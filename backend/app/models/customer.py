from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class CustomerStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PROSPECT = "prospect"


class CustomerType(str, enum.Enum):
    INDIVIDUAL = "individual"
    BUSINESS = "business"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(200), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(100), index=True)
    phone = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    zip_code = Column(String(20))
    country = Column(String(100))
    tax_id = Column(String(50))
    status = Column(SQLEnum(CustomerStatus), default=CustomerStatus.PROSPECT)
    customer_type = Column(SQLEnum(CustomerType), default=CustomerType.BUSINESS)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], back_populates="customers_created")
    contacts = relationship("Contact", back_populates="customer", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="customer")
    sales_orders = relationship("SalesOrder", back_populates="customer")

