import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import useSpeechToText from "@/hooks/useSpeechToText";
import { useRouter } from "next/router";
import styles from "./VoiceControl.module.css";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { useTranslation } from "next-i18next";

function VoiceControl() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText({
      continuous: true,
      interimResults: true,
      lang: "en-US",
    });

  const startStopListening = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startListening();
    }
  };

  const stopVoiceInput = () => {
    setText(
      (preVal) =>
        preVal +
        (transcript.length ? (preVal.length ? " " : "") + transcript : ""),
    );
    stopListening();
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const sendVoiceCommand = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/voiceCommand`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    console.log(data);
    if (data.message == "profile") {
      router.push("/profile");
    } else if (data.message == "sign out") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      router.push("/");
    } else if (data.message == "feeding schedule") {
      router.push("/feeding-schedule");
    } else if (data.message == "settings") {
      router.push("/settings");
    } else if (data.message == "dashboard") {
      router.push("/dashboard");
    }else if (data.message == "milestones") {
      router.push("/milestones");
    } else if (data.message == "journal") {
      router.push("/journal");
    } else if (data.message == "reminders") {
      router.push("/reminders");
    } else if (data.message == "growth") {
      router.push("/growth");
    } else if (data.message == "forum") {
      router.push("/forum");
    }
    else {
      setError("Voice command not found. Please try again!");
      setText("");
      setShowToast(true);
    }
  };

  return (
    <div>
      <Button variant="primary" onClick={handleShow} className={styles.button}>
        {t("Voice Control")}
      </Button>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Voice Control")}</Modal.Title>
        </Modal.Header>

        <Modal.Body className={styles.modalBody}>
          <h2>{t("Listening...")}</h2>
          <textarea
            disabled={isListening}
            value={
              isListening ? text + (transcript.length ? transcript : "") : text
            }
            onChange={(e) => setText(e.target.value)}
            className={styles.textarea}
          ></textarea>
          <div className={styles.buttonContainer}>
            <Button onClick={startStopListening} className={styles.button}>
              {isListening ? t("Stop listening") : t("Start")}
            </Button>
            <Button onClick={sendVoiceCommand} className={styles.button}>
              {t("Send")}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000}
          autohide className={styles.toastError}>
          <Toast.Header>
          <strong className="me-auto">Error</strong>
          <small>Just now</small>
          </Toast.Header>
          <Toast.Body>{error}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}
export default VoiceControl;
