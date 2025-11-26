from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric, Date, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class OpportunityStage(str, enum.Enum):
    PROSPECTING = "prospecting"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed-won"
    CLOSED_LOST = "closed-lost"


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    title = Column(String(200), nullable=False)
    value = Column(Numeric(10, 2), nullable=False)
    stage = Column(SQLEnum(OpportunityStage), default=OpportunityStage.PROSPECTING)
    probability = Column(Integer, default=0)  # 0-100
    expected_close_date = Column(Date)
    notes = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    lead = relationship("Lead", back_populates="opportunities")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="opportunities_assigned")

