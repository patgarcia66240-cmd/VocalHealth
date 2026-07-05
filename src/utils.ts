import { MeasurementRecord, ClassificationResult, MedicalSettings, DEFAULT_MEDICAL_SETTINGS } from "./types";

/**
 * Classifies blood pressure according to WHO / European Society of Cardiology guidelines
 */
export function classifyBloodPressure(systolic: number, diastolic: number): ClassificationResult {
  if (systolic >= 180 || diastolic >= 110) {
    return {
      category: "Crise Hypertensive",
      color: "text-red-600 font-bold",
      bgColor: "bg-red-50 border-red-200 text-red-800",
      description: "Attention ! Urgence médicale potentielle. Consultez un médecin rapidement."
    };
  }
  if (systolic >= 160 || diastolic >= 100) {
    return {
      category: "Hypertension (Grade 2)",
      color: "text-rose-600 font-semibold",
      bgColor: "bg-rose-50 border-rose-200 text-rose-800",
      description: "Tension modérée à sévère. Un suivi médical régulier est fortement recommandé."
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      category: "Hypertension (Grade 1)",
      color: "text-orange-600 font-medium",
      bgColor: "bg-orange-50 border-orange-200 text-orange-800",
      description: "Tension légèrement élevée. Surveillez votre hygiène de vie et parlez-en à un médecin."
    };
  }
  if (systolic >= 120 || diastolic >= 80) {
    return {
      category: "Normale Haute",
      color: "text-yellow-600 font-medium",
      bgColor: "bg-yellow-50 border-yellow-200 text-yellow-800",
      description: "Tension dans la limite supérieure. Excellente forme générale."
    };
  }
  if (systolic >= 90 && diastolic >= 60) {
    return {
      category: "Optimale / Normale",
      color: "text-green-600 font-medium",
      bgColor: "bg-green-50 border-green-200 text-green-800",
      description: "Tension artérielle idéale. Continuez ainsi !"
    };
  }
  // Hypotension
  return {
    category: "Hypotension",
    color: "text-blue-600 font-medium",
    bgColor: "bg-blue-50 border-blue-200 text-blue-800",
    description: "Tension artérielle basse. Si vous ressentez des vertiges, consultez un médecin."
  };
}

export interface MedicalAlertInfo {
  hasAlert: boolean;
  type: "warning" | "danger" | "none";
  messages: string[];
}

/**
 * Checks if blood pressure or pulse values exceed standard medical thresholds.
 * - Hypertension: SYS >= 140 or DIA >= 90
 * - Hypotension: SYS <= 90 or DIA <= 60
 * - Tachycardia: Pulse >= 100
 * - Bradycardia: Pulse <= 50
 */
export function checkMedicalThresholds(
  systolic: number,
  diastolic: number,
  pulse: number,
  spo2?: number,
  settings: MedicalSettings = DEFAULT_MEDICAL_SETTINGS,
): MedicalAlertInfo {
  const messages: string[] = [];
  let alertType: "warning" | "danger" | "none" = "none";

  const systolicHigh = settings.systolicHigh;
  const diastolicHigh = settings.diastolicHigh;
  const systolicLow = settings.systolicLow;
  const diastolicLow = settings.diastolicLow;
  const pulseHigh = settings.pulseHigh;
  const pulseLow = settings.pulseLow;

  // Blood pressure checks
  if (systolic >= systolicHigh + 40 || diastolic >= diastolicHigh + 20) {
    alertType = "danger";
    messages.push(`Tension critique : ${systolic}/${diastolic} mmHg (Crise Hypertensive).`);
  } else if (systolic >= systolicHigh || diastolic >= diastolicHigh) {
    alertType = "warning";
    messages.push(`Tension ?lev?e : ${systolic}/${diastolic} mmHg (Hypertension).`);
  } else if (systolic <= systolicLow || diastolic <= diastolicLow) {
    alertType = "warning";
    messages.push(`Tension basse : ${systolic}/${diastolic} mmHg (Hypotension).`);
  }

  // Pulse/heart rate checks at rest
  if (pulse >= pulseHigh + 20) {
    alertType = "danger";
    messages.push(`Rythme cardiaque tr?s ?lev? : ${pulse} bpm (Tachycardie s?v?re).`);
  } else if (pulse >= pulseHigh) {
    if (alertType !== "danger") {
      alertType = "warning";
    }
    messages.push(`Rythme cardiaque ?lev? : ${pulse} bpm (Tachycardie au repos).`);
  } else if (pulse <= pulseLow) {
    if (alertType !== "danger") {
      alertType = "warning";
    }
    messages.push(`Rythme cardiaque bas : ${pulse} bpm (Bradycardie).`);
  }

  if (settings.spo2Enabled && typeof spo2 === "number" && spo2 <= settings.spo2Low) {
    if (spo2 <= settings.spo2Low - 4) {
      alertType = "danger";
    } else if (alertType !== "danger") {
      alertType = "warning";
    }
    messages.push(`Saturation oxyg?ne basse : ${spo2}% (seuil ${settings.spo2Low}%).`);
  }

  return {
    hasAlert: messages.length > 0,
    type: alertType,
    messages
  };
}

