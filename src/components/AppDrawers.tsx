import { Suspense, lazy } from "react";
import Drawer from "./Drawer";
import ScanOCRDrawer from "./ScanOCRDrawer";
import { MedicalSettings, ParsedVoiceResult, MeasurementRecord } from "../types";

const MedicalSettingsPanel = lazy(() => import("./MedicalSettingsPanel"));
const AddRecordForm = lazy(() => import("./AddRecordForm"));

const fallback = <div className="p-4 space-y-3"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></div>;

interface AppDrawersProps {
  showSettingsPanel: boolean;
  showManualForm: boolean;
  showScanPanel: boolean;
  medicalSettings: MedicalSettings;
  parsedVoiceResult: ParsedVoiceResult | null;
  onSettingsPanelClose: () => void;
  onFormPanelClose: () => void;
  onScanPanelClose: () => void;
  onSettingsSave: (settings: MedicalSettings) => void;
  onRecordSave: (record: Omit<MeasurementRecord, "id">) => void;
  onImportRecords: (records: MeasurementRecord[]) => void;
}

export default function AppDrawers({
  showSettingsPanel,
  showManualForm,
  showScanPanel,
  medicalSettings,
  parsedVoiceResult,
  onSettingsPanelClose,
  onFormPanelClose,
  onScanPanelClose,
  onSettingsSave,
  onRecordSave,
  onImportRecords,
}: AppDrawersProps) {
  return (
    <>
      {/* Settings Drawer - Non-blocking sidebar */}
      <Drawer
        isOpen={showSettingsPanel}
        onClose={onSettingsPanelClose}
        title="Paramètres médicaux"
        size="md"
        position="right"
      >
        <Suspense fallback={fallback}>
          <MedicalSettingsPanel
            settings={medicalSettings}
            onSave={(nextSettings) => {
              onSettingsSave(nextSettings);
              onSettingsPanelClose();
            }}
            onClose={onSettingsPanelClose}
          />
        </Suspense>
      </Drawer>

      {/* Add Record Form Drawer - Non-blocking sidebar */}
      <Drawer
        isOpen={showManualForm}
        onClose={onFormPanelClose}
        title={parsedVoiceResult ? "Confirmer les mesures vocales" : "Nouvelle mesure"}
        size="md"
        position="right"
      >
        <Suspense fallback={fallback}>
          <AddRecordForm
            key={parsedVoiceResult ? "voice" : "manual"}
            initialValues={parsedVoiceResult}
            settings={medicalSettings}
            onSave={(record) => {
              onRecordSave(record);
              onFormPanelClose();
            }}
            onCancel={onFormPanelClose}
          />
        </Suspense>
      </Drawer>

      {/* Scan IA Drawer */}
      <ScanOCRDrawer
        isOpen={showScanPanel}
        onClose={onScanPanelClose}
        onImportRecords={(extractedRecords) => {
          // Convertir les ExtractedRecords en MeasurementRecord
          const records: MeasurementRecord[] = extractedRecords.map((r) => ({
            id: `rec-${Math.random().toString(36).slice(2, 11)}`,
            timestamp: r.timestamp,
            systolic: r.systolic,
            diastolic: r.diastolic,
            pulse: r.pulse || 0,
            spo2: r.spo2,
            notes: r.notes || "Importé par scan IA"
          }));
          onImportRecords(records);
          onScanPanelClose();
        }}
      />
    </>
  );
}
