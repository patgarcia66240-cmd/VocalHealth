import { useCallback, useState } from "react";

export function useSpeechSynthesis() {
  const [isMuted, setIsMuted] = useState(false);

  const speakInstructions = useCallback(
    (text: string, onEnd?: () => void) => {
      if (isMuted || !("speechSynthesis" in window)) {
        if (onEnd) {
          setTimeout(onEnd, 1000);
        }
        return;
      }

      const scheduleEnd = (callback: () => void) => {
        let called = false;
        const handleEnd = () => {
          if (!called) {
            called = true;
            setTimeout(callback, 1200);
          }
        };
        setTimeout(handleEnd, 15000);
        return handleEnd;
      };

      try {
        window.speechSynthesis.cancel();
        const Utterance = (window as any).SpeechSynthesisUtterance || SpeechSynthesisUtterance;
        const utterance = new Utterance(text);
        utterance.lang = "fr-FR";
        utterance.rate = 1.05;

        if (onEnd) {
          const handleEnd = scheduleEnd(onEnd);
          utterance.onend = handleEnd;
          utterance.onerror = handleEnd;
        }

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        try {
          const fallbackUtterance = new SpeechSynthesisUtterance(text);
          fallbackUtterance.lang = "fr-FR";
          fallbackUtterance.rate = 1.05;

          if (onEnd) {
            const handleEnd = scheduleEnd(onEnd);
            fallbackUtterance.onend = handleEnd;
            fallbackUtterance.onerror = handleEnd;
          }

          window.speechSynthesis.speak(fallbackUtterance);
        } catch (fallbackError) {
          console.error("TTS failed:", fallbackError);
          if (onEnd) onEnd();
        }

        if (error instanceof Error && error.message) {
          console.debug("Primary TTS path failed:", error.message);
        }
      }
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
