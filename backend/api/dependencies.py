from typing import Annotated, Optional

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.connection import get_session
from ..database.models import User
from ..core.config import settings
from sqlalchemy import select

_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is None:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
        _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    session: AsyncSession = Depends(get_session),
) -> Optional[User]:
    if credentials is None:
        return None
    try:
        _get_firebase_app()
        decoded = firebase_auth.verify_id_token(credentials.credentials)
        uid = decoded["uid"]
        result = await session.execute(select(User).where(User.firebase_uid == uid))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(
                firebase_uid=uid,
                email=decoded.get("email", ""),
                name=decoded.get("name", decoded.get("email", "Anonymous")),
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        return user
    except Exception:
        return None


async def get_current_user(
    user: Annotated[Optional[User], Depends(get_current_user_optional)],
) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


async def get_admin_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


DBSession = Annotated[AsyncSession, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentUserOptional = Annotated[Optional[User], Depends(get_current_user_optional)]
AdminUser = Annotated[User, Depends(get_admin_user)]
