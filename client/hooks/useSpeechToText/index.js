import { useState, useRef, useEffect } from "react";
import IncompatibleBrowserModal from "@/components/IncompatibleBrowserModal";

function useSpeechToText(options) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const [showIncompatibleModal, setShowIncompatibleModal] = useState(false);

  const browserSupportsSpeechRecognition =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        recognition.interimResults = options?.interimResults ?? true;
        recognition.lang = options?.lang ?? "en-US";
        recognition.continuous = options?.continuous ?? false;

        recognition.onresult = (event) => {
          try {
            const current = Array.from(event.results)
              .map((result) => result[0].transcript)
              .join(" ");
            setTranscript(current);
          } catch (err) {
            console.error("Error processing speech results:", err);
            setError("Error processing speech results");
          }
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setError(event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      }
    } catch (err) {
      console.error("Error initializing speech recognition:", err);
      setError(err.message);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping recognition on cleanup:", err);
        }
      }
    };
  }, []);

  const resetTranscript = () => {
    setTranscript("");
    setError(null);
  };

  const startListening = async () => {
    try {
      // Check browser compatibility when user tries to start listening
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("Speech recognition not supported");
        setShowIncompatibleModal(true);
        return;
      }

      // Initialize recognition if not already initialized
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        recognition.interimResults = options?.interimResults ?? true;
        recognition.lang = options?.lang ?? "en-US";
        recognition.continuous = options?.continuous ?? false;

        recognition.onresult = (event) => {
          try {
            const current = Array.from(event.results)
              .map((result) => result[0].transcript)
              .join(" ");
            setTranscript(current);
          } catch (err) {
            console.error("Error processing speech results:", err);
            setError("Error processing speech results");
          }
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setError(event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      }

      resetTranscript();
      await recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError(err.message);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      console.error("Failed to stop recognition:", err);
    }
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    showIncompatibleModal,
    setShowIncompatibleModal,
    browserSupportsSpeechRecognition,
  };
}

export default useSpeechToText;
