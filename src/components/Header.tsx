import { HeartPulse, Plus, Sun, Moon, Settings2, Camera } from "lucide-react";

interface HeaderProps {
  onManualToggle: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onSettingsToggle: () => void;
  onScanToggle: () => void;
}

export default function Header({ onManualToggle, theme, onThemeToggle, onSettingsToggle, onScanToggle }: HeaderProps) {
  return (
    <header className="bg-linear-to-r from-natural-surface to-natural-card/30 border-b border-natural-border/50 shadow-sm sticky top-0 z-40 backdrop-blur-sm" id="app-header">
      <div className="max-w-[95%] mx-auto px-3 sm:px-4 lg:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-linear-to-br from-natural-primary to-natural-accent text-white rounded-full shadow-md">
            <HeartPulse className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-natural-dark tracking-tight flex items-center gap-1.5" id="header-app-title">
              VocalHealth <span className="text-[9px] bg-linear-to-r from-natural-primary/10 to-natural-accent/10 text-natural-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-natural-primary/20">Médical</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-natural-secondary hidden sm:block font-medium">
              Suivi tension & pouls
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onScanToggle}
            className="p-2 border border-natural-border/50 hover:bg-natural-primary/5 rounded-xl text-natural-primary transition-all cursor-pointer flex items-center justify-center shadow-sm"
            title="Scanner un document"
            id="header-scan-toggle"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onSettingsToggle}
            className="p-2 border border-natural-border/50 hover:bg-natural-primary/5 rounded-xl text-natural-primary transition-all cursor-pointer flex items-center justify-center shadow-sm"
            title="Paramètres médicaux"
            id="header-settings-toggle"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onThemeToggle}
            className="p-2 border border-natural-border/50 hover:bg-natural-primary/5 rounded-xl text-natural-primary transition-all cursor-pointer flex items-center justify-center shadow-sm"
            title={theme === "light" ? "Mode sombre" : "Mode clair"}
            id="header-theme-toggle"
          >
            {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={onManualToggle}
            className="px-3 py-1.5 text-xs font-bold border border-natural-border/50 hover:bg-natural-primary/5 rounded-xl text-natural-primary transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
            id="header-manual-toggle"
          >
            <Plus className="h-3 w-3" />
            <span>Saisie</span>
          </button>
        </div>
      </div>
    </header>
  );
}
