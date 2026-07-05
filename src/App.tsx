import { useState, useEffect, useMemo } from "react";
import { MeasurementRecord, PeriodFilter, ParsedVoiceResult, PatientProfile, DEFAULT_MEDICAL_SETTINGS, type MedicalSettings } from "./types";
import { filterRecordsByPeriod, checkMedicalThresholds, MedicalAlertInfo } from "./utils";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import ConfirmDialog from "./components/ConfirmDialog";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AppAlerts from "./components/AppAlerts";
import DashboardSection from "./components/DashboardSection";
import HistorySection from "./components/HistorySection";
import AppDrawers from "./components/AppDrawers";
import {
  getAllRecords,
  saveRecord,
  deleteRecord,
  clearAllRecords,
  saveMultipleRecords,
  DatabaseError
} from "./db";

export default function App() {
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activePeriod, setActivePeriod] = useState<PeriodFilter>("all");
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(() => {
    const saved = localStorage.getItem("patient_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load patient profile from localStorage", e);
      }
    }
    return null;
  });
  const [parsedVoiceResult, setParsedVoiceResult] = useState<ParsedVoiceResult | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saveAlert, setSaveAlert] = useState<MedicalAlertInfo | null>(null);

  // Confirmation dialog state
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

  const [medicalSettings, setMedicalSettings] = useState<MedicalSettings>(() => {
    const saved = localStorage.getItem("medical_settings");
    if (saved) {
      try {
        return { ...DEFAULT_MEDICAL_SETTINGS, ...JSON.parse(saved) };
      } catch (error) {
        console.error("Failed to load medical settings from localStorage", error);
      }
    }
    return DEFAULT_MEDICAL_SETTINGS;
  });
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showScanPanel, setShowScanPanel] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Apply theme class to HTML element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("medical_settings", JSON.stringify(medicalSettings));
  }, [medicalSettings]);

  // Load records from IndexedDB on component mount
  useEffect(() => {
    async function loadIndexedData() {
      try {
        const startTime = Date.now();
        const stored = await getAllRecords();
        // Sort them descending by timestamp so newest are first
        const sorted = [...stored].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setRecords(sorted);
        
        // Ensure minimum skeleton display time (800ms for better UX)
        const elapsedTime = Date.now() - startTime;
        const minLoadTime = 800;
        if (elapsedTime < minLoadTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsedTime));
        }
      } catch (e) {
        console.error("Erreur de chargement d'IndexedDB :", e);
        if (e instanceof DatabaseError) {
          setStatusMessage("Impossible de charger les données. Veuillez actualiser la page.");
          setTimeout(() => setStatusMessage(null), 5000);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadIndexedData();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      "ctrl+n": () => {
        setParsedVoiceResult(null);
        setShowManualForm(true);
      },
      "escape": () => {
        if (showManualForm) {
          setShowManualForm(false);
          setParsedVoiceResult(null);
        } else if (showSettingsPanel) {
          setShowSettingsPanel(false);
        }
      },
    },
    true
  );

  // Handle adding a new measurement
  const handleSaveRecord = async (newRecordData: Omit<MeasurementRecord, "id">) => {
    const newRecord: MeasurementRecord = {
      ...newRecordData,
      id: `rec-${Math.random().toString(36).slice(2, 11)}`,
    };

    try {
      await saveRecord(newRecord);
      setRecords((prev: MeasurementRecord[]) => [newRecord, ...prev]);
      setParsedVoiceResult(null);
      setShowManualForm(false);

      // Calculate real-time medical thresholds warning
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
      // Short vocal announcement/feedback (accessible speech synthesis)
      speakFeedback(vocalFeedback);
    } catch (e) {
      console.error("Erreur de sauvegarde de la mesure :", e);
      if (e instanceof DatabaseError) {
        setStatusMessage("Erreur lors de la sauvegarde. Veuillez réessayer.");
        setTimeout(() => setStatusMessage(null), 5000);
      }
    }
  };

  // Inline edit handler
  const handleEditRecord = async (updatedRecord: MeasurementRecord) => {
    try {
      await saveRecord(updatedRecord);
      setRecords((prev: MeasurementRecord[]) => prev.map((r: MeasurementRecord) => (r.id === updatedRecord.id ? updatedRecord : r)));
    } catch (e) {
      console.error("Erreur de mise à jour de la mesure :", e);
      if (e instanceof DatabaseError) {
        setStatusMessage("Erreur lors de la mise à jour. Veuillez réessayer.");
        setTimeout(() => setStatusMessage(null), 5000);
      }
    }
  };

  // Delete handler with confirmation dialog
  const handleDeleteRecord = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Supprimer cette mesure ?",
      message: "Cette action est irréversible. La mesure sera définitivement supprimée de votre historique.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteRecord(id);
          setRecords((prev: MeasurementRecord[]) => prev.filter((r: MeasurementRecord) => r.id !== id));
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (e) {
          console.error("Erreur de suppression de la mesure :", e);
          if (e instanceof DatabaseError) {
            setStatusMessage("Erreur lors de la suppression. Veuillez réessayer.");
            setTimeout(() => setStatusMessage(null), 5000);
          }
        }
      },
    });
  };

  const getRecordDateKey = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return timestamp.slice(0, 10);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const saveImportedRecords = async (imported: MeasurementRecord[], replaceDateKeys = new Set<string>()) => {
    const remainingRecords = records.filter((record) => !replaceDateKeys.has(getRecordDateKey(record.timestamp)));
    const nextRecords = [...imported, ...remainingRecords].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    for (const record of records) {
      if (replaceDateKeys.has(getRecordDateKey(record.timestamp))) {
        await deleteRecord(record.id);
      }
    }

    await saveMultipleRecords(nextRecords);
    setRecords(nextRecords);
    setStatusMessage(`${imported.length} mesure(s) importée(s).`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Import external backup
  const handleImportRecords = async (imported: MeasurementRecord[]) => {
    if (imported.length === 0) {
      return;
    }

    try {
      const importedDateKeys = new Set(imported.map((record) => getRecordDateKey(record.timestamp)));
      const duplicateRecords = records.filter((record) => importedDateKeys.has(getRecordDateKey(record.timestamp)));

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
              await saveImportedRecords(imported, importedDateKeys);
              setConfirmDialog((current) => ({ ...current, isOpen: false }));
            } catch (e) {
              console.error("Erreur lors de l'import :", e);
              setStatusMessage("Erreur lors de l'import. Veuillez réessayer.");
              setTimeout(() => setStatusMessage(null), 5000);
            }
          },
        });
        return;
      }

      await saveImportedRecords(imported);
    } catch (e) {
      console.error("Erreur lors de l'import :", e);
      if (e instanceof DatabaseError) {
        setStatusMessage("Erreur lors de l'import. Veuillez réessayer.");
        setTimeout(() => setStatusMessage(null), 5000);
      }
    }
  };

  // Text-To-Speech confirmation helper
  const speakFeedback = (message: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "fr-FR";
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Computed filtered list for Charts & Statistics
  const filteredRecords = useMemo(() => {
    return filterRecordsByPeriod(records, activePeriod);
  }, [records, activePeriod]);

  // Clear all data with safety confirmation
  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Vider tout l'historique ?",
      message: "⚠️ Cette action est irréversible. Toutes vos mesures de tension et pouls seront définitivement effacées.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await clearAllRecords();
          setRecords([]);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (e) {
          console.error("Erreur de vidage d'IndexedDB :", e);
          if (e instanceof DatabaseError) {
            setStatusMessage("Erreur lors du vidage. Veuillez réessayer.");
            setTimeout(() => setStatusMessage(null), 5000);
          }
        }
      },
    });
  };

  return (
    <div className="h-screen bg-natural-bg text-natural-dark flex flex-col font-sans antialiased overflow-hidden" id="main-app-container">
      {/* Top Banner / Header */}
      <Header
        onManualToggle={() => {
          setParsedVoiceResult(null);
          setShowManualForm((prev: boolean) => !prev);
        }}
        theme={theme}
        onThemeToggle={() => setTheme((prev: "light" | "dark") => (prev === "light" ? "dark" : "light"))}
        onSettingsToggle={() => setShowSettingsPanel(true)}
        onScanToggle={() => setShowScanPanel(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-[95%] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4 overflow-y-auto" id="app-main-layout">
        {/* Alerts Section */}
        <AppAlerts 
          statusMessage={statusMessage}
          saveAlert={saveAlert}
          onAlertClose={() => setSaveAlert(null)}
        />

        {/* Dashboard Section */}
        <DashboardSection
          isLoading={isLoading}
          filteredRecords={filteredRecords}
          allRecords={records}
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

        {/* History Section */}
        <HistorySection
          isLoading={isLoading}
          records={records}
          medicalSettings={medicalSettings}
          onDeleteRequest={handleDeleteRecord}
          onEditRecord={handleEditRecord}
          onImportRecords={handleImportRecords}
          onClearAll={handleClearAll}
        />
      </main>

      {/* Page Footer */}
      <Footer />

      {/* Drawers Section */}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel || (confirmDialog.variant === "danger" ? "Supprimer" : "Confirmer")}
        cancelLabel={confirmDialog.cancelLabel}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
