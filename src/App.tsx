/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, FileSpreadsheet, AlertTriangle, ShieldAlert, X } from "lucide-react";
import { MeasurementRecord, PeriodFilter, ParsedVoiceResult, PatientProfile, DEFAULT_MEDICAL_SETTINGS, type MedicalSettings } from "./types";
import { filterRecordsByPeriod, checkMedicalThresholds, MedicalAlertInfo } from "./utils";
import VoiceInput from "./components/VoiceInput";
import AddRecordForm from "./components/AddRecordForm";
import StatsDashboard from "./components/StatsDashboard";
import HistorySpreadsheet from "./components/HistorySpreadsheet";
import Header from "./components/Header";
import MedicalSettingsPanel from "./components/MedicalSettingsPanel";
import PatientProfileWidget from "./components/PatientProfileWidget";
import Footer from "./components/Footer";
import { motion, AnimatePresence } from "motion/react";
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
        const stored = await getAllRecords();
        // Sort them descending by timestamp so newest are first
        const sorted = [...stored].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setRecords(sorted);
      } catch (e) {
        console.error("Erreur de chargement d'IndexedDB :", e);
        if (e instanceof DatabaseError) {
          setStatusMessage("Impossible de charger les données. Veuillez actualiser la page.");
          setTimeout(() => setStatusMessage(null), 5000);
        }
      }
    }
    loadIndexedData();
  }, []);

  // Handle adding a new measurement
  const handleSaveRecord = async (newRecordData: Omit<MeasurementRecord, "id">) => {
    const newRecord: MeasurementRecord = {
      ...newRecordData,
      id: `rec-${Math.random().toString(36).substr(2, 9)}`,
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
      let vocalFeedback = `Mesure enregistr?e. Tension de ${newRecord.systolic} sur ${newRecord.diastolic} avec un pouls ? ${newRecord.pulse}.`;
      if (typeof newRecord.spo2 === "number") {
        vocalFeedback += ` Saturation oxyg?ne ? ${newRecord.spo2}%.`;
      }

      if (alertCheck.hasAlert) {
        setSaveAlert(alertCheck);
        vocalFeedback += " Attention, certaines de vos constantes d?passent les limites recommand?es. Prenez le temps de vous reposer au calme.";
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

  // Delete handler
  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord(id);
      setRecords((prev: MeasurementRecord[]) => prev.filter((r: MeasurementRecord) => r.id !== id));
    } catch (e) {
      console.error("Erreur de suppression de la mesure :", e);
      if (e instanceof DatabaseError) {
        setStatusMessage("Erreur lors de la suppression. Veuillez réessayer.");
        setTimeout(() => setStatusMessage(null), 5000);
      }
    }
  };

  // Import external backup
  const handleImportRecords = async (imported: MeasurementRecord[]) => {
    try {
      const merged = [...imported, ...records];
      // Keep unique IDs
      const uniqueMap = new Map<string, MeasurementRecord>();
      merged.forEach((item: MeasurementRecord) => uniqueMap.set(item.id, item));
      const uniqueList = Array.from(uniqueMap.values());

      await saveMultipleRecords(uniqueList);
      setRecords(uniqueList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
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
  const handleClearAll = async () => {
    if (confirm("⚠️ Êtes-vous sûr de vouloir vider complètement l'historique ? Toutes les données de tension et pouls seront définitivement effacées.")) {
      try {
        await clearAllRecords();
        setRecords([]);
      } catch (e) {
        console.error("Erreur de vidage d'IndexedDB :", e);
        if (e instanceof DatabaseError) {
          setStatusMessage("Erreur lors du vidage. Veuillez réessayer.");
          setTimeout(() => setStatusMessage(null), 5000);
        }
      }
    }
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
      />

      {/* Main Body */}
      <main className="flex-1 max-w-[95%] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4 overflow-y-auto" id="app-main-layout">
        {/* Active status indicator (e.g. speaking or analyzing) */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-linear-to-r from-natural-primary to-natural-accent text-white text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-natural-primary/20 flex items-center gap-2 justify-center font-semibold font-sans tracking-wide backdrop-blur-sm"
              id="app-status-bar"
            >
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{statusMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time Medical Alert Banner on Save */}
        <AnimatePresence>
          {saveAlert && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              className={`p-4 rounded-2xl border flex gap-3 relative overflow-hidden transition-all shadow-lg backdrop-blur-sm ${
                saveAlert.type === "danger"
                  ? "bg-linear-to-r from-red-50/95 to-red-100/90 border-red-300 text-red-950 ring-2 ring-red-500/20"
                  : "bg-linear-to-r from-amber-50/95 to-amber-100/90 border-amber-300 text-amber-950 ring-2 ring-amber-500/20"
              }`}
              id="save-medical-alert-banner"
            >
              <div className="mt-0.5 shrink-0 p-2.5 rounded-xl bg-white/80 shadow-sm">
                {saveAlert.type === "danger" ? (
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="space-y-2 pr-8 flex-1">
                <h4 className="text-xs font-extrabold tracking-wide uppercase font-sans flex flex-wrap items-center gap-2">
                  <span>🚨 Alerte médicale</span>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm ${
                    saveAlert.type === "danger" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                  }`}>
                    {saveAlert.type === "danger" ? "Urgent" : "Attention"}
                  </span>
                </h4>
                <p className="text-xs font-semibold leading-relaxed">
                  Valeurs hors recommandations :
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 font-sans">
                  {saveAlert.messages.map((msg, idx) => (
                    <li key={idx} className="leading-relaxed">{msg}</li>
                  ))}
                </ul>
                <div className="text-[10px] leading-relaxed text-natural-secondary/90 border-t border-natural-border/30 pt-2.5 mt-2.5">
                  <strong>💡 Recommandations :</strong>
                  <ul className="list-decimal pl-4 mt-1.5 space-y-1">
                    <li>Asseyez-vous confortablement, dos soutenu</li>
                    <li>Respirez lentement (inspiration 4s, expiration 6s)</li>
                    <li>Évitez café, thé, alcool, tabac</li>
                    <li>Prenez une nouvelle mesure après 5 min de calme</li>
                  </ul>
                  <p className="mt-2 text-[9px] font-bold italic opacity-80">
                    *Cet assistant ne remplace pas un avis médical. En cas de symptômes, consultez.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSaveAlert(null)}
                className="absolute top-3 right-3 p-1.5 hover:bg-white/90 rounded-xl transition-all text-natural-secondary hover:text-natural-primary cursor-pointer border border-transparent hover:border-natural-border/40 shadow-sm hover:shadow-md"
                title="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative">

          {/* Left Column: Voice input and validation form */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3">

            {/* Patient Profile Card */}
            <PatientProfileWidget onProfileChange={setPatientProfile} />

            {/* Voice Input Engine */}
            <VoiceInput
              onParsedResult={(result) => {
                setParsedVoiceResult(result);
                setShowManualForm(true);
              }}
              onStatusChange={setStatusMessage}
            />

          </div>

          {/* Right Column: Graphs & Statistics - Always visible */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3">
            <StatsDashboard
              filteredRecords={filteredRecords}
              allRecords={records}
              activePeriod={activePeriod}
              patientProfile={patientProfile}
              settings={medicalSettings}
            />
          </div>

        </div>

        {/* Full-width Spreadsheet Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-5 w-5 text-natural-secondary" />
              <h3 className="font-bold text-natural-dark text-base">Historique des mesures</h3>
            </div>

            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] bg-linear-to-r from-red-50 to-red-100/50 hover:from-red-100 hover:to-red-200 text-red-700 px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer border border-red-200 shadow-sm hover:shadow-md hover:scale-[1.02]"
                id="clear-all-data-btn"
              >
                🗑️ Vider
              </button>
            )}
          </div>

          <HistorySpreadsheet
            records={records}
            filter={activePeriod}
            onFilterChange={setActivePeriod}
            onDeleteRecord={handleDeleteRecord}
            onEditRecord={handleEditRecord}
            onImportRecords={handleImportRecords}
            settings={medicalSettings}
          />
        </div>
      </main>

      {/* Page Footer */}
      <Footer />

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettingsPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-natural-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettingsPanel(false)}
          >
            <MedicalSettingsPanel
              settings={medicalSettings}
              onSave={(nextSettings) => {
                setMedicalSettings(nextSettings);
                setShowSettingsPanel(false);
              }}
              onClose={() => setShowSettingsPanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Overlay for Form - Appears on top of everything */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-natural-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowManualForm(false);
              setParsedVoiceResult(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-linear-to-br from-natural-surface to-natural-card/40 rounded-3xl border border-natural-border/50 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <AddRecordForm
                key={parsedVoiceResult ? "voice" : "manual"}
                initialValues={parsedVoiceResult}
                settings={medicalSettings}
                onSave={(record) => {
                  handleSaveRecord(record);
                  setShowManualForm(false);
                  setParsedVoiceResult(null);
                }}
                onCancel={() => {
                  setShowManualForm(false);
                  setParsedVoiceResult(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

