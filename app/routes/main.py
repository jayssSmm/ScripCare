import json
import logging
import os
import tempfile

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.prescription.get_Prescription import get_Prescription

logger = logging.getLogger(__name__)

# No Ruth URL or payload contract was found anywhere in this project.
# Configure this value in the environment before enabling the Ruth notification.
# Required information from Ruth: the exact POST endpoint URL, HTTP method, and
# expected JSON payload contract. This implementation sends the payload below when
# a valid Ruth URL is configured and medicines are present.
RUTH_URL = os.getenv("RUTH_URL")
RUTH_TIMEOUT_SECONDS = float(os.getenv("RUTH_TIMEOUT_SECONDS", "10"))

router = APIRouter()


def extract_medicine_names(parsed):
    if not isinstance(parsed, dict):
        return []

    medicines = parsed.get("medicines", [])
    if not isinstance(medicines, list):
        return []

    medicine_names = []
    for medicine in medicines:
        if not isinstance(medicine, dict):
            continue
        name = medicine.get("medicine_name")
        if isinstance(name, str):
            cleaned = name.strip()
            if cleaned:
                medicine_names.append(cleaned)
    return medicine_names


async def send_medicine_names_to_ruth(medicine_names):
    if not medicine_names:
        logger.debug("No valid medicine names to send to Ruth.")
        return

    if not RUTH_URL:
        logger.warning(
            "RUTH_URL is not configured. The parsed prescription was returned to the frontend, "
            "but Ruth notification was skipped. Configure RUTH_URL to enable the downstream call."
        )
        return

    payload = {"medicines": medicine_names}

    try:
        async with httpx.AsyncClient(timeout=RUTH_TIMEOUT_SECONDS) as client:
            response = await client.post(RUTH_URL, json=payload)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Ruth notification failed for payload %s: %s", payload, exc)


@router.post("/post/prescription/")
async def get_prescription(image: UploadFile = File(...)):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image"
        )

    image_bytes = await image.read()
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".jpg"
        ) as temp:
            temp.write(image_bytes)
            temp_path = temp.name

        parsed = get_Prescription(temp_path)

    except Exception as e:
        logger.exception("Prescription extraction failed")
        raise HTTPException(
            status_code=500,
            detail=f"Prescription extraction failed: {e}"
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

    medicine_names = extract_medicine_names(parsed)

    if medicine_names:
        await send_medicine_names_to_ruth(medicine_names)

    return parsed