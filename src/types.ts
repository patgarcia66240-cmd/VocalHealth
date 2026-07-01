/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MeasurementRecord {
  id: string;
  timestamp: string; // ISO string representing the date & time
  systolic: number;  // Systolic pressure in mmHg (e.g., 120)
  diastolic: number; // Diastolic pressure in mmHg (e.g., 80)
  pulse: number;     // Heart rate in beats per minute (e.g., 72)
  remarks?: string;  // Additional comments/notes
}

export type PeriodFilter = "all" | "month" | "week" | "day";

export interface ParsedVoiceResult {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  remarks: string;
}

export interface ClassificationResult {
  category: string;
  color: string; // Tailwind class color for text
  bgColor: string; // Tailwind class color for background
  description: string;
}

export interface PatientProfile {
  nom: string;
  prenom: string;
  adresse: string;
  cp: string;
  ville: string;
  tel: string;
  dateNaissance: string; // YYYY-MM-DD
}

