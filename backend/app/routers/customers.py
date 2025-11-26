from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.database import get_db
from app.models.customer import Customer
from app.models.contact import Contact
from app.models.sales_order import SalesOrder
from app.schemas.customer import Customer as CustomerSchema, CustomerCreate, CustomerUpdate
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, SALES_AND_ABOVE, ALL_ROLES
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/", response_model=List[CustomerSchema])
async def get_all_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Все роли могут просматривать
):
    """Get all customers with pagination and filtering."""
    query = db.query(Customer)
    
    if search:
        query = query.filter(
            or_(
                Customer.company_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%")
            )
        )
    
    if status_filter:
        query = query.filter(Customer.status == status_filter)
    
    customers = query.offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=CustomerSchema)
async def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a customer by ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/", response_model=CustomerSchema, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(SALES_AND_ABOVE))  # ADMIN, MANAGER, SALES
):
    """Create a new customer."""
    db_customer = Customer(**customer_data.dict(), created_by=current_user.id)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.put("/{customer_id}", response_model=CustomerSchema)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(SALES_AND_ABOVE))  # ADMIN, MANAGER, SALES
):
    """Update a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(SALES_AND_ABOVE))  # ADMIN, MANAGER, SALES
):
    """Delete a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(customer)
    db.commit()
    return None


@router.get("/{customer_id}/contacts")
async def get_customer_contacts(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all contacts for a customer."""
    contacts = db.query(Contact).filter(Contact.customer_id == customer_id).all()
    return contacts


@router.get("/{customer_id}/orders")
async def get_customer_orders(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all orders for a customer."""
    orders = db.query(SalesOrder).filter(SalesOrder.customer_id == customer_id).all()
    return orders

