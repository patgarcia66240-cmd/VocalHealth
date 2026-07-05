import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw } from "lucide-react";
import { MedicalAlertInfo } from "../utils";

interface AppAlertsProps {
  statusMessage: string | null;
  saveAlert: MedicalAlertInfo | null;
  onAlertClose: () => void;
}

export default function AppAlerts({ statusMessage, saveAlert, onAlertClose }: AppAlertsProps) {
  return (
    <AnimatePresence>
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-linear-to-r from-natural-primary to-natural-accent text-white text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-natural-primary/20 flex items-center gap-2 justify-center font-semibold tracking-wide"
          id="app-status-bar"
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>{statusMessage}</span>
        </motion.div>
      )}

      {saveAlert && saveAlert.hasAlert && (
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          className={`p-4 rounded-lg border flex gap-3 relative overflow-hidden transition-all shadow-lg ${
            saveAlert.type === "danger"
              ? "bg-rose-50 border-rose-200 text-rose-950"
              : "bg-amber-50 border-amber-200 text-amber-950"
          }`}
          id="save-medical-alert-banner"
        >
          <div className="mt-0.5 shrink-0 p-2 rounded-lg bg-white/80">
            {saveAlert.type === "danger" ? (
              <ShieldAlert className="h-5 w-5 text-rose-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div className="space-y-2 pr-8 flex-1">
            <h4 className="text-sm font-bold flex flex-wrap items-center gap-2">
              <span>Alerte médicale</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                saveAlert.type === "danger" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
              }`}>
                {saveAlert.type === "danger" ? "Urgent" : "Attention"}
              </span>
            </h4>
            <p className="text-sm font-medium">Valeurs hors recommandations :</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {saveAlert.messages.map((msg: string, idx: number) => (
                <li key={idx} className="leading-relaxed">{msg}</li>
              ))}
            </ul>
            <div className="text-xs leading-relaxed text-natural-secondary/70 border-t border-natural-border/30 pt-2 mt-2">
              <strong>Recommandations :</strong>
              <ul className="list-decimal pl-4 mt-1 space-y-0.5">
                <li>Asseyez-vous confortablement, dos soutenu</li>
                <li>Respirez lentement (inspiration 4s, expiration 6s)</li>
                <li>Évitez café, thé, alcool, tabac</li>
                <li>Prenez une nouvelle mesure après 5 min de calme</li>
              </ul>
              <p className="mt-1 text-xs italic opacity-80">
                *Cet assistant ne remplace pas un avis médical.
              </p>
            </div>
          </div>

          <button
            onClick={onAlertClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white rounded-lg transition-colors text-natural-secondary hover:text-natural-dark"
            title="Fermer (Escape)"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
