from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
from typing import List
from sqlalchemy import not_

router = APIRouter(prefix="/organizations", tags=["organizations"])

# --- Dependencies for role-based access ---
def require_org_member(org_id: int, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    membership = db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    return membership

def require_org_admin(org_id: int, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    membership = db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id, role="admin").first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not an admin of this organization")
    return membership

# --- Organization Routes ---
@router.post("/", response_model=schemas.OrganizationOut)
def create_organization(payload: schemas.OrganizationCreate, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    # Check for duplicate organization name
    existing_org = db.query(models.Organization).filter_by(name=payload.name).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Organization with this name already exists")
    org = models.Organization(
        name=payload.name,
        created_by_user_id=user_id
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    # Add creator as admin member
    member = models.OrganizationMember(user_id=user_id, organization_id=org.id, role="admin")
    db.add(member)
    db.commit()
    return org

@router.get("/me", response_model=List[schemas.OrganizationWithRole])
def list_my_organizations(db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    memberships = db.query(models.OrganizationMember).filter_by(user_id=user_id).all()
    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(models.Organization).filter(models.Organization.id.in_(org_ids)).all()
    orgs_by_id = {org.id: org for org in orgs}
    result = []
    for m in memberships:
        org = orgs_by_id.get(m.organization_id)
        if org:
            result.append(schemas.OrganizationWithRole(
                **schemas.OrganizationOut.model_validate(org).model_dump(),
                user_role=m.role
            ))
    return result

@router.get("/{org_id}", response_model=schemas.OrganizationWithMembers)
def get_organization(org_id: int, db: Session = Depends(get_db), _=Depends(require_org_member), user_id: int = Depends(auth.get_current_user_id)):
    org = db.query(models.Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    members = db.query(models.OrganizationMember).filter_by(organization_id=org_id).all()
    # Find current user's role
    user_role = None
    for m in members:
        if m.user_id == user_id:
            user_role = m.role
            break
    if user_role is None:
        user_role = "unknown"
    return schemas.OrganizationWithMembers(
        **schemas.OrganizationOut.model_validate(org).model_dump(),
        members=[schemas.OrganizationMemberOut.model_validate(m) for m in members],
        current_user_role=user_role
    )

@router.get("/", response_model=List[schemas.OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db),
    user_id: int = Depends(auth.get_current_user_id),
    include_mine: bool = Query(True, description="Include organizations you are already a member of")
):
    memberships = db.query(models.OrganizationMember).filter_by(user_id=user_id).all()
    joined_org_ids = {m.organization_id for m in memberships}
    if include_mine:
        orgs = db.query(models.Organization).all()
    else:
        orgs = db.query(models.Organization).filter(not_(models.Organization.id.in_(joined_org_ids))).all()
    return [schemas.OrganizationOut.model_validate(org) for org in orgs]

# --- Membership Routes ---
@router.post("/{org_id}/join")
def join_organization(org_id: int, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    org = db.query(models.Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    existing = db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    member = models.OrganizationMember(user_id=user_id, organization_id=org_id, role="member")
    db.add(member)
    db.commit()
    return {"detail": "Joined organization"}

@router.get("/{org_id}/members", response_model=List[schemas.OrganizationMemberOut])
def list_members(org_id: int, db: Session = Depends(get_db), _=Depends(require_org_member)):
    members = db.query(models.OrganizationMember).filter_by(organization_id=org_id).all()
    return [schemas.OrganizationMemberOut.model_validate(m) for m in members]

@router.patch("/{org_id}/members/{user_id}")
def update_member_role(org_id: int, user_id: int, payload: schemas.OrganizationMemberBase, db: Session = Depends(get_db), admin=Depends(require_org_admin)):
    member = db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member.role = payload.role
    db.commit()
    return {"detail": "Role updated"}

@router.delete("/{org_id}/members/{user_id}")
def remove_member(org_id: int, user_id: int, db: Session = Depends(get_db), _=Depends(require_org_admin)):
    member = db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).delete()
    db.commit()
    return {"detail": "Member removed"}

@router.post("/{org_id}/leave")
def leave_organization(org_id: int, db: Session = Depends(get_db), membership=Depends(require_org_member)):
    if membership.role == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot leave the organization without transferring authority")
    
    db.delete(membership)
    db.commit()
    return {"detail": "Left organization"}
