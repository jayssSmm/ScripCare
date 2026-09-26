import hashlib
import logging
import os
import re
import threading

from dotenv import load_dotenv
from fastapi import HTTPException

from textbee_sms import send_sms

load_dotenv()

logger = logging.getLogger(__name__)
_sent_reminders = {}
_sent_reminders_lock = threading.Lock()
_E164_PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")


def get_caregiver_phone_number():
    return os.getenv("CAREGIVER_PHONE_NUMBER", "").strip()


def send_caregiver_reminder(patient_name, medicine_name, reminder_time, idempotency_key):
    patient_name = patient_name.strip()
    medicine_name = medicine_name.strip()
    reminder_time = reminder_time.strip()
    if not patient_name or not medicine_name or not reminder_time:
        raise HTTPException(status_code=422, detail="Patient, medicine, and reminder time are required.")

    caregiver_phone = get_caregiver_phone_number()
    if not caregiver_phone:
        raise HTTPException(
            status_code=503,
            detail="Caregiver phone is not configured. Set CAREGIVER_PHONE_NUMBER on the backend.",
        )
    if not _E164_PHONE_PATTERN.fullmatch(caregiver_phone):
        raise HTTPException(
            status_code=400,
            detail="Caregiver phone configuration must use international E.164 format.",
        )

    device_id = os.getenv("TEXTBEE_DEVICE_ID", "").strip()
    api_key = os.getenv("TEXTBEE_API_KEY", "").strip()
    if not device_id or not api_key:
        raise HTTPException(status_code=503, detail="TextBee SMS service is not configured.")

    message = (
        f"ScripCare: A medication reminder has been set for {patient_name} "
        f"for {medicine_name} at {reminder_time}."
    )
    signature = (message, hashlib.sha256(caregiver_phone.encode("utf-8")).hexdigest())

    with _sent_reminders_lock:
        previous_signature = _sent_reminders.get(idempotency_key)
        if previous_signature is not None:
            if previous_signature != signature:
                raise HTTPException(status_code=409, detail="Reminder request key was already used.")
            return {"status": "sent", "duplicate": True}

        try:
            result = send_sms(
                device_id=device_id,
                api_key=api_key,
                recipients=[caregiver_phone],
                message=message,
            )
        except Exception:
            logger.warning("Caregiver SMS delivery failed; reminder was not activated.")
            raise HTTPException(
                status_code=502,
                detail="Caregiver notification could not be sent; the reminder was not activated.",
            ) from None

        if not isinstance(result, dict) or result.get("success") is False:
            logger.warning("TextBee did not confirm caregiver SMS delivery; reminder was not activated.")
            raise HTTPException(
                status_code=502,
                detail="Caregiver notification could not be sent; the reminder was not activated.",
            )

        _sent_reminders[idempotency_key] = signature

    return {"status": "sent", "duplicate": False}