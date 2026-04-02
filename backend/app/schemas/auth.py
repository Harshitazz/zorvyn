from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["admin", "analyst", "viewer"] = "viewer"


class LoginInput(BaseModel):
    email: EmailStr
    password: str
