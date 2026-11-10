
import os
from datetime import date, datetime, timedelta
from decimal import Decimal

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case

from jose import jwt, JWTError
from pwdlib import PasswordHash
from groq import Groq

from app.database import Base, engine, get_db
from app.models import (
    User,
    Transaction,
    Budget,
    UserSettings,
    DEFAULT_NOTIFICATIONS,
)
from app.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    TransactionCreate,
    TransactionResponse,
    BudgetCreate,
    BudgetResponse,
    ChatRequest,
    ChatResponse,
)

# =========================================================
# Configuration
# =========================================================

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing from .env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

password_hash = PasswordHash.recommended()
security = HTTPBearer()

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# =========================================================
# Database
# =========================================================

Base.metadata.create_all(bind=engine)

# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title="FinSight AI API",
    description="AI-powered Financial Intelligence System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# Authentication Helpers
# =========================================================

def create_access_token(user_id: int):
    expires = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expires,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = int(payload.get("sub"))

    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user


# =========================================================
# Financial Helpers
# =========================================================

def get_monthly_totals(db: Session, user_id: int):
    today = date.today()

    rows = (
        db.query(
            Transaction.type,
            func.sum(Transaction.amount),
        )
        .filter(
            Transaction.user_id == user_id,
            extract("year", Transaction.date) == today.year,
            extract("month", Transaction.date) == today.month,
        )
        .group_by(Transaction.type)
        .all()
    )

    totals = {
        "income": Decimal("0.00"),
        "expense": Decimal("0.00"),
    }

    for transaction_type, total in rows:
        if transaction_type in totals:
            totals[transaction_type] = Decimal(str(total or 0))

    return totals


def get_current_balance(db: Session, user_id: int):
    balance = (
        db.query(
            func.sum(
                case(
                    (Transaction.type == "income", Transaction.amount),
                    else_=-Transaction.amount,
                )
            )
        )
        .filter(Transaction.user_id == user_id)
        .scalar()
    )

    return Decimal(str(balance or 0))


# =========================================================
# General Routes
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to FinSight AI API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "ai": "configured" if groq_client else "not configured",
    }


# =========================================================
# Authentication Routes
# =========================================================

