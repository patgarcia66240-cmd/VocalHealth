import { getTursoClient } from "../db/turso";

export interface PatientRowInput {
  id: string;
  prenom: string;
  nom: string;
  adresse?: string;
  cp?: string;
  ville?: string;
  tel?: string;
  dateNaissance: string;
}

export interface RecordRowInput {
  id: string;
  patientId: string;
  timestamp: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  spo2?: number | null;
  remarks?: string;
}

export interface MedicalSettingsInput {
  patientId: string;
  systolicHigh: number;
  diastolicHigh: number;
  systolicLow: number;
  diastolicLow: number;
  pulseHigh: number;
  pulseLow: number;
  spo2Enabled: boolean;
  spo2Low: number;
}

function rowToPatient(row: any) {
  return {
    id: row.id,
    prenom: row.prenom,
    nom: row.nom,
    adresse: row.adresse || "",
    cp: row.cp || "",
    ville: row.ville || "",
    tel: row.tel || "",
    dateNaissance: row.date_naissance,
  };
}

function rowToRecord(row: any) {
  return {
    id: row.id,
    patientId: row.patient_id,
    timestamp: row.timestamp,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    spo2: row.spo2 ?? undefined,
    remarks: row.remarks || "",
  };
}

function rowToMedicalSettings(row: any) {
  return {
    systolicHigh: row.systolic_high,
    diastolicHigh: row.diastolic_high,
    systolicLow: row.systolic_low,
    diastolicLow: row.diastolic_low,
    pulseHigh: row.pulse_high,
    pulseLow: row.pulse_low,
    spo2Enabled: Boolean(row.spo2_enabled),
    spo2Low: row.spo2_low,
  };
}

export async function listPatients() {
  const db = getTursoClient();
  const result = await db.execute("SELECT * FROM patients ORDER BY updated_at DESC, created_at DESC");
  return result.rows.map(rowToPatient);
}

export async function upsertPatient(patient: PatientRowInput) {
  const db = getTursoClient();
  await db.execute({
    sql: `
      INSERT INTO patients (id, prenom, nom, adresse, cp, ville, tel, date_naissance, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        prenom = excluded.prenom,
        nom = excluded.nom,
        adresse = excluded.adresse,
        cp = excluded.cp,
        ville = excluded.ville,
        tel = excluded.tel,
        date_naissance = excluded.date_naissance,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      patient.id,
      patient.prenom,
      patient.nom,
      patient.adresse || "",
      patient.cp || "",
      patient.ville || "",
      patient.tel || "",
      patient.dateNaissance,
    ],
  });
  return patient;
}

export async function deletePatientById(id: string) {
  const db = getTursoClient();
  await db.execute({ sql: "DELETE FROM patients WHERE id = ?", args: [id] });
}

export async function listRecords(patientId: string) {
  const db = getTursoClient();
  const result = await db.execute({
    sql: "SELECT * FROM measurement_records WHERE patient_id = ? ORDER BY timestamp DESC",
    args: [patientId],
  });
  return result.rows.map(rowToRecord);
}

export async function upsertRecord(record: RecordRowInput) {
  const db = getTursoClient();
  await db.execute({
    sql: `
      INSERT INTO measurement_records (id, patient_id, timestamp, systolic, diastolic, pulse, spo2, remarks, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        patient_id = excluded.patient_id,
        timestamp = excluded.timestamp,
        systolic = excluded.systolic,
        diastolic = excluded.diastolic,
        pulse = excluded.pulse,
        spo2 = excluded.spo2,
        remarks = excluded.remarks,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      record.id,
      record.patientId,
      record.timestamp,
      record.systolic,
      record.diastolic,
      record.pulse,
      record.spo2 ?? null,
      record.remarks || "",
    ],
  });
  return record;
}

export async function deleteRecordById(id: string) {
  const db = getTursoClient();
  await db.execute({ sql: "DELETE FROM measurement_records WHERE id = ?", args: [id] });
}

export async function getMedicalSettings(patientId: string) {
  const db = getTursoClient();
  const result = await db.execute({
    sql: "SELECT * FROM medical_settings WHERE patient_id = ? LIMIT 1",
    args: [patientId],
  });
  return result.rows[0] ? rowToMedicalSettings(result.rows[0]) : null;
}

export async function upsertMedicalSettings(settings: MedicalSettingsInput) {
  const db = getTursoClient();
  const id = `settings-${settings.patientId}`;
  await db.execute({
    sql: `
      INSERT INTO medical_settings (
        id, patient_id, systolic_high, diastolic_high, systolic_low, diastolic_low,
        pulse_high, pulse_low, spo2_enabled, spo2_low, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(patient_id) DO UPDATE SET
        systolic_high = excluded.systolic_high,
        diastolic_high = excluded.diastolic_high,
        systolic_low = excluded.systolic_low,
        diastolic_low = excluded.diastolic_low,
        pulse_high = excluded.pulse_high,
        pulse_low = excluded.pulse_low,
        spo2_enabled = excluded.spo2_enabled,
        spo2_low = excluded.spo2_low,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [
      id,
      settings.patientId,
      settings.systolicHigh,
      settings.diastolicHigh,
      settings.systolicLow,
      settings.diastolicLow,
      settings.pulseHigh,
      settings.pulseLow,
      settings.spo2Enabled ? 1 : 0,
      settings.spo2Low,
    ],
  });

  return settings;
}
