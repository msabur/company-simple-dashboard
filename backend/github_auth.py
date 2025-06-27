from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
import requests
from config import VITE_GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
from jose import jwt
import os

router = APIRouter()

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
