/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, Heart, HeartPulse, Sparkles, RefreshCw, X, MessageSquare, Calendar, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { ParsedVoiceResult, MeasurementRecord } from "../types";
import { classifyBloodPressure, checkMedicalThresholds } from "../utils";
import { motion } from "motion/react";

interface AddRecordFormProps {
  key?: string;
  initialValues: ParsedVoiceResult | null;
  onSave: (record: Omit<MeasurementRecord, "id">) => void;
  onCancel?: () => void;
}

export default function AddRecordForm({ initialValues, onSave, onCancel }: AddRecordFormProps) {
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(70);
  const [remarks, setRemarks] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Synchronize state with parsed results from VoiceInput
    if (initialValues) {
      if (initialValues.systolic !== null) setSystolic(initialValues.systolic);
      if (initialValues.diastolic !== null) setDiastolic(initialValues.diastolic);
      if (initialValues.pulse !== null) setPulse(initialValues.pulse);
      setRemarks(initialValues.remarks || "");
    }
    
    // Set current date & time
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const formattedTime = now.toTimeString().split(" ")[0].slice(0, 5);
    setDate(formattedDate);
    setTime(formattedTime);
  }, [initialValues]);

  const classification = classifyBloodPressure(systolic, diastolic);
  const alertInfo = checkMedicalThresholds(systolic, diastolic, pulse);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the timestamp from date & time
    const localTimestamp = new Date(`${date}T${time}`).toISOString();
    
    onSave({
      timestamp: localTimestamp,
      systolic,
      diastolic,
      pulse,
      remarks: remarks.trim()
    });

    // Reset remarks
    setRemarks("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="bg-natural-surface rounded-[32px] border border-natural-border p-8 shadow-sm"
      id="add-record-form"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-natural-bg text-natural-primary rounded-xl">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-natural-primary" id="form-title">
              {initialValues ? "Validation des Mesures" : "Saisie Manuelle Directe"}
            </h2>
            <p className="text-[11px] text-natural-secondary">
              {initialValues ? "L'IA a extrait ces valeurs, ajustez-les si besoin" : "Entrez les paramètres directement"}
            </p>
          </div>
        </div>
        {initialValues && (
          <div className="flex items-center gap-1 bg-natural-bg text-natural-primary px-3 py-1 rounded-full text-xs font-bold border border-natural-border">
            <Sparkles className="h-3.5 w-3.5" />
            <span>IA</span>
          </div>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-natural-bg text-natural-secondary hover:text-natural-primary rounded-xl transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Blood Pressure Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Systolic */}
          <div className="space-y-2 bg-natural-bg/30 p-4 rounded-2xl border border-natural-border/70">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-natural-secondary uppercase tracking-widest">
                Systolique (SYS)
              </label>
              <span className="text-lg font-bold text-natural-primary font-mono">
                {systolic} <span className="text-[10px] text-natural-secondary font-normal font-sans">mmHg</span>
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="200"
              value={systolic}
              onChange={(e) => setSystolic(parseInt(e.target.value))}
              className="w-full h-1.5 bg-natural-border rounded-lg appearance-none cursor-pointer accent-natural-primary"
            />
            <div className="flex justify-between text-[10px] text-natural-secondary font-mono">
              <span>70 (Basse)</span>
              <span>120 (Idéal)</span>
              <span>200 (Élevée)</span>
            </div>
          </div>

          {/* Diastolic */}
          <div className="space-y-2 bg-natural-bg/30 p-4 rounded-2xl border border-natural-border/70">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-natural-secondary uppercase tracking-widest">
                Diastolique (DIA)
              </label>
              <span className="text-lg font-bold text-natural-primary font-mono">
                {diastolic} <span className="text-[10px] text-natural-secondary font-normal font-sans">mmHg</span>
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="130"
              value={diastolic}
              onChange={(e) => setDiastolic(parseInt(e.target.value))}
              className="w-full h-1.5 bg-natural-border rounded-lg appearance-none cursor-pointer accent-natural-primary"
            />
            <div className="flex justify-between text-[10px] text-natural-secondary font-mono">
              <span>40 (Basse)</span>
              <span>80 (Idéal)</span>
              <span>130 (Élevée)</span>
            </div>
          </div>
        </div>

        {/* Dynamic WHO Classification Banner */}
        <div className={`p-4 rounded-2xl border ${classification.bgColor} transition-all`}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] uppercase tracking-widest font-bold">Classification OMS</span>
            <span className={`text-xs font-bold ${classification.color}`}>{classification.category}</span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed font-sans">{classification.description}</p>
        </div>

        {/* Dynamic Medical Threshold Alerts */}
        {alertInfo.hasAlert && (
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-4 rounded-2xl border flex gap-3 transition-all ${
              alertInfo.type === "danger"
                ? "bg-red-50/80 border-red-200 text-red-900 shadow-sm animate-pulse"
                : "bg-amber-50/80 border-amber-200 text-amber-950 shadow-sm"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {alertInfo.type === "danger" ? (
                <ShieldAlert className="h-5 w-5 text-red-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold font-sans block text-natural-primary">
                ⚠️ Seuil d'attention recommandé dépassé
              </span>
              <ul className="list-disc pl-4 text-xs space-y-1 font-sans text-natural-dark">
                {alertInfo.messages.map((msg, idx) => (
                  <li key={idx} className="leading-relaxed">{msg}</li>
                ))}
              </ul>
              <p className="text-[10px] text-natural-secondary leading-relaxed pt-0.5">
                <strong>Conseil médical général :</strong> Restez assis au calme pendant 5 minutes sans parler avant de renouveler la mesure. Évitez l'effort, la caféine ou le tabac dans l'heure précédant le test. Si ces valeurs élevées/basses persistent ou si vous présentez des symptômes inhabituels (douleurs thoraciques, vertiges, essoufflements), parlez-en à un professionnel de santé.
              </p>
            </div>
          </motion.div>
        )}

        {/* Pulse & Date Time Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Heart rate / Pulse */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-natural-primary flex items-center gap-1 uppercase tracking-widest">
              <HeartPulse className="h-3.5 w-3.5 text-natural-primary" />
              Pouls (bpm)
            </label>
            <input
              type="number"
              min="30"
              max="220"
              required
              value={pulse}
              onChange={(e) => setPulse(parseInt(e.target.value) || 70)}
              className="w-full px-3.5 py-2 border border-natural-border rounded-xl text-xs text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-surface font-mono"
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-natural-primary flex items-center gap-1 uppercase tracking-widest">
              <Calendar className="h-3.5 w-3.5 text-natural-secondary" />
              Date de mesure
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-natural-border rounded-xl text-xs text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-surface"
            />
          </div>

          {/* Time Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-natural-primary flex items-center gap-1 uppercase tracking-widest">
              <Clock className="h-3.5 w-3.5 text-natural-secondary" />
              Heure
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2 border border-natural-border rounded-xl text-xs text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-surface"
            />
          </div>
        </div>

        {/* Remarks / Comments */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-natural-primary flex items-center gap-1 uppercase tracking-widest">
            <MessageSquare className="h-3.5 w-3.5 text-natural-secondary" />
            Remarques & Commentaires
          </label>
          <input
            type="text"
            placeholder="Ex: Après le repas, fatigué le matin..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3.5 py-2 border border-natural-border rounded-xl text-xs text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/10 focus:border-natural-primary bg-natural-surface"
            maxLength={180}
            id="form-remarks-input"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-natural-border hover:bg-natural-bg text-natural-secondary rounded-xl text-xs font-bold transition-colors focus:outline-none cursor-pointer"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2 bg-natural-primary hover:bg-[#047857] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer"
            id="save-record-btn"
          >
            <Plus className="h-4 w-4" />
            Enregistrer dans l'historique
          </button>
        </div>
      </form>
    </motion.div>
  );
}
