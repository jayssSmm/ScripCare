# routes.py
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.extension import get_sync_db  # your file with engine/SessionLocal
from app.models.models import Medicine

router = APIRouter()

@router.post("/medicine")
def create_medicine(
    medicine_name: str = Form(...),
    dosage: Optional[str] = Form(None),
    frequency: Optional[str] = Form(None),
    duration: Optional[str] = Form(None),
    db: Session = Depends(get_sync_db),
):
    if not medicine_name:
        raise HTTPException(status_code=400, detail="No medicine name provided")

    db_object = Medicine(
        medicine_name=medicine_name,
        dosage=dosage,
        frequency=frequency,
        duration=duration,
    )

    try:
        db.add(db_object)
        db.commit()
        db.refresh(db_object)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save medicine: {str(e)}")

    return {
        "inserted": 1,
        "id": str(db_object.id),
    }