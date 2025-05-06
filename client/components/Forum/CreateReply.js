//components/Forum/CreateReply.js
// This component allows users to create a new reply to a post in a forum. It includes a text area for the reply content and a submit button. The component uses the `useReplies` hook to manage the state and submission of the reply.
import { Form, Button } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import styles from "./CreateReply.module.css";
import { useReplies } from "../../hooks/useReplies";
import ForumToast from "@/components/Forum/ForumToast";

export function CreateReply({ postId }) {
  const { t } = useTranslation("common");
  const {
    replyContent,
    setReplyContent,
    handleReplySubmit,
    showToast,
    toastMessage,
    setShowToast,
  } = useReplies(postId);

  const onSubmit = async (e) => {
    await handleReplySubmit(e);
  };

  return (
    <>
      <Form onSubmit={onSubmit} className={styles.replyForm}>
        <Form.Group>
          <Form.Label>{t("Write a Reply")}</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={t("Write your reply here...")}
            required
          />
        </Form.Group>
        <div className={styles.submitButton}>
          <Button type="submit" variant="primary">
            {t("Submit Reply")}
          </Button>
        </div>
      </Form>

      <ForumToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message={toastMessage}
        type={"success"}
      />
    </>
  );
}
