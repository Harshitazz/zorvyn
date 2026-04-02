from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.cache import cache
from app.core.config import config
from app.db.database import get_db
from app.models.entities import User
from app.services.dashboard_service import get_dashboard_summary, get_monthly_trends, get_weekly_trends

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _get_cache_key(user_id: str, key: str, start: str | None = None, end: str | None = None) -> str:
    """Generate role-specific cache key to prevent data leakage."""
    suffix = ""
    if start or end:
        suffix = f":{start or 'all'}:{end or 'all'}"
    return f"dashboard:{user_id}:{key}{suffix}"


@router.get("")
def get_dashboard(
    startDate: str | None = Query(default=None, pattern="^\\d{4}-\\d{2}-\\d{2}$|^$"),
    endDate: str | None = Query(default=None, pattern="^\\d{4}-\\d{2}-\\d{2}$|^$"),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("dashboard:read")),
):
    """Get financial dashboard with aggregated overview."""
    start = None
    end = None
    if startDate:
        try:
            start = datetime.strptime(startDate, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid startDate format. Use YYYY-MM-DD")
    if endDate:
        try:
            end = datetime.strptime(endDate, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid endDate format. Use YYYY-MM-DD")

    cache_key = _get_cache_key(user.id, "summary", startDate, endDate)
    if not startDate and not endDate:
        cached = cache.get_json(cache_key)
        if cached is not None:
            return {"success": True, "message": "Dashboard fetched (cached)", "data": cached}

    data = get_dashboard_summary(db, start, end)
    if not startDate and not endDate:
        cache.set_json(cache_key, data, ttl=config.CACHE_TTL_DASHBOARD)
    return {"success": True, "message": "Dashboard fetched", "data": data}


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("dashboard:read")),
):
    """Get dashboard summary (alias for dashboard endpoint)."""
    cache_key = _get_cache_key(user.id, "summary")
    cached = cache.get_json(cache_key)
    if cached is not None:
        return {"success": True, "message": "Summary fetched (cached)", "data": cached}

    data = get_dashboard_summary(db)
    cache.set_json(cache_key, data, ttl=config.CACHE_TTL_DASHBOARD)
    return {"success": True, "message": "Summary fetched", "data": data}


@router.get("/trends/monthly")
def monthly_trends(
    year: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(["dashboard:read", "dashboard:trends"])),
):
    """Get monthly aggregated trends."""
    cache_key = _get_cache_key(user.id, f"trends:monthly:{year or 'all'}")
    cached = cache.get_json(cache_key)
    if cached is not None:
        return {"success": True, "message": "Monthly trends fetched (cached)", "data": cached}

    data = get_monthly_trends(db, year)
    cache.set_json(cache_key, data, ttl=config.CACHE_TTL_TRENDS)
    return {"success": True, "message": "Monthly trends fetched", "data": data}


@router.get("/trends/weekly")
def weekly_trends(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission(["dashboard:read", "dashboard:trends"])),
):
    """Get weekly aggregated trends (last 12 weeks)."""
    cache_key = _get_cache_key(user.id, "trends:weekly")
    cached = cache.get_json(cache_key)
    if cached is not None:
        return {"success": True, "message": "Weekly trends fetched (cached)", "data": cached}

    data = get_weekly_trends(db)
    cache.set_json(cache_key, data, ttl=config.CACHE_TTL_TRENDS)
    return {"success": True, "message": "Weekly trends fetched", "data": data}
