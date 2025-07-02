from fastapi import APIRouter, Depends, HTTPException
import requests
from sqlalchemy.orm import Session
from config import GITHUB_CLIENT_SECRET, VITE_GITHUB_CLIENT_ID
from database import get_db
import models, schemas, auth, emails
from pydantic import EmailStr

router = APIRouter(tags=["users"])

@router.get("/check-email")
def checkEmail(email: EmailStr, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter_by(email=email).first()
    if db_user is None:
        return {'exists': False, 'isSocialUser': False}
    else:
        return {'exists': True, 'isSocialUser': db_user.auth_provider != "local"}

@router.post("/signup")
async def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter_by(email=user.email).first()
    if existing_user:
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
    db.commit()
    db.refresh(db_user)
    token = auth.create_token({"user_id": db_user.id})

    # TODO actual implementation. already made a model
    # https://sabuhish.github.io/fastapi-mail/example/#using-jinja2-html-templates
    signup_email = schemas.EmailSchema(
        recipients=[user.email],
        body={
            "user_name": user.username,
            "verification_code": 4587,
        }
    )
    await emails.send_signup_verification_email(signup_email)

    return {"token": token, "user": schemas.UserOut.model_validate(db_user)}

@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter_by(email=user.email).first()
    if not db_user or not db_user.password_hash or not auth.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_token({"user_id": db_user.id})
    return {"token": token, "user": schemas.UserOut.model_validate(db_user)}

@router.post("/auth/google")
def google_auth(payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    user_data = auth.verify_google_token(payload.token)
    if not user_data or "email" not in user_data:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    db_user = db.query(models.User).filter_by(email=user_data["email"]).first()
    if db_user:
        if db_user.auth_provider != "google":
            raise HTTPException(status_code=400, detail="Account exists with a different provider")
    else:
        db_user = models.User(
            email=user_data["email"],
            full_name=user_data.get("name", ""),
            username=user_data["email"].split("@")[0],
            auth_provider="google",
            picture_url=user_data.get("picture", "")
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
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
    email = user_data.get("email")
    if not email:
        # Fallback: fetch emails endpoint
        emails_resp = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if emails_resp.status_code == 200:
            emails = emails_resp.json()
            primary = next((e for e in emails if e.get("primary")), None)
            email = primary["email"] if primary else emails[0]["email"] if emails else None
    if not email:
        raise HTTPException(status_code=400, detail="GitHub email not found")
    # Find or create user
    db_user = db.query(models.User).filter_by(email=email).first()
    if db_user:
        if db_user.auth_provider != "github":
            raise HTTPException(status_code=400, detail="Account exists with a different provider")
    else:
        db_user = models.User(
            email=email,
            full_name=user_data.get("name") or user_data.get("login"),
            username=user_data.get("login"),
            auth_provider="github",
            picture_url=user_data.get("avatar_url", "")
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    token = auth.create_token({"user_id": db_user.id})
    from schemas import UserOut
    return {"token": token, "user": UserOut.model_validate(db_user)}

@router.post("/change-password")
def change_password(payload: schemas.ChangePasswordRequest, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    db_user = db.query(models.User).filter_by(id=user_id).first()
    if not db_user or not db_user.password_hash:
        raise HTTPException(status_code=404, detail="User not found or password not set")
    if not auth.verify_password(payload.old_password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Old password is incorrect")
    db_user.password_hash = auth.hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}

@router.post("/update-info")
def update_info(payload: schemas.UpdateInfoRequest, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
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