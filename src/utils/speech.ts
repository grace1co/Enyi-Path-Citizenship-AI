/**
 * Browser text-to-speech helper.
 * Cleans text before reading it aloud.
 */

let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentOnEnd: (() => void) | null = null;

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  rate?: number
): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("Speech synthesis is not supported on this device/browser.");
    if (onEnd) onEnd();
    return;
  }

  try {
    // Stop any current speech before starting a new message.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    currentOnEnd = null;

    // Remove markdown so the voice reads clean text.
    const cleanText = text
      .replace(/[\#\*\_`\~\-]/g, "") // remove markdown symbols
      .replace(/\[\d+\]/g, "") // remove citation markers
      .replace(/\s+/g, " ") // normalize spacing
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    // Create the speech message.
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    
    let rateToUse = rate;
    if (rateToUse === undefined) {
      rateToUse = 0.92;
      try {
        const token = localStorage.getItem("enyi_auth_token");
        let speedSetting = "normal";
        if (token === "guest-token") {
          const savedSettings = localStorage.getItem("enyi_guest_settings");
          if (savedSettings) {
            speedSetting = JSON.parse(savedSettings).speechRate || "normal";
          }
        } else {
          const lastUserId = localStorage.getItem("enyi_last_user_id");
          if (lastUserId) {
            const savedSettings = localStorage.getItem(`enyi_user_settings_${lastUserId}`);
            if (savedSettings) {
              speedSetting = JSON.parse(savedSettings).speechRate || "normal";
            }
          }
        }
        if (speedSetting === "slow") rateToUse = 0.75;
        else if (speedSetting === "very-slow") rateToUse = 0.55;
        else rateToUse = 0.95;
      } catch (err) {}
    }

    utterance.rate = rateToUse;
    utterance.pitch = 1.0;

    // Pick an English voice if one is available.
    const voices = window.speechSynthesis.getVoices();
    const premiumOrStandardVoice = voices.find(
      (v) =>
        (v.name.includes("Google") ||
          v.name.includes("Natural") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel") ||
          v.name.includes("Microsoft Zira")) &&
        (v.lang.startsWith("en-US") || v.lang.startsWith("en-GB"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (premiumOrStandardVoice) {
      utterance.voice = premiumOrStandardVoice;
    }

    // Track speech start and finish.
    if (onStart) utterance.onstart = onStart;
    
    currentOnEnd = onEnd || null;
    utterance.onend = () => {
      if (onEnd) onEnd();
      activeUtterance = null;
      currentOnEnd = null;
    };
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error occurred:", e);
      if (onEnd) onEnd();
      activeUtterance = null;
      currentOnEnd = null;
    };

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Failed to run speakText:", error);
    if (onEnd) onEnd();
  }
}

export function stopSpeaking(triggerEnd = false): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();

    if (triggerEnd && currentOnEnd) {
      currentOnEnd();
    }

    currentOnEnd = null;
    activeUtterance = null;
  }
}

export function isSpeakingSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
