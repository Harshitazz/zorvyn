from datetime import date
from typing import Any, Optional

from sqlalchemy import case, desc, extract, func
from sqlalchemy.orm import Session

from app.models.entities import FinancialRecord


def _base_query(db: Session):
    return db.query(FinancialRecord).filter(FinancialRecord.is_deleted.is_(False))


def _query_with_date_filter(db: Session, start: Optional[date], end: Optional[date]):
    q = _base_query(db)
    if start:
        q = q.filter(FinancialRecord.date >= start)
    if end:
        q = q.filter(FinancialRecord.date <= end)
    return q


# ✅ 1. Dashboard Summary
def summarize_records(db: Session, start: Optional[date] = None, end: Optional[date] = None) -> dict[str, Any]:
    q = _query_with_date_filter(db, start, end)

    total_income, total_expenses, total_records = q.with_entities(
        func.coalesce(func.sum(case((FinancialRecord.type == "income", FinancialRecord.amount), else_=0.0)), 0.0),
        func.coalesce(func.sum(case((FinancialRecord.type == "expense", FinancialRecord.amount), else_=0.0)), 0.0),
        func.count(FinancialRecord.id),
    ).one()

    by_category = (
        q.with_entities(
            FinancialRecord.category,
            FinancialRecord.type,
            func.sum(FinancialRecord.amount).label("total"),
        )
        .group_by(FinancialRecord.category, FinancialRecord.type)
        .order_by(FinancialRecord.category, FinancialRecord.type)
        .all()
    )

    recent_activity = (
        q.order_by(FinancialRecord.date.desc(), FinancialRecord.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "overview": {
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "net_balance": float(total_income - total_expenses),
            "total_records": int(total_records),
        },
        "by_category": [
            {"category": c, "type": t, "total": float(total)}
            for c, t, total in by_category
        ],
        "recent_activity": [
            {
                "id": r.id,
                "amount": float(r.amount),
                "type": r.type,
                "category": r.category,
                "date": str(r.date),
                "notes": r.notes,
            }
            for r in recent_activity
        ],
    }


# ✅ 2. Monthly Trends
def monthly_trends(db: Session, year: Optional[int] = None) -> list[dict[str, Any]]:
    q = _base_query(db)

    if year:
        q = q.filter(extract("year", FinancialRecord.date) == year)

    group = (
        q.with_entities(
            extract("year", FinancialRecord.date).label("y"),
            extract("month", FinancialRecord.date).label("m"),
            func.coalesce(func.sum(case((FinancialRecord.type == "income", FinancialRecord.amount), else_=0.0)), 0.0),
            func.coalesce(func.sum(case((FinancialRecord.type == "expense", FinancialRecord.amount), else_=0.0)), 0.0),
            func.count(FinancialRecord.id),
        )
        .group_by("y", "m")
        .order_by("y", "m")
        .all()
    )

    return [
        {
            "month": f"{int(y):04d}-{int(m):02d}",
            "income": float(income),
            "expenses": float(expenses),
            "count": int(cnt),
        }
        for y, m, income, expenses, cnt in group
    ]


# ✅ 3. Weekly Trends
def weekly_trends(db: Session, week_count: int = 12) -> list[dict[str, Any]]:
    bind = db.get_bind()

    week_expr = (
        func.strftime("%W", FinancialRecord.date)
        if bind.dialect.name == "sqlite"
        else extract("week", FinancialRecord.date)
    )

    group = (
        db.query(
            extract("year", FinancialRecord.date).label("y"),
            week_expr.label("w"),
            func.coalesce(func.sum(case((FinancialRecord.type == "income", FinancialRecord.amount), else_=0.0)), 0.0),
            func.coalesce(func.sum(case((FinancialRecord.type == "expense", FinancialRecord.amount), else_=0.0)), 0.0),
            func.count(FinancialRecord.id),
        )
        .filter(FinancialRecord.is_deleted.is_(False))
        .group_by("y", "w")
        .order_by(desc("y"), desc("w"))
        .limit(week_count)
        .all()
    )

    ordered = list(reversed(group))

    return [
        {
            "week": f"{int(y):04d}-W{int(w):02d}",
            "income": float(income),
            "expenses": float(expenses),
            "count": int(cnt),
        }
        for y, w, income, expenses, cnt in ordered
    ]