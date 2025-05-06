import { Button } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { useReminders } from "../../context/ReminderContext";
import styles from "../../pages/baby/[id]/reminders/reminders.module.css";

const Header = () => {
  const { t } = useTranslation("common");
  const {
    deleteMode,
    reminders,
    handleShowAddModal,
    toggleDeleteMode,
    handleShowDeleteModal,
  } = useReminders();

  return (
    <div className={styles.headerRow}>
      <h2 className={styles.title}>{t("Reminders")}</h2>
      <div className={styles.headerActions}>
        <Button
          variant="light"
          className={styles.btnSave}
          onClick={handleShowAddModal}
        >
          {t("Add")}
        </Button>
        <Button
          variant="light"
          className={deleteMode ? styles.btnActive : styles.btnCancel}
          onClick={toggleDeleteMode}
        >
          {t("Delete")}
        </Button>
        {deleteMode && (
          <Button
            variant="light"
            className={styles.btnDelete}
            onClick={handleShowDeleteModal}
            disabled={!reminders.some((r) => r.selected)}
          >
            {t("Confirm Delete")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
