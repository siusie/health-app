// pages/forum/post/[post_id]/index.js
// Displays a post and its replies
import { useRouter } from "next/router";
import { Container, Button } from "react-bootstrap";
import styles from "../../../../components/Forum/Post.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { usePost } from "../../../../hooks/usePost";
import { useReplies } from "../../../../hooks/useReplies";
import { Post } from "../../../../components/Forum/Post";
import { Reply } from "../../../../components/Forum/Reply";
import { CreateReply } from "../../../../components/Forum/CreateReply";
import TextToSpeech from "@/components/TextToSpeech/TextToSpeech";

export default function PostDetail({ post_id }) {
  const { t } = useTranslation("common");
  const router = useRouter();

  const {
    post,
    error: postError,
    isEditing,
    editTitle,
    editContent,
    startEditing,
    setEditTitle,
    setEditContent,
    handleDeleteClick,
    handleEditSubmit,
    setIsEditing,
  } = usePost(post_id);

  const {
    replies,
    error: repliesError,
    editingReplyId,
    editReplyContent,
    handleStartReplyEdit,
    handleStartReplyDelete,
    handleReplyEdit,
    handleCancelReplyEdit,
    handleReplyDelete,
    setEditReplyContent,
    fetchReplies,
  } = useReplies(post_id);

  if (!post || postError || repliesError) {
    return (
      <Container className={styles.container}>
        {!post && !postError && <div>Loading...</div>}
        {(postError || repliesError) && (
          <div className={styles.error}>{postError || repliesError}</div>
        )}
      </Container>
    );
  }

  const startEditingHandler = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setIsEditing(true);
  };

  const handleReplyEditStart = (reply) => {
    if (!reply) return;
    setEditReplyContent(reply.content);
    handleStartReplyEdit(reply);
  };

  return (
    <Container className={styles.container}>
      <Button
        variant="link"
        onClick={() => router.push("/forum")}
        className={styles.backButton}
      >
        ← {t("Back to Forum")}
      </Button>

      <Post
        post={post}
        isEditing={isEditing}
        editTitle={editTitle}
        editContent={editContent}
        editCategory={post?.category}
        onEdit={startEditingHandler}
        setEditTitle={setEditTitle}
        setEditContent={setEditContent}
        onDelete={handleDeleteClick}
        onSave={handleEditSubmit}
        onCancel={() => setIsEditing(false)}
      />
      {!isEditing && (
        <div className={styles.textToSpeechContainer}>
          <TextToSpeech
            text={`${post?.content || ""}\n\n${t("Replies")}:\n${
              replies?.length > 0
                ? replies
                    .map(
                      (reply, index) =>
                        `${t("Reply")} ${index + 1}: ${reply.content}`,
                    )
                    .join("\n\n")
                : t("No replies")
            }`}
            title={post?.title || ""}
          />
        </div>
      )}

      <div className={styles.repliesSection}>
        <h5>
          <br />
          {t("Replies")} ({replies?.length || 0})
        </h5>
        {replies?.map((reply) => (
          <Reply
            key={reply.reply_id}
            reply={reply}
            isEditing={editingReplyId === reply.reply_id}
            editContent={editReplyContent}
            onEdit={() => handleReplyEditStart(reply)}
            onDelete={() => handleReplyDelete(reply.reply_id)}
            onSave={() => handleReplyEdit(reply.reply_id)}
            onCancel={handleCancelReplyEdit}
            setEditContent={setEditReplyContent}
          />
        ))}
        <CreateReply postId={post_id} onReplyCreated={fetchReplies} />
      </div>
    </Container>
  );
}

export async function getServerSideProps({ params, locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      post_id: params.post_id,
    },
  };
}
