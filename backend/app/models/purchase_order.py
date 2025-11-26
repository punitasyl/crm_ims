from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric, Date, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class PurchaseOrderStatus(str, enum.Enum):
    PENDING = "pending"
    ORDERED = "ordered"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    order_date = Column(Date, nullable=False, server_default=func.current_date())
    expected_date = Column(Date)
    status = Column(SQLEnum(PurchaseOrderStatus), default=PurchaseOrderStatus.PENDING)
    subtotal = Column(Numeric(10, 2), default=0.00)
    tax = Column(Numeric(10, 2), default=0.00)
    total = Column(Numeric(10, 2), default=0.00)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

