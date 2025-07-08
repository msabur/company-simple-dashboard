from datetime import datetime
from database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import text, DateTime, ForeignKey, String, Integer, UniqueConstraint
from sqlalchemy.sql import func
import sqlalchemy.dialects.postgresql

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    username: Mapped[str] = mapped_column(unique=True)

    verified: Mapped[bool] = mapped_column(default=False)
    full_name: Mapped[str] = mapped_column()
    password_hash: Mapped[str | None] = mapped_column()
    picture_url: Mapped[str] = mapped_column(default="")
    phone_number: Mapped[str | None] = mapped_column()
    gender: Mapped[str | None] = mapped_column()
    language: Mapped[str | None] = mapped_column()
    timezone: Mapped[str | None] = mapped_column()
    date_of_birth: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    auth_provider: Mapped[str] = mapped_column(default="local")  # "local", "google", "github", etc.

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    created_organizations = relationship("Organization", back_populates="created_by")
    organizations = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    invites = relationship("OrganizationInvite", back_populates="target_user", cascade="all, delete-orphan")

class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(ForeignKey("users.email"), unique=True)
    code: Mapped[int] = mapped_column()

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class PasswordReset(Base):
    __tablename__ = "password_resets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(ForeignKey('users.email'), unique=True)
    code: Mapped[str] = mapped_column(unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    created_by = relationship("User", back_populates="created_organizations")
    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    invites = relationship("OrganizationInvite", back_populates="organization", cascade="all, delete-orphan")

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"))
    roles: Mapped[list[str]] = mapped_column(sqlalchemy.dialects.postgresql.ARRAY(String), default=list)

    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="members")

    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_org"),
    )

class OrganizationInvite(Base):
    __tablename__ = "organization_invites"
    id: Mapped[int] = mapped_column(primary_key=True)
    org_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"))
    code: Mapped[str] = mapped_column(String, unique=True, index=True)
    target_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    uses: Mapped[int] = mapped_column(Integer, default=0)
    max_uses: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization = relationship("Organization", back_populates="invites")
    target_user = relationship("User", back_populates="invites")

    __table_args__ = (
        UniqueConstraint("org_id", "code", name="uq_org_code"),
    )