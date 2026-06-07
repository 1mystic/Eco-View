import uuid

import boto3
from botocore.config import Config

from ..core.config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )
    return _client


CONTENT_TYPE_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
}


async def upload_image(data: bytes, content_type: str) -> tuple[str, str]:
    ext = CONTENT_TYPE_EXT.get(content_type, "jpg")
    key = f"incidents/{uuid.uuid4()}.{ext}"

    _get_client().put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=data,
        ContentType=content_type,
        CacheControl="public, max-age=31536000",
    )

    url = f"{settings.R2_PUBLIC_URL}/{key}"
    return url, key
