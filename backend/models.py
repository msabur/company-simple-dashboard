from datetime import datetime
from database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import CheckConstraint, text, DateTime, ForeignKey, String, Integer, UniqueConstraint
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    full_name: Mapped[str] = mapped_column()
    username: Mapped[str] = mapped_column(unique=True)
    password_hash: Mapped[str | None] = mapped_column()
    picture_url: Mapped[str] = mapped_column(default="")
    is_google_user: Mapped[bool] = mapped_column(default=False)
    phone_number: Mapped[str | None] = mapped_column()
    gender: Mapped[str | None] = mapped_column()
    language: Mapped[str | None] = mapped_column()
    timezone: Mapped[str | None] = mapped_column()
    date_of_birth: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    created_organizations = relationship("Organization", back_populates="created_by")
    organizations = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            text("""
                (is_google_user = FALSE AND password_hash IS NOT NULL) OR
                 (is_google_user = TRUE AND password_hash IS NULL)
            """),
            name='ck_user_password_hash_if_not_google'
        ),
    )

class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    created_by = relationship("User", back_populates="created_organizations")
    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")

class OrganizationMember(Base):
    __tablename__ = "organization_members"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"))
    role: Mapped[str] = mapped_column(String, default="member")

    user = relationship("User", back_populates="organizations")
    organization = relationship("Organization", back_populates="members")

    __table_args__ = (
        UniqueConstraint("user_id", "organization_id", name="uq_user_org"),
    )