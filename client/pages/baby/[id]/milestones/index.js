import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "./milestones.module.css";
import {
  FaEdit,
  FaTrash,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import useSpeechToText from "@/hooks/useSpeechToText";
import IncompatibleBrowserModal from "@/components/IncompatibleBrowserModal";

const formatDate = (dateString) => {
  const [year, month, day] = dateString.split("-");
  const localDate = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript

  return localDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function MilestoneEachBaby({ baby_id }) {
  const { t } = useTranslation("common");
  const [milestones, setMilestones] = useState([]);
  const [modalError, setModalError] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [toasts, setToasts] = useState([]);
  const [date, setDate] = useState("");
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);
  const [currentInputField, setCurrentInputField] = useState(null);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [babyName, setBabyName] = useState("");

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechToText();

  const router = useRouter();

  const handleBackClick = () => {
    router.push("/milestones");
  };

  useEffect(() => {
    if (router.isReady && baby_id) {
      console.log("Fetching milestones for baby:", baby_id);
      async function fetchMilestones() {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}/milestones`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
          const data = await res.json();

          if (res.ok && data.status === "ok") {
            // Sort milestones by date (most recent first) before setting state
            const sortedMilestones = data.data.sort(
              (a, b) => new Date(b.date) - new Date(a.date),
            );
            setMilestones(sortedMilestones);
          } else {
            console.error("Failed to fetch milestones:", data);
          }
        } catch (error) {
          console.error("Error fetching milestones:", error);
        }
      }
      fetchMilestones();
    } else {
      console.log("Baby ID not found in query params.");
    }
  }, [baby_id, router.isReady]);

  useEffect(() => {
    if (router.isReady && baby_id) {
      // Fetch baby info
      async function fetchBabyInfo() {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
          const data = await res.json();
          if (res.ok && data.status === "ok") {
            setBabyName(data.data.first_name);
          }
        } catch (error) {
          console.error("Error fetching baby info:", error);
        }
      }
      fetchBabyInfo();
    }
  }, [baby_id, router.isReady]);

  useEffect(() => {
    if (transcript && currentInputField) {
      if (currentInputField === "title") {
        setTitle(transcript.trim()); // Replace the existing title
      } else if (currentInputField === "details") {
        setDetails(transcript.trim()); // Replace the existing details
      }
    }
  }, [transcript, currentInputField]);

  const handleOpenModal = (milestone) => {
    setModalError("");
    setSelectedMilestone(milestone);
    setTitle(milestone.title);
    setDetails(milestone.details);
    // Format the date for the input field (YYYY-MM-DD)
    setDate(new Date(milestone.date).toISOString().split("T")[0]);
    setModalShow(true);
  };

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
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
  let toastIdCounter = 1;
  const createToastId = () => {
    return toastIdCounter++;
  };

  const showToast = (message, variant = "success") => {
    const id = createToastId();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const validateForm = () => {
    if (!title.trim()) {
      setModalError(t("Title is required"));
      return false;
    }
    if (!details.trim()) {
      setModalError(t("Details are required"));
      return false;
    }
    if (!date) {
      setModalError(t("Date is required"));
      return false;
    }

    // Validate date format and range
    const selectedDate = new Date(date);

    // Check if date is valid
    if (isNaN(selectedDate.getTime())) {
      setModalError(t("Invalid date format."));
      return false;
    }

    // Check if date is too far in the future (max 5 years)
    const fiveYearsFromNow = new Date();
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
    if (selectedDate > fiveYearsFromNow) {
      setModalError(t("Date cannot be more than 5 years in the future."));
      return false;
    }

    // Check if date is too far in the past (max 50 years)
    const fiftyYearsAgo = new Date();
    fiftyYearsAgo.setFullYear(fiftyYearsAgo.getFullYear() - 50);
    if (selectedDate < fiftyYearsAgo) {
      setModalError(t("Date cannot be more than 50 years in the past."));
      return false;
    }

    return true;
  };

  const handleSaveMilestone = async () => {
    setModalError("");

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    try {
      const isNewMilestone = !selectedMilestone;
      const url = isNewMilestone
        ? `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}/milestones`
        : `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedMilestone.baby_id}/milestones/${selectedMilestone.milestone_id}`;

      const method = isNewMilestone ? "POST" : "PUT";

      // Parse the date as a local date
      const [year, month, day] = date.split("-");
      const localDate = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title,
          details,
          date: localDate,
        }),
      });

      const data = await res.json();
      if (data.status === "ok") {
        setModalShow(false);
        showToast(isNewMilestone ? "Milestone created!" : "Milestone updated!");
        router.reload();
      }
    } catch (error) {
      showToast(
        `Error ${selectedMilestone ? "saving" : "creating"} milestone.`,
        "danger",
      );
    }
  };

  const handleDeleteClick = (milestone) => {
    setMilestoneToDelete(milestone);
    setDeleteModalShow(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${milestoneToDelete.baby_id}/milestones/${milestoneToDelete.milestone_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();
      if (data.status === "ok") {
        setDeleteModalShow(false);
        setMilestones(
          milestones.filter(
            (m) => m.milestone_id !== milestoneToDelete.milestone_id,
          ),
        );
        showToast("Milestone deleted!");
      }
    } catch (error) {
      showToast("Error deleting milestone.", "danger");
    }
    setMilestoneToDelete(null);
  };

  const handleVoiceInput = (fieldName) => {
    // Only show modal if browser doesn't support speech recognition
    if (!browserSupportsSpeechRecognition) {
      setShowBrowserModal(true);
      return;
    }

    if (!isListening) {
      setCurrentInputField(fieldName);
      resetTranscript();
      startListening();
    } else {
      stopListening();
      setCurrentInputField(null);
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <IncompatibleBrowserModal
        show={showBrowserModal}
        onHide={() => setShowBrowserModal(false)}
      />
      <div className={styles.backButtonContainer}>
        <div className={styles.backButton} onClick={handleBackClick}>
          <span>← {t("Back to Overview")}</span>
        </div>
      </div>

      <h1 className={styles.heading}>
        {babyName ? `${t("Milestones for")} ${babyName}` : t("Milestones")}{" "}
      </h1>

      <table className={styles.mealsTable}>
        <thead>
          <tr>
            <th>{t("Title")}</th>
            <th>{t("Details")}</th>
            <th>{t("Date")}</th>
            <th style={{ width: "60px" }}></th>
          </tr>
        </thead>
        <tbody>
          {milestones && milestones.length > 0 ? (
            milestones.map((milestone) => (
              <tr key={milestone.milestone_id}>
                <td>{milestone.title}</td>
                <td>{milestone.details}</td>
                <td>{formatDate(milestone.date)}</td>
                <td className={styles.actionCell}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleOpenModal(milestone)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteClick(milestone)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <>
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  {t("No milestones found")}
                </td>
              </tr>
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedMilestone(null);
                      setTitle("");
                      setDetails("");
                      setDate("");
                      setModalShow(true);
                    }}
                  >
                    {t("Create Milestone")}
                  </Button>
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* edit milestone modal */}
      <Modal
        show={modalShow}
        onHide={() => setModalShow(false)}
        className={`${showBrowserModal ? styles.modalBlur : ""}`}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("Edit Milestone")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && (
            <Alert variant="danger" className="mb-3">
              {modalError}
            </Alert>
          )}
          <Form noValidate>
            <Form.Group className="mb-3">
              <Form.Label>
                {t("Title")} <span className="text-danger">*</span>
              </Form.Label>
              <div className="d-flex align-items-center">
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setModalError("");
                  }}
                  isInvalid={modalError && !title.trim()}
                />
                <Button
                  variant="link"
                  className="ms-2 p-0"
                  onClick={() => handleVoiceInput("title")}
                >
                  {isListening && currentInputField === "title" ? (
                    <FaMicrophoneSlash className="text-danger" />
                  ) : (
                    <FaMicrophone className="text-primary" />
                  )}
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                {t("Details")} <span className="text-danger">*</span>
              </Form.Label>
              <div className="d-flex align-items-start">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    setModalError("");
                  }}
                  isInvalid={modalError && !details.trim()}
                />
                <Button
                  variant="link"
                  className="ms-2 p-0"
                  onClick={() => handleVoiceInput("details")}
                >
                  {isListening && currentInputField === "details" ? (
                    <FaMicrophoneSlash className="text-danger" />
                  ) : (
                    <FaMicrophone className="text-primary" />
                  )}
                </Button>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                {t("Date")} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setModalError("");
                }}
                isInvalid={modalError && !date}
                max={
                  new Date(new Date().setFullYear(new Date().getFullYear() + 5))
                    .toISOString()
                    .split("T")[0]
                } // allow up to 5 years in the future
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setModalShow(false)}
          >
            {t("Cancel")}
          </Button>
          <Button className={styles.button} onClick={handleSaveMilestone}>
            {t("Save Changes")}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModalShow} onHide={() => setDeleteModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Confirm Deletion")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t("Are you sure you want to delete this milestone?")}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setDeleteModalShow(false)}
          >
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            {t("Delete")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MilestoneEachBaby;

// export async function getStaticPaths() {
//   // Fetch the token from localStorage on the client side
//   if (typeof window !== "undefined") {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       return {
//         paths: [],
//         fallback: false,
//       };
//     }

//     // Fetch the list of baby IDs from your custom API route
//     const res = await fetch(`/api/getBabyProfiles?token=${token}`);
//     const data = await res.json();

//     if (data.status !== "ok") {
//       return {
//         paths: [],
//         fallback: false,
//       };
//     }

//     // Generate the paths for each baby ID
//     const paths = data.babies.map((baby) => ({
//       params: { id: baby.baby_id.toString() },
//     }));

//     return {
//       paths,
//       fallback: false, // See the "fallback" section below
//     };
//   }

//   return {
//     paths: [],
//     fallback: false,
//   };
// }

export async function getServerSideProps({ params, locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      baby_id: params.id,
    },
  };
}
