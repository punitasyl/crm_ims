from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.lead import Lead, LeadStatus
from app.models.customer import Customer
from app.models.opportunity import Opportunity
from app.core.dependencies import get_current_user
from app.core.permissions import require_role, SALES_AND_ABOVE, ALL_ROLES
from app.models.user import User, UserRole

router = APIRouter()


@router.get("/")
async def get_all_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all leads with pagination and filtering."""
    query = db.query(Lead)
    
    if status_filter:
        query = query.filter(Lead.status == status_filter)
    
    leads = query.offset(skip).limit(limit).all()
    return leads


@router.get("/{lead_id}")
async def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a lead by ID."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(SALES_AND_ABOVE))  # ADMIN, MANAGER, SALES
):
    """Create a new lead."""
    if "assigned_to" not in lead_data:
        lead_data["assigned_to"] = current_user.id
    
    db_lead = Lead(**lead_data)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead


@router.put("/{lead_id}")
async def update_lead(
    lead_id: int,
    lead_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(SALES_AND_ABOVE))  # ADMIN, MANAGER, SALES
):
    """Update a lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    for field, value in lead_data.items():
        if hasattr(lead, field):
            setattr(lead, field, value)
    
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(SALES_AND_ABOVE))  # ADMIN, MANAGER, SALES
):
    """Delete a lead."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    db.delete(lead)
    db.commit()
    return None


@router.put("/{lead_id}/convert")
async def convert_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Convert a lead to an opportunity."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Update lead status
    lead.status = LeadStatus.CONVERTED
    db.commit()
    
    # Create opportunity if value exists
    if lead.estimated_value:
        customer_name = lead.customer.company_name if lead.customer else "Lead"
        opportunity = Opportunity(
            lead_id=lead.id,
            title=f"Opportunity from {customer_name}",
            value=lead.estimated_value,
            stage="prospecting",
            assigned_to=lead.assigned_to
        )
        db.add(opportunity)
        db.commit()
    
    return {"message": "Lead converted successfully", "lead": lead}

