# MedTrack — Medication Adherence App for Elderly Patients

A mobile/web application that helps elderly patients stay on top of their medication schedule, while keeping caregivers informed and stock levels in check.

## Overview

MedTrack simplifies medication management for elderly users by combining automated scheduling, simple dose tracking, caregiver alerts, and refill reminders — all wrapped in a large-font, easy-to-navigate interface designed for accessibility.

## Must-Have Requirements

1. **Prescription Input & Parsing**
   Users (or caregivers) can upload a photo of a prescription or medicine label. The app parses the image (OCR) to extract medicine name, dosage, and frequency, and allows manual correction of any misread fields before saving.

2. **Auto-Generated Daily Schedule**
   Based on parsed or manually entered prescription data, the app automatically builds a daily dosing schedule with reminders grouped into time-of-day slots (morning, afternoon, night) and relative-to-meal timing (before/after food).

3. **Dose Tracking & Adherence**
   Each scheduled dose can be marked as **Taken** or **Skipped** by the patient. The app tracks adherence percentage over time (daily, weekly, monthly views).

4. **Caregiver Linking & Missed-Dose Alerts**
   Patients can link one or more caregivers to their account. If a dose is not marked as taken within a configurable time window past its scheduled time, the linked caregiver(s) receive an alert.

5. **Refill Alerts**
   The app tracks remaining stock per medicine (decremented on each "Taken" dose) and notifies the patient (and optionally the caregiver) when stock falls below a configurable threshold.

6. **Elderly-Friendly UI**
   Simple navigation, large fonts, high-contrast color schemes, minimal steps per action, and large touch targets throughout the app.

## Core User Roles

- **Patient** — primary user; manages medications, marks doses, views own adherence.
- **Caregiver** — linked to one or more patients; receives missed-dose and (optionally) refill alerts; can view adherence history.

## Suggested Feature Flow

1. Patient/caregiver adds a medicine (via photo upload or manual entry).
2. App parses and confirms details with the user.
3. App generates a recurring daily schedule based on frequency and meal timing.
4. Reminders fire at scheduled times; patient marks each dose.
5. Adherence stats update in real time.
6. If a dose window is missed, caregiver is notified.
7. When stock runs low, patient (and caregiver) get a refill alert.

## Tech Considerations (suggested, not mandatory)

- **OCR**: on-device or cloud OCR API for prescription/label parsing.
- **Notifications**: push notifications (mobile) or scheduled email/SMS for reminders and alerts.
- **Data model**: `Patient`, `Caregiver`, `Medicine` (name, dosage, frequency, stock, threshold), `Schedule` (time slots), `DoseLog` (taken/skipped, timestamp).
- **Accessibility**: scalable typography, WCAG-compliant contrast ratios, voice-assist support as a stretch goal.

## Status

Requirements gathering / early planning stage — this README captures the must-have feature set as a starting point for design and development.

## Next Steps

- [ ] Define data model in detail
- [ ] Design wireframes with accessibility review
- [ ] Choose OCR provider/approach
- [ ] Define caregiver notification channel(s)
- [ ] Define adherence % calculation window and reporting views