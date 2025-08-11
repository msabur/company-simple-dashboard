"""
Admin authentication dependency for FastAPI admin routes
"""
from fastapi import Depends, HTTPException, status
from .auth import get_current_user

def admin_required(current_user=Depends(get_current_user)):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
