from fastapi import APIRouter, UploadFile, File, HTTPException
from app.prescription.get_Prescription import get_Prescription
import json

router = APIRouter()

@router.post("/post/prescription/")
async def get_prescription(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    image_bytes = await image.read()

    try:
        raw = get_Prescription(image_bytes)
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Model returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prescription extraction failed: {e}")

    return parsed