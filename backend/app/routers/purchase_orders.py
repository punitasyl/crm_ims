from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal
import time

from app.database import get_db
from app.models.purchase_order import PurchaseOrder, PurchaseOrderStatus
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.purchase_order import PurchaseOrder as PurchaseOrderSchema, PurchaseOrderCreate, PurchaseOrderUpdate
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, WAREHOUSE_AND_ABOVE, ALL_ROLES
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/", response_model=List[PurchaseOrderSchema])
async def get_all_purchase_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all purchase orders."""
    query = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product)
    )
    
    if status_filter:
        try:
            status_enum = PurchaseOrderStatus(status_filter.lower())
            query = query.filter(PurchaseOrder.status == status_enum)
        except ValueError:
            pass
    
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    
    orders = query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit).all()
    return orders


@router.get("/{order_id}", response_model=PurchaseOrderSchema)
async def get_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a purchase order by ID."""
    order = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product)
    ).filter(PurchaseOrder.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка на закупку не найдена"
        )
    return order


@router.post("/", response_model=PurchaseOrderSchema, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    order_data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Create a new purchase order."""
    # Generate PO number
    po_number = f"PO-{int(time.time() * 1000)}"
    
    # Validate supplier exists
    supplier = db.query(Supplier).filter(Supplier.id == order_data.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Поставщик не найден"
        )
    
    # Validate products and calculate totals
    subtotal = Decimal("0.00")
    items_to_create = []
    
    for item_data in order_data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Товар с ID {item_data.product_id} не найден"
            )
        
        item_total = item_data.quantity * item_data.unit_price
        subtotal += item_total
        
        items_to_create.append({
            "product_id": item_data.product_id,
            "quantity": item_data.quantity,
            "unit_price": item_data.unit_price,
            "total": item_total,
            "received_quantity": Decimal("0.00")
        })
    
    tax = subtotal * Decimal("0.12")  # 12% НДС
    total = subtotal + tax
    
    # Create purchase order
    db_order = PurchaseOrder(
        po_number=po_number,
        supplier_id=order_data.supplier_id,
        expected_date=order_data.expected_date,
        status=PurchaseOrderStatus.PENDING,
        subtotal=subtotal,
        tax=tax,
        total=total,
        notes=order_data.notes,
        created_by=current_user.id
    )
    db.add(db_order)
    db.flush()  # Get the order ID
    
    # Create order items
    for item_data in items_to_create:
        db_item = PurchaseOrderItem(
            purchase_order_id=db_order.id,
            **item_data
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    
    # Reload with relationships
    db_order = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product)
    ).filter(PurchaseOrder.id == db_order.id).first()
    
    return db_order


@router.put("/{order_id}", response_model=PurchaseOrderSchema)
async def update_purchase_order(
    order_id: int,
    order_data: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Update a purchase order."""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка на закупку не найдена"
        )
    
    # If status is being changed to RECEIVED, process inventory
    if order_data.status and order_data.status.lower() == "received":
        if order.status != PurchaseOrderStatus.RECEIVED:
            # Add items to inventory
            for item in order.items:
                # Find or create inventory entry
                inventory = db.query(Inventory).filter(
                    Inventory.product_id == item.product_id,
                    Inventory.warehouse_id == 1  # Default warehouse, можно сделать настраиваемым
                ).first()
                
                if not inventory:
                    inventory = Inventory(
                        product_id=item.product_id,
                        warehouse_id=1,
                        quantity=Decimal("0.00"),
                        reserved_quantity=Decimal("0.00")
                    )
                    db.add(inventory)
                
                # Add received quantity to inventory
                received = item.received_quantity if item.received_quantity > 0 else item.quantity
                inventory.quantity += received
    
    # Update order fields
    if order_data.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == order_data.supplier_id).first()
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Поставщик не найден"
            )
        order.supplier_id = order_data.supplier_id
    
    if order_data.expected_date:
        order.expected_date = order_data.expected_date
    
    if order_data.status:
        try:
            order.status = PurchaseOrderStatus(order_data.status.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неверный статус: {order_data.status}"
            )
    
    if order_data.notes is not None:
        order.notes = order_data.notes
    
    # Update items if provided
    if order_data.items:
        # Delete existing items
        db.query(PurchaseOrderItem).filter(
            PurchaseOrderItem.purchase_order_id == order_id
        ).delete()
        
        # Recalculate totals
        subtotal = Decimal("0.00")
        for item_data in order_data.items:
            product = db.query(Product).filter(Product.id == item_data.product_id).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Товар с ID {item_data.product_id} не найден"
                )
            
            item_total = item_data.quantity * item_data.unit_price
            subtotal += item_total
            
            db_item = PurchaseOrderItem(
                purchase_order_id=order_id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total=item_total,
                received_quantity=Decimal("0.00")
            )
            db.add(db_item)
        
        order.subtotal = subtotal
        order.tax = subtotal * Decimal("0.12")
        order.total = order.subtotal + order.tax
    
    db.commit()
    db.refresh(order)
    
    # Reload with relationships
    order = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product)
    ).filter(PurchaseOrder.id == order_id).first()
    
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Delete a purchase order."""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка на закупку не найдена"
        )
    
    # Don't allow deletion of received orders
    if order.status == PurchaseOrderStatus.RECEIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить полученную заявку на закупку"
        )
    
    db.delete(order)
    db.commit()
    return None


@router.post("/{order_id}/receive", response_model=PurchaseOrderSchema)
async def receive_purchase_order(
    order_id: int,
    warehouse_id: int = Query(1, description="ID склада для поступления товара"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Mark purchase order as received and add items to inventory."""
    order = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.items)
    ).filter(PurchaseOrder.id == order_id).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка на закупку не найдена"
        )
    
    if order.status == PurchaseOrderStatus.RECEIVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заявка уже получена"
        )
    
    # Validate warehouse
    from app.models.warehouse import Warehouse
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Склад не найден"
        )
    
    # Add items to inventory
    for item in order.items:
        # Find or create inventory entry
        inventory = db.query(Inventory).filter(
            Inventory.product_id == item.product_id,
            Inventory.warehouse_id == warehouse_id
        ).first()
        
        if not inventory:
            inventory = Inventory(
                product_id=item.product_id,
                warehouse_id=warehouse_id,
                quantity=Decimal("0.00"),
                reserved_quantity=Decimal("0.00")
            )
            db.add(inventory)
        
        # Add quantity to inventory (use received_quantity if set, otherwise use quantity)
        received = item.received_quantity if item.received_quantity > 0 else item.quantity
        inventory.quantity += received
        item.received_quantity = received
    
    # Update order status
    order.status = PurchaseOrderStatus.RECEIVED
    
    db.commit()
    db.refresh(order)
    
    # Reload with relationships
    order = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product)
    ).filter(PurchaseOrder.id == order_id).first()
    
    return order
