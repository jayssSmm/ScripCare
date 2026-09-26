# schemas.py
from typing import Optional, List
from pydantic import BaseModel

class MedicineIn(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    timing: Optional[str] = None
    food_instruction: Optional[str] = None

class MedicinesPayload(BaseModel):
    medicines: List[MedicineIn]