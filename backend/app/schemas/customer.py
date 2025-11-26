from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Union
from datetime import datetime
from app.models.customer import CustomerStatus, CustomerType


class CustomerBase(BaseModel):
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[Union[EmailStr, str]] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[Union[CustomerStatus, str]] = CustomerStatus.PROSPECT
    customer_type: Optional[Union[CustomerType, str]] = CustomerType.BUSINESS
    notes: Optional[str] = None
    
    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, v):
        """Convert empty string to None for email."""
        if v == '' or v is None:
            return None
        return v
    
    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        """Convert string status to enum."""
        if isinstance(v, str):
            try:
                return CustomerStatus(v.lower())
            except ValueError:
                return CustomerStatus.PROSPECT
        return v if v else CustomerStatus.PROSPECT
    
    @field_validator('customer_type', mode='before')
    @classmethod
    def validate_customer_type(cls, v):
        """Convert string customer_type to enum."""
        if isinstance(v, str):
            try:
                return CustomerType(v.lower())
            except ValueError:
                return CustomerType.BUSINESS
        return v if v else CustomerType.BUSINESS


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[Union[EmailStr, str]] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[Union[CustomerStatus, str]] = None
    customer_type: Optional[Union[CustomerType, str]] = None
    notes: Optional[str] = None
    
    @field_validator('email', mode='before')
    @classmethod
    def validate_email(cls, v):
        """Convert empty string to None for email."""
        if v == '' or v is None:
            return None
        return v
    
    @field_validator('status', mode='before')
    @classmethod
    def validate_status(cls, v):
        """Convert string status to enum."""
        if isinstance(v, str) and v:
            try:
                return CustomerStatus(v.lower())
            except ValueError:
                return None
        return v
    
    @field_validator('customer_type', mode='before')
    @classmethod
    def validate_customer_type(cls, v):
        """Convert string customer_type to enum."""
        if isinstance(v, str) and v:
            try:
                return CustomerType(v.lower())
            except ValueError:
                return None
        return v


class Customer(CustomerBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

