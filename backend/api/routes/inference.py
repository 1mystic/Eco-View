from fastapi import APIRouter

from ...database.schemas import ClassifyOut, ClassifyRequest
from ...inference.classifier import classify_image

router = APIRouter()


@router.post("/classify", response_model=ClassifyOut)
async def classify(body: ClassifyRequest):
    result = classify_image(body.image_url)
    return ClassifyOut(**result)
