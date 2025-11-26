from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


# Import nested schemas
from app.schemas.product import Product as ProductSchema
from app.schemas.supplier import Supplier as SupplierSchema


class PurchaseOrderItemBase(BaseModel):
    product_id: int
    quantity: Decimal  # В кв.м
    unit_price: Decimal


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    purchase_order_id: int
    total: Decimal
    received_quantity: Decimal
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductSchema] = None

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    supplier_id: int
    expected_date: Optional[date] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[int] = None
    expected_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseOrderItemCreate]] = None


class PurchaseOrder(PurchaseOrderBase):
    id: int
    po_number: str
    order_date: date
    status: str
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierSchema] = None
    items: List[PurchaseOrderItem] = []

    class Config:
        from_attributes = True


