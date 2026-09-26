# routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.extension import get_sync_db
from app.models.models import Medicine
from app.pydantic.medcine import MedicinesPayload

router = APIRouter()

@router.post("/medicines")
def create_medicines(payload: MedicinesPayload, db: Session = Depends(get_sync_db)):
    if not payload.medicines:
        raise HTTPException(status_code=400, detail="No medicines provided")

    db_objects = [
        Medicine(
            medicine_name=med.medicine_name,
            dosage=med.dosage,
            frequency=med.frequency,
            duration=med.duration,
            timing=med.timing,
            food_instruction=med.food_instruction,
            phone_number=med.phone_number,
            reminder_times=med.reminder_times,
            reminder_active=med.reminder_active,
        )
        for med in payload.medicines
    ]

    try:
        db.add_all(db_objects)
        db.commit()
        for obj in db_objects:
            db.refresh(obj)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save medicines: {str(e)}")

    return {
        "inserted": len(db_objects),
        "ids": [str(obj.id) for obj in db_objects],
    }