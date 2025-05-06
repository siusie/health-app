import { useReminders } from "../../context/ReminderContext";
import styles from "../../pages/baby/[id]/reminders/reminders.module.css";

const ToastMessage = () => {
  const { toastMessage, setToastMessage } = useReminders();

  if (!toastMessage) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toastMessage}>
        <div
          className={`${styles.toastIconCircle} ${
            toastMessage.type === "error" ? styles.error : ""
          }`}
        >
          {toastMessage.type === "success" ? "✓" : "✗"}
        </div>
        {toastMessage.message}
        <button
          className={styles.toastClose}
          onClick={() => setToastMessage(null)}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ToastMessage;
