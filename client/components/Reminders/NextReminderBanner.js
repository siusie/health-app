import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { useReminders } from "../../context/ReminderContext";
import { useTranslation } from "next-i18next";
import styles from "../../pages/baby/[id]/reminders/reminders.module.css";

const NextReminderBanner = () => {
  const { t } = useTranslation("common");
  const { nextReminder } = useReminders();

  if (!nextReminder) return null;

  return (
    <div className={styles.nextReminderBanner}>
      <div className={styles.reminderCircle}>
        <FontAwesomeIcon icon={faClock} />
      </div>
      <div className={styles.reminderContent}>
        <h3 className={styles.reminderTitle}>
          {nextReminder.reminder.title}
        </h3>
        <p className={styles.reminderSubtext}>
          {t("Next reminder due in")} {nextReminder.timeLeft} {t("at")}{" "}
          {nextReminder.formattedTime}
        </p>
      </div>
    </div>
  );
};

export default NextReminderBanner;
