from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import Product as ProductSchema, ProductCreate, ProductUpdate
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, MANAGER_AND_ADMIN, ALL_ROLES
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/", response_model=List[ProductSchema])
async def get_all_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all products with pagination and filtering."""
    query = db.query(Product)
    
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%")
            )
        )
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(MANAGER_AND_ADMIN))  # ADMIN, MANAGER
):
    """Create a new product."""
    # Check if SKU already exists
    existing = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing:
        raise HTTPException(status_code=409, detail="Product with this SKU already exists")
    
    # Convert Pydantic model to dict, excluding None values only for optional fields
    product_dict = product_data.dict(exclude_unset=False)
    db_product = Product(**product_dict)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(MANAGER_AND_ADMIN))  # ADMIN, MANAGER
):
    """Update a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.dict(exclude_unset=True)
    
    # Check SKU uniqueness if being updated
    if "sku" in update_data and update_data["sku"] != product.sku:
        existing = db.query(Product).filter(Product.sku == update_data["sku"]).first()
        if existing:
            raise HTTPException(status_code=409, detail="Product with this SKU already exists")
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(MANAGER_AND_ADMIN))  # ADMIN, MANAGER
):
    """Delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return None


@router.get("/category/{category_id}", response_model=List[ProductSchema])
async def get_products_by_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all products in a category."""
    products = db.query(Product).filter(Product.category_id == category_id).all()
    return products

