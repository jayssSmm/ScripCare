"""
Send SMS messages using the TextBee gateway API (https://textbee.dev).

Requires: pip install requests

Set your credentials as environment variables rather than hardcoding them:
    export TEXTBEE_API_KEY="your_api_key"
    export TEXTBEE_DEVICE_ID="your_device_id"
"""

import os
import requests


def send_sms(device_id: str, api_key: str, recipients: list[str], message: str) -> dict:
    """
    Send an SMS using the TextBee gateway API.

    Args:
        device_id: Your TextBee device ID (from the dashboard).
        api_key: Your TextBee API key.
        recipients: List of phone numbers in E.164 format, e.g. ["+12015550123"].
        message: The SMS text to send.

    Returns:
        The parsed JSON response from TextBee (contains success flag,
        smsBatchId, recipientCount, etc.).

    Raises:
        requests.HTTPError: if the request fails (bad API key, invalid
        device, etc.).
    """
    url = "https://api.textbee.dev/api/v1/gateway/send-sms"
    response = requests.post(
        url,
        json={"deviceId": device_id, "recipients": recipients, "message": message},
        headers={"x-api-key": api_key, "Content-Type": "application/json"},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    DEVICE_ID = os.environ["TEXTBEE_DEVICE_ID"]
    API_KEY = os.environ["TEXTBEE_API_KEY"]

    result = send_sms(
        device_id=DEVICE_ID,
        api_key=API_KEY,
        recipients=["+12015550123"],
        message="Hello from Python!",
    )
    print(result)
