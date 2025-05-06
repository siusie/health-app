import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "next-i18next";
import { useReminders } from "../../context/ReminderContext";
import styles from "../../pages/baby/[id]/reminders/reminders.module.css";

const EmptyState = () => {
  const { t } = useTranslation("common");
  const { handleShowAddModal } = useReminders();

  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.emptyStateContent}>
        <FontAwesomeIcon icon={faClock} className={styles.emptyStateIcon} />
        <h3>{t("No reminders yet")}</h3>
        <p>{t("Create your first reminder to get started")}</p>
        <Button
          variant="light"
          className={styles.btnSave}
          onClick={handleShowAddModal}
        >
          {t("Add Reminder")}
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
