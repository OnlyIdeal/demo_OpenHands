import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import AuthSession, User


def hash_password(password: str, salt: str | None = None) -> str:
    actual_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), actual_salt.encode(), 120_000).hex()
    return f"pbkdf2_sha256${actual_salt}${digest}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        _, salt, expected = encoded.split("$", 2)
    except ValueError:
        return False
    actual = hash_password(password, salt).rsplit("$", 1)[-1]
    return hmac.compare_digest(actual, expected)


def create_session(database: Session, user: User) -> AuthSession:
    settings = get_settings()
    auth_session = AuthSession(
        token=secrets.token_urlsafe(32),
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.session_days),
    )
    database.add(auth_session)
    database.commit()
    database.refresh(auth_session)
    return auth_session


def get_current_user(request: Request, database: Session = Depends(get_db)) -> User:
    token = request.cookies.get(get_settings().cookie_name)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    auth_session = database.scalar(select(AuthSession).where(AuthSession.token == token))
    now = datetime.now(timezone.utc)
    expires_at = auth_session.expires_at.replace(tzinfo=timezone.utc) if auth_session else now
    if not auth_session or expires_at <= now or not auth_session.user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    return auth_session.user
