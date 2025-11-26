from pydantic import BaseModel, field_serializer
from typing import Optional, Union
from datetime import datetime
from decimal import Decimal


class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Union[Decimal, float]
    cost: Optional[Union[Decimal, float]] = 0.00
    unit: Optional[str] = "piece"
    weight: Optional[Union[Decimal, float]] = None
    dimensions: Optional[str] = None
    length_mm: Optional[int] = None  # Длина плитки в миллиметрах
    width_mm: Optional[int] = None  # Ширина плитки в миллиметрах
    image_url: Optional[str] = None
    is_active: Optional[bool] = True
    reorder_level: Optional[int] = 0
    reorder_quantity: Optional[int] = 0
    
    @field_serializer('price', 'cost', 'weight')
    def serialize_decimal(self, value: Optional[Union[Decimal, float]], _info):
        """Convert Decimal to float for JSON serialization."""
        if value is None:
            return None
        if isinstance(value, Decimal):
            return float(value)
        return value


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[Decimal] = None
    cost: Optional[Decimal] = None
    unit: Optional[str] = None
    weight: Optional[Decimal] = None
    dimensions: Optional[str] = None
    length_mm: Optional[int] = None
    width_mm: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    reorder_level: Optional[int] = None
    reorder_quantity: Optional[int] = None


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

