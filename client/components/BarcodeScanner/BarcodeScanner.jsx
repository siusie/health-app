import React, { useEffect, useRef, useState } from "react";
import Quagga from "quagga";

function BarcodeScanner({ onDetected, cameraActive }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cameraActive || !scannerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          constraints: {
            facingMode: "user",
            width: 1000,
            height: 500,
          },
          target: scannerRef.current,
        },
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
            "code_128_reader",
          ],
        },
        locate: true,
        numOfWorkers: navigator.hardwareConcurrency || 4, // Optimize performance
      },
      (err) => {
        if (err) {
          console.error("Error initializing Quagga:", err);
          setError("Camera access failed. Please allow camera permissions.");
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onProcessed((result) => {
      if (!result || !result.boxes || !Quagga.canvas || !Quagga.canvas.ctx) return; // ✅ Ensure valid result

      const drawingCtx = Quagga.canvas.ctx.overlay;
      const drawingCanvas = Quagga.canvas.dom.overlay;
      drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

      // ✅ REMOVE: drawPath to avoid 'undefined' errors
    });

    Quagga.onDetected((data) => {
      if (data?.codeResult?.code) {
        onDetected(data.codeResult.code);
        Quagga.stop(); // Stop scanning after detection
      }
    });

    return () => {
      Quagga.stop();
    };
  }, [cameraActive, onDetected]);

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div ref={scannerRef} id="interactive" className="viewport" style={{ width: "100%", height: "500px" }} />
    </div>
  );
}

export default BarcodeScanner;
