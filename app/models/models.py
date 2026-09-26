# models.py
import uuid
from sqlalchemy import Column, Text, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medicine_name = Column(Text, nullable=False)
    dosage = Column(Text, nullable=True)
    frequency = Column(Text, nullable=True)
    duration = Column(Text, nullable=True)
    timing = Column(Text, nullable=True)
    food_instruction = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())