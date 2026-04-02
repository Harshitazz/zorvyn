from datetime import date
from typing import Any, Optional

from sqlalchemy import case, desc, extract, func, or_
from sqlalchemy.orm import Session

from app.models.entities import FinancialRecord


def _base_query(db: Session):
    return db.query(FinancialRecord).filter(FinancialRecord.is_deleted.is_(False))


def query_records(
    db: Session,
    type_: Optional[str] = None,
    category: Optional[str] = None,
    start: Optional[date] = None,
    end: Optional[date] = None,
    search: Optional[str] = None,
):
    q = _base_query(db)
    if type_:
        q = q.filter(FinancialRecord.type == type_)
    if category:
        q = q.filter(FinancialRecord.category == category)
    if start:
        q = q.filter(FinancialRecord.date >= start)
    if end:
        q = q.filter(FinancialRecord.date <= end)
    if search:
        token = f"%{search.lower()}%"
        q = q.filter(
            or_(
                func.lower(FinancialRecord.category).like(token),
                func.lower(func.coalesce(FinancialRecord.notes, "")).like(token),
            )
        )
    return q


def get_record(db: Session, record_id: str) -> Optional[FinancialRecord]:
    return _base_query(db).filter(FinancialRecord.id == record_id).first()


def create_record(db: Session, record_data: dict[str, Any]) -> FinancialRecord:
    record = FinancialRecord(**record_data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_record(db: Session, record: FinancialRecord, updates: dict[str, Any]) -> FinancialRecord:
    for k, v in updates.items():
        if v is not None:
            setattr(record, k, v)
    db.commit()
    db.refresh(record)
    return record


def soft_delete_record(db: Session, record: FinancialRecord) -> FinancialRecord:
    record.is_deleted = True
    db.commit()
    db.refresh(record)
    return record
