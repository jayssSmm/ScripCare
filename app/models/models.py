# models.py
import uuid
from datetime import date

from sqlalchemy import Boolean, Column, Date, Text, TIMESTAMP, UniqueConstraint, func
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
    phone_number = Column(Text, nullable=True)
    reminder_times = Column(Text, nullable=True)
    reminder_active = Column(Boolean, nullable=False, default=True)


class MedicineReminderLog(Base):
    __tablename__ = "medicine_reminder_log"
    __table_args__ = (
        UniqueConstraint(
            "medicine_id",
            "reminder_time",
            "sent_on",
            name="uq_medicine_reminder_slot_day",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medicine_id = Column(UUID(as_uuid=True), nullable=False)
    reminder_time = Column(Text, nullable=False)
    sent_on = Column(Date, nullable=False, default=date.today)