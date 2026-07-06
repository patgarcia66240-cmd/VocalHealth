import { useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  onError: (message: string) => void;
  onStatusChange: (status: string | null) => void;
}

export function useSpeechRecognition({ onError, onStatusChange }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supportSpeech, setSupportSpeech] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupportSpeech(false);
    }
  }, []);

  const stopRecognition = (clearStatus = true) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (clearStatus) {
      onStatusChange(null);
    }
  };

  const startListening = (statusMessage: string) => {
    setTranscript("");
    onStatusChange(statusMessage);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError("La reconnaissance vocale n'est pas supportée par votre navigateur.");
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
          onError("Accès au microphone refusé. Veuillez autoriser l'accès.");
        } else {
          onError(`Erreur vocale : ${event.error}`);
        }
        stopRecognition(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (error: any) {
      onError(`Erreur lors du démarrage du micro : ${error.message}`);
      setIsListening(false);
      onStatusChange(null);
    }
  };

  return {
    isListening,
    transcript,
    supportSpeech,
    setTranscript,
    startListening,
    stopRecognition,
  };
}
