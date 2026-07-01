/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export default function Footer() {
  return (
    <footer className="bg-natural-surface border-t border-natural-border mt-12 py-6 text-center text-xs text-natural-secondary" id="app-footer-layout">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} VocalHealth. Conçu pour un suivi médical personnel, rapide et sans compromis sur la vie privée.</p>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span>Statut : Sécurisé</span>
          <span>•</span>
          <span>Sauvegarde locale cryptée</span>
        </div>
      </div>
    </footer>
  );
}
