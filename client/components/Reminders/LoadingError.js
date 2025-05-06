import { Button } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { useReminders } from "../../context/ReminderContext";
import styles from "../../pages/baby/[id]/reminders/reminders.module.css";

const LoadingError = () => {
  const { t } = useTranslation("common");
  const { loading, error, fetchReminders } = useReminders();

  if (loading) {
    return (
      <div className={styles.noDataContainer}>
        <p>{t("Loading...")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.noDataContainer}>
        <p className={styles.errorText}>{error}</p>
        <Button
          variant="light"
          className={styles.btnSave}
          onClick={fetchReminders}
        >
          {t("Try Again")}
        </Button>
      </div>
    );
  }

  return null;
};

export default LoadingError;
