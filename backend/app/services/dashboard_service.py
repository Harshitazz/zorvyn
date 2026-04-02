from datetime import date
from sqlalchemy.orm import Session

from app.core.config import config
from app.repository.dashboard_repository import monthly_trends, summarize_records, weekly_trends


def get_dashboard_summary(db: Session, start: date | None = None, end: date | None = None):
    """Get aggregated financial overview."""
    summary = summarize_records(db, start, end)
    return summary


def get_monthly_trends(db: Session, year: int | None = None):
    """Get month-over-month income and expense trends."""
    trends = monthly_trends(db, year)
    return trends


def get_weekly_trends(db: Session):
    """Get week-over-week income and expense trends (last 12 weeks)."""
    trends = weekly_trends(db)
    return trends
