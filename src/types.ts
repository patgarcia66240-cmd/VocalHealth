export interface MeasurementRecord {
  id: string;
  patientId?: string; // Local patient key. Legacy records may not have one.
  timestamp: string; // ISO string representing the date & time
  systolic: number;  // Systolic pressure in mmHg (e.g., 120)
  diastolic: number; // Diastolic pressure in mmHg (e.g., 80)
  pulse: number;     // Heart rate in beats per minute (e.g., 72)
  spo2?: number;     // Oxygen saturation in percent (e.g., 98)
  remarks?: string;  // Additional comments/notes
}

export type PeriodFilter = "all" | "month" | "week" | "day";

export interface ParsedVoiceResult {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  spo2: number | null;
  remarks: string;
}

export interface ClassificationResult {
  category: string;
  color: string; // Tailwind class color for text
  bgColor: string; // Tailwind class color for background
  description: string;
}

export interface PatientProfile {
  id?: string;
  nom: string;
  prenom: string;
  adresse: string;
  cp: string;
  ville: string;
  tel: string;
  dateNaissance: string; // YYYY-MM-DD
}

export interface MedicalSettings {
  systolicHigh: number;
  diastolicHigh: number;
  systolicLow: number;
  diastolicLow: number;
  pulseHigh: number;
  pulseLow: number;
  spo2Enabled: boolean;
  spo2Low: number;
}

export const DEFAULT_MEDICAL_SETTINGS: MedicalSettings = {
  systolicHigh: 140,
  diastolicHigh: 90,
  systolicLow: 90,
  diastolicLow: 60,
  pulseHigh: 100,
  pulseLow: 50,
  spo2Enabled: false,
  spo2Low: 94,
};

