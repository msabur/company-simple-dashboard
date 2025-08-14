"""
Admin router for global admin interface (user/org management)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
from database import get_db
from helpers.admin_auth import admin_required
from models import User, Organization
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])

# Pydantic model for organization update
class OrgUpdate(BaseModel):
    name: str | None = None
    created_by_user_id: int | None = None

# User Management Endpoints

@router.get("/users")
def get_users(db: Session = Depends(get_db), current_user=Depends(admin_required)):
    users = db.query(User).all()
    # For each user, include linked_accounts as a list of {provider}
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "phone_number": u.phone_number,
            "language": u.language,
            "is_admin": u.is_admin,
            "linked_accounts": [{"provider": a.provider} for a in getattr(u, "linked_accounts", [])],
        })
    return result


@router.get("/users/{user_id}")
def get_user_detail(user_id: int, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "phone_number": user.phone_number,
        "language": user.language,
        "is_admin": user.is_admin,
        "linked_accounts": [{"provider": a.provider} for a in getattr(user, "linked_accounts", [])],
    }


@router.put("/users/{user_id}")
def update_user(user_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user=Depends(admin_required)):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field in ["is_admin", "phone_number", "language"]:
        if field in payload:
            setattr(user, field, payload[field])
    if payload.get("reset_password"):
        user.password_hash = None
    db.commit()
    db.refresh(user)
    return {"success": True, "user": {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "phone_number": user.phone_number,
        "language": user.language,
        "is_admin": user.is_admin,
        "linked_accounts": [{"provider": a.provider} for a in getattr(user, "linked_accounts", [])],
    }}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"success": True}

# Organization Management Endpoints

@router.get("/organizations")
def get_organizations(db: Session = Depends(get_db), current_user=Depends(admin_required)):
    orgs = db.query(Organization).all()
    result = []
    for o in orgs:
        # Count members if relationship exists, else 0
        member_count = len(getattr(o, "members", [])) if hasattr(o, "members") else 0
        result.append({
            "id": o.id,
            "name": o.name,
            "created_by_user_id": o.created_by_user_id,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "member_count": member_count,
        })
    return result


@router.get("/organizations/{org_id}")
def get_org_detail(org_id: int, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    org = db.query(Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    members = []
    for m in getattr(org, "members", []):
        user = db.query(User).filter_by(id=m.user_id).first()
        members.append({
            "id": m.id,
            "user_id": m.user_id,
            "roles": m.roles or [],
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            } if user else None,
        })
    return {
        "id": org.id,
        "name": org.name,
        "created_by_user_id": org.created_by_user_id,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "member_count": len(members),
        "members": members,
    }


@router.post("/organizations")
def create_organization(db: Session = Depends(get_db), current_user=Depends(admin_required)):
    # TODO: Implement org creation
    pass


@router.put("/organizations/{org_id}")
def update_organization(org_id: int, payload: OrgUpdate, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    org = db.query(Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    if payload.name:
        org.name = payload.name
    if payload.created_by_user_id:
        org.created_by_user_id = payload.created_by_user_id
    db.commit()
    db.refresh(org)
    return {"success": True, "org": {
        "id": org.id,
        "name": org.name,
        "created_by_user_id": org.created_by_user_id,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "member_count": len(getattr(org, "members", [])) if hasattr(org, "members") else 0,
    }}


@router.delete("/organizations/{org_id}")
def delete_organization(org_id: int, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    org = db.query(Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    db.delete(org)
    db.commit()
    return {"success": True}


@router.post("/organizations/{org_id}/members")
def add_org_member(org_id: int, payload: dict = Body(...), db: Session = Depends(get_db), current_user=Depends(admin_required)):
    user_id = payload.get("user_id")
    roles = payload.get("roles", [])
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    org = db.query(Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    from models import OrganizationMember
    existing = db.query(OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")
    member = OrganizationMember(user_id=user_id, organization_id=org_id, roles=roles)
    db.add(member)
    db.commit()
    db.refresh(member)
    return {"success": True, "member": {
        "id": member.id,
        "user_id": member.user_id,
        "roles": member.roles,
    }}


@router.delete("/organizations/{org_id}/members/{user_id}")
def remove_org_member(org_id: int, user_id: int, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    from models import OrganizationMember
    member = db.query(OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"success": True}

# Top organizations by member count
@router.get("/stats/top-orgs")
def top_organizations(limit: int = 5, db: Session = Depends(get_db), current_user=Depends(admin_required)):
    from models import OrganizationMember
    q = db.query(Organization, func.count(OrganizationMember.id).label("member_count"))\
        .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)\
        .group_by(Organization.id)\
        .order_by(func.count(OrganizationMember.id).desc())\
        .limit(limit)
    results = q.all()
    return [{
        "id": org.id,
        "name": org.name,
        "member_count": int(member_count)
    } for org, member_count in results]

# Email templates preview (reads raw template files)
@router.get("/email-templates")
def email_templates(db: Session = Depends(get_db), current_user=Depends(admin_required)):
    templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
    # fallback to project root templates
    if not os.path.isdir(templates_dir):
        templates_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "templates")
    result = {}
    try:
        files = [f for f in os.listdir(templates_dir) if f.endswith('.jinja2')]
    except Exception:
        files = []
    for fname in files:
        path = os.path.join(templates_dir, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                result[fname] = f.read()
        except Exception:
            result[fname] = "(not available)"
    return result
