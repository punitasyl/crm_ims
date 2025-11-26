from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_

from app.database import get_db
from app.models.warehouse import Warehouse
from app.models.inventory import Inventory
from app.schemas.warehouse import Warehouse as WarehouseSchema, WarehouseCreate, WarehouseUpdate
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, WAREHOUSE_AND_ABOVE, ALL_ROLES
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/", response_model=List[WarehouseSchema])
async def get_all_warehouses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all warehouses with pagination and filtering."""
    query = db.query(Warehouse)
    
    if search:
        query = query.filter(
            or_(
                Warehouse.name.ilike(f"%{search}%"),
                Warehouse.code.ilike(f"%{search}%"),
                Warehouse.city.ilike(f"%{search}%")
            )
        )
    
    if is_active is not None:
        query = query.filter(Warehouse.is_active == is_active)
    
    warehouses = query.order_by(Warehouse.name).offset(skip).limit(limit).all()
    return warehouses


@router.get("/{warehouse_id}", response_model=WarehouseSchema)
async def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get warehouse by ID."""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Склад не найден"
        )
    return warehouse


@router.post("/", response_model=WarehouseSchema, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    warehouse_data: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Create a new warehouse."""
    # Check if warehouse with same code already exists
    existing_warehouse = db.query(Warehouse).filter(
        Warehouse.code == warehouse_data.code
    ).first()
    
    if existing_warehouse:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Склад с таким кодом уже существует"
        )
    
    db_warehouse = Warehouse(**warehouse_data.model_dump())
    db.add(db_warehouse)
    
    try:
        db.commit()
        db.refresh(db_warehouse)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания склада: {str(e)}"
        )
    
    return db_warehouse


@router.put("/{warehouse_id}", response_model=WarehouseSchema)
async def update_warehouse(
    warehouse_id: int,
    warehouse_data: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Update warehouse."""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Склад не найден"
        )
    
    # Check if code is being changed and if new code already exists
    if warehouse_data.code and warehouse_data.code != warehouse.code:
        existing_warehouse = db.query(Warehouse).filter(
            Warehouse.code == warehouse_data.code
        ).first()
        if existing_warehouse:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Склад с таким кодом уже существует"
            )
    
    # Update fields
    update_data = warehouse_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(warehouse, field, value)
    
    try:
        db.commit()
        db.refresh(warehouse)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обновления склада: {str(e)}"
        )
    
    return warehouse


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(WAREHOUSE_AND_ABOVE))  # ADMIN, MANAGER, WAREHOUSE
):
    """Delete warehouse."""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Склад не найден"
        )
    
    # Check if warehouse has inventory items
    from app.models.inventory import Inventory
    inventory_count = db.query(Inventory).filter(
        Inventory.warehouse_id == warehouse_id
    ).count()
    
    if inventory_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Невозможно удалить склад: на складе есть {inventory_count} записей инвентаря. Сначала удалите или переместите товары."
        )
    
    try:
        db.delete(warehouse)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка удаления склада: {str(e)}"
        )
    
    return None

