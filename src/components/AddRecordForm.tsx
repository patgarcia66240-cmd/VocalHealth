import React, { useState, useEffect } from "react";
import { Plus, Heart, HeartPulse, Droplets, Sparkles, X, MessageSquare, Calendar, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { ParsedVoiceResult, MeasurementRecord, MedicalSettings } from "../types";
import { classifyBloodPressure, checkMedicalThresholds } from "../utils";
import { motion } from "motion/react";

interface AddRecordFormProps {
  key?: string;
  initialValues: ParsedVoiceResult | null;
  onSave: (record: Omit<MeasurementRecord, "id">) => void;
  onCancel?: () => void;
  settings: MedicalSettings;
}

export default function AddRecordForm({ initialValues, onSave, onCancel, settings }: AddRecordFormProps) {
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(70);
  const [spo2, setSpo2] = useState<number>(98);
  const [remarks, setRemarks] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Synchronize state with parsed results from VoiceInput
    if (initialValues) {
      if (initialValues.systolic !== null) setSystolic(initialValues.systolic);
      if (initialValues.diastolic !== null) setDiastolic(initialValues.diastolic);
      if (initialValues.pulse !== null) setPulse(initialValues.pulse);
      if (initialValues.spo2 !== null) setSpo2(initialValues.spo2);
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
  const alertInfo = checkMedicalThresholds(systolic, diastolic, pulse, settings.spo2Enabled ? spo2 : undefined, settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the timestamp from date & time
    const localTimestamp = new Date(`${date}T${time}`).toISOString();
    
    onSave({
      timestamp: localTimestamp,
      systolic,
      diastolic,
      pulse,
      spo2: settings.spo2Enabled ? spo2 : undefined,
      remarks: remarks.trim()
    });

    // Reset remarks
    setRemarks("");
  };

  return (
    <div className="h-full flex flex-col" id="add-record-form">
      <div className="p-6 border-b border-natural-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-linear-to-br from-natural-primary/15 to-natural-accent/15 text-natural-primary rounded-2xl shadow-md">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-natural-dark tracking-tight" id="form-title">
                {initialValues ? "Validation des mesures" : "Nouvelle mesure"}
              </h2>
              <p className="text-sm text-natural-secondary">
                {initialValues ? "L'IA a extrait ces valeurs" : "Entrez vos paramètres"}
              </p>
            </div>
          </div>
          {initialValues && (
            <div className="flex items-center gap-1.5 bg-linear-to-r from-natural-primary/10 to-natural-accent/10 text-natural-primary px-3 py-1.5 rounded-full text-xs font-bold border border-natural-primary/20 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>IA</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Blood Pressure Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Systolic */}
          <div className="space-y-2 bg-linear-to-br from-natural-primary/5 to-natural-accent/5 p-4 rounded-xl border border-natural-border/40 shadow-sm">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-natural-dark uppercase tracking-wider">
                Systolique
              </label>
              <span className="text-lg font-bold text-natural-primary font-mono">
                {systolic} <span className="text-xs text-natural-secondary font-normal font-sans">mmHg</span>
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="200"
              value={systolic}
              onChange={(e) => setSystolic(parseInt(e.target.value))}
              className="w-full h-2 bg-natural-border/50 rounded-lg appearance-none cursor-pointer accent-natural-primary"
            />
            <div className="flex justify-between text-[9px] text-natural-secondary font-mono">
              <span>70</span>
              <span className="text-natural-primary font-bold">120</span>
              <span>200</span>
            </div>
          </div>

          {/* Diastolic */}
          <div className="space-y-2 bg-natural-bg/30 p-4 rounded-2xl border border-natural-border/70">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-natural-secondary uppercase tracking-widest">
                Diastolique (DIA)
              </label>
              <span className="text-lg font-bold text-natural-primary font-mono">
                {diastolic} <span className="text-xs text-natural-secondary font-normal font-sans">mmHg</span>
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
            <div className="flex justify-between text-xs text-natural-secondary font-mono">
              <span>40 (Basse)</span>
              <span>80 (Idéal)</span>
              <span>130 (Élevée)</span>
            </div>
          </div>
        </div>

        {/* Dynamic WHO Classification Banner */}
        <div className={`p-4 rounded-2xl border ${classification.bgColor} transition-all`}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs uppercase tracking-widest font-bold">Classification OMS</span>
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
              <span className="text-xs uppercase tracking-widest font-bold font-sans block text-natural-primary">
                ⚠️ Seuil d'attention recommandé dépassé
              </span>
              <ul className="list-disc pl-4 text-xs space-y-1 font-sans text-natural-dark">
                {alertInfo.messages.map((msg, idx) => (
                  <li key={idx} className="leading-relaxed">{msg}</li>
                ))}
              </ul>
              <p className="text-xs text-natural-secondary leading-relaxed pt-0.5">
                <strong>Conseil médical général :</strong> Restez assis au calme pendant 5 minutes sans parler avant de renouveler la mesure. Évitez l'effort, la caféine ou le tabac dans l'heure précédant le test. Si ces valeurs élevées/basses persistent ou si vous présentez des symptômes inhabituels (douleurs thoraciques, vertiges, essoufflements), parlez-en à un professionnel de santé.
              </p>
            </div>
          </motion.div>
        )}

        {/* Pulse & Date Time Grid */}
        <div className={`grid grid-cols-1 gap-3 ${settings.spo2Enabled ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {/* Heart rate / Pulse */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-natural-dark flex items-center gap-1 uppercase tracking-wider">
              <HeartPulse className="h-3.5 w-3.5 text-natural-primary" />
              Pouls
            </label>
            <input
              type="number"
              min="30"
              max="220"
              required
              value={pulse}
              onChange={(e) => setPulse(parseInt(e.target.value) || 70)}
              className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-xs text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm font-mono font-bold shadow-sm transition-all"
            />
          </div>

          {settings.spo2Enabled && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-natural-dark flex items-center gap-1 uppercase tracking-wider">
                <Droplets className="h-3.5 w-3.5 text-natural-primary" />
                Saturation SpO? <span className="text-natural-secondary normal-case font-normal">(optionnel)</span>
              </label>
              <input
                type="number"
                min="70"
                max="100"
                value={spo2}
                onChange={(e) => setSpo2(parseInt(e.target.value) || 98)}
                className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-xs text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm font-mono font-bold shadow-sm transition-all"
              />
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-natural-dark flex items-center gap-1 uppercase tracking-wider">
              <Calendar className="h-3.5 w-3.5 text-natural-secondary" />
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-xs text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm shadow-sm transition-all"
            />
          </div>

          {/* Time Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-natural-dark flex items-center gap-1 uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-natural-secondary" />
              Heure
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-natural-border/50 rounded-xl text-xs text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-white/80 backdrop-blur-sm shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Remarks / Comments */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-natural-primary flex items-center gap-1 uppercase tracking-widest">
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

      </form>

      {/* Footer with action buttons */}
      <div className="p-6 border-t border-natural-border/40 bg-linear-to-r from-natural-card/20 to-natural-bg/20">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-natural-card hover:bg-natural-border text-natural-secondary rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-natural-border/50 shadow-sm hover:shadow-md"
          >
            <X className="h-4 w-4" />
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-2.5 bg-linear-to-r from-natural-primary to-natural-accent hover:from-natural-primary/90 hover:to-natural-accent/90 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
            type="submit"
          >
            <Plus className="h-4 w-4" />
            Enregistrer les mesures
          </button>
        </div>
      </div>
    </div>
  );
}
