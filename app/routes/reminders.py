from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.reminder_service import send_caregiver_reminder

router = APIRouter()


class ReminderNotificationPayload(BaseModel):
    patient_name: str = Field(min_length=1, max_length=120)
    medicine_name: str = Field(min_length=1, max_length=200)
    reminder_time: str = Field(min_length=1, max_length=80)
    idempotency_key: str = Field(min_length=1, max_length=128)


@router.post("/post/reminder/")
def create_reminder_notification(payload: ReminderNotificationPayload):
    return send_caregiver_reminder(
        patient_name=payload.patient_name,
        medicine_name=payload.medicine_name,
        reminder_time=payload.reminder_time,
        idempotency_key=payload.idempotency_key,
    )