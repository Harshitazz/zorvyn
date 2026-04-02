from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import require_permission
from app.core.cache import cache
from app.db.database import get_db
from app.models.entities import FinancialRecord, User
from app.schemas.records import RecordCreateInput, RecordUpdateInput
from app.services.record_service import (
    create_record_entry,
    delete_record_entry,
    get_record_entry,
    list_records,
    update_record_entry,
)

router = APIRouter(prefix="/api/records", tags=["records"])


@router.get("")
def list_records_endpoint(
    type: str | None = Query(default=None, pattern="^(income|expense)?$"),
    category: str | None = Query(default=None),
    startDate: str | None = Query(default=None, pattern="^\\d{4}-\\d{2}-\\d{2}$|^$"),
    endDate: str | None = Query(default=None, pattern="^\\d{4}-\\d{2}-\\d{2}$|^$"),
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("records:read")),
):
    """List financial records with filtering, search, and pagination."""
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
    
    if type and type not in ("income", "expense"):
        raise HTTPException(status_code=400, detail="Type must be 'income' or 'expense'")
    
    payload = list_records(db, type, category, start, end, q, page, limit)
    return {"success": True, "message": "Records fetched", "data": payload}


@router.post("")
def create_record_endpoint(
    payload: RecordCreateInput,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("records:write")),
):
    """Create a new financial record."""
    record = create_record_entry(db, user.id, payload.model_dump())
    cache.delete_prefix("dashboard:")
    return {"success": True, "message": "Record created", "data": {"id": record.id}}


@router.get("/{record_id}")
def get_record_endpoint(
    record_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("records:read")),
):
    """Get a specific financial record by ID."""
    record = get_record_entry(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return {
        "success": True,
        "message": "Record fetched",
        "data": {
            "id": record.id,
            "amount": float(record.amount),
            "type": record.type,
            "category": record.category,
            "date": str(record.date),
            "notes": record.notes,
            "created_by": record.created_by,
            "is_deleted": record.is_deleted,
        },
    }


@router.patch("/{record_id}")
def update_record_endpoint(
    record_id: str,
    payload: RecordUpdateInput,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("records:write")),
):
    """Update a financial record."""
    record = get_record_entry(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    updated = update_record_entry(db, record, payload.model_dump(exclude_unset=True))
    cache.delete_prefix("dashboard:")
    return {"success": True, "message": "Record updated", "data": {"id": updated.id}}


@router.delete("/{record_id}")
def delete_record_endpoint(
    record_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("records:write")),
):
    """Soft-delete a financial record."""
    record = get_record_entry(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    deleted = delete_record_entry(db, record)
    cache.delete_prefix("dashboard:")
    return {"success": True, "message": "Record deleted", "data": {"id": deleted.id}}