@app.post(
    "/api/auth/register",
    response_model=TokenResponse,
    status_code=201,
)
def register(
    data: UserRegister,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(
        User.email == data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=password_hash.hash(data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }


@app.post("/api/auth/login", response_model=TokenResponse)
def login(
    data: UserLogin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    if not user or not password_hash.verify(
        data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_profile(user: User = Depends(get_current_user)):
    return user


# =========================================================
# Transactions
# =========================================================

@app.get(
    "/api/transactions",
    response_model=list[TransactionResponse],
)
def get_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .all()
    )


@app.post(
    "/api/transactions",
    response_model=TransactionResponse,
    status_code=201,
)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    transaction = Transaction(
        **data.model_dump(),
        user_id=user.id,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return transaction


@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user.id,
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    db.delete(transaction)
    db.commit()

    return {"message": "Transaction deleted successfully"}


# =========================================================
# Budgets
# =========================================================

@app.get("/api/budgets")
def get_budgets(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budgets = db.query(Budget).filter(
        Budget.user_id == user.id
    ).all()

    today = date.today()
    results = []

    for budget in budgets:
        spent = (
            db.query(func.sum(Transaction.amount))
            .filter(
                Transaction.user_id == user.id,
                Transaction.type == "expense",
                Transaction.category == budget.category,
                extract("year", Transaction.date) == today.year,
                extract("month", Transaction.date) == today.month,
            )
            .scalar()
        ) or Decimal("0.00")

        results.append({
            "id": budget.id,
            "name": budget.name,
            "category": budget.category,
            "limit": budget.limit,
            "spent": Decimal(str(spent)),
        })

    return results


@app.post("/api/budgets", status_code=201)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = Budget(
        **data.model_dump(),
        user_id=user.id,
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return {
        "id": budget.id,
        "name": budget.name,
        "category": budget.category,
        "limit": budget.limit,
        "spent": Decimal("0.00"),
    }


@app.delete("/api/budgets/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == user.id,
    ).first()

    if not budget:
        raise HTTPException(
            status_code=404,
            detail="Budget not found",
        )

    db.delete(budget)
    db.commit()

    return {"message": "Budget deleted successfully"}


# =========================================================
# Dashboard
# =========================================================

@app.get("/api/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    totals = get_monthly_totals(db, user.id)

    income = totals["income"]
    expenses = totals["expense"]

    recent_transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
        .limit(5)
        .all()
    )

    transaction_count = db.query(Transaction).filter(
        Transaction.user_id == user.id
    ).count()

    return {
        "currency": "EGP",
        "total_balance": get_current_balance(db, user.id),
        "monthly_income": income,
        "monthly_expenses": expenses,
        "monthly_savings": income - expenses,
        "transaction_count": transaction_count,
        "recent_transactions": [
            TransactionResponse.model_validate(item).model_dump(mode="json")
            for item in recent_transactions
        ],
    }


# =========================================================
# Reports
# =========================================================

@app.get("/api/reports/expenses")
def expense_report(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today = date.today()

    rows = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.type == "expense",
            extract("year", Transaction.date) == today.year,
            extract("month", Transaction.date) == today.month,
        )
        .group_by(Transaction.category)
        .all()
    )

    return [
        {
            "category": category,
            "amount": total,
        }
        for category, total in rows
    ]


# =========================================================
# Forecasting
# =========================================================

@app.get("/api/forecast")
def forecast(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    totals = get_monthly_totals(db, user.id)

    monthly_savings = totals["income"] - totals["expense"]
    current_balance = get_current_balance(db, user.id)

    projections = []

    for month in range(1, 7):
        projections.append({
            "month": month,
            "projected_balance": (
                current_balance + monthly_savings * month
            ),
        })

    return {
        "current_balance": current_balance,
        "monthly_savings": monthly_savings,
        "projections": projections,
        "note": "Illustrative projection based on current-month net cash flow.",
    }



# =========================================================
# User Settings Routes
# =========================================================

@app.get("/api/settings")
def get_settings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    settings = db.query(UserSettings).filter(
        UserSettings.user_id == user.id
    ).first()

    if not settings:
        return {
            "profile": {
                "name": user.name,
                "email": user.email,
                "currency": "EGP",
                "account_type": "Personal",
            },
            "notifications": DEFAULT_NOTIFICATIONS.copy(),
        }

    return {
        "profile": {
            "name": user.name,
            "email": user.email,
            "currency": settings.currency,
            "account_type": settings.account_type,
        },
        "notifications": {
            **DEFAULT_NOTIFICATIONS,
            **(settings.notifications or {}),
        },
    }


@app.put("/api/settings")
def update_settings(
    data: dict,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    profile = data.get("profile", {})
    notifications = data.get("notifications", {})

    if not isinstance(profile, dict) or not isinstance(notifications, dict):
        raise HTTPException(
            status_code=422,
            detail="Invalid settings data",
        )

    name = profile.get("name")
    email = profile.get("email")

    if name is not None:
        if not isinstance(name, str) or not name.strip():
            raise HTTPException(422, "Name cannot be empty")
        user.name = name.strip()

    if email is not None:
        if not isinstance(email, str) or not email.strip():
            raise HTTPException(422, "Email cannot be empty")

        email = email.strip().lower()

        existing = db.query(User).filter(
            User.email == email,
            User.id != user.id,
        ).first()

        if existing:
            raise HTTPException(400, "Email is already in use")

        user.email = email

    settings = db.query(UserSettings).filter(
        UserSettings.user_id == user.id
    ).first()

    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)

    currency = profile.get("currency")
    account_type = profile.get("account_type")

    if currency is not None:
        if not isinstance(currency, str) or not currency.strip():
            raise HTTPException(422, "Invalid currency")
        settings.currency = currency.strip().upper()

    if account_type is not None:
        if not isinstance(account_type, str) or not account_type.strip():
            raise HTTPException(422, "Invalid account type")
        settings.account_type = account_type.strip()

    current_notifications = {
        **DEFAULT_NOTIFICATIONS,
        **(settings.notifications or {}),
    }

    for key, value in notifications.items():
        if key not in DEFAULT_NOTIFICATIONS:
            raise HTTPException(422, f"Unknown notification: {key}")

        if not isinstance(value, bool):
            raise HTTPException(422, f"{key} must be true or false")

        current_notifications[key] = value

    settings.notifications = current_notifications

    db.commit()
    db.refresh(settings)

    return {
        "message": "Settings updated successfully",
        "profile": {
            "name": user.name,
            "email": user.email,
            "currency": settings.currency,
            "account_type": settings.account_type,
        },
        "notifications": settings.notifications,
    }



# =========================================================
# Groq AI Assistant
# =========================================================

@app.post("/api/ai/chat", response_model=ChatResponse)
def ai_chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not groq_client:
        raise HTTPException(
            status_code=503,
            detail="Groq API key is not configured in backend .env",
        )

    totals = get_monthly_totals(db, user.id)

    recent = (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.date.desc())
        .limit(10)
        .all()
    )

    financial_context = {
        "currency": "EGP",
        "total_balance": str(get_current_balance(db, user.id)),
        "monthly_income": str(totals["income"]),
        "monthly_expenses": str(totals["expense"]),
        "monthly_savings": str(totals["income"] - totals["expense"]),
        "recent_transactions": [
            {
                "name": item.name,
                "category": item.category,
                "amount": str(item.amount),
                "type": item.type,
                "date": item.date.isoformat(),
            }
            for item in recent
        ],
    }

    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are FinSight AI, a careful financial assistant. "
                        "Use only the supplied financial context. "
                        "Never invent balances or transactions. "
                        "If information is missing, explain that. "
                        "Provide educational financial guidance, not guaranteed "
                        "investment advice. Respond in the same language as "
                        "the user's question. "
                        f"Financial context: {financial_context}"
                    ),
                },
                {
                    "role": "user",
                    "content": data.message,
                },
            ],
            temperature=0.3,
            max_tokens=1000,
        )

        answer = (
            completion.choices[0].message.content
            or "I could not generate a response."
        )

        return {"answer": answer}

    except Exception as error:
        print(f"Groq API error: {error}")

        raise HTTPException(
            status_code=502,
            detail="AI service request failed. Check your Groq API key and model.",
        )
