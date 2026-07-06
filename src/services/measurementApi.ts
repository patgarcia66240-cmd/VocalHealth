import { ParsedVoiceResult } from "../types";

export type AiProvider = "gemini" | "openai" | "mistral" | "qwen";

export function getAiProviderName(provider: AiProvider) {
  return provider === "gemini" ? "Gemini" : provider === "openai" ? "OpenAI" : provider === "mistral" ? "Mistral" : "Qwen";
}

export async function parseMeasurements(text: string, provider: AiProvider): Promise<ParsedVoiceResult> {
  const response = await fetch("/api/parse-measurements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, provider }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || "La connexion au serveur d'analyse a échoué.");
  }

  const result = await response.json();
  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Impossible d'extraire des constantes de santé valides.");
}
