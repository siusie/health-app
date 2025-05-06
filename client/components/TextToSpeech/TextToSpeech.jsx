import React, { useEffect, useState } from "react";
import styles from "./TextToSpeech.module.css";
import { useTranslation } from "next-i18next";

function TextToSpeech({ text, title }) {
  const { t } = useTranslation("common");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Function to strip HTML tags
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = (e) => {
    e.preventDefault();

    if ("speechSynthesis" in window) {
      // Strip HTML tags from both title and text
      const cleanTitle = stripHtml(title || "");
      const cleanText = stripHtml(text || "");

      // Create utterances for title and content
      const titleUtterance = new SpeechSynthesisUtterance(
        cleanTitle ? `Title: ${cleanTitle}` : "",
      );
      const pauseUtterance = new SpeechSynthesisUtterance("."); // Creates a natural pause
      const contentUtterance = new SpeechSynthesisUtterance(cleanText);

      // Set properties for all utterances
      [titleUtterance, contentUtterance].forEach((utterance) => {
        utterance.voice = speechSynthesis
          .getVoices()
          .find((voice) => voice.name === "Google US English");
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = 1;
      });

      // Configure pause
      pauseUtterance.rate = 0.1; // Slow rate creates longer pause

      // Handle speaking states
      titleUtterance.onstart = () => setIsSpeaking(true);
      contentUtterance.onend = () => setIsSpeaking(false);

      // Queue the utterances
      if (cleanTitle) {
        window.speechSynthesis.speak(titleUtterance);
        window.speechSynthesis.speak(pauseUtterance);
      }
      window.speechSynthesis.speak(contentUtterance);
    } else {
      alert(
        "Text-to-speech is not supported in this browser or no text provided",
      );
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div>
      <button
        onClick={handleSpeak}
        disabled={isSpeaking}
        className={styles.button}
        type="button"
      >
        {isSpeaking ? "Speaking..." : t("Speak")}
      </button>
      <button
        onClick={handleStop}
        disabled={!isSpeaking}
        className={styles.button}
        type="button"
      >
        {t("Stop")}
      </button>
    </div>
  );
}

export default TextToSpeech;
