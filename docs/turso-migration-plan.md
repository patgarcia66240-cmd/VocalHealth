# Turso Migration Guide

This guide prepares the future move from browser-only storage to Turso online SQLite.

Current storage:

- Measurements: IndexedDB store `VocalTensionDB.records`
- Current patient: `localStorage.patient_profile`
- Patient list: `localStorage.patient_profiles`
- Medical settings: `localStorage.medical_settings`
- Theme/providers: localStorage

Target storage:

- Turso/libSQL for patients, records, and medical settings
- localStorage only for UI preferences such as theme and selected AI provider
- optional IndexedDB cache later if offline support is needed

## 1. Create Turso Resources

Install and authenticate the Turso CLI when ready:

```powershell
npm install -g turso
turso auth login
```

Create a database:

```powershell
turso db create vocalhealth
```

Get the database URL:

```powershell
turso db show vocalhealth --url
```

Create an auth token:

```powershell
turso db tokens create vocalhealth
```

Add these values to `.env.local`:

```env
APP_STORAGE_MODE="turso"
VITE_STORAGE_MODE="turso"
TURSO_DATABASE_URL="libsql://your-db-name-your-org.turso.io"
TURSO_AUTH_TOKEN="your-token"
```

Do not commit `.env.local`. The repository already ignores `.env*` except `.env.example`.

## 2. Apply Schema

The schema lives in `server/db/schema.sql`.

Apply it with the Turso shell:

```powershell
turso db shell vocalhealth < server/db/schema.sql
```

If PowerShell redirection causes issues, open the shell and paste the SQL:

```powershell
turso db shell vocalhealth
```

Then paste the contents of `server/db/schema.sql`.

## 3. Verify Connection

Start the app:

```powershell
npm run dev
```

Open:

```text
GET /api/db/status
```

Expected before env vars:

```json
{ "mode": "local", "configured": false, "status": "local" }
```

Expected after env vars:

```json
{ "mode": "turso", "configured": true, "status": "ok" }
```

## 4. API Routes To Add

Add these server routes before changing frontend storage:

```text
GET    /api/cloud/patients
POST   /api/cloud/patients
PUT    /api/cloud/patients/:id
DELETE /api/cloud/patients/:id

GET    /api/cloud/records?patientId=...
POST   /api/cloud/records
PUT    /api/cloud/records/:id
DELETE /api/cloud/records/:id

GET    /api/cloud/medical-settings?patientId=...
PUT    /api/cloud/medical-settings/:patientId
```

Keep IndexedDB/localStorage as the app source of truth until these routes are tested.

## 5. Data Mapping

`PatientProfile` maps to `patients`:

```text
prenom          -> patients.prenom
nom             -> patients.nom
adresse         -> patients.adresse
cp              -> patients.cp
ville           -> patients.ville
tel             -> patients.tel
dateNaissance   -> patients.date_naissance
```

`MeasurementRecord` maps to `measurement_records`:

```text
id        -> measurement_records.id
timestamp -> measurement_records.timestamp
systolic  -> measurement_records.systolic
diastolic -> measurement_records.diastolic
pulse     -> measurement_records.pulse
spo2      -> measurement_records.spo2
remarks   -> measurement_records.remarks
```

Add `patient_id` during migration. Current local records do not have a patient id, so the first migration should attach all existing records to the currently selected patient.

`MedicalSettings` maps to `medical_settings`:

```text
systolicHigh  -> systolic_high
diastolicHigh -> diastolic_high
systolicLow   -> systolic_low
diastolicLow  -> diastolic_low
pulseHigh     -> pulse_high
pulseLow      -> pulse_low
spo2Enabled   -> spo2_enabled, stored as 0 or 1
spo2Low       -> spo2_low
```

## 6. One-Shot Local Migration

Recommended migration flow:

1. Load `patient_profile`.
2. If missing, ask the user to create/select a patient first.
3. Upsert the patient in Turso.
4. Load `patient_profiles` and upsert all known patients.
5. Load IndexedDB records from `getAllRecords()`.
6. Insert records into `measurement_records` with `patient_id` set to the selected patient.
7. Load `medical_settings` and upsert one row for the selected patient.
8. Store a local flag such as `vocalhealth_turso_migrated=true`.
9. Show a confirmation message.

Do not delete local IndexedDB immediately. Keep it as rollback/cache until Turso reads and writes are validated.

## 7. Rollout Order

1. Add server repositories for Turso.
2. Add API routes.
3. Add frontend API client.
4. Add manual "Sync to cloud" action.
5. Verify imported data in Turso dashboard.
6. Switch reads to Turso for selected patient.
7. Switch writes to Turso.
8. Keep local cache for offline fallback or remove it later.

## 8. Validation Checklist

- `/api/db/status` returns `ok`.
- Creating a patient writes to Turso.
- Selecting a patient loads their records only.
- Adding a record creates a row with the correct `patient_id`.
- Editing a record updates only that row.
- Deleting a record removes only that row.
- Deleting a patient cascades their records and settings.
- Medical settings are loaded per patient.
- Existing IndexedDB data can be migrated once.
- Running the migration twice does not duplicate records.

## 9. Important Notes

- Turso credentials must stay server-side only.
- Do not call Turso directly from the React frontend.
- Keep all Turso access behind Express routes.
- For medical/privacy data, add authentication before using this beyond a personal/local app.
