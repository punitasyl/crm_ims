from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, WAREHOUSE_AND_ABOVE, ALL_ROLES
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/warehouses")
async def get_all_warehouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all warehouses."""
    warehouses = db.query(Warehouse).filter(Warehouse.is_active == True).all()
    return warehouses


class InventoryAdjust(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: float
    type: str  # "add", "subtract", or "set"
    reserved_quantity: Optional[float] = 0


@router.get("/")
async def get_all_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all inventory items with related product and warehouse data."""
    from sqlalchemy.orm import joinedload
    inventory = db.query(Inventory).options(
        joinedload(Inventory.product),
        joinedload(Inventory.warehouse)
    ).all()
    return inventory


@router.get("/warehouse/{warehouse_id}")
async def get_inventory_by_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory for a specific warehouse."""
    inventory = db.query(Inventory).filter(Inventory.warehouse_id == warehouse_id).all()
    return inventory


@router.get("/product/{product_id}")
async def get_inventory_by_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory for a specific product."""
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).all()
    return inventory


class InventoryUpdate(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: Optional[float] = None
    reserved_quantity: Optional[float] = None
    adjustment_type: Optional[str] = None
    adjustment_quantity: Optional[float] = None


@router.post("/adjust")
async def adjust_inventory(
    adjust_data: InventoryAdjust,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Adjust inventory levels. Only updates existing inventory items.
    New inventory items are created automatically when purchase orders are received."""
    inventory = db.query(Inventory).filter(
        Inventory.product_id == adjust_data.product_id,
        Inventory.warehouse_id == adjust_data.warehouse_id
    ).first()
    
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запись инвентаря не найдена. Товары автоматически добавляются в инвентарь при получении заявок на закупку."
        )
    
    # Update reserved_quantity if provided
    if adjust_data.reserved_quantity is not None:
        inventory.reserved_quantity = adjust_data.reserved_quantity
    
    from decimal import Decimal
    if adjust_data.type == "add":
        inventory.quantity += Decimal(str(adjust_data.quantity))
    elif adjust_data.type == "subtract":
        inventory.quantity = max(Decimal("0"), inventory.quantity - Decimal(str(adjust_data.quantity)))
    elif adjust_data.type == "set":
        inventory.quantity = Decimal(str(adjust_data.quantity))
    else:
        raise HTTPException(status_code=400, detail="Invalid adjustment type. Use 'add', 'subtract', or 'set'")
    
    from datetime import datetime
    inventory.last_updated = datetime.utcnow()
    
    db.commit()
    db.refresh(inventory)
    return inventory


@router.put("/{inventory_id}")
async def update_inventory(
    inventory_id: int,
    update_data: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Update inventory item."""
    from sqlalchemy.orm import joinedload
    inventory = db.query(Inventory).options(
        joinedload(Inventory.product),
        joinedload(Inventory.warehouse)
    ).filter(Inventory.id == inventory_id).first()
    
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    from decimal import Decimal
    
    if update_data.reserved_quantity is not None:
        inventory.reserved_quantity = Decimal(str(update_data.reserved_quantity))
    
    if update_data.adjustment_type and update_data.adjustment_quantity is not None:
        adjustment_qty = Decimal(str(update_data.adjustment_quantity))
        if update_data.adjustment_type == "add":
            inventory.quantity += adjustment_qty
        elif update_data.adjustment_type == "subtract":
            inventory.quantity = max(Decimal("0"), inventory.quantity - adjustment_qty)
        elif update_data.adjustment_type == "set":
            inventory.quantity = adjustment_qty
    
    from datetime import datetime
    inventory.last_updated = datetime.utcnow()
    
    db.commit()
    db.refresh(inventory)
    return inventory


@router.get("/low-stock")
async def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all low stock items."""
    # Get all inventory items with their products
    inventory_items = db.query(Inventory).join(Product).filter(
        Product.reorder_level > 0
    ).all()
    
    low_stock = [
        item for item in inventory_items
        if item.quantity <= item.product.reorder_level
    ]
    
    return low_stock


@router.get("/reports")
async def get_inventory_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory reports."""
    # Placeholder for inventory reports
    return {"message": "Inventory reports endpoint"}

