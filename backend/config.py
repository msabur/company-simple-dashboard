import os
from pathlib import Path
from fastapi_mail import ConnectionConfig

IS_DOCKER = os.getenv("IS_DOCKER")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("VITE_GOOGLE_CLIENT_ID")
VITE_GITHUB_CLIENT_ID = os.getenv("VITE_GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")

MAIL_CONFIG = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=os.getenv("MAIL_PORT"),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    TEMPLATE_FOLDER=Path(__file__).parent / 'templates',
)