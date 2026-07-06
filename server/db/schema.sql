PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  adresse TEXT,
  cp TEXT,
  ville TEXT,
  tel TEXT,
  date_naissance TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS measurement_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  pulse INTEGER NOT NULL,
  spo2 INTEGER,
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_measurement_records_patient_timestamp
  ON measurement_records(patient_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS medical_settings (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL UNIQUE,
  systolic_high INTEGER NOT NULL DEFAULT 140,
  diastolic_high INTEGER NOT NULL DEFAULT 90,
  systolic_low INTEGER NOT NULL DEFAULT 90,
  diastolic_low INTEGER NOT NULL DEFAULT 60,
  pulse_high INTEGER NOT NULL DEFAULT 100,
  pulse_low INTEGER NOT NULL DEFAULT 50,
  spo2_enabled INTEGER NOT NULL DEFAULT 0,
  spo2_low INTEGER NOT NULL DEFAULT 94,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
