from datetime import date as dt_date
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


RECORD_TYPES = Literal["income", "expense"]
RECORD_CATEGORIES = Literal[
    "salary",
    "freelance",
    "investment",
    "rent",
    "utilities",
    "food",
    "transport",
    "healthcare",
    "education",
    "entertainment",
    "shopping",
    "insurance",
    "tax",
    "other",
]


class RecordCreateInput(BaseModel):
    amount: Decimal = Field(gt=0, decimal_places=2, max_digits=12)
    type: RECORD_TYPES
    category: RECORD_CATEGORIES
    date: dt_date
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("amount", mode="before")
    @classmethod
    def validate_amount(cls, v):
        if isinstance(v, str):
            v = Decimal(v)
        if not isinstance(v, Decimal):
            v = Decimal(str(v))
        if v <= 0:
            raise ValueError("Amount must be positive")
        if v.as_tuple().exponent < -2:
            raise ValueError("Amount cannot have more than 2 decimal places")
        return v


class RecordUpdateInput(BaseModel):
    amount: Optional[Decimal] = Field(default=None, gt=0)
    type: Optional[RECORD_TYPES] = None
    category: Optional[RECORD_CATEGORIES] = None
    date: Optional[dt_date] = None
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("amount", mode="before")
    @classmethod
    def validate_amount(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = Decimal(v)
        if not isinstance(v, Decimal):
            v = Decimal(str(v))
        if v <= 0:
            raise ValueError("Amount must be positive")
        if v.as_tuple().exponent < -2:
            raise ValueError("Amount cannot have more than 2 decimal places")
        return v
