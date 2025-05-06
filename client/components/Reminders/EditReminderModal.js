import { Button, Form, Modal, Alert } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { useReminders } from "../../context/ReminderContext";
import styles from "../../pages/baby/[id]/reminders/reminders.module.css";
import styles2 from "./AddReminderModal.module.css";
import { constructTimeString } from "../../utils/reminderUtil";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import useSpeechToText from "@/hooks/useSpeechToText";
import IncompatibleBrowserModal from "@/components/IncompatibleBrowserModal";

const EditReminderModal = () => {
  const { t } = useTranslation("common");
  const [error, setError] = useState(null);
  const {
    showEditModal,
    handleCloseEditModal,
    title,
    setTitle,
    time,
    setTime,
    note,
    setNote,
    reminderDate,
    setReminderDate,
    nextReminderEnabled,
    setNextReminderEnabled,
    reminderIn,
    setReminderIn,
    selectedReminder,
    handleUpdateReminder,
    showTitleRequired,
    showToast,
  } = useReminders();

  // Speech to text related states and hooks
  const [currentInputField, setCurrentInputField] = useState(null);
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    showIncompatibleModal,
    setShowIncompatibleModal,
    browserSupportsSpeechRecognition,
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    lang: "en-US",
  });

  // Handle voice input for different fields
  const handleVoiceInput = (fieldName) => {
    // Only show modal if browser doesn't support speech recognition
    if (!browserSupportsSpeechRecognition) {
      setShowIncompatibleModal(true);
      return;
    }

    if (!isListening) {
      setCurrentInputField(fieldName);
      resetTranscript();
      startListening();
    } else {
      stopVoiceInput();
    }
  };

  const stopVoiceInput = () => {
    // Add transcript content to the appropriate field
    if (currentInputField === "title") {
      setTitle(
        title +
          (transcript.length ? (title.length ? " " : "") + transcript : ""),
      );
    } else if (currentInputField === "note") {
      setNote(
        note + (transcript.length ? (note.length ? " " : "") + transcript : ""),
      );
    }
    stopListening();
    setCurrentInputField(null);
  };

  const onSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title");
      // showTitleRequired();
      return;
    }

    let hours = parseInt(time.hours);
    if (isNaN(hours) || hours < 1 || hours > 12) {
      setError("Please enter a valid hour (1-12)");
      // showToast("Please enter a valid hour (1-12)", "error");
      return;
    }

    let minutes = parseInt(time.minutes);
    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      setError("Please enter valid minutes (0-59)");
      // showToast("Please enter valid minutes (0-59)", "error");
      return;
    }

    if (!reminderDate) {
      setError("Please select a date");
      // showToast("Please select a date", "error");
      return;
    }

    const formattedTime = constructTimeString(time);

    const reminderData = {
      title,
      time: formattedTime,
      date: reminderDate,
      notes: note,
      is_active: selectedReminder?.isActive || true,
      next_reminder: nextReminderEnabled,
      reminder_in: nextReminderEnabled ? reminderIn : null,
    };

    await handleUpdateReminder(reminderData);
  };

  return (
    <>
      <Modal
        show={showEditModal}
        onHide={handleCloseEditModal}
        centered
        className={showIncompatibleModal ? styles.modalBlur : ""}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("Edit Reminder")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("Title")}</Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="text"
                  value={
                    isListening && currentInputField === "title"
                      ? title + " " + transcript
                      : title
                  }
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isListening && currentInputField === "title"}
                  isInvalid={!!error}
                />
                <Button
                  variant="link"
                  className="ms-2 p-0"
                  onClick={() => handleVoiceInput("title")}
                >
                  <FontAwesomeIcon
                    icon={
                      isListening && currentInputField === "title"
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    className={
                      isListening && currentInputField === "title"
                        ? "text-danger"
                        : "text-primary"
                    }
                  />
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Date")}</Form.Label>
              <Form.Control
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                isInvalid={!!error}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Time")}</Form.Label>
              <div className={styles.timeRow}>
                <div className={styles.timeSegment}>
                  <input
                    type="number"
                    className={styles.timeBox}
                    value={time.hours}
                    onChange={(e) =>
                      setTime({ ...time, hours: e.target.value })
                    }
                    min="1"
                    max="12"
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    className={styles.timeBox}
                    value={time.minutes}
                    onChange={(e) => {
                      const newMinutes = e.target.value || "00";
                      setTime({
                        ...time,
                        minutes: newMinutes.padStart(2, "0"),
                      });
                    }}
                    min="0"
                    max="59"
                  />
                </div>
                <div className={styles.amPmSegment}>
                  <button
                    type="button"
                    className={
                      time.period === "AM"
                        ? styles.amPmBtnActive
                        : styles.amPmBtn
                    }
                    onClick={() => setTime({ ...time, period: "AM" })}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={
                      time.period === "PM"
                        ? styles.amPmBtnActive
                        : styles.amPmBtn
                    }
                    onClick={() => setTime({ ...time, period: "PM" })}
                  >
                    PM
                  </button>
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>{t("Note")}</Form.Label>
              <div className="d-flex align-items-start">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={
                    isListening && currentInputField === "note"
                      ? note + " " + transcript
                      : note
                  }
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isListening && currentInputField === "note"}
                />
                <Button
                  variant="link"
                  className="ms-2 p-0"
                  onClick={() => handleVoiceInput("note")}
                >
                  <FontAwesomeIcon
                    icon={
                      isListening && currentInputField === "note"
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    className={
                      isListening && currentInputField === "note"
                        ? "text-danger"
                        : "text-primary"
                    }
                  />
                </Button>
              </div>
            </Form.Group>

            <div className={styles.reminderRow}>
              <Form.Check
                type="switch"
                id="edit-next-reminder-switch"
                label={t("Next reminder")}
                checked={nextReminderEnabled}
                onChange={() => setNextReminderEnabled(!nextReminderEnabled)}
              />
              {nextReminderEnabled && (
                <div className="mt-2">
                  <p className={styles.reminderInfo}>{t("Remind me in")}</p>
                  <Form.Select
                    value={reminderIn}
                    onChange={(e) => setReminderIn(e.target.value)}
                    style={{ width: "120px" }}
                  >
                    <option value="1 hr">1 hr</option>
                    <option value="1.5 hrs">1.5 hrs</option>
                    <option value="2 hrs">2 hrs</option>
                    <option value="3 hrs">3 hrs</option>
                    <option value="4 hrs">4 hrs</option>
                  </Form.Select>
                </div>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            className={styles.btnCancel}
            onClick={handleCloseEditModal}
          >
            {t("Cancel")}
          </Button>
          <Button className={styles2.btn} onClick={onSubmit}>
            {t("Update")}
          </Button>
        </Modal.Footer>
      </Modal>

      <IncompatibleBrowserModal
        show={showIncompatibleModal}
        onHide={() => setShowIncompatibleModal(false)}
      />
    </>
  );
};

export default EditReminderModal;
