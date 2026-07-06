# Turso API Contract Draft

This is the draft contract for future Turso-backed routes.

## Patients

### `GET /api/patients`

Response:

```json
{
  "patients": [
    {
      "id": "pat_...",
      "prenom": "Jean",
      "nom": "Dupont",
      "adresse": "",
      "cp": "75001",
      "ville": "Paris",
      "tel": "",
      "dateNaissance": "1970-01-01"
    }
  ]
}
```

### `POST /api/patients`

Body:

```json
{
  "prenom": "Jean",
  "nom": "Dupont",
  "adresse": "",
  "cp": "75001",
  "ville": "Paris",
  "tel": "",
  "dateNaissance": "1970-01-01"
}
```

## Records

### `GET /api/records?patientId=pat_...`

Response:

```json
{
  "records": [
    {
      "id": "rec_...",
      "patientId": "pat_...",
      "timestamp": "2026-07-06T08:30:00.000Z",
      "systolic": 120,
      "diastolic": 80,
      "pulse": 70,
      "spo2": 98,
      "remarks": "Repos"
    }
  ]
}
```

### `POST /api/records`

Body:

```json
{
  "patientId": "pat_...",
  "timestamp": "2026-07-06T08:30:00.000Z",
  "systolic": 120,
  "diastolic": 80,
  "pulse": 70,
  "spo2": 98,
  "remarks": "Repos"
}
```

## Medical Settings

### `GET /api/medical-settings?patientId=pat_...`

Response:

```json
{
  "settings": {
    "systolicHigh": 140,
    "diastolicHigh": 90,
    "systolicLow": 90,
    "diastolicLow": 60,
    "pulseHigh": 100,
    "pulseLow": 50,
    "spo2Enabled": false,
    "spo2Low": 94
  }
}
```
