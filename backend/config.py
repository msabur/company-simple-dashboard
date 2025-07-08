import os
from pathlib import Path
from fastapi_mail import ConnectionConfig
from pydantic import SecretStr

def get_env(name: str) -> str:
    value = os.getenv(name)
    if value is None:
        raise RuntimeError(f"Environment variable '{name}' is required but not set.")
    return value

IS_DOCKER = os.getenv("IS_DOCKER", False)
JWT_SECRET_KEY = get_env("JWT_SECRET_KEY")
GOOGLE_CLIENT_ID = get_env("VITE_GOOGLE_CLIENT_ID")
VITE_GITHUB_CLIENT_ID = get_env("VITE_GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = get_env("GITHUB_CLIENT_SECRET")
POSTGRES_USER = get_env("POSTGRES_USER")
POSTGRES_PASSWORD = get_env("POSTGRES_PASSWORD")
PASSWORD_RESET_BASE_URL = get_env("PASSWORD_RESET_BASE_URL")

MAIL_CONFIG = ConnectionConfig(
    MAIL_USERNAME=get_env("MAIL_USERNAME"),
    MAIL_PASSWORD=SecretStr(get_env("MAIL_PASSWORD")),
    MAIL_FROM=get_env("MAIL_FROM"),
    MAIL_PORT=int(get_env("MAIL_PORT")),
    MAIL_SERVER=get_env("MAIL_SERVER"),
    MAIL_FROM_NAME=get_env("MAIL_FROM_NAME"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    TEMPLATE_FOLDER=Path(__file__).parent / 'templates',
)