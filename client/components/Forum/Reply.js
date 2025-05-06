// components/Forum/Reply.js
// This is a component that display a single existing reply. It handles:
//  - Displaying reply content
//  - Editing existing replies
//  - Deleting replies
//  - Showing metadata about the reply
import { Card, Button, Form, Modal } from "react-bootstrap";
import { useState } from "react";
import styles from "./Reply.module.css";
import { useTranslation } from "next-i18next";
import ForumToast from "@/components/Forum/ForumToast";

export function Reply({
  reply,
  isEditing,
  editContent,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  setEditContent,
}) {
  const { t } = useTranslation("common");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleContentChange = (e) => {
    setEditContent && setEditContent(e.target.value);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const showToast = (message) => {
    setToastMessage(message);
    setShowSuccessToast(true);
  };

  const handleSave = async () => {
    try {
      await onSave();
      showToast(t("Reply has been saved!"));
    } catch (error) {
      showToast(t("Error saving reply"));
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setShowDeleteModal(false);
      await onDelete(reply.reply_id);
      showToast(t("Reply has been deleted!"));
    } catch (error) {
      showToast(t("Error deleting reply"));
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleCancel = () => {
    // Reset edit content
    setEditContent("");
    // Call parent's cancel handler
    onCancel();
  };

  return (
    <>
      <Card className={styles.replyCard}>
        <Card.Body>
          {reply.is_owner && !isEditing && (
            <div className={styles.replyActions}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={onEdit}
                className={styles.editButton}
              >
                {t("Edit")}
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleDeleteClick}
                className={styles.deleteButton}
              >
                {t("Delete")}
              </Button>
            </div>
          )}
          {isEditing ? (
            <>
              <Form.Control
                as="textarea"
                rows={3}
                value={editContent || ""}
                onChange={handleContentChange}
                className={styles.editContentInput}
              />
              <div className={styles.editButtons}>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleSave}
                  className={styles.editActionButton}
                >
                  {t("Save")}
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleCancel}
                  className={styles.editActionButton}
                >
                  {t("Cancel")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Card.Text>{reply.content}</Card.Text>
              <div className={styles.replyMetadata}>
                <small>
                  {t("Posted by")}: {reply.author} on{" "}
                  {new Date(reply.created_at).toLocaleDateString()} at{" "}
                  {new Date(reply.created_at).toLocaleTimeString()}
                </small>
                {reply.updated_at && reply.updated_at !== reply.created_at && (
                  <small className={styles.editedText}>
                    <i>
                      {t(" Last edited")}:{" "}
                      {new Date(reply.updated_at).toLocaleDateString()} at{" "}
                      {new Date(reply.updated_at).toLocaleTimeString()}
                    </i>
                  </small>
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showDeleteModal} onHide={handleDeleteCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Confirm Delete")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t(
            "Are you sure you want to delete this reply? This action cannot be undone.",
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteCancel}>
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            {t("Delete")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ForumToast
        show={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        message={toastMessage}
        type={"success"}
      />
    </>
  );
}
