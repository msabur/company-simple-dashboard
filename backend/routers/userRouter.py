import random
import string
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
import requests
from sqlalchemy.orm import Session
from pydantic import EmailStr

from config import GITHUB_CLIENT_SECRET, VITE_GITHUB_CLIENT_ID, PASSWORD_RESET_BASE_URL
from helpers import emails, auth

def get_current_user_id(user=Depends(auth.get_current_user)):
    return user.id
import models, schemas
from database import get_db

def generate_verification_code(length: int = 4) -> str:
    return ''.join(random.choices(string.digits, k=length))

def generate_password_reset_code() -> str:
    return str(uuid.uuid4())

router = APIRouter(tags=["users"])

@router.get("/check-email")
def checkEmail(email: EmailStr, db: Session = Depends(get_db)) -> schemas.EmailCheckResult:
    db_user = db.query(models.User).filter_by(email=email).first()

    exists = db_user is not None
    isSocialUser = exists and db_user.auth_provider != "local"
    verified = exists and db_user.verified
    return schemas.EmailCheckResult(exists=exists, isSocialUser=isSocialUser, verified=verified)


@router.post("/signup")
async def signup(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing_email = db.query(models.User).filter_by(email=user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_username = db.query(models.User).filter_by(username=user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    db_user = models.User(
        email=user.email,
        full_name=user.full_name,
        username=user.username,
        password_hash=auth.hash_password(user.password),
    )
    db.add(db_user)

    existing_code_entry = db.query(models.VerificationCode).filter_by(email=user.email).first()
    if existing_code_entry:
        code = existing_code_entry.code
    else:
        code = generate_verification_code()
        db_verification_code = models.VerificationCode(email=user.email, code=code)
        db.add(db_verification_code)
    
    db.commit()
    db.refresh(db_user)
    
    email_info = schemas.EmailDetails(
        recipients=[user.email],
        body={
            "user_name": user.username,
            "verification_code": code,
        }
    )
    background_tasks.add_task(emails.send_signup_verification_email, email_info)

    return {"user": schemas.UserOut.model_validate(db_user)}

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter_by(email=user.email).first()
    if not db_user or not db_user.password_hash or not auth.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    elif not db_user.verified:
        raise HTTPException(status_code=401, detail="Email not verified")
    
    token = auth.create_token({"user_id": db_user.id})
    return {"token": token, "user": schemas.UserOut.model_validate(db_user)}

@router.post("/auth/google")
def google_auth(payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    user_data = auth.verify_google_token(payload.token)
    if not user_data or "email" not in user_data:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    google_email = user_data["email"]
    # Check for linked account first
    linked = db.query(models.LinkedAccount).filter_by(provider="google", email=google_email).first()
    if linked:
        db_user = db.query(models.User).filter_by(id=linked.user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found for linked account")
    else:
        # If a user exists with this Google email, link it for backward compatibility
        db_user = db.query(models.User).filter_by(email=google_email).first()
        if db_user:
            # Create LinkedAccount for this user
            linked = models.LinkedAccount(
                user_id=db_user.id,
                provider="google",
                email=google_email,
                picture_url=user_data.get("picture", "")
            )
            db.add(linked)
            db.commit()
        else:
            # No user with this email, create a new user and LinkedAccount
            db_user = models.User(
                email=google_email,
                full_name=user_data.get("name", ""),
                username=google_email.split("@")[0],
                auth_provider="google",
                picture_url=user_data.get("picture", "")
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            linked = models.LinkedAccount(
                user_id=db_user.id,
                provider="google",
                email=google_email,
                picture_url=user_data.get("picture", "")
            )
            db.add(linked)
            db.commit()
    token = auth.create_token({"user_id": db_user.id})
    return {"token": token, "user": schemas.UserOut.model_validate(db_user)}

@router.post("/auth/github")
def github_auth(payload: dict, db: Session = Depends(get_db)):
    code = payload.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")
    # Exchange code for access token
    token_resp = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": VITE_GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        },
    )
    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get GitHub token")
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token from GitHub")
    # Get user info from GitHub
    user_resp = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if user_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get GitHub user info")
    user_data = user_resp.json()
    github_email = user_data.get("email")
    if not github_email:
        emails_resp = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if emails_resp.status_code == 200:
            emails = emails_resp.json()
            primary = next((e for e in emails if e.get("primary")), None)
            github_email = primary["email"] if primary else emails[0]["email"] if emails else None
    if not github_email:
        raise HTTPException(status_code=400, detail="GitHub email not found")
    # Check for linked account first
    linked = db.query(models.LinkedAccount).filter_by(provider="github", email=github_email).first()
    if linked:
        db_user = db.query(models.User).filter_by(id=linked.user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found for linked account")
    else:
        # If a user exists with this GitHub email, link it for backward compatibility
        db_user = db.query(models.User).filter_by(email=github_email).first()
        if db_user:
            linked = models.LinkedAccount(
                user_id=db_user.id,
                provider="github",
                email=github_email,
                picture_url=user_data.get("avatar_url", "")
            )
            db.add(linked)
            db.commit()
        else:
            db_user = models.User(
                email=github_email,
                full_name=user_data.get("name") or user_data.get("login"),
                username=user_data.get("login"),
                auth_provider="github",
                picture_url=user_data.get("avatar_url", "")
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            linked = models.LinkedAccount(
                user_id=db_user.id,
                provider="github",
                email=github_email,
                picture_url=user_data.get("avatar_url", "")
            )
            db.add(linked)
            db.commit()
    token = auth.create_token({"user_id": db_user.id})
    from schemas import UserOut
    return {"token": token, "user": UserOut.model_validate(db_user)}

@router.post("/change-password")
def change_password(payload: schemas.ChangePasswordRequest, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    db_user = db.query(models.User).filter_by(id=user_id).first()
    if not db_user or not db_user.password_hash:
        raise HTTPException(status_code=404, detail="User not found or password not set")
    if not auth.verify_password(payload.old_password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Old password is incorrect")
    db_user.password_hash = auth.hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}

@router.post("/update-info")
def update_info(payload: schemas.UpdateInfoRequest, db: Session = Depends(get_db), user_id: int = Depends(get_current_user_id)):
    db_user = db.query(models.User).filter_by(id=user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check email uniqueness if email is being updated
    if payload.email and payload.email != db_user.email:
        email_exists = db.query(models.User).filter_by(email=payload.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already registered")

    update_fields = [
        "full_name", "email", "phone_number", "language", "gender", "timezone", "date_of_birth"
    ]
    for field in update_fields:
        value = getattr(payload, field)
        if value is not None:
            setattr(db_user, field, value)
    db.commit()
    db.refresh(db_user)
    return {"detail": "User info updated successfully", "user": schemas.UserOut.model_validate(db_user)}

@router.post("/resend-verification-code")
def resend_verification_code(payload: schemas.EmailContainer, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.verified:
        raise HTTPException(status_code=400, detail="User already verified")
    code_entry = db.query(models.VerificationCode).filter_by(email=payload.email).first()
    if code_entry:
        code = code_entry.code
    else:
        code = generate_verification_code()
        db_verification_code = models.VerificationCode(email=payload.email, code=code)
        db.add(db_verification_code)
        db.commit()
    email_info = schemas.EmailDetails(
        recipients=[payload.email],
        body={
            "user_name": user.username,
            "verification_code": code,
        }
    )
    background_tasks.add_task(emails.send_signup_verification_email, email_info)
    return {"detail": "Sending"}

@router.post("/verify-email")
def verify_email(payload: schemas.EmailVerificationRequest, db: Session = Depends(get_db)):
    email = payload.email
    code = payload.code
    code_entry = db.query(models.VerificationCode).filter_by(email=email, code=code).first()
    if not code_entry:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    user = db.query(models.User).filter_by(email=email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.verified = True
    db.delete(code_entry)
    db.commit()
    return {"detail": "Email verified successfully"}

@router.post('/send-password-reset-email')
def send_password_reset_email(payload: schemas.EmailContainer, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email doesn't exist")
    
    existing_reset_entry = db.query(models.PasswordReset).filter_by(email=payload.email).first()
    if existing_reset_entry:
        code = existing_reset_entry.code
    else:
        code = generate_password_reset_code()
        db_pw_reset = models.PasswordReset(email=payload.email, code=code)
        db.add(db_pw_reset)
        db.commit()
    
    email_info = schemas.EmailDetails(
        recipients=[payload.email],
        body={
            "user_name": user.username,
            "reset_link": f"{PASSWORD_RESET_BASE_URL}?code={code}"
        }
    )
    background_tasks.add_task(emails.send_password_reset_email, email_info)
    return {"detail": "Sending"}

@router.get('/verify-password-reset-code')
def verify_password_reset_code(code: str, db: Session = Depends(get_db)):
    db_pw_reset = db.query(models.PasswordReset).filter_by(code=code).first()
    if db_pw_reset is None:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"detail":"Code found!"}

@router.post('/reset-password')
def reset_password(code: str, new_password: str, db: Session = Depends(get_db)):
    db_pw_reset = db.query(models.PasswordReset).filter_by(code=code).first()
    if db_pw_reset is None:
        raise HTTPException(status_code=404, detail="Code not found")
    
    db_user = db.query(models.User).filter_by(email=db_pw_reset.email).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User account no longer exists")
    
    db_user.password_hash = auth.hash_password(new_password)

    db.add(db_user)
    db.delete(db_pw_reset)
    db.commit()
    
    return {"detail":'Success'}
@router.get("/linked-accounts", response_model=list[schemas.LinkedAccountOut])
def list_linked_accounts(user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    accounts = db.query(models.LinkedAccount).filter_by(user_id=user_id).all()
    return accounts

@router.post("/link-account")
def link_account(payload: schemas.LinkAccountRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    provider = payload.provider
    token = payload.token
    # Check if already linked
    existing = db.query(models.LinkedAccount).filter_by(user_id=user_id, provider=provider).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account already linked")
    # Verify token and get email
    if provider == "google":
        user_data = auth.verify_google_token(token)
        if not user_data or "email" not in user_data:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        email = user_data["email"]
        picture_url = user_data.get("picture")
    elif provider == "github":
        token_resp = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": VITE_GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": token,
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get GitHub token")
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token from GitHub")
        user_resp = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get GitHub user info")
        user_data = user_resp.json()
        email = user_data.get("email")
        if not email:
            emails_resp = requests.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if emails_resp.status_code == 200:
                emails = emails_resp.json()
                primary = next((e for e in emails if e.get("primary")), None)
                email = primary["email"] if primary else emails[0]["email"] if emails else None
        picture_url = user_data.get("avatar_url")
        if not email:
            raise HTTPException(status_code=400, detail="GitHub email not found")
    else:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    # Check if email is already linked to another user
    email_exists = db.query(models.LinkedAccount).filter_by(email=email).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="This social account is already linked to another user")
    # Link account
    linked = models.LinkedAccount(
        user_id=user_id,
        provider=provider,
        email=email,
        picture_url=picture_url
    )
    db.add(linked)
    db.commit()
    db.refresh(linked)
    return {"detail": f"{provider.capitalize()} account linked"}

@router.post("/unlink-account")
def unlink_account(payload: schemas.UnlinkAccountRequest, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    account = db.query(models.LinkedAccount).filter_by(user_id=user_id, provider=payload.provider, email=payload.email).first()
    if not account:
        raise HTTPException(status_code=404, detail="Linked account not found")
    db.delete(account)
    db.commit()
    return {"detail": f"{payload.provider.capitalize()} account unlinked"}