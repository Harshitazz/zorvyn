from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class UserCreateInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["admin", "analyst", "viewer"]


class UserUpdateInput(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    role: Literal["admin", "analyst", "viewer"] | None = None
    status: Literal["active", "inactive"] | None = None
