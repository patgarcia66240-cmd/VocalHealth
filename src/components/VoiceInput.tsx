import { useState } from "react";
import { Mic, MicOff, Loader2, Sparkles, AlertCircle, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ParsedVoiceResult } from "../types";
import GuidedMode from "./GuidedMode";
import InputModeSwitch from "./InputModeSwitch";
import type { InputMode } from "./InputModeSwitch";
import { getAiProviderName, parseMeasurements } from "../services/measurementApi";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useVoiceProvider } from "../hooks/useVoiceProvider";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useGuidedVoiceFlow } from "../hooks/useGuidedVoiceFlow";
interface VoiceInputProps {

  onParsedResult: (result: ParsedVoiceResult) => void;

  onStatusChange: (status: string | null) => void;

}



export default function VoiceInput({ onParsedResult, onStatusChange }: VoiceInputProps) {

  // Modes: "guided" (step-by-step assistant) or "free" (dictate everything at once)

  const [inputMode, setInputMode] = useState<InputMode>("guided");

  

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isMuted, setIsMuted, speakInstructions, cancelSpeech } = useSpeechSynthesis();
  const { selectedProvider, setSelectedProvider } = useVoiceProvider();
  const {
    isListening,
    transcript,
    supportSpeech,
    setTranscript,
    startListening: startSpeechRecognition,
    stopRecognition,
  } = useSpeechRecognition({ onError: setError, onStatusChange });

  const startListening = () => {
    setError(null);
    startSpeechRecognition(inputMode === "guided" ? `Écoute Étape ${guidedStep}...` : "Écoute en cours...");
  };

  const analyzeTranscriptWithAI = async (textToParse: string) => {
    setIsAnalyzing(true);
    setError(null);
    const providerName = getAiProviderName(selectedProvider);
    onStatusChange(`Analyse intelligente par ${providerName} AI...`);

    try {
      const result = await parseMeasurements(textToParse, selectedProvider);
      onParsedResult(result);
      speakInstructions("Mesures analysées avec succès. Veuillez relire et sauvegarder.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la communication avec l'analyseur.");
      throw err;
    } finally {
      setIsAnalyzing(false);
      onStatusChange(null);
    }
  };

  const {
    guidedStep,
    guidedStepCards,
    liveParsedTension,
    liveParsedPulse,
    clearGuidedValues,
    validateGuidedValue,
    skipOrNone,
    resetGuidedMode,
    jumpToStep,
  } = useGuidedVoiceFlow({
    inputMode,
    isListening,
    transcript,
    setTranscript,
    startListening,
    stopRecognition,
    speakInstructions,
    analyzeTranscript: analyzeTranscriptWithAI,
    setError,
  });

  const handleValidateValue = (value: string) => {
    if (inputMode === "guided") {
      validateGuidedValue(value);
      return;
    }

    if (value.trim()) {
      void analyzeTranscriptWithAI(value);
    }
  };

  const stopListening = (shouldProcess: boolean = true) => {
    stopRecognition();

    if (shouldProcess) {
      handleValidateValue(transcript.trim());
    }
  };

  const handleSkipOrNone = skipOrNone;
  const handleStepJump = jumpToStep;
  return (

    <div className="bg-linear-to-br from-natural-surface to-natural-card/30 rounded-[28px] border border-natural-border/50 p-5 shadow-lg shadow-natural-primary/5 flex flex-col gap-4 backdrop-blur-sm" id="voice-input-container">

      

      {/* Upper header controls */}

      <div className="grid grid-cols-1 gap-4 border-b border-natural-border/60 pb-4 lg:grid-cols-[max-content_minmax(0,1fr)] lg:items-center">

       
        {/* Mode switcher and Mute button */}

        <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-self-end lg:justify-end lg:items-center lg:flex-nowrap">

          <label className="relative flex-none lg:shrink-0">

            <span className="sr-only">Sélectionner le moteur d'analyse IA</span>

            <select

              value={selectedProvider}

              onChange={(e) => {

                const prov = e.target.value as "gemini" | "openai" | "mistral" | "qwen";

                setSelectedProvider(prov);

                const provName = prov === 'gemini' ? 'Gemini' : prov === 'openai' ? 'OpenAI' : prov === 'mistral' ? 'Mistral' : 'Qwen';

                speakInstructions(`Moteur ${provName} activé.`);

              }}

              className="h-11 w-[8.2rem] appearance-none rounded-2xl border border-natural-border/60 bg-linear-to-br from-natural-card to-natural-bg px-3.5 pr-9 text-xs font-bold text-natural-dark shadow-sm outline-none transition-all hover:shadow-md focus:border-natural-primary focus:ring-2 focus:ring-natural-primary/15"

              title="Sélectionner le moteur d'analyse IA"

            >

              <option value="gemini">Gemini</option>

              <option value="openai">OpenAI</option>

              <option value="mistral">Mistral</option>

              <option value="qwen">Qwen</option>

            </select>

            

          </label>



          {/* Mute/Unmute voice guidance */}

          <button

            onClick={() => {

              const nextMuted = !isMuted;

              setIsMuted(nextMuted);

              if (!nextMuted) {

                if (inputMode === "guided") {

                  speakInstructions(

                    guidedStep === 1

                      ? "Veuillez dicter votre tension."

                      : guidedStep === 2

                      ? "Veuillez dicter votre pouls."

                      : "Veuillez dicter un commentaire."

                  );

                }

              } else {

                cancelSpeech();

              }

            }}

            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-natural-border/60 bg-linear-to-br from-natural-card to-natural-bg text-natural-primary shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex-none"

            title={isMuted ? "Activer l'aide vocale" : "Couper l'aide vocale"}

          >

            {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}

          </button>



          <InputModeSwitch
            value={inputMode}
            onChange={(mode) => {
              setInputMode(mode);
              setTranscript("");

              if (mode === "guided") {
                clearGuidedValues();
                speakInstructions("Mode pas a pas activé. Veuillez dicter votre tension.");
              } else {
                speakInstructions("Mode libre activé. Dites votre tension, pouls et remarques d'une seule traite.");
              }
            }}
          />

        </div>

      </div>



      {!supportSpeech && (

        <div className="p-4 bg-amber-50/50 border border-amber-100 text-amber-800 rounded-2xl text-xs flex gap-3">

          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />

          <div>

            <p className="font-bold">Saisie clavier assistée</p>

            <p className="text-amber-700 mt-1 leading-relaxed">

              Le microphone n'est pas activable. Entrez vos valeurs directement ci-dessous, elles seront nettoyées et converties automatiquement.

            </p>

          </div>

        </div>

      )}



      {/* Main Mode GUI */}

      {inputMode === "guided" ? (

        <GuidedMode

          step={guidedStep}

          cards={guidedStepCards}

          liveParsedTension={liveParsedTension}

          liveParsedPulse={liveParsedPulse}

          transcript={transcript}

          supportSpeech={supportSpeech}

          isListening={isListening}

          isAnalyzing={isAnalyzing}

          onStepJump={handleStepJump}

          onTranscriptChange={setTranscript}

          onValidate={handleValidateValue}

          onSkip={handleSkipOrNone}

          onReset={resetGuidedMode}

          onStartListening={startListening}

          onStopListening={() => stopListening(true)}

        />

      ) : (

        /* Free Mode GUI */

        <div className="space-y-3">

          <div className="flex flex-col items-center py-2 bg-natural-bg/25 border border-natural-border/50 rounded-2xl p-3">

            <div className="relative flex items-center justify-center">

              <AnimatePresence>

                {isListening && (

                  <motion.div

                    className="absolute inset-0 bg-natural-primary opacity-15 rounded-full"

                    initial={{ scale: 0.8, opacity: 0.4 }}

                    animate={{ scale: 1.8, opacity: 0 }}

                    exit={{ opacity: 0 }}

                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}

                  />

                )}

              </AnimatePresence>



              <button

                onClick={isListening ? () => stopListening(true) : startListening}

                disabled={isAnalyzing}

                className={`relative z-10 h-20 w-20 rounded-full flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95 focus:outline-none cursor-pointer ${

                  isListening ? "bg-rose-500 shadow-rose-200" : "bg-natural-primary hover:bg-[#047857] shadow-emerald-200"

                } disabled:opacity-50`}

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



            <div className="mt-5 text-center">

              <p className="font-bold text-natural-primary text-sm">

                {isListening ? "Nous vous écoutons..." : isAnalyzing ? "Extraction intelligente..." : "Mode libre de dictée"}

              </p>

              <p className="text-sm text-natural-secondary mt-1.5 max-w-xs mx-auto leading-relaxed">

                {isListening

                  ? "Cliquez de nouveau pour analyser votre message complet."

                  : 'Ex : "Tension 12 8, pouls à 74, tout va bien ce matin."'}

              </p>

            </div>



            {(transcript || isAnalyzing) && (

              <div className="w-full mt-5 bg-white border border-natural-border rounded-2xl p-4 relative shadow-inner">

                <span className="absolute top-2.5 right-3 text-xs uppercase tracking-wider text-natural-secondary font-bold font-mono">

                  Texte capturé

                </span>

                <p className="text-xs text-natural-dark pr-12 italic leading-relaxed">

                  {transcript || (isAnalyzing && "Analyse globale par Gemini...")}

                </p>

              </div>

            )}

          </div>



          {/* Written backup entry */}

          <div className="space-y-1.5">

            <label className="text-xs font-bold text-natural-secondary uppercase tracking-widest block">

              Saisie directe :

            </label>

            <textarea

              className="w-full min-h-15 text-xs p-2 border border-natural-border rounded-xl focus:ring-1 focus:ring-natural-primary focus:border-natural-primary text-natural-dark bg-natural-bg/25"

              placeholder="Écrivez votre phrase ici (Ex: 120 80 pouls 75 en forme) puis cliquez sur Analyser"

              value={transcript}

              onChange={(e) => setTranscript(e.target.value)}

              disabled={isListening || isAnalyzing}

            />

            <button

              onClick={() => analyzeTranscriptWithAI(transcript)}

              disabled={isListening || isAnalyzing || !transcript.trim()}

              className="w-full py-1.5 px-3 bg-natural-primary hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"

            >

              {isAnalyzing ? (

                <>

                  <Loader2 className="h-3 w-3 animate-spin" />

                  <span>Analyse...</span>

                </>

              ) : (

                <>

                  <Sparkles className="h-3 w-3 text-natural-accent" />

                  <span>Analyser</span>

                </>

              )}

            </button>

          </div>

        </div>

      )}



      {error && (

        <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs flex gap-2" id="voice-error-banner">

          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />

          <p>{error}</p>

        </div>

      )}



    </div>

  );

}

















