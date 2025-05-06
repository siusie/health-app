import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { useReminders } from "../../context/ReminderContext";
import styles from "../../pages/baby/[id]/reminders/reminders.module.css";

const DeleteReminderModal = () => {
  const { t } = useTranslation("common");
  const {
    showDeleteModal,
    handleCloseDeleteModal,
    handleDeleteReminders
  } = useReminders();

  return (
    <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
      <Modal.Header closeButton>
        <Modal.Title>{t("Delete Reminder")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t("Are you sure? The selected reminder(s) will be deleted.")}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="light"
          className={styles.btnCancel}
          onClick={handleCloseDeleteModal}
        >
          {t("Cancel")}
        </Button>
        <Button variant="danger" onClick={handleDeleteReminders}>
          {t("Yes")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteReminderModal;
