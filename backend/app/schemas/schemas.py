from datetime import datetime
from typing import Any
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    employee_id: str
    password: str


class UserOut(BaseModel):
    id: int
    employee_id: str
    name: str
    email: str
    branch_id: int | None
    roles: list[str] = []

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut | None = None



class ClientCreate(BaseModel):
    name: str
    category: str = "HNI"
    email: str | None = None
    phone: str | None = None
    city: str | None = "Jodhpur"
    total_aum: float = 1.00
    client_ref: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    total_aum: float | None = None


class ClientOut(BaseModel):
    id: int
    client_ref: str
    name: str
    category: str
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    total_aum: Any = None
    registered_on: datetime

    class Config:
        from_attributes = True





class AssetAllocationOut(BaseModel):
    category: str
    amount_cr: float
    percentage: float


class DashboardSummaryOut(BaseModel):
    total_aum_cr: float
    active_clients_count: int
    monthly_growth_percent: float
    asset_allocation: list[AssetAllocationOut]


class HoldingCreate(BaseModel):
    client_id: str
    symbol: str
    name: str
    category: str = "Equity"
    quantity: float
    buy_price: float
    current_price: float


class HoldingOut(BaseModel):
    id: str
    symbol: str
    name: str
    category: str
    quantity: float
    buy_price: float
    current_price: float
    market_value: float
    gain_loss: float
    gain_loss_percentage: float


class ClientPortfolioOut(BaseModel):
    client_id: str
    equity_value: float
    debt_value: float
    mf_value: float
    cash_value: float
    other_value: float
    total_aum: float
    holdings: list[HoldingOut]


class ResearchCallOut(BaseModel):
    id: str
    type: str  # BUY / SELL / HOLD
    symbol: str
    company_name: str
    sector: str
    entry_price: float
    target_price: float
    stop_loss: float
    timeline: str
    rationale: str
    date: str


class DocumentOut(BaseModel):
    id: str
    name: str
    category: str
    file_size: str
    files_count: int
    updated_at: str


class ReportOut(BaseModel):
    id: str
    title: str
    type: str
    client_name: str
    generated_on: str
    status: str


class DocumentCreate(BaseModel):
    name: str
    category: str = "General"
    file_size: str | None = "1.5 MB"
    files_count: int | None = 1


class ReportCreate(BaseModel):
    title: str
    report_type: str
    client_name: str | None = "General"
    status: str | None = "Generated"


class TaskCreate(BaseModel):
    title: str
    due_date: str | None = "Today"
    priority: str | None = "Medium"


class TaskOut(BaseModel):
    id: str
    title: str
    due_date: str
    status: str
    priority: str

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    client_name: str
    category: str = "HNI"
    sender: str = "advisor"
    text: str
    message_time: str | None = "Just now"
    thread_id: str | None = "t1"


class MessageOut(BaseModel):
    id: str
    client_name: str
    category: str
    sender: str
    text: str
    message_time: str
    unread: bool
    thread_id: str


class AuditLogOut(BaseModel):
    id: int
    client: str
    type: str
    date: str
    status: str
    auditor: str


class UserCreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    password: str
    role_name: str = "Relationship Manager"
    branch_id: int = 1


class ClientAssignRequest(BaseModel):
    rm_id: int
    client_id: int


class SystemAuditLogOut(BaseModel):
    id: int
    user_id: int | None = None
    user_name: str | None = None
    action: str
    module: str | None = None
    record_id: int | None = None
    ip_address: str | None = None
    old_value: str | None = None
    new_value: str | None = None
    created_at: str





