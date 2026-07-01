/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Info } from "lucide-react";

export default function VoiceTips() {
  return (
    <div className="bg-natural-card text-natural-dark p-6 rounded-[32px] border border-natural-border shadow-sm space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-natural-primary flex items-center gap-1.5">
        <Info className="h-4 w-4 text-natural-primary" />
        Comment parler au micro ?
      </h3>
      <p className="text-[11px] text-natural-secondary leading-relaxed">
        Appuyez sur le gros micro et dictez vos données de manière naturelle en français. Par exemple :
      </p>
      <ul className="space-y-1.5 text-[11px] font-mono text-natural-primary bg-white p-3 rounded-2xl border border-natural-border shadow-inner">
        <li>• "Tension 12 8 avec pouls à 72"</li>
        <li>• "Tension 134 sur 85, pouls 68 fatigué le matin"</li>
        <li>• "Ma systolique est de 125, ma diastolique de 80, pouls 75"</li>
      </ul>
      <p className="text-[10px] text-natural-secondary leading-relaxed">
        L'IA Gemini se charge de normaliser et de structurer intelligemment vos propos dans la feuille de calcul.
      </p>
    </div>
  );
}
