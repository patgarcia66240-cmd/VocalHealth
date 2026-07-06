import { DEFAULT_MEDICAL_SETTINGS, MedicalSettings, PatientProfile } from "./types";

const PATIENT_PROFILE_KEY = "patient_profile";
const MEDICAL_SETTINGS_KEY = "medical_settings";
const THEME_KEY = "theme";

export type Theme = "light" | "dark";

function readJson<T>(key: string): T | null {
  const saved = localStorage.getItem(key);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as T;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage`, error);
    return null;
  }
}

export function loadPatientProfile(): PatientProfile | null {
  return readJson<PatientProfile>(PATIENT_PROFILE_KEY);
}

export function savePatientProfile(profile: PatientProfile | null) {
  if (profile) {
    localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(PATIENT_PROFILE_KEY);
  }
}

export function loadMedicalSettings(): MedicalSettings {
  const saved = readJson<Partial<MedicalSettings>>(MEDICAL_SETTINGS_KEY);
  return saved ? { ...DEFAULT_MEDICAL_SETTINGS, ...saved } : DEFAULT_MEDICAL_SETTINGS;
}

export function saveMedicalSettings(settings: MedicalSettings) {
  localStorage.setItem(MEDICAL_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
}
