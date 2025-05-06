// components/Forum/Post.js
// This component displays a single post in the forum
// It includes the post title, content, metadata, and actions (edit, delete)
import { Card, Button, Form, Modal } from "react-bootstrap";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import styles from "./Post.module.css";
import { useTranslation } from "next-i18next";
import { useState, useEffect } from "react";
import CategorySelector from "@/components/ForumCategories/ForumCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import useSpeechToText from "@/hooks/useSpeechToText";
import TextToSpeech from "@/components/TextToSpeech/TextToSpeech";
import ForumToast from "@/components/Forum/ForumToast";

// Remove debug logging from ViewOnlyEditor
function ViewOnlyEditor({ content, key }) {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: true,
        }),
        Underline,
      ],
      content,
      editable: false,
      onCreate: () => setMounted(true),
      immediatelyRender: false,
    },
    [content],
  );

  // Force content update when it changes
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!mounted || !editor) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <EditorContent editor={editor} />;
}

export function Post({
  post,
  isEditing,
  editTitle,
  editContent,
  editCategory,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  setEditTitle,
  setEditContent,
}) {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [editCategoryState, setEditCategoryState] = useState(
    post?.category || null,
  );
  const [selectedInput, setSelectedInput] = useState(null);

  // Create editor instance with proper editable state
  const editor = useEditor(
    {
      extensions: [StarterKit, Link, Underline],
      content: isEditing ? editContent : post?.content,
      editable: isEditing,
      onCreate: () => setMounted(true),
    },
    [isEditing],
  );

  // Update editor's editable state when isEditing changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
      if (isEditing) {
        editor.commands.setContent(post.content);
      }
    }
  }, [editor, isEditing, post.content]);

  // Keep existing cleanup effect
  useEffect(() => {
    setMounted(true);
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!mounted || !post) {
    return <div>Loading...</div>;
  }

  const handleEditChange = (e) => {
    setEditTitle && setEditTitle(e.target.value);
  };

  const handleEditClick = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategoryState(post.category);
    onEdit();
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setShowDeleteModal(false);
      await onDelete();
      setShowSuccessToast(true);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleSave = () => {
    const currentContent = editor.getHTML();
    onSave(editTitle, currentContent, editCategoryState);
  };

  return (
    <>
      <Card className={styles.postDetailCard}>
        <Card.Body>
          {/* Add buttons at the top level of Card.Body */}
          {post.is_owner && !isEditing && (
            <div className={styles.postActions}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleEditClick}
                className={styles.editButton}
              >
                {t("Edit Post")}
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleDeleteClick}
                className={styles.deleteButton}
              >
                {t("Delete Post")}
              </Button>
            </div>
          )}

          <div className={styles.postHeader}>
            {isEditing ? (
              <>
                <div className="d-flex align-items-center mb-3">
                  <Form.Control
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={styles.editTitleInput}
                  />
                </div>
                <div className={styles.categorySelector}>
                  <Form.Label>{t("Category (optional)")}</Form.Label>
                  <CategorySelector
                    selectedCategory={editCategoryState}
                    setCategory={setEditCategoryState}
                  />
                </div>
                <div className={styles.editor}>
                  <div className={styles.toolbar}>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={
                        editor?.isActive("bold") ? styles.isActive : ""
                      }
                    >
                      Bold
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                      }
                      className={
                        editor?.isActive("italic") ? styles.isActive : ""
                      }
                    >
                      Italic
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                      }
                      className={
                        editor?.isActive("underline") ? styles.isActive : ""
                      }
                    >
                      Underline
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                      }
                      className={
                        editor?.isActive("bulletList") ? styles.isActive : ""
                      }
                    >
                      Bullet List
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                      }
                      className={
                        editor?.isActive("orderedList") ? styles.isActive : ""
                      }
                    >
                      Ordered List
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt("Enter the URL:");
                        if (url) {
                          editor.chain().focus().setLink({ href: url }).run();
                        }
                      }}
                      className={
                        editor?.isActive("link") ? styles.isActive : ""
                      }
                    >
                      Link
                    </button>
                  </div>
                  <EditorContent
                    editor={editor}
                    className={styles.editorContent}
                  />
                </div>
                {isEditing && (
                  <div className={styles.formActions}>
                    <div className={styles.leftActions}>
                      <TextToSpeech
                        text={editor?.getHTML() || ""}
                        title={editTitle || ""}
                      />
                    </div>
                    <div className={styles.rightActions}>
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
                          onClick={onCancel}
                          className={styles.editActionButton}
                        >
                          {t("Cancel")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.postTitleContainer}>
                  <Card.Title className={styles.postTitle}>
                    {post.title}
                  </Card.Title>
                  {post.category && (
                    <div className={styles.categoryBadge}>
                      {t(post.category)}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {!isEditing ? (
            <div className={styles.postContent}>
              <ViewOnlyEditor
                content={post.content}
                key={post.updated_at || "initial"}
              />
            </div>
          ) : null}
          <div className={styles.postMetadata}>
            <div className={styles.metadataContainer}>
              <small>
                {t("Posted by")}: {post.display_name} on{" "}
                {new Date(post.created_at).toLocaleDateString()} at{" "}
                {new Date(post.created_at).toLocaleTimeString()}
              </small>
              {post.updated_at && post.updated_at !== post.created_at && (
                <small>
                  <i className={styles.editedText}>
                    {t("Last edited")}:{" "}
                    {new Date(post.updated_at).toLocaleDateString()} at{" "}
                    {new Date(post.updated_at).toLocaleTimeString()}
                  </i>
                </small>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      <Modal show={showDeleteModal} onHide={handleDeleteCancel}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Confirm Delete")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t(
            "Are you sure you want to delete this post? This action cannot be undone.",
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
        message={t("Post successfully deleted")}
        type="success"
      />
    </>
  );
}
