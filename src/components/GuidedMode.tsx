import {
  ArrowRight,
  Check,
  Droplets,
  HeartPulse,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  RotateCcw
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export type GuidedStep = 1 | 2 | 3;

export type GuidedStepCardData = {
  step: GuidedStep;
  label: string;
  value: string;
  placeholder: string;
  icon: LucideIcon;
  disabled: boolean;
};

interface GuidedModeProps {
  step: GuidedStep;
  cards: GuidedStepCardData[];
  liveParsedTension: string;
  liveParsedPulse: string;
  transcript: string;
  supportSpeech: boolean;
  isListening: boolean;
  isAnalyzing: boolean;
  onStepJump: (step: GuidedStep) => void;
  onTranscriptChange: (value: string) => void;
  onValidate: (value: string) => void;
  onSkip: () => void;
  onReset: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
}

export default function GuidedMode({
  step,
  cards,
  liveParsedTension,
  liveParsedPulse,
  transcript,
  supportSpeech,
  isListening,
  isAnalyzing,
  onStepJump,
  onTranscriptChange,
  onValidate,
  onSkip,
  onReset,
  onStartListening,
  onStopListening
}: GuidedModeProps) {
  return (
    <div className="space-y-4">
      <GuidedStepProgress cards={cards} currentStep={step} onStepJump={onStepJump} />

      <div className="overflow-hidden rounded-[30px] border border-natural-border/60 bg-linear-to-br from-white via-natural-card/80 to-natural-bg shadow-inner">
        <GuidedInstructionPanel
          step={step}
          liveParsedTension={liveParsedTension}
          liveParsedPulse={liveParsedPulse}
          transcript={transcript}
          supportSpeech={supportSpeech}
          isListening={isListening}
          isAnalyzing={isAnalyzing}
          onStartListening={onStartListening}
          onStopListening={onStopListening}
        />

        <GuidedTextControls
          step={step}
          transcript={transcript}
          isAnalyzing={isAnalyzing}
          onTranscriptChange={onTranscriptChange}
          onValidate={onValidate}
          onSkip={onSkip}
          onReset={onReset}
        />
      </div>
    </div>
  );
}

interface GuidedStepProgressProps {
  cards: GuidedStepCardData[];
  currentStep: GuidedStep;
  onStepJump: (step: GuidedStep) => void;
}

function GuidedStepProgress({ cards, currentStep, onStepJump }: GuidedStepProgressProps) {
  return (
    <div className="grid grid-cols-1 gap-3 text-sm font-bold sm:grid-cols-3">
      {cards.map((card) => (
        <GuidedStepCard
          key={card.step}
          card={card}
          isActive={currentStep === card.step}
          onStepJump={onStepJump}
        />
      ))}
    </div>
  );
}

interface GuidedStepCardProps {
  card: GuidedStepCardData;
  isActive: boolean;
  onStepJump: (step: GuidedStep) => void;
}

function GuidedStepCard({ card, isActive, onStepJump }: GuidedStepCardProps) {
  const { step, label, value, placeholder, icon: StepIcon, disabled } = card;
  const isDone = Boolean(value);

  return (
    <button
      onClick={() => onStepJump(step)}
      disabled={disabled}
      className={`group relative min-h-30 overflow-hidden rounded-[26px] border p-4 text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive
          ? "border-natural-primary bg-linear-to-br from-white via-natural-card to-emerald-50 text-natural-dark shadow-xl shadow-natural-primary/15 ring-2 ring-natural-primary/10"
          : isDone
          ? "border-emerald-200 bg-linear-to-br from-emerald-50 to-white text-emerald-900 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
          : "border-natural-border/60 bg-white/55 text-natural-secondary hover:border-natural-primary/40 hover:bg-white/80"
      }`}
    >
      <div
        className={`absolute inset-x-4 top-4 h-1 rounded-full transition-all ${
          isActive ? "bg-natural-primary" : isDone ? "bg-emerald-400" : "bg-natural-border/60"
        }`}
      />

      <div className="flex h-full flex-col items-center justify-center gap-3 pt-3 text-center">
        <span
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 transition-all duration-300 ${
            isActive
              ? "border-white bg-natural-primary text-white shadow-lg shadow-natural-primary/25 ring-4 ring-natural-primary/15"
              : isDone
              ? "border-white bg-emerald-500 text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-100"
              : "border-white bg-natural-card text-natural-secondary shadow-md ring-1 ring-natural-border/60"
          }`}
        >
          {isDone ? <Check className="h-7 w-7" /> : <span className="text-lg font-black">{step}</span>}

          <span
            className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ${
              isActive
                ? "bg-white text-natural-primary"
                : isDone
                ? "bg-emerald-50 text-emerald-600"
                : "bg-natural-bg text-natural-secondary"
            }`}
          >
            <StepIcon className="h-3.5 w-3.5" />
          </span>
        </span>

        <div className="min-w-0 space-y-1">
          <span className="block text-sm font-extrabold text-natural-dark">{label}</span>
          <span
            className={`block max-w-full truncate rounded-full px-1 py-0.5 text-xs font-bold ${
              isDone ? "bg-white/80 font-mono text-emerald-700 shadow-inner" : "bg-natural-bg/70 text-natural-secondary/70"
            }`}
          >
            {value || placeholder}
          </span>
        </div>
      </div>
    </button>
  );
}

