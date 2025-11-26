from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Numeric(10, 3), nullable=False, default=0)  # Поддержка кв.м (десятичные значения)
    reserved_quantity = Column(Numeric(10, 3), default=0)  # Поддержка кв.м
    location = Column(String(100))
    last_updated = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="inventory_items")
    warehouse = relationship("Warehouse", back_populates="inventory_items")

    # Unique constraint
    __table_args__ = (UniqueConstraint('product_id', 'warehouse_id', name='_product_warehouse_uc'),)

