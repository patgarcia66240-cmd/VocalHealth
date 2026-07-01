/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Info } from "lucide-react";

export default function VoiceTips() {
  return (
    <div className="bg-gradient-to-br from-natural-card/50 to-natural-bg/30 text-natural-dark p-4 rounded-2xl border border-natural-border/50 shadow-md space-y-3 backdrop-blur-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-natural-dark flex items-center gap-1.5">
        <Info className="h-4 w-4 text-natural-primary" />
        Conseils d'utilisation
      </h3>
      <p className="text-[11px] text-natural-secondary leading-relaxed font-medium">
        Parlez naturellement en français. L'IA Gemini extrait automatiquement vos constantes.
      </p>
      <ul className="space-y-2 text-[11px] font-sans text-natural-dark bg-white/60 p-3 rounded-xl border border-natural-border/40 shadow-inner">
        <li className="flex items-start gap-2">
          <span className="text-natural-primary">•</span>
          <span>"Tension 12 8 avec pouls à 72"</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-natural-primary">•</span>
          <span>"134 sur 85, pouls 68 fatigué"</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-natural-primary">•</span>
          <span>"Systolique 125, diastolique 80, pouls 75"</span>
        </li>
      </ul>
      <div className="flex items-center gap-1.5 text-[9px] text-natural-primary bg-natural-primary/5 px-2 py-1.5 rounded-lg border border-natural-primary/10">
        <span className="font-bold">💡</span>
        <span className="font-medium">Conversion automatique par IA</span>
      </div>
    </div>
  );
}
