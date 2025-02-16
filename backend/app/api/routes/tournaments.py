import uuid
from typing import Any, Optional
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, update
from sqlmodel import col, delete, func, select

from backend.app import crud
from backend.app.api.deps import (
    SessionDep,
    get_current_active_superuser,
)
from backend.app.core.config import SUPERUSER_EMAIL, SUPERUSER_PASSWORD
from backend.app.core.security import get_password_hash
from common.db.models import User, UserPublic, UsersPublic


router = APIRouter()