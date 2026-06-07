from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
from sqlalchemy import func, select

from ...database.models import Incident, User, Verification
from ...database.schemas import (
    IncidentCreate,
    IncidentListOut,
    IncidentOut,
    IncidentStatusUpdate,
)
from ...inference.classifier import classify_image
from ..dependencies import AdminUser, CurrentUser, CurrentUserOptional, DBSession

router = APIRouter()

POINTS_FOR_REPORT = 10
POINTS_FOR_VERIFICATION = 5
VERIFICATIONS_TO_VERIFY = 3


async def _run_classification(incident_id: UUID, photo_url: str, session_factory):
    from ...database.connection import SessionLocal

    async with SessionLocal() as session:
        result = await session.execute(select(Incident).where(Incident.id == incident_id))
        incident = result.scalar_one_or_none()
        if incident is None:
            return

        ml = classify_image(photo_url)
        incident.ml_label = ml["label"]
        incident.ml_confidence = ml["confidence"]
        incident.ml_severity = ml["severity"]
        incident.status = "classified"
        await session.commit()


@router.get("", response_model=IncidentListOut)
async def list_incidents(
    session: DBSession,
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    q = select(Incident).order_by(Incident.created_at.desc())
    if status:
        q = q.where(Incident.status == status)
    if type:
        q = q.where(Incident.type == type)

    count_q = select(func.count()).select_from(q.subquery())
    total = (await session.execute(count_q)).scalar_one()

    result = await session.execute(q.limit(limit).offset(offset))
    items = result.scalars().all()

    return IncidentListOut(items=list(items), total=total)


@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(incident_id: UUID, session: DBSession):
    result = await session.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
async def create_incident(
    body: IncidentCreate,
    background_tasks: BackgroundTasks,
    session: DBSession,
    user: CurrentUserOptional,
):
    reporter_uid = user.firebase_uid if user else "anonymous"

    if user is None:
        result = await session.execute(
            select(User).where(User.firebase_uid == "anonymous")
        )
        anon = result.scalar_one_or_none()
        if anon is None:
            anon = User(firebase_uid="anonymous", email="", name="Anonymous")
            session.add(anon)
            await session.flush()

    incident = Incident(
        reporter_firebase_uid=reporter_uid,
        type=body.type,
        description=body.description,
        photo_url=body.photo_url,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    session.add(incident)

    if user:
        user.points += POINTS_FOR_REPORT

    await session.commit()
    await session.refresh(incident)

    if body.photo_url:
        background_tasks.add_task(_run_classification, incident.id, body.photo_url, None)

    return incident


@router.patch("/{incident_id}/status", response_model=IncidentOut)
async def update_status(
    incident_id: UUID,
    body: IncidentStatusUpdate,
    session: DBSession,
    _: AdminUser,
):
    result = await session.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = body.status
    await session.commit()
    await session.refresh(incident)
    return incident


@router.post("/{incident_id}/verify", response_model=IncidentOut)
async def verify_incident(
    incident_id: UUID,
    session: DBSession,
    user: CurrentUser,
):
    result = await session.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    existing = await session.execute(
        select(Verification).where(
            Verification.incident_id == incident_id,
            Verification.verifier_firebase_uid == user.firebase_uid,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already verified by this user")

    verification = Verification(
        incident_id=incident_id,
        verifier_firebase_uid=user.firebase_uid,
    )
    session.add(verification)
    incident.verification_count += 1
    user.points += POINTS_FOR_VERIFICATION

    if incident.verification_count >= VERIFICATIONS_TO_VERIFY and incident.status == "classified":
        incident.status = "verified"

    await session.commit()
    await session.refresh(incident)
    return incident
