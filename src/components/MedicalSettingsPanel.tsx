import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Droplets, HeartPulse, Settings2, Save, X, RotateCcw, Activity } from "lucide-react";
import { motion } from "motion/react";
import { DEFAULT_MEDICAL_SETTINGS, type MedicalSettings } from "../types";

interface MedicalSettingsPanelProps {
  settings: MedicalSettings;
  onSave: (settings: MedicalSettings) => void;
  onClose: () => void;
}

export default function MedicalSettingsPanel({ settings, onSave, onClose }: MedicalSettingsPanelProps) {
  const [draft, setDraft] = useState<MedicalSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const updateNumber = (key: keyof MedicalSettings) => (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((previous) => ({
      ...previous,
      [key]: Number(event.target.value),
    }));
  };

  const updateToggle = (key: keyof MedicalSettings) => (event: ChangeEvent<HTMLInputElement>) => {
    setDraft((previous) => ({
      ...previous,
      [key]: event.target.checked,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.98 }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      className="w-full max-w-2xl bg-linear-to-br from-natural-surface to-natural-card/40 rounded-3xl border border-natural-border/60 shadow-2xl overflow-hidden"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="medical-settings-title"
    >
      <div className="p-6 border-b border-natural-border/50 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-natural-primary/15 to-natural-accent/15 text-natural-primary rounded-2xl shadow-md">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-natural-dark tracking-tight" id="medical-settings-title">
              Paramètres médicaux
            </h2>
            <p className="text-[11px] text-natural-secondary">
              Ajustez les seuils de tension, pouls et saturation pour les alertes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-natural-bg text-natural-secondary hover:text-natural-primary transition-all cursor-pointer"
          aria-label="Fermer les paramètres"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-natural-dark">
            <HeartPulse className="h-4 w-4 text-natural-primary" />
            Tension artérielle
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="SYS haute" value={draft.systolicHigh} min={100} max={220} suffix="mmHg" onChange={updateNumber("systolicHigh")} />
            <NumberField label="DIA haute" value={draft.diastolicHigh} min={60} max={140} suffix="mmHg" onChange={updateNumber("diastolicHigh")} />
            <NumberField label="SYS basse" value={draft.systolicLow} min={60} max={140} suffix="mmHg" onChange={updateNumber("systolicLow")} />
            <NumberField label="DIA basse" value={draft.diastolicLow} min={40} max={100} suffix="mmHg" onChange={updateNumber("diastolicLow")} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-natural-dark">
            <ActivityIcon />
            Pouls
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField label="Pouls haut" value={draft.pulseHigh} min={60} max={220} suffix="bpm" onChange={updateNumber("pulseHigh")} />
            <NumberField label="Pouls bas" value={draft.pulseLow} min={30} max={100} suffix="bpm" onChange={updateNumber("pulseLow")} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-bold text-natural-dark">
              <Droplets className="h-4 w-4 text-natural-primary" />
              Saturation oxygène
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-natural-secondary cursor-pointer">
              <input type="checkbox" checked={draft.spo2Enabled} onChange={updateToggle("spo2Enabled")} className="h-4 w-4 rounded border-natural-border text-natural-primary focus:ring-natural-primary/30" />
              Paramètre optionnel activé
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-100">
            <NumberField label="Seuil SpO₂ bas" value={draft.spo2Low} min={70} max={100} suffix="%" onChange={updateNumber("spo2Low")} disabled={!draft.spo2Enabled} />
            <div className="rounded-2xl border border-natural-border/60 bg-natural-bg/40 p-4 text-xs text-natural-secondary leading-relaxed">
              <p className="font-bold text-natural-dark mb-1">Conseil</p>
              <p>Le seuil est utilisé pour déclencher l’alerte si une mesure de saturation est saisie.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-natural-border/50 flex items-center justify-between gap-3 flex-wrap bg-natural-bg/30">
        <button
          type="button"
          onClick={() => setDraft(DEFAULT_MEDICAL_SETTINGS)}
          className="px-3.5 py-2 text-xs font-bold rounded-xl border border-natural-border/60 text-natural-secondary hover:text-natural-primary hover:bg-natural-surface transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-natural-border/60 text-natural-secondary hover:text-natural-primary hover:bg-natural-surface transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-natural-primary text-white hover:bg-natural-primary/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            Enregistrer
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`space-y-1.5 rounded-2xl border border-natural-border/60 p-4 bg-natural-surface shadow-sm ${disabled ? "opacity-60" : ""}`}>
      <span className="block text-[10px] font-bold uppercase tracking-wider text-natural-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-natural-border/60 rounded-xl text-sm text-natural-dark focus:outline-none focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary bg-natural-bg/70 shadow-sm disabled:cursor-not-allowed"
        />
        <span className="text-[10px] font-bold text-natural-secondary shrink-0">{suffix}</span>
      </div>
    </label>
  );
}

function ActivityIcon() {
  return <Activity className="h-4 w-4 text-natural-primary" />;
}
