// client/pages/stool/index.js
import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Modal, Form, Button, Alert } from "react-bootstrap";
import { useRouter } from "next/router";
import BabyCard from "../../components/BabyCard/BabyCard";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styles from "./stool.module.css";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import useSpeechToText from "@/hooks/useSpeechToText";
import IncompatibleBrowserModal from "@/components/IncompatibleBrowserModal";

export default function Stool() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  // Add stool log modal state
  const [addStoolModalShow, setAddStoolModalShow] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [modalError, setModalError] = useState("");
  
  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [amPm, setAmPm] = useState("AM");
  const [color, setColor] = useState("");
  const [consistency, setConsistency] = useState("");
  const [notes, setNotes] = useState("");
  
  // Validation errors
  const [dateError, setDateError] = useState("");
  const [timeError, setTimeError] = useState("");
  const [colorError, setColorError] = useState("");
  const [consistencyError, setConsistencyError] = useState("");
  const [notesError, setNotesError] = useState("");
  
  // Speech to text
  const [currentInputField, setCurrentInputField] = useState(null);
  const [showIncompatibleModal, setShowIncompatibleModal] = useState(false);
  
  const {
    isListening,
    startListening,
    stopListening,
    transcript,
    resetTranscript,
    error: speechError,
  } = useSpeechToText();

  // Format date in YYYY-MM-DD format
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Navigate to baby's stool page
  const handleSelectBaby = (babyId) => {
    router.push(`/baby/${babyId}/stool`);
  };
  
  // Helper function to get current time in 12-hour format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Convert to 12-hour format
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    
    return {
      hour: String(hours12),
      minute: String(minutes).padStart(2, "0"),
      amPm: ampm
    };
  };
  
  // Open add stool log modal
  const handleOpenAddStoolModal = (babyId) => {
    setModalError("");
    
    // Reset form fields with current date/time
    setSelectedDate(new Date());
    const currentTime = getCurrentTime();
    setHour(currentTime.hour);
    setMinute(currentTime.minute);
    setAmPm(currentTime.amPm);
    setColor("");
    setConsistency("");
    setNotes("");
    
    // Reset validation errors
    setDateError("");
    setTimeError("");
    setColorError("");
    setConsistencyError("");
    setNotesError("");
    
    setSelectedBaby(babyId);
    setAddStoolModalShow(true);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [router]);
  
  // Toast notification functionality
  const showToast = useCallback((message, variant = "success") => {
    let toastIdCounter = 1;
    const createToastId = () => {
      return toastIdCounter++;
    };
    const id = createToastId();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  
  // Form validation
  const validateInputs = () => {
    let isValid = true;
    
    // Reset error states
    setDateError("");
    setTimeError("");
    setColorError("");
    setConsistencyError("");
    setNotesError("");
    
    // Validate date
    if (!selectedDate) {
      setDateError(t("Please select a date."));
      isValid = false;
    }
    
    // Validate time
    const parsedHour = parseInt(hour, 10);
    const parsedMinute = parseInt(minute, 10);
    if (isNaN(parsedHour) || parsedHour < 1 || parsedHour > 12 || 
        isNaN(parsedMinute) || parsedMinute < 0 || parsedMinute > 59) {
      setTimeError(t("Please enter a valid time."));
      isValid = false;
    }
    
    // Validate color
    if (!color || color.trim() === "") {
      setColorError(t("Please select a color."));
      isValid = false;
    }
    
    // Validate consistency
    if (!consistency || consistency.trim() === "") {
      setConsistencyError(t("Please select a consistency."));
      isValid = false;
    }
    
    // Validate notes length (max 255 characters)
    if (notes && notes.length > 255) {
      setNotesError(t("Notes must be less than 255 characters."));
      isValid = false;
    }
    
    return isValid;
  };
  
  // Convert time to ISO format with UTC to avoid timezone issues
  const formatTimeToISO = (timeStr) => {
    // Parse the time string (e.g., "7:30 PM")
    const match = timeStr.match(/([0-9]+):([0-9]+)\s?(AM|PM)/i);
    if (!match) return new Date().toISOString();
    
    let [_, hours, minutes, period] = match;
    
    // Convert hours to 24-hour format
    hours = parseInt(hours, 10);
    if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
    
    // Create a date object with the selected date but in UTC
    const localDate = new Date(selectedDate);
    
    // Create a new UTC date to avoid timezone offset issues
    const date = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      hours, 
      parseInt(minutes, 10),
      0,
      0
    ));
    
    return date.toISOString();
  };
  
  // Save stool log
  const handleSaveStoolLog = async () => {
    if (!validateInputs()) {
      return;
    }
    
    // Format time string
    const timeStr = `${hour}:${minute} ${amPm}`;
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedBaby}/stool`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            color,
            consistency,
            notes: notes || "",
            timestamp: formatTimeToISO(timeStr)
          }),
        }
      );
      
      const data = await res.json();
      
      if (data.status === "ok") {
        setAddStoolModalShow(false);
        showToast("Stool log added successfully!");
        
        // Clear form fields
        setSelectedDate(new Date());
        const currentTime = getCurrentTime();
        setHour(currentTime.hour);
        setMinute(currentTime.minute);
        setAmPm(currentTime.amPm);
        setColor("");
        setConsistency("");
        setNotes("");
      } else {
        showToast("Failed to add stool log", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error adding stool log", "error");
    }
  };
  
  // Handle voice input
  const handleVoiceInput = async (fieldName) => {
    if (!isListening) {
      if (speechError?.includes("not supported")) {
        setShowIncompatibleModal(true);
        return;
      }
      setCurrentInputField(fieldName);
      resetTranscript(); // Clear previous transcript
      // Clear the existing field content when starting new voice input
      if (fieldName === "notes") {
        setNotes("");
      }
      startListening();
    } else {
      stopListening();
      setCurrentInputField(null);
    }
  };
  
  // Handle transcript updates
  useEffect(() => {
    if (transcript && currentInputField) {
      if (currentInputField === "notes") {
        setNotes(transcript.trim()); // Replace the existing notes
      }
    }
  }, [transcript, currentInputField]);
  
  // Handle speech errors
  useEffect(() => {
    if (speechError && !speechError.includes("not supported")) {
      showToast(t("Voice input error occurred"), "error");
    }
  }, [speechError, t, showToast]);

  if (loading) {
    return (
      <Container className={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <p>{t("Loading...")}</p>
        </div>
      </Container>
    );
  }
  
  // Toast message component
  const ToastMessage = ({ message, variant = "success", onClose }) => (
    <div className={styles.toastMessage}>
      <div
        className={
          variant === "error"
            ? `${styles.toastIconCircle} ${styles.error}`
            : variant === "warning"
            ? `${styles.toastIconCircle} ${styles.warning}`
            : styles.toastIconCircle
        }
      >
        <AiOutlineInfoCircle />
      </div>
      <span>{message}</span>
      <button className={styles.toastClose} onClick={onClose}>
        ×
      </button>
    </div>
  );

  const ToastContainer = ({ toasts, removeToast }) => (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <ToastMessage
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return (
    <Container className={styles.container}>
      {/* Toast Container for notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{t("Stool Tracking")}</h1>
      </div>
      
      <p>{t("Select a baby to view or add stool records")}</p>
      <BabyCard
        buttons={[
          {
            name: "View Stool Records",
            functionHandler: handleSelectBaby,
          },
          {
            name: "Add Stool Entry",
            functionHandler: handleOpenAddStoolModal,
          },
        ]}
      />
      
      {/* Add Stool Log Modal */}
      <Modal 
        show={addStoolModalShow}
        onHide={() => setAddStoolModalShow(false)}
        className={`${showIncompatibleModal ? styles.modalBlur : ""}`}
        dialogClassName={styles.modalContainer}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("Add Stool Log")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form>
            <Form.Group className="mb-3" controlId="date">
              <Form.Label>{t("Date")}</Form.Label>
              <Form.Control
                type="date"
                value={formatLocalDate(selectedDate)}
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value + "T00:00:00")
                    : new Date();
                  setSelectedDate(date);
                }}
                isInvalid={!!dateError}
              />
              <Form.Control.Feedback type="invalid">
                {dateError}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group controlId="time" className="mb-3">
              <Form.Label>{t("Time")}</Form.Label>
              <div className={styles.timeRow}>
                <div className={styles.timeSegment}>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className={styles.timeBox}
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className={styles.timeBox}
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                  />
                </div>
                <div className={styles.amPmSegment}>
                  <button
                    type="button"
                    className={amPm === "AM" ? styles.amPmBtnActive : styles.amPmBtn}
                    onClick={() => setAmPm("AM")}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={amPm === "PM" ? styles.amPmBtnActive : styles.amPmBtn}
                    onClick={() => setAmPm("PM")}
                  >
                    PM
                  </button>
                </div>
              </div>
              <Form.Control.Feedback type="invalid">
                {timeError}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="color">
              <Form.Label>{t("Color")}</Form.Label>
              <Form.Select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                isInvalid={!!colorError}
              >
                <option value="">{t("Select color")}</option>
                <option value="Yellow">{t("Yellow")}</option>
                <option value="Green">{t("Green")}</option>
                <option value="Brown">{t("Brown")}</option>
                <option value="Black">{t("Black")}</option>
                <option value="Red">{t("Red")}</option>
                <option value="White">{t("White")}</option>
                <option value="Other">{t("Other")}</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {colorError}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="consistency">
              <Form.Label>{t("Consistency")}</Form.Label>
              <Form.Select
                value={consistency}
                onChange={(e) => setConsistency(e.target.value)}
                isInvalid={!!consistencyError}
              >
                <option value="">{t("Select consistency")}</option>
                <option value="Watery">{t("Watery")}</option>
                <option value="Loose">{t("Loose")}</option>
                <option value="Soft">{t("Soft")}</option>
                <option value="Formed">{t("Formed")}</option>
                <option value="Hard">{t("Hard")}</option>
                <option value="Mucousy">{t("Mucousy")}</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {consistencyError}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="notes">
              <Form.Label>{t("Notes")}</Form.Label>
              <div className="d-flex align-items-start">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("Enter any additional notes")}
                  isInvalid={!!notesError}
                />
                <Button
                  variant="link"
                  className="ms-2 p-0"
                  onClick={() => handleVoiceInput("notes")}
                >
                  {isListening && currentInputField === "notes" ? (
                    <FaMicrophoneSlash className="text-danger" />
                  ) : (
                    <FaMicrophone className="text-primary" />
                  )}
                </Button>
              </div>
              <Form.Control.Feedback type="invalid">
                {notesError}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                {`${notes.length}/255 ${t("characters")}`}
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setAddStoolModalShow(false)}
          >
            {t("Cancel")}
          </Button>
          <Button className={styles.btnSave} onClick={handleSaveStoolLog}>
            {t("Save")}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Incompatible Browser Modal */}
      <IncompatibleBrowserModal
        show={showIncompatibleModal}
        onHide={() => setShowIncompatibleModal(false)}
      />
    </Container>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}