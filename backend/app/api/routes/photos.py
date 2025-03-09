import os
from typing import Any
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import or_, update
from sqlmodel import col, delete, func, select
import aiofiles

from backend.app import crud
from backend.app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_user
)
from backend.app.core.config import settings

from common.db.models.base import FilePath


router = APIRouter()

@router.post(
    '/',
    dependencies=[Depends(get_current_user)],
    response_model=FilePath
)
async def upload_photo(
    session: SessionDep,
    file: UploadFile = File(...),
) -> FilePath:
    """
    Upload photo
    """
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            await buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке файла: {e}")
    
    return FilePath(file_path=file_path)

    