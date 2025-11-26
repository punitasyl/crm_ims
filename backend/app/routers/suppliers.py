from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import Supplier as SupplierSchema, SupplierCreate, SupplierUpdate
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, WAREHOUSE_AND_ABOVE, ALL_ROLES
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/", response_model=List[SupplierSchema])
async def get_all_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all suppliers."""
    query = db.query(Supplier)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Supplier.name.ilike(search_filter)) |
            (Supplier.code.ilike(search_filter)) |
            (Supplier.contact_person.ilike(search_filter))
        )
    
    if is_active is not None:
        query = query.filter(Supplier.is_active == is_active)
    
    suppliers = query.order_by(Supplier.name).offset(skip).limit(limit).all()
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierSchema)
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a supplier by ID."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Поставщик не найден"
        )
    return supplier


@router.post("/", response_model=SupplierSchema, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Create a new supplier."""
    # Check if code already exists
    existing = db.query(Supplier).filter(Supplier.code == supplier_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Поставщик с таким кодом уже существует"
        )
    
    db_supplier = Supplier(**supplier_data.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.put("/{supplier_id}", response_model=SupplierSchema)
async def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Update a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Поставщик не найден"
        )
    
    # Check if code is being changed and if it conflicts
    if supplier_data.code and supplier_data.code != supplier.code:
        existing = db.query(Supplier).filter(Supplier.code == supplier_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Поставщик с таким кодом уже существует"
            )
    
    update_data = supplier_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Delete a supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Поставщик не найден"
        )
    
    # Check if supplier has purchase orders
    from app.models.purchase_order import PurchaseOrder
    has_orders = db.query(PurchaseOrder).filter(PurchaseOrder.supplier_id == supplier_id).first()
    if has_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить поставщика, у которого есть заявки на закупку"
        )
    
    db.delete(supplier)
    db.commit()
    return None


