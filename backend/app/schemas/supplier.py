from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class SupplierBase(BaseModel):
    name: str
    code: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = True


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Supplier(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


