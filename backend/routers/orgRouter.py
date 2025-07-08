from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import not_
import random, string
from datetime import datetime, timezone

from helpers import auth
from database import get_db
import models, schemas

router = APIRouter(prefix="/organizations", tags=["organizations"])

# --- Dependencies for role-based access ---
def require_org_member(org_id: int, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    membership = db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this organization")
    return membership

def require_org_admin(org_id: int, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    membership = db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if not membership or ("admin" not in membership.roles):
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
    member = models.OrganizationMember(user_id=user_id, organization_id=org.id, roles=["admin"])
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
                user_roles=m.roles
            ))
    return result

@router.get("/{org_id}", response_model=schemas.OrganizationWithMembers)
def get_organization(org_id: int, db: Session = Depends(get_db), _=Depends(require_org_member), user_id: int = Depends(auth.get_current_user_id)):
    org = db.query(models.Organization).filter_by(id=org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    members = db.query(models.OrganizationMember).filter_by(organization_id=org_id).all()
    # Find current user's roles
    user_roles = []
    for m in members:
        if m.user_id == user_id:
            user_roles = m.roles
            break
    return schemas.OrganizationWithMembers(
        **schemas.OrganizationOut.model_validate(org).model_dump(),
        members=[schemas.OrganizationMemberOut.model_validate(m) for m in members],
        current_user_roles=user_roles
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
    member = models.OrganizationMember(user_id=user_id, organization_id=org_id, roles=["member"])
    db.add(member)
    db.commit()
    return {"detail": "Joined organization"}

@router.get("/{org_id}/members", response_model=List[schemas.OrganizationMemberOut])
def list_members(org_id: int, db: Session = Depends(get_db), _=Depends(require_org_member)):
    members = db.query(models.OrganizationMember).filter_by(organization_id=org_id).all()
    return [schemas.OrganizationMemberOut.model_validate(m) for m in members]

@router.patch("/{org_id}/members/{user_id}")
def update_member_roles(org_id: int, user_id: int, payload: schemas.OrganizationMemberBase, db: Session = Depends(get_db), admin=Depends(require_org_admin)):
    member = db.query(models.OrganizationMember).filter_by(organization_id=org_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member.roles = payload.roles
    db.commit()
    return {"detail": "Roles updated"}

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
    if "admin" in membership.roles:
        raise HTTPException(status_code=403, detail="Admins cannot leave the organization without transferring authority")
    db.delete(membership)
    db.commit()
    return {"detail": "Left organization"}

# --- Invite Routes ---
def generate_invite_code(org_id: int, length: int = 6) -> str:
    code = ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
    return f"{org_id}-{code}"

@router.get("/me/invites", response_model=List[schemas.OrganizationInviteOut])
def list_user_invites(db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    # Only invites targeted to this user
    invites = db.query(models.OrganizationInvite).filter(
        models.OrganizationInvite.target_user_id == user_id
    ).all()
    return [schemas.OrganizationInviteOut.model_validate(i) for i in invites]

# --- Organization Invite Routes (must come after /me/invites) ---
@router.get("/{org_id}/invites", response_model=List[schemas.OrganizationInviteOut])
def list_org_invites(org_id: int, db: Session = Depends(get_db), admin=Depends(require_org_admin)):
    invites = db.query(models.OrganizationInvite).filter_by(org_id=org_id).all()
    return [schemas.OrganizationInviteOut.model_validate(i) for i in invites]

@router.post("/{org_id}/invites", response_model=schemas.OrganizationInviteOut)
def create_invite(org_id: int, payload: schemas.OrganizationInviteCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), admin=Depends(require_org_admin)):
    # Generate unique code
    for _ in range(5):
        code = generate_invite_code(org_id)
        if not db.query(models.OrganizationInvite).filter_by(org_id=org_id, code=code).first():
            break
    else:
        raise HTTPException(status_code=500, detail="Failed to generate unique invite code")
    target_user_id = None
    if payload.target_username:
        user = db.query(models.User).filter_by(username=payload.target_username).first()
        if user:
            target_user_id = user.id
        else:
            raise HTTPException(status_code=404, detail="No user found with the given username")
    
    invite = models.OrganizationInvite(
        org_id=org_id,
        code=code,
        target_user_id=target_user_id,
        max_uses=payload.max_uses or 1,
        expires_at=payload.expires_at
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Send invite email if targeted
    if target_user_id:
        user = db.query(models.User).filter_by(id=target_user_id).first()
        org = db.query(models.Organization).filter_by(id=org_id).first()
        if user and org and background_tasks:
            from helpers.emails import send_org_invite_email
            email_info = schemas.EmailDetails(
                recipients=[user.email],
                body={
                    "user_name": user.username,
                    "org_name": org.name,
                    "invite_code": code,
                }
            )
            background_tasks.add_task(send_org_invite_email, email_info)
    return schemas.OrganizationInviteOut.model_validate(invite)

@router.delete("/{org_id}/invites/{invite_id}")
def revoke_invite(org_id: int, invite_id: int, db: Session = Depends(get_db), admin=Depends(require_org_admin)):
    invite = db.query(models.OrganizationInvite).filter_by(id=invite_id, org_id=org_id).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    db.delete(invite)
    db.commit()
    return {"detail": "Invite revoked"}

@router.post("/invites/accept")
def accept_invite(payload: schemas.OrganizationInviteAccept, db: Session = Depends(get_db), user_id: int = Depends(auth.get_current_user_id)):
    code = payload.code.strip()
    invite = db.query(models.OrganizationInvite).filter_by(code=code).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.expires_at and invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invite expired")
    if invite.target_user_id and invite.target_user_id != user_id:
        raise HTTPException(status_code=403, detail="This invite is not for you")
    if invite.uses >= invite.max_uses:
        raise HTTPException(status_code=400, detail="Invite has reached max uses")
    # Check if already a member
    existing = db.query(models.OrganizationMember).filter_by(organization_id=invite.org_id, user_id=user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")
    # Add as member
    member = models.OrganizationMember(user_id=user_id, organization_id=invite.org_id, roles=["member"])
    db.add(member)
    invite.uses += 1
    if invite.uses >= invite.max_uses:
        db.delete(invite)
    db.commit()
    return {"detail": "Joined organization"}
