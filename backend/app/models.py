
from datetime import datetime, date

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    ForeignKey,
    Numeric,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database import Base


# =========================================================
# User Model
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship(
        "Transaction",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    budgets = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    settings = relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


# =========================================================
# Transaction Model
# =========================================================

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), default="Other")
    amount = Column(Numeric(14, 2), nullable=False)
    type = Column(String(20), nullable=False)
    date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="transactions")


# =========================================================
# Budget Model
# =========================================================

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    category = Column(String(100), default="Other")
    limit = Column(Numeric(14, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="budgets")


# =========================================================
# User Settings Model
# =========================================================

DEFAULT_NOTIFICATIONS = {
    "transactions": True,
    "budgets": True,
    "reports": False,
    "aiInsights": True,
}


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    currency = Column(String(10), nullable=False, default="EGP")

    account_type = Column(
        String(50),
        nullable=False,
        default="Personal",
    )

    notifications = Column(
        JSON,
        nullable=False,
        default=lambda: DEFAULT_NOTIFICATIONS.copy(),
    )

    user = relationship("User", back_populates="settings")
