import { useEffect, useState } from "react";
import { PatientProfile } from "../types";
import { loadPatientProfile, savePatientProfile } from "../storage";

export function usePatientProfile() {
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(loadPatientProfile);

  useEffect(() => {
    savePatientProfile(patientProfile);
  }, [patientProfile]);

  return { patientProfile, setPatientProfile };
}
