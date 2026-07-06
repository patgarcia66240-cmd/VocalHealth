import { useEffect, useMemo, useRef, useState } from "react";
import { MeasurementRecord, ParsedVoiceResult, PeriodFilter } from "./types";
import { checkMedicalThresholds, filterRecordsByPeriod, MedicalAlertInfo } from "./utils";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { getRecordDateKey, useRecords } from "./hooks/useRecords";
import { useMedicalSettings } from "./hooks/useMedicalSettings";
import { usePatientProfile } from "./hooks/usePatientProfile";
import { useTheme } from "./hooks/useTheme";
import { speakFeedback } from "./services/speech";
import { DatabaseError } from "./db";
import ConfirmDialog from "./components/ConfirmDialog";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppAlerts from "./components/AppAlerts";
import DashboardSection from "./components/DashboardSection";
import HistorySection from "./components/HistorySection";
import AppDrawers from "./components/AppDrawers";
import { getPatientProfileKey } from "./services/patientProfiles";

export default function App() {
  const [activePeriod] = useState<PeriodFilter>("all");
  const [parsedVoiceResult, setParsedVoiceResult] = useState<ParsedVoiceResult | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saveAlert, setSaveAlert] = useState<MedicalAlertInfo | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showScanPanel, setShowScanPanel] = useState(false);

  const {
    records,
    isLoading,
    addRecord,
    editRecord,
    removeRecord,
    replaceImportedRecords,
    clearRecords,
    showStatus,
  } = useRecords(setStatusMessage);
  const { patientProfile, setPatientProfile } = usePatientProfile();
  const { medicalSettings, setMedicalSettings } = useMedicalSettings();
  const { theme, toggleTheme } = useTheme();
  const activePatientId = patientProfile ? getPatientProfileKey(patientProfile) : undefined;
  const migratedLegacyPatientIdRef = useRef<string | null>(null);

  const patientRecords = useMemo(() => {
    if (!activePatientId) {
      return records.filter((record) => !record.patientId);
    }

    return records.filter((record) => record.patientId === activePatientId);
  }, [activePatientId, records]);

  useEffect(() => {
    if (!activePatientId || migratedLegacyPatientIdRef.current === activePatientId) return;

    const unassignedRecords = records.filter((record) => !record.patientId);
    if (unassignedRecords.length === 0) return;

    migratedLegacyPatientIdRef.current = activePatientId;

    async function attachLegacyRecordsToPatient() {
      try {
        for (const record of unassignedRecords) {
          await editRecord({ ...record, patientId: activePatientId });
        }
        showStatus(`${unassignedRecords.length} ancienne(s) mesure(s) rattachée(s) au patient sélectionné.`);
      } catch (error) {
        console.error("Erreur de rattachement des anciennes mesures :", error);
        migratedLegacyPatientIdRef.current = null;
        if (error instanceof DatabaseError) {
          showStatus("Impossible de rattacher les anciennes mesures au patient sélectionné.");
        }
      }
    }

    attachLegacyRecordsToPatient();
  }, [activePatientId, editRecord, records, showStatus]);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "default";
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "default",
    confirmLabel: undefined,
    cancelLabel: undefined,
    onConfirm: () => {},
  });

  useKeyboardShortcuts(
    {
      "ctrl+n": () => {
        setParsedVoiceResult(null);
        setShowManualForm(true);
      },
      escape: () => {
        if (showManualForm) {
          setShowManualForm(false);
          setParsedVoiceResult(null);
        } else if (showSettingsPanel) {
          setShowSettingsPanel(false);
        }
      },
    },
    true,
  );

  const handleSaveRecord = async (newRecordData: Omit<MeasurementRecord, "id">) => {
    try {
      const newRecord = await addRecord({
        ...newRecordData,
        patientId: activePatientId,
      });
      setParsedVoiceResult(null);
      setShowManualForm(false);

      const alertCheck = checkMedicalThresholds(
        newRecord.systolic,
        newRecord.diastolic,
        newRecord.pulse,
        newRecord.spo2,
        medicalSettings,
      );
      let vocalFeedback = `Mesure enregistrée. Tension de ${newRecord.systolic} sur ${newRecord.diastolic} avec un pouls à ${newRecord.pulse}.`;
      if (typeof newRecord.spo2 === "number") {
        vocalFeedback += ` Saturation oxygène à ${newRecord.spo2}%.`;
      }

      if (alertCheck.hasAlert) {
        setSaveAlert(alertCheck);
        vocalFeedback += " Attention, certaines de vos constantes dépassent les limites recommandées. Prenez le temps de vous reposer au calme.";
      } else {
        setSaveAlert(null);
      }

      speakFeedback(vocalFeedback);
    } catch (error) {
      console.error("Erreur de sauvegarde de la mesure :", error);
      if (error instanceof DatabaseError) {
        showStatus("Erreur lors de la sauvegarde. Veuillez réessayer.");
      }
    }
  };

  const handleEditRecord = async (updatedRecord: MeasurementRecord) => {
    try {
      await editRecord({
        ...updatedRecord,
        patientId: updatedRecord.patientId || activePatientId,
      });
    } catch (error) {
      console.error("Erreur de mise à jour de la mesure :", error);
      if (error instanceof DatabaseError) {
        showStatus("Erreur lors de la mise à jour. Veuillez réessayer.");
      }
    }
  };

  const handleDeleteRecord = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer cette mesure ?",
      message: "Cette action est irréversible. La mesure sera définitivement supprimée de votre historique.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await removeRecord(id);
          setConfirmDialog((current) => ({ ...current, isOpen: false }));
        } catch (error) {
          console.error("Erreur de suppression de la mesure :", error);
          if (error instanceof DatabaseError) {
            showStatus("Erreur lors de la suppression. Veuillez réessayer.");
          }
        }
      },
    });
  };

  const handleImportRecords = async (imported: MeasurementRecord[]) => {
    if (imported.length === 0) return;

    try {
      const importedWithPatient = imported.map((record) => ({
        ...record,
        patientId: activePatientId,
      }));
      const importedDateKeys = new Set(importedWithPatient.map((record) => getRecordDateKey(record.timestamp)));
      const duplicateRecords = patientRecords.filter((record) => importedDateKeys.has(getRecordDateKey(record.timestamp)));

      if (duplicateRecords.length > 0) {
        const duplicateDates = Array.from(new Set(duplicateRecords.map((record) => getRecordDateKey(record.timestamp))));

        setConfirmDialog({
          isOpen: true,
          title: "Mesures déjà présentes",
          message: `${duplicateRecords.length} ancienne(s) mesure(s) existe(nt) déjà sur ${duplicateDates.length} date(s) importée(s). Voulez-vous effacer les anciennes mesures de ces dates et les remplacer par celles du scan ?`,
          variant: "warning",
          confirmLabel: "Mettre à jour",
          cancelLabel: "Garder l'ancien",
          onConfirm: async () => {
            try {
              await replaceImportedRecords(importedWithPatient, importedDateKeys, activePatientId);
              setConfirmDialog((current) => ({ ...current, isOpen: false }));
            } catch (error) {
              console.error("Erreur lors de l'import :", error);
              showStatus("Erreur lors de l'import. Veuillez réessayer.");
            }
          },
        });
        return;
      }

      await replaceImportedRecords(importedWithPatient, new Set<string>(), activePatientId);
    } catch (error) {
      console.error("Erreur lors de l'import :", error);
      if (error instanceof DatabaseError) {
        showStatus("Erreur lors de l'import. Veuillez réessayer.");
      }
    }
  };

  const filteredRecords = useMemo(() => {
    return filterRecordsByPeriod(patientRecords, activePeriod);
  }, [patientRecords, activePeriod]);

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Vider tout l'historique ?",
      message: "Cette action est irréversible. Toutes vos mesures de tension et pouls seront définitivement effacées.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await clearRecords(activePatientId);
          setConfirmDialog((current) => ({ ...current, isOpen: false }));
        } catch (error) {
          console.error("Erreur de vidage d'IndexedDB :", error);
          if (error instanceof DatabaseError) {
            showStatus("Erreur lors du vidage. Veuillez réessayer.");
          }
        }
      },
    });
  };

  return (
    <div className="h-screen bg-natural-bg text-natural-dark flex flex-col font-sans antialiased overflow-hidden" id="main-app-container">
      <Header
        onManualToggle={() => {
          setParsedVoiceResult(null);
          setShowManualForm((prev) => !prev);
        }}
        theme={theme}
        onThemeToggle={toggleTheme}
        onSettingsToggle={() => setShowSettingsPanel(true)}
        onScanToggle={() => setShowScanPanel(true)}
      />

      <main className="flex-1 max-w-[95%] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4 overflow-y-auto" id="app-main-layout">
        <AppAlerts
          statusMessage={statusMessage}
          saveAlert={saveAlert}
          onAlertClose={() => setSaveAlert(null)}
        />

        <DashboardSection
          isLoading={isLoading}
          filteredRecords={filteredRecords}
          allRecords={patientRecords}
          activePeriod={activePeriod}
          patientProfile={patientProfile}
          medicalSettings={medicalSettings}
          onParsedResult={(result) => {
            setParsedVoiceResult(result);
            setShowManualForm(true);
          }}
          onProfileChange={setPatientProfile}
          onStatusChange={setStatusMessage}
        />

        <HistorySection
          isLoading={isLoading}
          records={patientRecords}
          medicalSettings={medicalSettings}
          onDeleteRequest={handleDeleteRecord}
          onEditRecord={handleEditRecord}
          onImportRecords={handleImportRecords}
          onClearAll={handleClearAll}
        />
      </main>

      <Footer />

      <AppDrawers
        showSettingsPanel={showSettingsPanel}
        showManualForm={showManualForm}
        showScanPanel={showScanPanel}
        medicalSettings={medicalSettings}
        parsedVoiceResult={parsedVoiceResult}
        onSettingsPanelClose={() => setShowSettingsPanel(false)}
        onFormPanelClose={() => {
          setShowManualForm(false);
          setParsedVoiceResult(null);
        }}
        onScanPanelClose={() => setShowScanPanel(false)}
        onSettingsSave={setMedicalSettings}
        onRecordSave={handleSaveRecord}
        onImportRecords={handleImportRecords}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel || (confirmDialog.variant === "danger" ? "Supprimer" : "Confirmer")}
        cancelLabel={confirmDialog.cancelLabel}
        onCancel={() => setConfirmDialog((current) => ({ ...current, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
