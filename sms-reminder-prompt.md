# Agent Prompt: SMS Medicine Reminder System for ScripCare

Copy everything in the code block below into your coding agent (Claude Code, Cursor, etc.) at the repo root.

```
You are working in the ScripCare-krish repository (FastAPI backend + SQLAlchemy + 
Postgres, React/Vite frontend). Implement an SMS medicine-reminder system using the 
TextBee SMS gateway. Follow these steps exactly, in order. Do not skip steps or 
substitute your own architecture.

CONTEXT / KNOWN ISSUES TO FIX FIRST
1. app/routes/medcine.py has broken imports:
   - `from database import get_sync_db` -> should be `from app.extension import get_sync_db`
   - `from models import Medicine` -> should be `from app.models.models import Medicine`
   - `from schemas import MedicinesPayload` -> should be `from app.pydantic.medcine import MedicinesPayload`
   Fix these so the /medicines POST endpoint actually works.

2. Leave app/routes/main.py's RUTH_URL / send_medicine_names_to_ruth code untouched — 
   it is unrelated dead code referencing an undocumented external service. Do not 
   remove it, do not wire it into the reminder system, do not "fix" it.

STEP 1 — Extend the Medicine model
File: app/models/models.py
Add these columns to the existing Medicine class (do not remove existing columns):
   - phone_number: Column(Text, nullable=True)   # E.164 format, e.g. "+919876543210"
   - reminder_times: Column(Text, nullable=True)  # comma-separated 24h times, e.g. "08:00,14:00,20:00"
   - reminder_active: Column(Boolean, default=True)
Import Boolean from sqlalchemy at the top of the file if not already imported.

Add a new model in the same file:
   class MedicineReminderLog(Base):
       __tablename__ = "medicine_reminder_log"
       id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
       medicine_id = Column(UUID(as_uuid=True), nullable=False)
       reminder_time = Column(Text, nullable=False)         # "08:00"
       sent_date = Column(TIMESTAMP(timezone=True), server_default=func.now())

Add a unique constraint on (medicine_id, reminder_time, cast(sent_date as date)) 
using SQLAlchemy's UniqueConstraint with a text() expression, OR, if that's awkward 
in plain SQLAlchemy, add a separate plain Date column called sent_on (Column(Date), 
default=date.today) and put a UniqueConstraint on (medicine_id, reminder_time, sent_on) 
instead — use whichever is simpler to get working correctly, but a unique constraint 
that prevents the same medicine+time+day being logged twice is mandatory.

STEP 2 — Update the Pydantic schema
File: app/pydantic/medcine.py
Add the three new fields (phone_number, reminder_times, reminder_active) as 
Optional fields on MedicineIn, matching the types above, so the existing 
/medicines POST endpoint can accept them.

STEP 3 — Database migration
There is no Alembic setup in this repo. Do not add Alembic. Instead:
- If this is a dev database with no important data, it's acceptable to drop and 
  recreate tables from the SQLAlchemy metadata.
- If not, write the raw ALTER TABLE / CREATE TABLE SQL needed for these changes 
  and show it to me — do not run destructive SQL against the database without 
  me confirming first.

STEP 4 — Reminder scheduler
Create a new file: app/reminders/scheduler.py
It must:
- Use APScheduler's BackgroundScheduler, running a job every 1 minute.
- In the job function:
  1. Get the current time as "HH:MM" (24h, local server time).
  2. Query all Medicine rows where reminder_active is True AND reminder_times 
     is not null AND phone_number is not null.
  3. For each, split reminder_times on "," and check if current "HH:MM" is in 
     that list.
  4. If it matches, first attempt to INSERT a MedicineReminderLog row for 
     (medicine_id, reminder_time, today's date) and commit. If that insert 
     fails due to the unique constraint (catch sqlalchemy.exc.IntegrityError), 
     roll back and skip sending — this means it was already sent today for 
     this slot.
  5. Only if the log insert succeeded, build a message like:
     "Time to take {medicine_name}" + optionally " ({dosage})" if dosage is set 
     + optionally " — {food_instruction}" if food_instruction is set.
  6. Send it using the send_sms function already defined in textbee_sms.py at 
     the repo root (import it — do not rewrite it or duplicate its logic). 
     Pass device_id and api_key read from the TEXTBEE_DEVICE_ID and 
     TEXTBEE_API_KEY environment variables (loaded via dotenv, consistent 
     with how the rest of this repo reads env vars).
  7. Wrap the send_sms call in try/except and log failures with Python's 
     logging module — do not let a failed SMS crash the scheduler loop.
- Expose a start_scheduler() function that creates, starts, and returns the 
  scheduler instance.
- Use app.extension.SessionLocal for DB sessions (matching the existing 
  get_sync_db pattern in app/extension.py), and always close the session in 
  a finally block.

STEP 5 — Wire it into app startup
File: app/__init__.py
In create_app(), register a FastAPI startup event (or lifespan handler, 
whichever matches FastAPI's current recommended pattern for this FastAPI 
version) that calls start_scheduler() from app.reminders.scheduler. 
Do not start the scheduler at import time — only on app startup, and only once.

STEP 6 — Dependencies
File: requirements.txt
Add these two lines if not already present: 
   apscheduler
   requests
Do not change or remove any existing lines in this file.

STEP 7 — Environment variables
Confirm .env (or .env.example if present, create one if not) documents these 
two new required variables, alongside the existing ones (GROQ_API_KEY, 
DATABASE_URL, etc.):
   TEXTBEE_DEVICE_ID=
   TEXTBEE_API_KEY=

STEP 8 — Sanity check
After making all changes, run a syntax/import check (e.g. `python -c "import app"` 
or equivalent) to confirm nothing is broken, and tell me the exact commands you 
ran and their output. Do not silently swallow errors.

Constraints:
- Do not introduce Celery, Redis, or any new infrastructure beyond APScheduler 
  and requests — keep this in-process.
- Do not touch the frontend in this task.
- Do not modify textbee_sms.py.
- If anything above is ambiguous or conflicts with existing code you find, stop 
  and ask me rather than guessing.
```
