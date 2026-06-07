from fastapi import APIRouter, HTTPException, UploadFile

from ...core.config import settings
from ...database.schemas import UploadOut
from ...services.r2 import upload_image
from ..dependencies import CurrentUserOptional

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/heic", "image/webp"}
MAX_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024


@router.post("/image", response_model=UploadOut)
async def upload(
    file: UploadFile,
    _user: CurrentUserOptional,
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image format")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Image exceeds {settings.MAX_IMAGE_SIZE_MB}MB limit")

    url, key = await upload_image(data, file.content_type or "image/jpeg")
    return UploadOut(url=url, key=key)
