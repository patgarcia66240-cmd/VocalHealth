import { PatientProfile } from "../types";
import {
  deletePatient,
  getAllPatients,
  getAppStateValue,
  savePatient,
  savePatients,
  setAppStateValue,
} from "../db";

const LEGACY_PATIENT_PROFILES_KEY = "patient_profiles";
const SELECTED_PATIENT_ID_KEY = "selected_patient_id";

export function getPatientProfileKey(profile: PatientProfile) {
  return `${profile.prenom.trim().toLowerCase()}|${profile.nom.trim().toLowerCase()}|${profile.dateNaissance}`;
}

export function getPatientId(profile: PatientProfile) {
  return profile.id || getPatientProfileKey(profile);
}

function withPatientId(profile: PatientProfile): PatientProfile {
  return {
    ...profile,
    id: getPatientId(profile),
  };
}

function mergeProfiles(profiles: PatientProfile[]) {
  const uniqueProfiles = new Map<string, PatientProfile>();

  profiles.forEach((profile) => {
    const nextProfile = withPatientId(profile);
    uniqueProfiles.set(getPatientId(nextProfile), nextProfile);
  });

  return Array.from(uniqueProfiles.values());
}

function loadLegacyPatientProfiles(): PatientProfile[] {
  const saved = localStorage.getItem(LEGACY_PATIENT_PROFILES_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as PatientProfile[];
  } catch (error) {
    console.error("Failed to load legacy patient profiles", error);
    return [];
  }
}

export async function migrateLegacyPatientProfiles() {
  const existingProfiles = await getAllPatients();
  if (existingProfiles.length > 0) return existingProfiles;

  const legacyProfiles = mergeProfiles(loadLegacyPatientProfiles());
  if (legacyProfiles.length > 0) {
    await savePatients(legacyProfiles);
  }

  return legacyProfiles;
}

export async function loadPatientProfiles(currentProfile?: PatientProfile | null) {
  const indexedProfiles = await migrateLegacyPatientProfiles();
  return mergeProfiles(currentProfile ? [currentProfile, ...indexedProfiles] : indexedProfiles);
}

export async function upsertPatientProfile(profile: PatientProfile) {
  const nextProfile = withPatientId(profile);
  await savePatient(nextProfile);
  return nextProfile;
}

export async function removePatientProfile(profile: PatientProfile) {
  await deletePatient(getPatientId(profile));
}

export async function selectPatientProfile(profile: PatientProfile) {
  const nextProfile = await upsertPatientProfile(profile);
  await setAppStateValue(SELECTED_PATIENT_ID_KEY, getPatientId(nextProfile));
  return nextProfile;
}

export async function clearSelectedPatientProfile() {
  await setAppStateValue(SELECTED_PATIENT_ID_KEY, null);
}

export async function loadSelectedPatientProfile() {
  const profiles = await loadPatientProfiles();
  const selectedPatientId = await getAppStateValue(SELECTED_PATIENT_ID_KEY);
  if (!selectedPatientId) return null;

  return profiles.find((profile) => getPatientId(profile) === selectedPatientId) || null;
}
