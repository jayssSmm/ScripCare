# schemas.py
from typing import List, Optional
from pydantic import BaseModel

class MedicineIn(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    timing: Optional[str] = None
    food_instruction: Optional[str] = None
    phone_number: Optional[str] = None
    reminder_times: Optional[str] = None
    reminder_active: Optional[bool] = True

class MedicinesPayload(BaseModel):
    medicines: List[MedicineIn]