interface GuidedInstructionPanelProps {
  step: GuidedStep;
  liveParsedTension: string;
  liveParsedPulse: string;
  transcript: string;
  supportSpeech: boolean;
  isListening: boolean;
  isAnalyzing: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

function GuidedInstructionPanel({
  step,
  liveParsedTension,
  liveParsedPulse,
  transcript,
  supportSpeech,
  isListening,
  isAnalyzing,
  onStartListening,
  onStopListening
}: GuidedInstructionPanelProps) {
  return (
    <div className="px-4 pb-4 pt-5 text-center sm:px-5">
      <div className="mx-auto max-w-md space-y-2">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-natural-primary/10 text-natural-primary">
          {step === 1 && <Droplets className="h-5 w-5" />}
          {step === 2 && <HeartPulse className="h-5 w-5" />}
          {step === 3 && <MessageSquare className="h-5 w-5" />}
        </span>

        <h3 className="flex min-h-7 items-center justify-center gap-1.5 text-base font-extrabold text-natural-dark">
          {step === 1 && (
            <>
              {liveParsedTension ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-lg text-emerald-700 ring-1 ring-emerald-100">
                  {liveParsedTension}
                </span>
              ) : (
                "Tension : parlez ou saisissez"
              )}
            </>
          )}
          {step === 2 && (
            <>
              {liveParsedPulse ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-mono text-lg text-emerald-700 ring-1 ring-emerald-100">
                  {liveParsedPulse} bpm
                </span>
              ) : (
                "Pouls : parlez ou saisissez"
              )}
            </>
          )}
          {step === 3 && (
            <>
              {transcript ? (
                <span className="line-clamp-2 rounded-2xl bg-emerald-50 px-3 py-1 text-sm italic text-emerald-700 ring-1 ring-emerald-100">
                  "{transcript}"
                </span>
              ) : (
                "Commentaire : parlez ou saisissez"
              )}
            </>
          )}
        </h3>

        <p className="text-sm leading-relaxed text-natural-secondary">
          {step === 1 && "Dites deux chiffres ou nombres. Ex: '12 8', '120 sur 80', ou tapez-les."}
          {step === 2 && "Dites votre rythme cardiaque. Ex: '72 battements', 'soixante-quinze', ou tapez-le."}
          {step === 3 && "Dites votre forme générale, ex : 'bien', 'fatigué', ou 'aucun' pour passer."}
        </p>
      </div>

      {supportSpeech && (
        <GuidedMicButton
          isListening={isListening}
          isAnalyzing={isAnalyzing}
          onStartListening={onStartListening}
          onStopListening={onStopListening}
        />
      )}
    </div>
  );
}

interface GuidedMicButtonProps {
  isListening: boolean;
  isAnalyzing: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

function GuidedMicButton({ isListening, isAnalyzing, onStartListening, onStopListening }: GuidedMicButtonProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 pt-4">
      <div className="relative">
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-natural-primary/20"
                initial={{ scale: 0.85, opacity: 0.55 }}
                animate={{ scale: 1.65, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-natural-primary/30"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.95, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
              />
            </>
          )}
        </AnimatePresence>

        <button
          onClick={isListening ? onStopListening : onStartListening}
          disabled={isAnalyzing}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-natural-primary/20 disabled:opacity-50 ${
            isListening ? "bg-rose-500 shadow-rose-200" : "bg-natural-primary shadow-emerald-200 hover:bg-[#047857]"
          }`}
        >
          {isListening ? (
            <MicOff className="h-8 w-8 animate-pulse" />
          ) : isAnalyzing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>
      </div>

      <span className="text-center text-xs font-extrabold uppercase tracking-wide text-natural-primary">
        {isListening ? "Le micro vous écoute... parlez naturellement" : "Cliquez sur le micro pour parler"}
      </span>
    </div>
  );
}

interface GuidedTextControlsProps {
  step: GuidedStep;
  transcript: string;
  isAnalyzing: boolean;
  onTranscriptChange: (value: string) => void;
  onValidate: (value: string) => void;
  onSkip: () => void;
  onReset: () => void;
}

function GuidedTextControls({
  step,
  transcript,
  isAnalyzing,
  onTranscriptChange,
  onValidate,
  onSkip,
  onReset
}: GuidedTextControlsProps) {
  const placeholder =
    step === 1
      ? "Ex: 12 8 ou 120 80"
      : step === 2
      ? "Ex: 72 ou 85"
      : "Saisissez ou dites un commentaire (ou 'aucun')";

  return (
    <div className="border-t border-natural-border/60 bg-white/65 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onValidate(transcript);
            }
          }}
          placeholder={placeholder}
          className="min-h-11 flex-1 rounded-2xl border border-natural-border bg-natural-surface px-4 py-2 text-center font-mono text-sm font-bold tracking-wide text-natural-primary shadow-inner outline-none transition-all placeholder:text-natural-secondary/45 focus:border-natural-primary focus:ring-2 focus:ring-natural-primary/15"
          disabled={isAnalyzing}
        />

        <button
          onClick={() => onValidate(transcript)}
          disabled={isAnalyzing || !transcript.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-natural-primary px-5 text-xs font-extrabold text-white shadow-lg shadow-natural-primary/15 transition-all hover:bg-[#047857] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
          title="Étape suivante"
        >
          <span>Valider</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-bold text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700"
          title="Recommencer l'assistant du début"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Recommencer</span>
        </button>

        <button
          onClick={onSkip}
          className="rounded-full px-3 py-1 text-xs font-bold text-natural-primary transition-all hover:bg-natural-primary/10"
        >
          Passer
        </button>
      </div>
    </div>
  );
}
