import { useState, useEffect, useRef } from "react";

import {

  Mic,

  MicOff,

  Loader2,

  Sparkles,

  AlertCircle,

  Volume2,

  VolumeX,

  Droplets,

  HeartPulse,

  MessageSquare

} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

import { ParsedVoiceResult } from "../types";

import GuidedMode from "./GuidedMode";

import type { GuidedStep, GuidedStepCardData } from "./GuidedMode";

import InputModeSwitch from "./InputModeSwitch";

import type { InputMode } from "./InputModeSwitch";



interface VoiceInputProps {

  onParsedResult: (result: ParsedVoiceResult) => void;

  onStatusChange: (status: string | null) => void;

}



// Helper to convert spoken French words to digit representations

function parseFrenchToNumbers(text: string): string {

  if (!text) return "";

  let clean = text.toLowerCase();

  

  // Replace common symbols/separators

  clean = clean.replace(/\bsur\b/g, " ");

  clean = clean.replace(/\bvirgule\b/g, ".");

  clean = clean.replace(/-et-/g, " ");

  clean = clean.replace(/-et\b/g, " ");

  clean = clean.replace(/\bet\b/g, " ");

  clean = clean.replace(/-/g, " ");



  const replacements: [string, string][] = [

    ["quatre vingt seize", "96"],

    ["quatre-vingt-seize", "96"],

    ["quatre vingt quinze", "95"],

    ["quatre-vingt-quinze", "95"],

    ["quatre vingt quatorze", "94"],

    ["quatre-vingt-quatorze", "94"],

    ["quatre vingt treize", "93"],

    ["quatre-vingt-treize", "93"],

    ["quatre vingt douze", "92"],

    ["quatre-vingt-douze", "92"],

    ["quatre vingt onze", "91"],

    ["quatre-vingt-onze", "91"],

    ["quatre vingt dix", "90"],

    ["quatre-vingt-dix", "90"],

    ["quatre vingt neuf", "89"],

    ["quatre-vingt-neuf", "89"],

    ["quatre vingt huit", "88"],

    ["quatre-vingt-huit", "88"],

    ["quatre vingt sept", "87"],

    ["quatre-vingt-sept", "87"],

    ["quatre vingt six", "86"],

    ["quatre-vingt-six", "86"],

    ["quatre vingt cinq", "85"],

    ["quatre-vingt-cinq", "85"],

    ["quatre vingt quatre", "84"],

    ["quatre-vingt-quatre", "84"],

    ["quatre vingt trois", "83"],

    ["quatre-vingt-trois", "83"],

    ["quatre vingt deux", "82"],

    ["quatre-vingt-deux", "82"],

    ["quatre vingt un", "81"],

    ["quatre-vingt-un", "81"],

    ["quatre vingt", "80"],

    ["quatre-vingt", "80"],

    ["soixante seize", "76"],

    ["soixante-seize", "76"],

    ["soixante quinze", "75"],

    ["soixante-quinze", "75"],

    ["soixante quatorze", "74"],

    ["soixante-quatorze", "74"],

    ["soixante treize", "73"],

    ["soixante-treize", "73"],

    ["soixante douze", "72"],

    ["soixante-douze", "72"],

    ["soixante dix", "70"],

    ["soixante-dix", "70"],

    ["dix sept", "17"],

    ["dix-sept", "17"],

    ["dix huit", "18"],

    ["dix-huit", "18"],

    ["dix neuf", "19"],

    ["dix-neuf", "19"],

    ["vingt et un", "21"],

    ["vingt-et-un", "21"],

    ["trente et un", "31"],

    ["trente-et-un", "31"],

    ["quarante et un", "41"],

    ["quarante-et-un", "41"],

    ["cinquante et un", "51"],

    ["cinquante-et-un", "51"],

    ["soixante et un", "61"],

    ["soixante-et-un", "61"],

    ["cent vingt", "120"],

    ["cent trente", "130"],

    ["cent quarante", "140"],

    ["cent cinquante", "150"],

    ["cent soixante", "160"],

    ["vingt", "20"],

    ["trente", "30"],

    ["quarante", "40"],

    ["cinquante", "50"],

    ["soixante", "60"],

    ["cent", "100"],

    ["seize", "16"],

    ["quinze", "15"],

    ["quatorze", "14"],

    ["treize", "13"],

    ["douze", "12"],

    ["onze", "11"],

    ["dix", "10"],

    ["neuf", "9"],

    ["huit", "8"],

    ["sept", "7"],

    ["six", "6"],

    ["cinq", "5"],

    ["quatre", "4"],

    ["trois", "3"],

    ["deux", "2"],

    ["un", "1"],

    ["une", "1"],

    ["zéro", "0"],

    ["zero", "0"]

  ];



  for (const [word, digit] of replacements) {

    const regex = new RegExp(`\\b${word}\\b`, 'g');

    clean = clean.replace(regex, digit);

  }



  return clean;

}



