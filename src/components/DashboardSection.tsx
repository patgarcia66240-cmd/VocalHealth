import { Suspense, lazy } from "react";
import { MeasurementRecord, PeriodFilter, PatientProfile, MedicalSettings } from "../types";
import { SkeletonDashboard } from "./SkeletonDashboard";
import { SkeletonPatientProfile } from "./SkeletonPatientProfile";
import { SkeletonVoiceInput } from "./SkeletonVoiceInput";

const VoiceInput = lazy(() => import("./VoiceInput"));
const StatsDashboard = lazy(() => import("./StatsDashboard"));
const PatientProfileWidget = lazy(() => import("./PatientProfileWidget"));

interface DashboardSectionProps {
  isLoading: boolean;
  filteredRecords: MeasurementRecord[];
  allRecords: MeasurementRecord[];
  activePeriod: PeriodFilter;
  patientProfile: PatientProfile | null;
  medicalSettings: MedicalSettings;
  onParsedResult: (result: any) => void;
  onProfileChange: (profile: PatientProfile | null) => void;
  onStatusChange: (message: string | null) => void;
}

export default function DashboardSection({
  isLoading,
  filteredRecords,
  allRecords,
  activePeriod,
  patientProfile,
  medicalSettings,
  onParsedResult,
  onProfileChange,
  onStatusChange,
}: DashboardSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative">
      {/* Left Column: Voice input and validation form */}
      <div className="lg:col-span-5 xl:col-span-4 space-y-3">
        {/* Patient Profile Card */}
        {isLoading ? (
          <SkeletonPatientProfile />
        ) : (
          <Suspense fallback={<SkeletonPatientProfile />}>
            <PatientProfileWidget currentProfile={patientProfile} onProfileChange={onProfileChange} />
          </Suspense>
        )}

        {/* Voice Input Engine */}
        {isLoading ? (
          <SkeletonVoiceInput />
        ) : (
          <Suspense fallback={<SkeletonVoiceInput />}>
            <VoiceInput
              onParsedResult={onParsedResult}
              onStatusChange={onStatusChange}
            />
          </Suspense>
        )}
      </div>

      {/* Right Column: Graphs & Statistics - Always visible */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-3">
        {isLoading ? (
          <SkeletonDashboard />
        ) : (
          <Suspense fallback={<SkeletonDashboard />}>
            <StatsDashboard
              filteredRecords={filteredRecords}
              allRecords={allRecords}
              activePeriod={activePeriod}
              patientProfile={patientProfile}
              settings={medicalSettings}
              onProfileChange={onProfileChange}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
