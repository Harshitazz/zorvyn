from datetime import date
from sqlalchemy.orm import Session

from app.models.entities import FinancialRecord
from app.repository.record_repository import create_record, get_record, query_records, soft_delete_record, update_record


def list_records(
    db: Session,
    type_: str | None = None,
    category: str | None = None,
    start: date | None = None,
    end: date | None = None,
    q: str | None = None,
    page: int = 1,
    limit: int = 20,
):
    query = query_records(db, type_, category, start, end, q)
    total = query.count()
    items = (
        query.order_by(FinancialRecord.date.desc(), FinancialRecord.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return {
        "items": [
            {
                "id": r.id,
                "amount": float(r.amount),
                "type": r.type,
                "category": r.category,
                "date": str(r.date),
                "notes": r.notes,
                "created_by": r.created_by,
                "is_deleted": r.is_deleted,
            }
            for r in items
        ],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit,
        },
    }


def create_record_entry(db: Session, creator_id: str, payload: dict):
    record_data = {**payload, "created_by": creator_id}
    return create_record(db, record_data)


def get_record_entry(db: Session, record_id: str):
    return get_record(db, record_id)


def update_record_entry(db: Session, record: FinancialRecord, payload: dict):
    return update_record(db, record, payload)


def delete_record_entry(db: Session, record: FinancialRecord):
    return soft_delete_record(db, record)

