/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { RefreshCw, FileSpreadsheet, AlertTriangle, ShieldAlert, X } from "lucide-react";
import { MeasurementRecord, PeriodFilter, ParsedVoiceResult, PatientProfile } from "./types";
import { filterRecordsByPeriod, checkMedicalThresholds, MedicalAlertInfo } from "./utils";
import VoiceInput from "./components/VoiceInput";
import AddRecordForm from "./components/AddRecordForm";
import StatsDashboard from "./components/StatsDashboard";
import HistorySpreadsheet from "./components/HistorySpreadsheet";
import Header from "./components/Header";
import VoiceTips from "./components/VoiceTips";
import PatientProfileWidget from "./components/PatientProfileWidget";
import Footer from "./components/Footer";
import { motion, AnimatePresence } from "motion/react";
import {
  getAllRecords,
  saveRecord,
  deleteRecord,
  clearAllRecords,
  saveMultipleRecords
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
      setRecords((prev) => [newRecord, ...prev]);
      setParsedVoiceResult(null);
      setShowManualForm(false);
      
      // Calculate real-time medical thresholds warning
      const alertCheck = checkMedicalThresholds(newRecord.systolic, newRecord.diastolic, newRecord.pulse);
      let vocalFeedback = `Mesure enregistrée. Tension de ${newRecord.systolic} sur ${newRecord.diastolic} avec un pouls à ${newRecord.pulse}.`;
      
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
    }
  };

  // Inline edit handler
  const handleEditRecord = async (updatedRecord: MeasurementRecord) => {
    try {
      await saveRecord(updatedRecord);
      setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
    } catch (e) {
      console.error("Erreur de mise à jour de la mesure :", e);
    }
  };

  // Delete handler
  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error("Erreur de suppression de la mesure :", e);
    }
  };

  // Import external backup
  const handleImportRecords = async (imported: MeasurementRecord[]) => {
    try {
      const merged = [...imported, ...records];
      // Keep unique IDs
      const uniqueMap = new Map();
      merged.forEach(item => uniqueMap.set(item.id, item));
      const uniqueList = Array.from(uniqueMap.values());
      
      await saveMultipleRecords(uniqueList);
      setRecords(uniqueList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (e) {
      console.error("Erreur lors de l'import :", e);
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
      }
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg text-natural-dark flex flex-col font-sans antialiased" id="main-app-container">
      {/* Top Banner / Header */}
      <Header
        onManualToggle={() => {
          setParsedVoiceResult(null);
          setShowManualForm((prev) => !prev);
        }}
        theme={theme}
        onThemeToggle={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8" id="app-main-layout">
        {/* Active status indicator (e.g. speaking or analyzing) */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-natural-primary text-white text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 justify-center font-semibold font-sans tracking-wide"
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
              className={`p-5 rounded-[24px] border flex gap-4 relative overflow-hidden transition-all ${
                saveAlert.type === "danger"
                  ? "bg-red-50/90 border-red-200 text-red-950 shadow-md ring-2 ring-red-500/10"
                  : "bg-amber-50/90 border-amber-200 text-amber-950 shadow-md ring-2 ring-amber-500/10"
              }`}
              id="save-medical-alert-banner"
            >
              <div className="mt-0.5 shrink-0 p-2 rounded-xl bg-white/60">
                {saveAlert.type === "danger" ? (
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                )}
              </div>
              <div className="space-y-2 pr-8 flex-1">
                <h4 className="text-xs font-extrabold tracking-wide uppercase font-sans text-natural-primary flex flex-wrap items-center gap-2">
                  <span>🚨 Notification d'attention médicale</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    saveAlert.type === "danger" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {saveAlert.type === "danger" ? "Alerte Élevée" : "Attention"}
                  </span>
                </h4>
                <p className="text-xs font-semibold leading-relaxed text-natural-primary">
                  La mesure enregistrée présente des valeurs hors des limites recommandées :
                </p>
                <ul className="list-disc pl-5 text-xs space-y-1 font-sans text-natural-dark">
                  {saveAlert.messages.map((msg, idx) => (
                    <li key={idx} className="leading-relaxed">{msg}</li>
                  ))}
                </ul>
                <div className="text-[10.5px] leading-relaxed text-natural-secondary border-t border-natural-border/20 pt-2.5 mt-2.5">
                  <strong>💡 Que faire maintenant ?</strong>
                  <ul className="list-decimal pl-4 mt-1.5 space-y-1">
                    <li>Asseyez-vous confortablement, le dos soutenu, les pieds à plat sur le sol.</li>
                    <li>Fermez les yeux, respirez lentement et profondément (inspiration 4s, expiration 6s) pendant 5 minutes.</li>
                    <li>Ne consommez pas de café, thé, alcool ou tabac, et évitez de parler.</li>
                    <li>Prenez une nouvelle mesure de contrôle après ce temps de calme.</li>
                  </ul>
                  <p className="mt-2 text-[9.5px] font-bold italic opacity-90">
                    *Cette application est un assistant de suivi personnel et ne remplace pas l'avis d'un médecin. Si les alertes persistent ou s'accompagnent de symptômes (malaise, essoufflement, douleurs), contactez un médecin ou le 15.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSaveAlert(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/80 rounded-xl transition-colors text-natural-secondary hover:text-natural-primary cursor-pointer border border-transparent hover:border-natural-border/30 shadow-sm"
                title="Fermer la notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Voice input and validation form */}
          <div className="lg:col-span-4 space-y-6">
            
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

            {/* Validation / Editing Form */}
            <AnimatePresence mode="wait">
              {showManualForm && (
                <AddRecordForm
                  key={parsedVoiceResult ? "voice" : "manual"}
                  initialValues={parsedVoiceResult}
                  onSave={handleSaveRecord}
                  onCancel={() => {
                    setShowManualForm(false);
                    setParsedVoiceResult(null);
                  }}
                />
              )}
            </AnimatePresence>
            
            {/* Quick Helper Tips Card in Natural Tones design */}
            <VoiceTips />

          </div>

          {/* Right Column: Graphs & Statistics */}
          <div className="lg:col-span-8 space-y-6">
            <StatsDashboard
              filteredRecords={filteredRecords}
              allRecords={records}
              activePeriod={activePeriod}
              patientProfile={patientProfile}
            />
          </div>

        </div>

        {/* Full-width Spreadsheet Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-5 w-5 text-natural-secondary" />
              <h3 className="font-bold text-natural-primary text-base">Feuille de calcul interactive</h3>
            </div>
            
            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] bg-natural-card hover:bg-natural-border text-natural-primary px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-widest transition-all cursor-pointer border border-natural-border"
                id="clear-all-data-btn"
              >
                Vider l'historique
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
          />
        </div>
      </main>

      {/* Page Footer */}
      <Footer />
    </div>
  );
}
