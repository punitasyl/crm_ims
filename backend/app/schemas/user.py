from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Union
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    role: Optional[Union[UserRole, str]] = UserRole.VIEWER
    
    @field_validator('role', mode='before')
    @classmethod
    def parse_role(cls, v):
        """Convert string role to UserRole enum."""
        if isinstance(v, str):
            try:
                return UserRole(v.lower())
            except ValueError:
                return UserRole.VIEWER
        return v if v else UserRole.VIEWER


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(UserResponse):
    pass


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[Union[UserRole, str]] = None
    is_active: Optional[bool] = None
    
    @field_validator('role', mode='before')
    @classmethod
    def parse_role(cls, v):
        """Convert string role to UserRole enum."""
        if isinstance(v, str):
            try:
                return UserRole(v.lower())
            except ValueError:
                return None
        return v

