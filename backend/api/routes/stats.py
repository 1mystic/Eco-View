from datetime import date, datetime, timezone

from fastapi import APIRouter
from sqlalchemy import distinct, func, select

from ...database.models import Incident, User
from ...database.schemas import LeaderboardEntry, PlatformStats
from ..dependencies import DBSession

router = APIRouter()


@router.get("/platform", response_model=PlatformStats)
async def platform_stats(session: DBSession):
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    total = (await session.execute(select(func.count()).select_from(Incident))).scalar_one()
    verified = (await session.execute(
        select(func.count()).select_from(Incident).where(Incident.status == "verified")
    )).scalar_one()
    resolved = (await session.execute(
        select(func.count()).select_from(Incident).where(Incident.status == "resolved")
    )).scalar_one()
    reporters = (await session.execute(
        select(func.count(distinct(Incident.reporter_firebase_uid)))
        .select_from(Incident)
        .where(Incident.reporter_firebase_uid != "anonymous")
    )).scalar_one()
    today_count = (await session.execute(
        select(func.count()).select_from(Incident).where(Incident.created_at >= today_start)
    )).scalar_one()

    return PlatformStats(
        total_incidents=total,
        verified_incidents=verified,
        resolved_incidents=resolved,
        total_reporters=reporters,
        incidents_today=today_count,
    )


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(session: DBSession, limit: int = 20):
    result = await session.execute(
        select(User, func.count(Incident.id).label("report_count"))
        .outerjoin(Incident, Incident.reporter_firebase_uid == User.firebase_uid)
        .where(User.firebase_uid != "anonymous")
        .group_by(User.id)
        .order_by(User.points.desc())
        .limit(limit)
    )
    rows = result.all()

    return [
        LeaderboardEntry(
            rank=i + 1,
            name=user.name,
            firebase_uid=user.firebase_uid,
            points=user.points,
            report_count=report_count or 0,
        )
        for i, (user, report_count) in enumerate(rows)
    ]
