import logging
import os
from datetime import date, datetime

from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError

from app.extension import SessionLocal
from app.models.models import Medicine, MedicineReminderLog
from textbee_sms import send_sms

logger = logging.getLogger(__name__)

load_dotenv()


def send_due_reminders():
    device_id = os.getenv("TEXTBEE_DEVICE_ID")
    api_key = os.getenv("TEXTBEE_API_KEY")
    if not device_id or not api_key:
        logger.error("Skipping reminder run because TextBee credentials are not configured")
        return

    current_time = datetime.now().strftime("%H:%M")
    today = date.today()
    session = SessionLocal()

    try:
        medicines = (
            session.query(Medicine)
            .filter(
                Medicine.reminder_active.is_(True),
                Medicine.reminder_times.is_not(None),
                Medicine.phone_number.is_not(None),
            )
            .all()
        )

        for medicine in medicines:
            reminder_times = {
                reminder_time.strip()
                for reminder_time in medicine.reminder_times.split(",")
            }
            if current_time not in reminder_times or not medicine.phone_number.strip():
                continue

            reminder_log = MedicineReminderLog(
                medicine_id=medicine.id,
                reminder_time=current_time,
                sent_on=today,
            )
            session.add(reminder_log)
            try:
                session.commit()
            except IntegrityError:
                session.rollback()
                continue

            message = f"Time to take {medicine.medicine_name}"
            if medicine.dosage:
                message += f" ({medicine.dosage})"
            if medicine.food_instruction:
                message += f" — {medicine.food_instruction}"

            try:
                send_sms(
                    device_id=device_id,
                    api_key=api_key,
                    recipients=[medicine.phone_number.strip()],
                    message=message,
                )
            except Exception:
                logger.exception(
                    "Failed SMS reminder for medicine %s at %s",
                    medicine.id,
                    current_time,
                )
    finally:
        session.close()


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        send_due_reminders,
        trigger="interval",
        minutes=1,
        id="medicine_reminders",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    return scheduler