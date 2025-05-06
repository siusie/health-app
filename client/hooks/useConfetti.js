// hooks/useConfetti.js
// A custom hook to manage confetti animation in a React component
import { useState, useCallback } from "react";
import ReactConfetti from "react-confetti";

export const useConfetti = () => {
  const [confettiConfig, setConfettiConfig] = useState({
    show: false,
    x: 0,
    y: 0,
  });

  const startConfetti = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setConfettiConfig({
      show: true,
      x: rect.left,
      y: rect.top,
    });
  }, []);

  const stopConfetti = useCallback(() => {
    setConfettiConfig((prev) => ({ ...prev, show: false }));
  }, []);

  return {
    confettiConfig,
    startConfetti,
    stopConfetti,
    ConfettiComponent: confettiConfig.show ? (
      <ReactConfetti
        width={200}
        height={200}
        recycle={false}
        numberOfPieces={50}
        style={{
          position: "fixed",
          left: confettiConfig.x,
          top: confettiConfig.y,
          zIndex: 1000,
        }}
        onConfettiComplete={() => stopConfetti()}
      />
    ) : null,
  };
};