// Extractor of digits only, formatted nicely

function cleanInputToDigits(val: string, step: 1 | 2): string {

  if (!val) return "";

  

  // First, map French spoken numbers to actual digits

  const withDigits = parseFrenchToNumbers(val);

  

  // Now, extract all sequences of digits from the text

  const digits = withDigits.match(/\d+/g);

  

  if (!digits || digits.length === 0) return "";

  

  if (step === 1) {

    // For tension (blood pressure), we expect Systolic and Diastolic

    if (digits.length >= 2) {

      return `${digits[0]}/${digits[1]}`;

    } else {

      // If a single number is typed or spoken (e.g., 128)

      const single = digits[0];

      if (single.length >= 3) {

        if (single.length === 3) {

          return `${single.slice(0, 2)}/${single.slice(2)}`;

        } else if (single.length === 4) {

          return `${single.slice(0, 2)}/${single.slice(2)}`;

        }

      }

      return single;

    }

  } else {

    // For pulse, only expect a single number

    return digits[0];

  }

}



export default function VoiceInput({ onParsedResult, onStatusChange }: VoiceInputProps) {

  // Modes: "guided" (step-by-step assistant) or "free" (dictate everything at once)

  const [inputMode, setInputMode] = useState<InputMode>("guided");

  

  // Guided Mode steps state - now strictly storing cleaned numeric digits only

  const [guidedStep, setGuidedStep] = useState<GuidedStep>(1);

  const [guidedTension, setGuidedTension] = useState("");

  const [guidedPulse, setGuidedPulse] = useState("");

  const [guidedRemarks, setGuidedRemarks] = useState("");

  

  // Speech engine state

  const [isListening, setIsListening] = useState(false);

  const [transcript, setTranscript] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [supportSpeech, setSupportSpeech] = useState(true);

  const [isMuted, setIsMuted] = useState(false);

  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "openai" | "mistral" | "qwen">(() => {

    const saved = localStorage.getItem("selected_ai_provider");

    if (saved === "gemini" || saved === "openai" || saved === "mistral" || saved === "qwen") {

      return saved;

    }

    return "gemini";

  });



  useEffect(() => {

    localStorage.setItem("selected_ai_provider", selectedProvider);

  }, [selectedProvider]);

  

  const recognitionRef = useRef<any>(null);



  useEffect(() => {

    // Check for speech recognition support in the browser

    const SpeechRecognition =

      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;



    if (!SpeechRecognition) {

      setSupportSpeech(false);

    }



    // Message vocal de bienvenue désactivé - l'utilisateur peut activer l'aide vocale manuellement

  }, []);



  // Text-To-Speech guidance helper with an optional callback to start listening again

  const speakInstructions = (text: string, onEnd?: () => void) => {

    if (isMuted || !("speechSynthesis" in window)) {

      if (onEnd) {

        // If muted or not supported, wait a minimal safe moment then trigger callback

        setTimeout(onEnd, 1000);

      }

      return;

    }

    try {

      window.speechSynthesis.cancel();

      const utterance = new SynthesisUtteranceCopy(text);

      utterance.lang = "fr-FR";

      utterance.rate = 1.05;

      if (onEnd) {

        let called = false;

        const handleEnd = () => {

          if (!called) {

            called = true;

            // Introduce a 1200ms cushion pause after TTS stops before opening the mic

            setTimeout(onEnd, 1200);

          }

        };

        utterance.onend = handleEnd;

        utterance.onerror = handleEnd;

        // Safety timeout of 15 seconds to prevent getting stuck if onend never fires

        setTimeout(handleEnd, 15000);

      }

      window.speechSynthesis.speak(utterance);

    } catch (e) {

      // Fallback

      try {

        const fallbackUtterance = new SpeechSynthesisUtterance(text);

        fallbackUtterance.lang = "fr-FR";

        fallbackUtterance.rate = 1.05;

        if (onEnd) {

          let called = false;

          const handleEnd = () => {

            if (!called) {

              called = true;

              setTimeout(onEnd, 1200);

            }

          };

          fallbackUtterance.onend = handleEnd;

          fallbackUtterance.onerror = handleEnd;

          setTimeout(handleEnd, 15000);

        }

        window.speechSynthesis.speak(fallbackUtterance);

      } catch (err) {

        console.error("TTS failed:", err);

        if (onEnd) onEnd();

      }

    }

  };



  // Keep a clean copy reference to avoid TS problems with speechSynthesis

  const SynthesisUtteranceCopy = (window as any).SpeechSynthesisUtterance || SpeechSynthesisUtterance;



  const startListening = () => {

    setError(null);

    setTranscript("");

    onStatusChange(inputMode === "guided" ? `Écoute Étape ${guidedStep}...` : "Écoute en cours...");



    const SpeechRecognition =

      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

 

    if (!SpeechRecognition) {

      setError("La reconnaissance vocale n'est pas supportée par votre navigateur.");

      return;

    }



    try {

      const rec = new SpeechRecognition();

      rec.lang = "fr-FR";

      rec.continuous = true;

      rec.interimResults = true;



      rec.onstart = () => {

        setIsListening(true);

      };



      rec.onresult = (event: any) => {

        let fullTranscript = "";

        for (let i = 0; i < event.results.length; ++i) {

          if (event.results[i].isFinal || i === event.results.length - 1) {

            fullTranscript += event.results[i][0].transcript;

          }

        }

        setTranscript(fullTranscript);

      };



      rec.onerror = (event: any) => {

        console.error("Erreur de reconnaissance vocale :", event.error);

        if (event.error === "not-allowed") {

          setError("Accès au microphone refusé. Veuillez autoriser l'accès.");

        } else {

          setError(`Erreur vocale : ${event.error}`);

        }

        stopListening(false);

      };



      rec.onend = () => {

        setIsListening(false);

      };



      recognitionRef.current = rec;

      rec.start();

    } catch (e: any) {

      setError(`Erreur lors du démarrage du micro : ${e.message}`);

      setIsListening(false);

      onStatusChange(null);

    }

  };



  const stopListening = (shouldProcess: boolean = true) => {

    if (recognitionRef.current) {

      recognitionRef.current.stop();

    }

    setIsListening(false);

    onStatusChange(null);



    if (shouldProcess) {

      const spokenText = transcript.trim();

      handleValidateValue(spokenText);

    }

  };



  // Real-time voice transition effect (making steps fluid and auto-advancing on numbers detected)

  useEffect(() => {

    if (inputMode !== "guided" || !isListening || !transcript.trim()) return;



    if (guidedStep === 1) {

      const parsedValue = cleanInputToDigits(transcript, 1);

      // If we have a fully detected tension, e.g. "12/8" or "120/80"

      if (parsedValue.includes("/") && parsedValue.split("/")[1] !== "") {

        // Stop listening immediately to stop recording

        if (recognitionRef.current) {

          recognitionRef.current.stop();

        }

        setIsListening(false);



        const timer = setTimeout(() => {

          // Auto-advance step!

          setGuidedTension(parsedValue);

          setGuidedStep(2);

          setTranscript("");

          

          speakInstructions(

            `Tension enregistrée : ${parsedValue.replace("/", " sur ")}. Veuillez dicter votre pouls.`,

            () => {

              setTranscript("");

              startListening();

            }

          );

        }, 800); // Debounce of silence/completed speaking



        return () => clearTimeout(timer);

      }

    } else if (guidedStep === 2) {

      const parsedValue = cleanInputToDigits(transcript, 2);

      const pulseNum = parseInt(parsedValue, 10);

      if (!isNaN(pulseNum) && pulseNum >= 35 && pulseNum <= 220) {

        // Stop listening immediately to prevent recording synthesized speech or extra comments

        if (recognitionRef.current) {

          recognitionRef.current.stop();

        }

        setIsListening(false);



        const timer = setTimeout(() => {

          // Auto-advance step!

          setGuidedPulse(parsedValue);

          setGuidedStep(3);

          setTranscript("");

          

          speakInstructions(

            `Pouls enregistré : ${parsedValue}. Veuillez enfin dicter vos commentaires, ou dites aucun.`,

            () => {

              setTranscript("");

              startListening();

            }

          );

        }, 800); // Debounce



        return () => clearTimeout(timer);

      }

    } else if (guidedStep === 3) {

      const cleanLower = transcript.trim().toLowerCase();

      if (cleanLower === "aucun" || cleanLower === "rien" || cleanLower === "pas de commentaire") {

        const timer = setTimeout(() => {

          setGuidedRemarks("Aucun");

          setTranscript("");

          if (recognitionRef.current) {

            recognitionRef.current.stop();

          }

          setIsListening(false);

          const combinedText = `Tension: ${guidedTension}. Pouls: ${guidedPulse}. Commentaire: Aucun.`;

          analyzeTranscriptWithAI(combinedText);

        }, 800);

        return () => clearTimeout(timer);

      } else if (transcript.trim().length > 4) {

        // If they said a sentence, auto-submit after a comfortable 2.5 seconds pause

        const timer = setTimeout(() => {

          const finalRemarks = transcript.trim();

          setGuidedRemarks(finalRemarks);

          setTranscript("");

          if (recognitionRef.current) {

            recognitionRef.current.stop();

          }

          setIsListening(false);

          const combinedText = `Tension: ${guidedTension}. Pouls: ${guidedPulse}. Commentaire: ${finalRemarks}.`;

          analyzeTranscriptWithAI(combinedText);

        }, 2200);

        return () => clearTimeout(timer);

      }

    }

  }, [transcript, isListening, guidedStep, inputMode, guidedTension, guidedPulse]);



  const handleValidateValue = (value: string) => {

    if (inputMode === "guided") {

      if (!value.trim()) {

        setError("Veuillez dicter ou saisir la valeur avant de continuer.");

        return;

      }



      setError(null);

      if (guidedStep === 1) {

        const parsedTension = cleanInputToDigits(value, 1);

        if (!parsedTension) {

          setError("Tension incorrecte. Exemples : '12 8' ou '120 80'.");

          return;

        }



        // Stop microphone

        if (recognitionRef.current) {

          recognitionRef.current.stop();

        }

        setIsListening(false);



        setGuidedTension(parsedTension);

        setGuidedStep(2);

        setTranscript("");



        speakInstructions("Tension enregistrée. Veuillez dicter votre pouls.", () => {

          setTranscript("");

          startListening();

        });

      } else if (guidedStep === 2) {

        const parsedPulse = cleanInputToDigits(value, 2);

        if (!parsedPulse) {

          setError("Pouls incorrect. Exemple : '72' ou '80'.");

          return;

        }



        // Stop microphone

        if (recognitionRef.current) {

          recognitionRef.current.stop();

        }

        setIsListening(false);



        setGuidedPulse(parsedPulse);

        setGuidedStep(3);

        setTranscript("");



        speakInstructions("Pouls enregistré. Dictez un commentaire éventuel, ou dites : aucun.", () => {

          setTranscript("");

          startListening();

        });

      } else if (guidedStep === 3) {

        const comment = value.trim();

        setGuidedRemarks(comment);

        setTranscript("");

        

        // Stop microphone

        if (recognitionRef.current) {

          recognitionRef.current.stop();

        }

        setIsListening(false);



        const combinedText = `Tension: ${guidedTension}. Pouls: ${guidedPulse}. Commentaire: ${comment}.`;

        analyzeTranscriptWithAI(combinedText);

      }

    } else {

      // Free Mode

      if (value.trim()) {

        analyzeTranscriptWithAI(value);

      }

    }

  };



  const handleSkipOrNone = () => {

    setError(null);

    if (guidedStep === 1) {

      // Stop mic

      if (recognitionRef.current) {

        recognitionRef.current.stop();

      }

      setIsListening(false);



      setGuidedTension("Non précisée");

      setGuidedStep(2);

      setTranscript("");

      speakInstructions("Tension ignorée. Veuillez dicter votre pouls.", () => {

        setTranscript("");

        startListening();

      });

    } else if (guidedStep === 2) {

      // Stop mic

      if (recognitionRef.current) {

        recognitionRef.current.stop();

      }

      setIsListening(false);



      setGuidedPulse("Non précisé");

      setGuidedStep(3);

      setTranscript("");

      speakInstructions("Pouls ignoré. Veuillez dicter vos commentaires.", () => {

        setTranscript("");

        startListening();

      });

    } else if (guidedStep === 3) {

      // Stop mic

      if (recognitionRef.current) {

        recognitionRef.current.stop();

      }

      setIsListening(false);



      const combinedText = `Tension: ${guidedTension}. Pouls: ${guidedPulse}. Commentaire: Aucun commentaire.`;

      setGuidedRemarks("Aucun");

      setTranscript("");

      analyzeTranscriptWithAI(combinedText);

    }

  };



  const resetGuidedMode = () => {

    // Stop mic

    if (recognitionRef.current) {

      recognitionRef.current.stop();

    }

    setIsListening(false);



    setGuidedStep(1);

    setGuidedTension("");

    setGuidedPulse("");

    setGuidedRemarks("");

    setTranscript("");

    setError(null);

    speakInstructions("Assistant réinitialisé. Veuillez dicter votre tension.", () => {

      setTranscript("");

      startListening();

    });

  };



  const analyzeTranscriptWithAI = async (textToParse: string) => {

    setIsAnalyzing(true);

    setError(null);

    const providerName = selectedProvider === "gemini" ? "Gemini" : selectedProvider === "openai" ? "OpenAI" : selectedProvider === "mistral" ? "Mistral" : "Qwen";

    onStatusChange(`Analyse intelligente par ${providerName} AI...`);



    try {

      const response = await fetch("/api/parse-measurements", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ text: textToParse, provider: selectedProvider }),

      });



      if (!response.ok) {

        const errData = await response.json();

        throw new Error(errData.error || "La connexion au serveur d'analyse a échoué.");

      }



      const result = await response.json();

      if (result.success && result.data) {

        onParsedResult(result.data);

        speakInstructions("Mesures analysées avec succès. Veuillez relire et sauvegarder.");

        

        // Reset steps for next entry

        setGuidedStep(1);

        setGuidedTension("");

        setGuidedPulse("");

        setGuidedRemarks("");

        setTranscript("");

      } else {

        throw new Error("Impossible d'extraire des constantes de santé valides.");

      }

    } catch (err: any) {

      console.error(err);

      setError(err.message || "Erreur lors de la communication avec l'analyseur.");

    } finally {

      setIsAnalyzing(false);

      onStatusChange(null);

    }

  };



  const handleStepJump = (step: GuidedStep) => {

    // Stop mic

    if (recognitionRef.current) {

      recognitionRef.current.stop();

    }

    setIsListening(false);



    setGuidedStep(step);

    setTranscript("");

    setError(null);

    if (step === 1) {

      speakInstructions("Ajustement de la tension. Veuillez la dicter.", () => {

        setTranscript("");

        startListening();

      });

    } else if (step === 2) {

      speakInstructions("Ajustement du pouls. Veuillez le dicter.", () => {

        setTranscript("");

        startListening();

      });

    } else if (step === 3) {

      speakInstructions("Ajustement des commentaires.", () => {

        setTranscript("");

        startListening();

      });

    }

  };



  // Live parsed values preview for text input feedback

  const liveParsedTension = guidedStep === 1 && transcript.trim() ? cleanInputToDigits(transcript, 1) : "";

  const liveParsedPulse = guidedStep === 2 && transcript.trim() ? cleanInputToDigits(transcript, 2) : "";

  const guidedStepCards: GuidedStepCardData[] = [

    {

      step: 1 as const,

      label: "Tension",

      value: guidedTension,

      placeholder: "—",

      icon: Droplets,

      disabled: false

    },

    {

      step: 2 as const,

      label: "Pouls",

      value: guidedPulse,

      placeholder: "—",

      icon: HeartPulse,

      disabled: !guidedTension && guidedStep < 2

    },

    {

      step: 3 as const,

      label: "Commentaire",

      value: guidedRemarks,

      placeholder: "—",

      icon: MessageSquare,

      disabled: (!guidedTension || !guidedPulse) && guidedStep < 3

    }

  ];



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

                if ("speechSynthesis" in window) {

                  window.speechSynthesis.cancel();

                }

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
                setGuidedStep(1);
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








