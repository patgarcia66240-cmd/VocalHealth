export function speakFeedback(message: string) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "fr-FR";
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}
