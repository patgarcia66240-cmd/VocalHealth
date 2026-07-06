import { useEffect, useState } from "react";
import { MedicalSettings } from "../types";
import { loadMedicalSettings, saveMedicalSettings } from "../storage";

export function useMedicalSettings() {
  const [medicalSettings, setMedicalSettings] = useState<MedicalSettings>(loadMedicalSettings);

  useEffect(() => {
    saveMedicalSettings(medicalSettings);
  }, [medicalSettings]);

  return { medicalSettings, setMedicalSettings };
}
