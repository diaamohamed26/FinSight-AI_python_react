
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# =========================
# Authentication
# =========================

class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# =========================
# Transactions
# =========================

class TransactionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = "Other"
    amount: Decimal = Field(
        gt=0,
        max_digits=14,
        decimal_places=2,
    )
    type: Literal["income", "expense"]
    date: date


class TransactionResponse(TransactionCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# =========================
# Budgets
# =========================

class BudgetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = "Other"
    limit: Decimal = Field(
        gt=0,
        max_digits=14,
        decimal_places=2,
    )


class BudgetResponse(BudgetCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# =========================
# AI Assistant
# =========================

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    answer: str
