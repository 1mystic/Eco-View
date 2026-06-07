import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Incident ──────────────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    type: str = Field(..., min_length=1, max_length=64)
    description: str = Field(..., min_length=10, max_length=1000)
    photo_url: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class IncidentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|classified|verified|resolved|rejected)$")


class MLResult(BaseModel):
    label: str
    confidence: float
    severity: str
    processing_time_ms: int


class IncidentOut(BaseModel):
    id: uuid.UUID
    reporter_firebase_uid: str
    type: str
    description: str
    photo_url: Optional[str]
    latitude: float
    longitude: float
    status: str
    ml_label: Optional[str]
    ml_confidence: Optional[float]
    ml_severity: Optional[str]
    verification_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IncidentListOut(BaseModel):
    items: list[IncidentOut]
    total: int


# ── User ──────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    firebase_uid: str
    email: str
    name: str
    role: str
    points: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Stats ─────────────────────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    name: str
    firebase_uid: str
    points: int
    report_count: int


class PlatformStats(BaseModel):
    total_incidents: int
    verified_incidents: int
    resolved_incidents: int
    total_reporters: int
    incidents_today: int


# ── Upload ────────────────────────────────────────────────────────────────────

class UploadOut(BaseModel):
    url: str
    key: str


# ── Inference ────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    image_url: str


class ClassifyOut(BaseModel):
    label: str
    confidence: float
    severity: str
    processing_time_ms: int
    model_version: str
