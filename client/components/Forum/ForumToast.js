// components/Forum/ForumToast.js
// This is a component for displaying toast notifications in the forum
// It shows success or error messages based on the type of notification
import styles from "./ForumToast.module.css";
import { useEffect } from "react";

const ForumToast = ({ show, message, type, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show || !message) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toastMessage}>
        <div
          className={`${styles.toastIconCircle} ${
            type === "error" ? styles.error : ""
          }`}
        >
          {type === "success" ? "✓" : "✗"}
        </div>
        {message}
        <button className={styles.toastClose} onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default ForumToast;
