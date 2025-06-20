from datetime import datetime
from database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import CheckConstraint, text, DateTime
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

    __table_args__ = (
        CheckConstraint(
            text("""
                (is_google_user = FALSE AND password_hash IS NOT NULL) OR
                 (is_google_user = TRUE AND password_hash IS NULL)
            """),
            name='ck_user_password_hash_if_not_google'
        ),
    )