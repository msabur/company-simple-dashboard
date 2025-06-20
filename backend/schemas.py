from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, field_serializer

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
    is_google_user: bool

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

    @field_validator('*', mode="after")
    @classmethod
    def empty_string_to_none(cls, v):
        if isinstance(v, str):
            return None if v == "" else v
        else:
            return v