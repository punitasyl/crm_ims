from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    cost = Column(Numeric(10, 2), default=0.00)
    unit = Column(String(20), default="piece")
    weight = Column(Numeric(10, 2))
    dimensions = Column(String(100))
    length_mm = Column(Integer)  # Длина плитки в миллиметрах
    width_mm = Column(Integer)   # Ширина плитки в миллиметрах
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    reorder_level = Column(Integer, default=0)
    reorder_quantity = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="products")
    inventory_items = relationship("Inventory", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="product")

