import { useEffect, useState } from "react";
import { AiProvider } from "../services/measurementApi";

const STORAGE_KEY = "selected_ai_provider";

function isAiProvider(value: string | null): value is AiProvider {
  return value === "gemini" || value === "openai" || value === "mistral" || value === "qwen";
}

export function useVoiceProvider() {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isAiProvider(saved) ? saved : "gemini";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedProvider);
  }, [selectedProvider]);

  return { selectedProvider, setSelectedProvider };
}
