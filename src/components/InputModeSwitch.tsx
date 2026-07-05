import { Mic, Sparkles } from "lucide-react";

export type InputMode = "guided" | "free";

interface InputModeSwitchProps {
  value: InputMode;
  onChange: (mode: InputMode) => void;
}

const modes = [
  {
    value: "guided" as const,
    label: "Pas à pas",
    caption: "Guidage séquentiel",
    icon: Sparkles
  },
  {
    value: "free" as const,
    label: "Mode libre",
    caption: "Une seule dictée",
    icon: Mic
  }
];

export default function InputModeSwitch({ value, onChange }: InputModeSwitchProps) {
  return (
    <div className="inline-flex gap-1 rounded-2xl border border-natural-border/60 bg-white/85 p-0.5 shadow-[0_10px_24px_rgba(15,118,110,0.10)] ring-1 ring-white/70">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={`min-w-[7.6rem] rounded-[0.9rem] px-3 py-2 text-left transition-all duration-300 ${
              isActive
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span className="text-sm font-extrabold leading-none">{mode.label}</span>
            </span>
            <span
              className={`mt-1 block pl-6 text-[0.48rem] font-extrabold uppercase tracking-[0.08em] leading-none ${
                isActive ? "text-white/85" : "text-slate-500/90"
              }`}
            >
              {mode.caption}
            </span>
          </button>
        );
      })}
    </div>
  );
}
