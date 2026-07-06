import { useEffect, useMemo, useState } from "react";
import { Droplets, HeartPulse, MessageSquare } from "lucide-react";
import { cleanInputToDigits } from "../services/frenchNumberParser";
import type { GuidedStep, GuidedStepCardData } from "../components/GuidedMode";
import type { InputMode } from "../components/InputModeSwitch";

interface UseGuidedVoiceFlowOptions {
  inputMode: InputMode;
  isListening: boolean;
  transcript: string;
  setTranscript: (value: string) => void;
  startListening: () => void;
  stopRecognition: (clearStatus?: boolean) => void;
  speakInstructions: (text: string, onEnd?: () => void) => void;
  analyzeTranscript: (text: string) => Promise<void>;
  setError: (message: string | null) => void;
}

export function useGuidedVoiceFlow({
  inputMode,
  isListening,
  transcript,
  setTranscript,
  startListening,
  stopRecognition,
  speakInstructions,
  analyzeTranscript,
  setError,
}: UseGuidedVoiceFlowOptions) {
  const [guidedStep, setGuidedStep] = useState<GuidedStep>(1);
  const [guidedTension, setGuidedTension] = useState("");
  const [guidedPulse, setGuidedPulse] = useState("");
  const [guidedRemarks, setGuidedRemarks] = useState("");

  const clearGuidedValues = () => {
    setGuidedStep(1);
    setGuidedTension("");
    setGuidedPulse("");
    setGuidedRemarks("");
    setTranscript("");
  };

  const analyzeAndReset = (text: string) => {
    void analyzeTranscript(text).then(clearGuidedValues);
  };

  useEffect(() => {
    if (inputMode !== "guided" || !isListening || !transcript.trim()) return;

    if (guidedStep === 1) {
      const parsedValue = cleanInputToDigits(transcript, 1);
      if (parsedValue.includes("/") && parsedValue.split("/")[1] !== "") {
        stopRecognition(false);

        const timer = setTimeout(() => {
          setGuidedTension(parsedValue);
          setGuidedStep(2);
          setTranscript("");

          speakInstructions(
            `Tension enregistrée : ${parsedValue.replace("/", " sur ")}. Veuillez dicter votre pouls.`,
            () => {
              setTranscript("");
              startListening();
            },
          );
        }, 800);

        return () => clearTimeout(timer);
      }
    } else if (guidedStep === 2) {
      const parsedValue = cleanInputToDigits(transcript, 2);
      const pulseNum = parseInt(parsedValue, 10);
      if (!isNaN(pulseNum) && pulseNum >= 35 && pulseNum <= 220) {
        stopRecognition(false);

        const timer = setTimeout(() => {
          setGuidedPulse(parsedValue);
          setGuidedStep(3);
          setTranscript("");

          speakInstructions(
            `Pouls enregistré : ${parsedValue}. Veuillez enfin dicter vos commentaires, ou dites aucun.`,
            () => {
              setTranscript("");
              startListening();
            },
          );
        }, 800);

        return () => clearTimeout(timer);
      }
    } else if (guidedStep === 3) {
      const cleanLower = transcript.trim().toLowerCase();
      if (cleanLower === "aucun" || cleanLower === "rien" || cleanLower === "pas de commentaire") {
        const timer = setTimeout(() => {
          setGuidedRemarks("Aucun");
          setTranscript("");
          stopRecognition(false);
          analyzeAndReset(`Tension: ${guidedTension}. Pouls: ${guidedPulse}. Commentaire: Aucun.`);
        }, 800);

        return () => clearTimeout(timer);
      }

      if (transcript.trim().length > 4) {
        const timer = setTimeout(() => {
          const finalRemarks = transcript.trim();
          setGuidedRemarks(finalRemarks);
          setTranscript("");
          stopRecognition(false);
          analyzeAndReset(`Tension: ${guidedTension}. Pouls: ${guidedPulse}. Commentaire: ${finalRemarks}.`);
        }, 2200);

        return () => clearTimeout(timer);
      }
    }
  }, [analyzeTranscript, guidedPulse, guidedStep, guidedTension, inputMode, isListening, setTranscript, speakInstructions, startListening, stopRecognition, transcript]);

  const validateGuidedValue = (value: string) => {
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

      stopRecognition(false);
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

      stopRecognition(false);
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
      stopRecognition(false);
      analyzeAndReset(`Tension: ${guidedTension}. Pouls: ${guidedPulse}. Commentaire: ${comment}.`);
    }
  };

  const skipOrNone = () => {
    setError(null);

    if (guidedStep === 1) {
      stopRecognition(false);
      setGuidedTension("Non précisée");
      setGuidedStep(2);
      setTranscript("");
      speakInstructions("Tension ignorée. Veuillez dicter votre pouls.", () => {
        setTranscript("");
        startListening();
      });
    } else if (guidedStep === 2) {
      stopRecognition(false);
      setGuidedPulse("Non précisé");
      setGuidedStep(3);
      setTranscript("");
      speakInstructions("Pouls ignoré. Veuillez dicter vos commentaires.", () => {
        setTranscript("");
        startListening();
      });
    } else if (guidedStep === 3) {
      stopRecognition(false);
      setGuidedRemarks("Aucun");
      setTranscript("");
      analyzeAndReset(`Tension: ${guidedTension}. Pouls: ${guidedPulse}. Commentaire: Aucun commentaire.`);
    }
  };

  const resetGuidedMode = () => {
    stopRecognition(false);
    clearGuidedValues();
    setError(null);
    speakInstructions("Assistant réinitialisé. Veuillez dicter votre tension.", () => {
      setTranscript("");
      startListening();
    });
  };

  const jumpToStep = (step: GuidedStep) => {
    stopRecognition(false);
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

  const liveParsedTension = guidedStep === 1 && transcript.trim() ? cleanInputToDigits(transcript, 1) : "";
  const liveParsedPulse = guidedStep === 2 && transcript.trim() ? cleanInputToDigits(transcript, 2) : "";

  const guidedStepCards: GuidedStepCardData[] = useMemo(
    () => [
      {
        step: 1,
        label: "Tension",
        value: guidedTension,
        placeholder: "—",
        icon: Droplets,
        disabled: false,
      },
      {
        step: 2,
        label: "Pouls",
        value: guidedPulse,
        placeholder: "—",
        icon: HeartPulse,
        disabled: !guidedTension && guidedStep < 2,
      },
      {
        step: 3,
        label: "Commentaire",
        value: guidedRemarks,
        placeholder: "—",
        icon: MessageSquare,
        disabled: (!guidedTension || !guidedPulse) && guidedStep < 3,
      },
    ],
    [guidedPulse, guidedRemarks, guidedStep, guidedTension],
  );

  return {
    guidedStep,
    guidedTension,
    guidedPulse,
    guidedRemarks,
    guidedStepCards,
    liveParsedTension,
    liveParsedPulse,
    clearGuidedValues,
    validateGuidedValue,
    skipOrNone,
    resetGuidedMode,
    jumpToStep,
  };
}
