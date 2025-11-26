from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal

from app.database import get_db
from app.models.sales_order import SalesOrder, OrderStatus
from app.models.order_item import OrderItem
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.product import Product
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, SALES_AND_ABOVE, WAREHOUSE_AND_ABOVE, ALL_ROLES
from app.models.user import User, UserRole

router = APIRouter()


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: Decimal  # Поддержка кв.м (десятичные значения)
    unit_price: Decimal
    discount: Optional[Decimal] = 0.00
    warehouse_id: Optional[int] = None  # Склад, с которого будет отгружаться товар


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]
    shipping_address: Optional[str] = None
    notes: Optional[str] = None
    discount: Optional[Decimal] = 0.00
    warehouse_id: Optional[int] = None  # Основной склад для заказа


@router.get("/")
async def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders with pagination and filtering."""
    from sqlalchemy.orm import joinedload
    query = db.query(SalesOrder).options(
        joinedload(SalesOrder.customer),
        joinedload(SalesOrder.items).joinedload(OrderItem.product)
    )
    
    if status_filter:
        query = query.filter(SalesOrder.status == status_filter)
    
    orders = query.order_by(SalesOrder.created_at.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get an order by ID with related data."""
    from sqlalchemy.orm import joinedload
    order = db.query(SalesOrder).options(
        joinedload(SalesOrder.customer),
        joinedload(SalesOrder.items).joinedload(OrderItem.product)
    ).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )
    return order


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(SALES_AND_ABOVE))  # ADMIN, MANAGER, SALES
):
    """Create a new order and reserve inventory."""
    # Generate order number
    import time
    order_number = f"SO-{int(time.time() * 1000)}"
    
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    # Check inventory availability and reserve items
    warehouse_id = order_data.warehouse_id
    inventory_updates = []
    
    for item_data in order_data.items:
        # Determine warehouse for this item (use item's warehouse_id or order's warehouse_id)
        item_warehouse_id = item_data.warehouse_id or warehouse_id
        
        if not item_warehouse_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Не указан склад для товара ID {item_data.product_id}"
            )
        
        # Check product exists
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Товар с ID {item_data.product_id} не найден"
            )
        
        # Check inventory
        inventory = db.query(Inventory).filter(
            Inventory.product_id == item_data.product_id,
            Inventory.warehouse_id == item_warehouse_id
        ).first()
        
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Товар '{product.name}' отсутствует на складе ID {item_warehouse_id}"
            )
        
        # Check available quantity (quantity - reserved_quantity)
        # Convert to Decimal for comparison
        item_quantity = Decimal(str(item_data.quantity))
        available = Decimal(str(inventory.quantity)) - Decimal(str(inventory.reserved_quantity))
        if available < item_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Недостаточно товара '{product.name}' на складе. Доступно: {available} {product.unit or 'шт'}, требуется: {item_quantity} {product.unit or 'шт'}"
            )
        
        # Reserve inventory (increase reserved_quantity)
        inventory.reserved_quantity = Decimal(str(inventory.reserved_quantity)) + item_quantity
        inventory_updates.append((inventory, item_quantity))
    
    # Calculate totals (quantity × unit_price = total for each item)
    subtotal = sum(Decimal(str(item.unit_price)) * Decimal(str(item.quantity)) for item in order_data.items)
    tax = subtotal * Decimal("0.1")  # 10% tax
    total = subtotal + tax - Decimal(str(order_data.discount))
    
    # Create order
    db_order = SalesOrder(
        order_number=order_number,
        customer_id=order_data.customer_id,
        subtotal=subtotal,
        tax=tax,
        discount=order_data.discount,
        total=total,
        shipping_address=order_data.shipping_address,
        notes=order_data.notes,
        created_by=current_user.id,
        status=OrderStatus.PENDING
    )
    db.add(db_order)
    db.flush()  # Get the order ID
    
    # Create order items
    for item_data in order_data.items:
        item_quantity = Decimal(str(item_data.quantity))
        item_unit_price = Decimal(str(item_data.unit_price))
        item_discount = Decimal(str(item_data.discount))
        item_total = item_unit_price * item_quantity - item_discount
        order_item = OrderItem(
            order_id=db_order.id,
            product_id=item_data.product_id,
            quantity=item_quantity,
            unit_price=item_unit_price,
            discount=item_discount,
            total=item_total
        )
        db.add(order_item)
    
    try:
        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        db.rollback()
        # Rollback inventory reservations
        for inventory, quantity in inventory_updates:
            reserved_qty = Decimal(str(inventory.reserved_quantity))
            qty = Decimal(str(quantity))
            inventory.reserved_quantity = reserved_qty - qty
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания заказа: {str(e)}"
        )


class OrderStatusUpdate(BaseModel):
    status: str
    warehouse_id: Optional[int] = None  # Склад для отгрузки


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES, UserRole.WAREHOUSE]))  # Все кроме VIEWER (WAREHOUSE для отгрузки)
):
    """Update order status and manage inventory accordingly."""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )
    
    try:
        new_status = OrderStatus(status_data.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный статус заказа"
        )
    
    old_status = order.status
    
    # Get order items with products
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    # Handle inventory based on status change
    warehouse_id = status_data.warehouse_id
    
    if new_status == OrderStatus.CANCELLED and old_status != OrderStatus.CANCELLED:
        # Release reserved inventory when cancelling
        for item in order_items:
            # Try to find inventory - check if warehouse_id is provided, otherwise find any inventory for this product
            if warehouse_id:
                inventory = db.query(Inventory).filter(
                    Inventory.product_id == item.product_id,
                    Inventory.warehouse_id == warehouse_id
                ).first()
            else:
                # Find first available inventory for this product
                inventory = db.query(Inventory).filter(
                    Inventory.product_id == item.product_id
                ).first()
            
            if inventory:
                item_qty = Decimal(str(item.quantity))
                reserved_qty = Decimal(str(inventory.reserved_quantity))
                if reserved_qty >= item_qty:
                    inventory.reserved_quantity = reserved_qty - item_qty
    
    elif new_status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED] and old_status not in [OrderStatus.SHIPPED, OrderStatus.DELIVERED]:
        # Deduct inventory when shipping/delivering
        for item in order_items:
            if warehouse_id:
                inventory = db.query(Inventory).filter(
                    Inventory.product_id == item.product_id,
                    Inventory.warehouse_id == warehouse_id
                ).first()
            else:
                # Find first available inventory for this product
                inventory = db.query(Inventory).filter(
                    Inventory.product_id == item.product_id
                ).first()
            
            if inventory:
                item_qty = Decimal(str(item.quantity))
                reserved_qty = Decimal(str(inventory.reserved_quantity))
                qty = Decimal(str(inventory.quantity))
                
                # Check if enough reserved quantity
                if reserved_qty < item_qty:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Недостаточно зарезервированного товара для заказа"
                    )
                
                # Deduct from both quantity and reserved_quantity
                inventory.quantity = qty - item_qty
                inventory.reserved_quantity = reserved_qty - item_qty
    
    order.status = new_status
    
    try:
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обновления статуса заказа: {str(e)}"
        )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an order."""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(order)
    db.commit()
    return None

