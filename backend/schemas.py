from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, field_serializer
from typing import List, Optional

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    username: str
    password: str

class UserOut(BaseModel):
    email: EmailStr
    full_name: str
    username: str
    phone_number: str | None
    language: str | None
    gender: str | None
    timezone: str | None
    date_of_birth: datetime | None
    picture_url: str
    auth_provider: str

    model_config = ConfigDict(from_attributes=True)

    # Make date_of_birth in YYYY-MM-DD format for frontend
    
    @field_serializer('date_of_birth')
    def serialize_date_of_birth(self, v: datetime | None) -> str | None:
        return v.strftime(r"%Y-%m-%d") if v else None


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    token: str

class EmailCheck(BaseModel):
    email: EmailStr

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UpdateInfoRequest(BaseModel):
    full_name: str | None
    email: EmailStr | None
    phone_number: str | None
    language: str | None
    gender: str | None
    timezone: str | None
    date_of_birth: datetime | None

    # Convert empty strings to None for database

    @field_validator('*', mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if isinstance(v, str):
            return None if v == "" else v
        else:
            return v

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationOut(OrganizationBase):
    id: int
    name: str
    created_by_user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OrganizationMemberBase(BaseModel):
    roles: List[str]

class OrganizationMemberCreate(OrganizationMemberBase):
    user_id: int
    organization_id: int

class OrganizationMemberOut(OrganizationMemberBase):
    id: int
    user_id: int
    organization_id: int
    # Optionally include user info
    user: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)

class OrganizationWithMembers(OrganizationOut):
    members: List[OrganizationMemberOut] = []
    current_user_roles: List[str]

class OrganizationWithRole(OrganizationOut):
    user_roles: List[str]

class OrganizationInviteBase(BaseModel):
    max_uses: int = 1
    expires_at: Optional[datetime] = None

class OrganizationInviteCreate(OrganizationInviteBase):
    target_username: Optional[str] = None

class OrganizationInviteOut(OrganizationInviteBase):
    id: int
    code: str
    uses: int
    created_at: datetime
    org_id: int
    organization: Optional[OrganizationOut] = None
    target_user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

class OrganizationInviteAccept(BaseModel):
    code: str