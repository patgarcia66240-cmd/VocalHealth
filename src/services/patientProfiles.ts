import { PatientProfile } from "../types";
import { loadPatientProfile, savePatientProfile } from "../storage";

const PATIENT_PROFILES_KEY = "patient_profiles";

export function getPatientProfileKey(profile: PatientProfile) {
  return `${profile.prenom.trim().toLowerCase()}|${profile.nom.trim().toLowerCase()}|${profile.dateNaissance}`;
}

export function loadPatientProfiles(): PatientProfile[] {
  const saved = localStorage.getItem(PATIENT_PROFILES_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as PatientProfile[];
  } catch (error) {
    console.error("Failed to load patient profiles", error);
    return [];
  }
}

function savePatientProfiles(profiles: PatientProfile[]) {
  localStorage.setItem(PATIENT_PROFILES_KEY, JSON.stringify(profiles));
}

export function mergePatientProfiles(currentProfile?: PatientProfile | null) {
  const savedProfiles = loadPatientProfiles();
  const mergedProfiles = currentProfile ? [currentProfile, ...savedProfiles] : savedProfiles;
  const uniqueProfiles = new Map<string, PatientProfile>();

  mergedProfiles.forEach((profile) => {
    uniqueProfiles.set(getPatientProfileKey(profile), profile);
  });

  return Array.from(uniqueProfiles.values());
}

export function upsertPatientProfile(profile: PatientProfile) {
  const profiles = loadPatientProfiles();
  const profileKey = getPatientProfileKey(profile);
  savePatientProfiles([profile, ...profiles.filter((item) => getPatientProfileKey(item) !== profileKey)]);
}

export function removePatientProfile(profile: PatientProfile) {
  const profileKey = getPatientProfileKey(profile);
  savePatientProfiles(loadPatientProfiles().filter((item) => getPatientProfileKey(item) !== profileKey));
}

export function selectPatientProfile(profile: PatientProfile, profiles: PatientProfile[]) {
  const profileKey = getPatientProfileKey(profile);
  const nextProfiles = [profile, ...profiles.filter((item) => getPatientProfileKey(item) !== profileKey)];

  savePatientProfile(profile);
  savePatientProfiles(nextProfiles);
}

export { loadPatientProfile, savePatientProfile };
