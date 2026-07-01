/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { HeartPulse, ShieldCheck, Plus, Sun, Moon } from "lucide-react";

interface HeaderProps {
  onManualToggle: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}

export default function Header({ onManualToggle, theme, onThemeToggle }: HeaderProps) {
  return (
    <header className="bg-natural-surface border-b border-natural-border shadow-sm sticky top-0 z-40" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-natural-primary text-white rounded-full shadow-md">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-natural-primary tracking-tight flex items-center gap-1.5" id="header-app-title">
              VocalHealth <span className="text-[10px] bg-natural-bg text-natural-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Tension &amp; Pouls</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-natural-secondary hidden sm:block">
              Reconnaissance vocale médicale précise, sécurisée &amp; locale
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-natural-primary bg-natural-bg border border-natural-border px-3 py-1 rounded-full font-semibold">
            <ShieldCheck className="h-4 w-4 text-natural-primary" />
            <span>Données médicales stockées localement en toute sécurité</span>
          </div>
          
          <button
            onClick={onThemeToggle}
            className="p-2 border border-natural-border hover:bg-natural-bg rounded-xl text-natural-primary transition-colors cursor-pointer flex items-center justify-center"
            title={theme === "light" ? "Passer au mode sombre adapté aux yeux" : "Passer au mode clair"}
            id="header-theme-toggle"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <button
            onClick={onManualToggle}
            className="px-3.5 py-1.5 text-xs font-bold border border-natural-border hover:bg-natural-bg rounded-xl text-natural-primary transition-colors flex items-center gap-1.5 cursor-pointer"
            id="header-manual-toggle"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Saisie Manuelle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
