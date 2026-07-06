import { useEffect, useState } from "react";
import { PatientProfile } from "../types";
import { loadSelectedPatientProfile, selectPatientProfile, clearSelectedPatientProfile } from "../services/patientProfiles";

export function usePatientProfile() {
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [isPatientProfileLoading, setIsPatientProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    loadSelectedPatientProfile()
      .then((profile) => {
        if (isMounted) setPatientProfile(profile);
      })
      .catch((error) => {
        console.error("Failed to load selected patient profile", error);
      })
      .finally(() => {
        if (isMounted) setIsPatientProfileLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePatientProfile = async (profile: PatientProfile | null) => {
    setPatientProfile(profile);

    try {
      if (profile) {
        const selectedProfile = await selectPatientProfile(profile);
        setPatientProfile(selectedProfile);
      } else {
        await clearSelectedPatientProfile();
      }
    } catch (error) {
      console.error("Failed to persist selected patient profile", error);
    }
  };

  return { patientProfile, setPatientProfile: updatePatientProfile, isPatientProfileLoading };
}