/**
 * Format date in French format
 */
export function formatDateFr(isoString: string, includeTime: boolean = true): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "Date invalide";
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric"
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit"
  };
  
  if (includeTime) {
    return `${date.toLocaleDateString("fr-FR", dateOptions)} à ${date.toLocaleTimeString("fr-FR", timeOptions)}`;
  }
  return date.toLocaleDateString("fr-FR", dateOptions);
}

/**
 * Generate realistic medical history records to populate the application initially.
 * This guarantees the user has a beautiful dashboard layout right out of the box.
 */
export const INITIAL_RECORDS: MeasurementRecord[] = [
  {
    id: "rec-1",
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(), // 6 days ago morning
    systolic: 122,
    diastolic: 81,
    pulse: 68,
    remarks: "Mesure matinale, reposé"
  },
  {
    id: "rec-2",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(), // 5 days ago morning
    systolic: 125,
    diastolic: 83,
    pulse: 71,
    remarks: "Un peu stressé avant le travail"
  },
  {
    id: "rec-3",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 days ago evening
    systolic: 119,
    diastolic: 78,
    pulse: 65,
    remarks: "Après une séance de méditation douce"
  },
  {
    id: "rec-4",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(), // 3 days ago morning
    systolic: 141,
    diastolic: 91,
    pulse: 78,
    remarks: "Après trois tasses de café noir serré"
  },
  {
    id: "rec-5",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString(), // 2 days ago morning
    systolic: 128,
    diastolic: 84,
    pulse: 73,
    remarks: "Tension habituelle au réveil"
  },
  {
    id: "rec-6",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // Yesterday evening
    systolic: 120,
    diastolic: 79,
    pulse: 69,
    remarks: "Mesure de contrôle du soir"
  },
  {
    id: "rec-7",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Today morning
    systolic: 121,
    diastolic: 80,
    pulse: 72,
    remarks: "Pris au réveil, forme excellente"
  }
];

/**
 * Filter records by Period (Month, Week, Day, All)
 */
export function filterRecordsByPeriod(records: MeasurementRecord[], period: "all" | "month" | "week" | "day"): MeasurementRecord[] {
  const now = new Date();
  const sorted = [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  if (period === "all") return sorted;
  
  return sorted.filter(r => {
    const rDate = new Date(r.timestamp);
    const diffMs = now.getTime() - rDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (period === "day") {
      // Within last 24 hours
      return diffDays <= 1;
    }
    if (period === "week") {
      // Within last 7 days
      return diffDays <= 7;
    }
    if (period === "month") {
      // Within last 30 days
      return diffDays <= 30;
    }
    return true;
  });
}

/**
 * Calculate medical statistics
 */
export function calculateStats(records: MeasurementRecord[]) {
  if (records.length === 0) {
    return {
      avgSys: 0,
      avgDia: 0,
      avgPulse: 0,
      minSys: 0,
      maxSys: 0,
      minDia: 0,
      maxDia: 0,
      minPulse: 0,
      maxPulse: 0,
      normalPercent: 0,
      totalCount: 0
    };
  }

  let totalSys = 0;
  let totalDia = 0;
  let totalPulse = 0;
  
  let minSys = Infinity;
  let maxSys = -Infinity;
  let minDia = Infinity;
  let maxDia = -Infinity;
  let minPulse = Infinity;
  let maxPulse = -Infinity;
  
  let normalCount = 0;

  records.forEach(r => {
    totalSys += r.systolic;
    totalDia += r.diastolic;
    totalPulse += r.pulse;

    if (r.systolic < minSys) minSys = r.systolic;
    if (r.systolic > maxSys) maxSys = r.systolic;
    
    if (r.diastolic < minDia) minDia = r.diastolic;
    if (r.diastolic > maxDia) maxDia = r.diastolic;
    
    if (r.pulse < minPulse) minPulse = r.pulse;
    if (r.pulse > maxPulse) maxPulse = r.pulse;

    // Check if optimal or normal (systolic < 130 and diastolic < 85)
    if (r.systolic < 130 && r.diastolic < 85) {
      normalCount++;
    }
  });

  return {
    avgSys: Math.round(totalSys / records.length),
    avgDia: Math.round(totalDia / records.length),
    avgPulse: Math.round(totalPulse / records.length),
    minSys,
    maxSys,
    minDia,
    maxDia,
    minPulse,
    maxPulse,
    normalPercent: Math.round((normalCount / records.length) * 100),
    totalCount: records.length
  };
}

/**
 * Calculates age in years from a birth date string (YYYY-MM-DD)
 */
export function calculateAge(birthDateString: string): number | null {
  if (!birthDateString) return null;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}


