from sqlalchemy import Column, Integer, ForeignKey, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(10, 3), nullable=False, default=1)  # Поддержка кв.м (десятичные значения)
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), default=0.00)
    total = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product", back_populates="order_items")

