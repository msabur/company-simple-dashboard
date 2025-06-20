from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, get_db
import models, schemas, auth
from pydantic import EmailStr

router = APIRouter()

@router.get("/check-email")
def checkEmail(email: EmailStr, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter_by(email=email).first()
    if db_user is None:
        return {'exists': False}
    elif db_user.is_google_user:
        return {'exists': False, 'isGoogleUser': True}
    else:
        return {'exists': True}

@router.post("/signup", response_model=schemas.UserOut)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
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
        is_google_user=False,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    token = auth.create_token({"user_id": db_user.id})
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
    if not db_user:
        db_user = models.User(
            email=user_data["email"],
            full_name=user_data.get("name", ""),
            username=user_data["email"].split("@")[0],
            is_google_user=True,
            picture_url=user_data.get("picture", "")
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    token = auth.create_token({"user_id": db_user.id})
    return {"token": token, "user": schemas.UserOut.model_validate(db_user)}

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