from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"


class LeadPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    source = Column(String(100))
    status = Column(SQLEnum(LeadStatus), default=LeadStatus.NEW)
    priority = Column(SQLEnum(LeadPriority), default=LeadPriority.MEDIUM)
    estimated_value = Column(Numeric(10, 2))
    notes = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="leads")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="leads_assigned")
    opportunities = relationship("Opportunity", back_populates="lead")

