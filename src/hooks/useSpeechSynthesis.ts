import { useCallback, useState } from "react";

const TTS_SAFETY_TIMEOUT_MS = 15000;

export function useSpeechSynthesis() {
  const [isMuted, setIsMuted] = useState(false);

  const speakInstructions = useCallback(
    (text: string, onEnd?: () => void): Promise<void> => {
      if (isMuted || !("speechSynthesis" in window)) {
        onEnd?.();
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        let completed = false;

        const finish = () => {
          if (completed) return;
          completed = true;
          resolve();
          onEnd?.();
        };

        const configureUtterance = (utterance: SpeechSynthesisUtterance) => {
          utterance.lang = "fr-FR";
          utterance.rate = 1.05;
          utterance.onend = finish;
          utterance.onerror = finish;
          return utterance;
        };

        try {
          window.speechSynthesis.cancel();
          const Utterance = (window as any).SpeechSynthesisUtterance || SpeechSynthesisUtterance;
          window.speechSynthesis.speak(configureUtterance(new Utterance(text)));
          setTimeout(finish, TTS_SAFETY_TIMEOUT_MS);
        } catch (error) {
          try {
            window.speechSynthesis.speak(configureUtterance(new SpeechSynthesisUtterance(text)));
            setTimeout(finish, TTS_SAFETY_TIMEOUT_MS);
          } catch (fallbackError) {
            console.error("TTS failed:", fallbackError);
            finish();
          }
        }
      });
    },
    [isMuted],
  );

  const cancelSpeech = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { isMuted, setIsMuted, speakInstructions, cancelSpeech };
}
