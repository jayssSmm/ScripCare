import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.reminder_service import _sent_reminders, _sent_reminders_lock, get_caregiver_phone_number
from app.routes.reminders import router


class ReminderNotificationTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(router)
        self.client = TestClient(self.app)
        with _sent_reminders_lock:
            _sent_reminders.clear()
        self.environment = {
            "CAREGIVER_PHONE_NUMBER": "+1" + "9" * 10,
            "TEXTBEE_DEVICE_ID": "test-device-id",
            "TEXTBEE_API_KEY": "test-api-key",
        }
        self.payload = {
            "patient_name": "Priya Sharma",
            "medicine_name": "Paracetamol",
            "reminder_time": "15 minutes before 8:00 AM",
            "idempotency_key": "test-reminder-request-1",
        }

    def test_caregiver_phone_is_loaded_from_environment(self):
        with patch.dict(os.environ, self.environment, clear=False):
            self.assertEqual(get_caregiver_phone_number(), self.environment["CAREGIVER_PHONE_NUMBER"])

    def test_sms_success_returns_success_and_uses_reminder_data(self):
        with patch.dict(os.environ, self.environment, clear=False), patch(
            "app.reminder_service.send_sms", return_value={"success": True}
        ) as send_sms:
            response = self.client.post("/post/reminder/", json=self.payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "sent")
        send_sms.assert_called_once_with(
            device_id="test-device-id",
            api_key="test-api-key",
            recipients=[self.environment["CAREGIVER_PHONE_NUMBER"]],
            message=(
                "B-Sure: A medication reminder has been set for Priya Sharma "
                "for Paracetamol at 15 minutes before 8:00 AM."
            ),
        )

    def test_missing_phone_does_not_attempt_sms(self):
        environment = {key: value for key, value in self.environment.items() if key != "CAREGIVER_PHONE_NUMBER"}
        with patch.dict(os.environ, environment, clear=True), patch("app.reminder_service.send_sms") as send_sms:
            response = self.client.post("/post/reminder/", json=self.payload)

        self.assertEqual(response.status_code, 503)
        self.assertIn("CAREGIVER_PHONE_NUMBER", response.json()["detail"])
        send_sms.assert_not_called()

    def test_invalid_phone_does_not_attempt_sms(self):
        environment = {**self.environment, "CAREGIVER_PHONE_NUMBER": "not-a-phone"}
        with patch.dict(os.environ, environment, clear=True), patch("app.reminder_service.send_sms") as send_sms:
            response = self.client.post("/post/reminder/", json=self.payload)

        self.assertEqual(response.status_code, 400)
        self.assertIn("E.164", response.json()["detail"])
        send_sms.assert_not_called()

    def test_provider_failure_does_not_activate_reminder(self):
        with patch.dict(os.environ, self.environment, clear=True), patch(
            "app.reminder_service.send_sms", side_effect=RuntimeError("provider secret detail")
        ) as send_sms:
            response = self.client.post("/post/reminder/", json=self.payload)

        self.assertEqual(response.status_code, 502)
        self.assertIn("not activated", response.json()["detail"])
        self.assertNotIn("provider secret detail", response.text)
        send_sms.assert_called_once()

    def test_repeated_request_key_sends_sms_once(self):
        with patch.dict(os.environ, self.environment, clear=False), patch(
            "app.reminder_service.send_sms", return_value={"success": True}
        ) as send_sms:
            first = self.client.post("/post/reminder/", json=self.payload)
            second = self.client.post("/post/reminder/", json=self.payload)

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertTrue(second.json()["duplicate"])
        send_sms.assert_called_once()


if __name__ == "__main__":
    unittest.main()