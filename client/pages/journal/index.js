// pages/journal/index.js
import { useForm } from "react-hook-form";
import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Row,
  Col,
  Card,
  Modal,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import styles from "./journal.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import useSpeechToText from "@/hooks/useSpeechToText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import IncompatibleBrowserModal from "@/components/IncompatibleBrowserModal";
import TextToSpeech from "@/components/TextToSpeech/TextToSpeech";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import JournalEntryTags from "@/components/JournalEntryTags/JournalEntryTags";

// View-only editor for displaying rich text in journal entries
const ViewOnlyEditor = ({ content }) => {
  const editor = useEditor(
    {
      extensions: [StarterKit, Link, Image, Underline],
      content: content,
      editable: false,
      editorProps: {
        attributes: {
          class: "view-only-editor",
        },
      },
      enableCoreExtensions: true,
    },
    [content],
  );

  return <EditorContent editor={editor} />;
};

export default function Journal() {
  const { t } = useTranslation("common");
  const { register, handleSubmit, reset } = useForm();
  const [entries, setEntries] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [text, setText] = useState("");
  const [titleText, setTitleText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [selectedInput, setSelectedInput] = useState(null);
  const [editSelectedInput, setEditSelectedInput] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterTags, setFilterTags] = useState([]); // Filter tags for search
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    showIncompatibleModal,
    setShowIncompatibleModal,
  } = useSpeechToText({
    continuous: true,
    interimResults: true,
    lang: "en-US",
  });

  const startStopListening = (e, inputType) => {
    e.preventDefault();

    // Check if using Firefox only when button is clicked
    const isFirefox =
      typeof window !== "undefined" &&
      navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

    if (isListening) {
      stopVoiceInput();
    } else {
      setSelectedInput(inputType);
      startListening();
    }
  };

  const stopVoiceInput = () => {
    // Determine which input field to update
    if (selectedInput === "title") {
      const newTitleValue =
        titleText +
        (transcript.length ? (titleText.length ? " " : "") + transcript : "");
      setTitleText(newTitleValue);
      register("title").onChange({ target: { value: newTitleValue } });
    } else if (selectedInput === "search") {
      const newSearchValue =
        searchTerm +
        (transcript.length ? (searchTerm.length ? " " : "") + transcript : "");
      setSearchTerm(newSearchValue);
    } else {
      const newTextValue = transcript.length
        ? (text.length ? " " : "") + transcript
        : "";

      setText(newTextValue);
      // Update the editor content. Otherwise, the rich text editor will not be updated with the transcript from speech-to-text
      editor?.commands.setContent(newTextValue);
      register("text").onChange({ target: { value: newTextValue } });
    }
    stopListening();
    setSelectedInput(null);
  };

  const startStopListeningEdit = (e, inputType) => {
    e.preventDefault();

    if (isListening) {
      stopVoiceInputEdit();
    } else {
      setEditSelectedInput(inputType);
      startListening();
    }
  };

  const stopVoiceInputEdit = () => {
    if (editSelectedInput === "title") {
      setEditedEntry({
        ...editedEntry,
        title:
          editedEntry.title +
          (transcript.length
            ? (editedEntry.title.length ? " " : "") + transcript
            : ""),
      });
    } else {
      const newText = transcript.length
        ? (editedEntry.text.length ? " " : "") + transcript
        : "";
      setEditedEntry({
        ...editedEntry,
        text: newText,
      });
      // Update the edit editor content. Otherwise, the rich text editor will not be updated with the transcript from speech-to-text
      editEditor?.commands.setContent(newText);
    }
    stopListening();
    setEditSelectedInput(null);
  };

  // Fetch journal entries
  useEffect(() => {
    const fetchEntries = async () => {
      // Get all journal entries
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/journal`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (response.ok) {
          const journalEntryArray = Object.keys(data)
            .filter((key) => key !== "status")
            .map((key) => data[key])
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // sort by newest date first
          setEntries(journalEntryArray);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching journal entries:", error);
      }
    };

    fetchEntries();
  }, []);

  // Submit journal entry
  const onSubmit = async (data) => {
    try {
      if (text.trim() === "") return;

      const formData = new FormData();
      formData.append("title", titleText);
      formData.append("text", text);
      formData.append("date", new Date().toISOString());
      formData.append("tags", JSON.stringify(selectedTags));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/journal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (res.ok) {
        const newEntry = await res.json();
        setEntries([newEntry, ...entries]);

        // Reset form and state
        reset();
        setText("");
        setTitleText("");
        setSelectedTags([]);
        setFilePreview(null);
        // Clear the editor content after submission
        editor?.commands.clearContent();

        // Show success toast
        setToastMessage(t("Journal entry created successfully"));
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error submitting journal entry:", error);
      // Show error toast
      setToastMessage(t("Error creating journal entry"));
      setShowToast(true);
    }
  };

  // Fetch selected journal entry details
  const fetchEntryDetails = async (entryId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/journal/${entryId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Round to seconds for comparison. Otherwise the timestamps may differ by milliseconds and appear as if the entry was edited when it wasn't.
        const updatedTime = Math.floor(
          new Date(data.updated_at).getTime() / 1000,
        );
        const createdTime = Math.floor(new Date(data.date).getTime() / 1000);

        setSelectedEntry({
          ...data,
          last_edited: updatedTime > createdTime ? data.updated_at : null,
        });
      } else {
        console.error("Error fetching entry details");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Event handler for updating an entry
  const handleUpdate = async () => {
    if (!editedEntry || !selectedEntry) return;

    // Validate empty values
    if (!editedEntry.title?.trim() || !editedEntry.text?.trim()) {
      alert(t("Title and content cannot be empty"));
      return;
    }

    // Check if data was modified
    if (
      editedEntry.title === selectedEntry.title &&
      editedEntry.text === selectedEntry.text &&
      JSON.stringify(editedEntry.tags) === JSON.stringify(selectedEntry.tags)
    ) {
      setIsEditing(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const currentTime = new Date().toISOString();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/journal/${selectedEntry.entry_id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editedEntry.title.trim(),
            text: editedEntry.text.trim(),
            tags: editedEntry.tags || [],
            updated_at: currentTime,
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();

        // Update with the last_edited timestamp and tags
        const updatedEntry = {
          ...selectedEntry,
          ...result.data,
          tags: result.data.tags || [],
          last_edited: result.data.updated_at,
        };

        setSelectedEntry(updatedEntry);
        // Update the entry in the entries list
        setEntries(
          entries.map((entry) =>
            entry.entry_id === updatedEntry.entry_id ? updatedEntry : entry,
          ),
        );
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating entry:", error);
    }
  };

  // Handle delete entry
  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token || !selectedEntry) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/journal/${selectedEntry.entry_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Remove the entry from the entries list
        setEntries(
          entries.filter((entry) => entry.entry_id !== selectedEntry.entry_id),
        );
        setShowDeleteModal(false);
        alert("Reply successfully deleted");
        setShowModal(false);
        setDeleteConfirmed(false);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  // For image preview (not implemented currently)
  // const handleFileChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     setFilePreview(URL.createObjectURL(file));
  //   } else {
  //     setFilePreview(null);
  //   }
  // };

  // Filter entries based on search term and selected tags
  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      entry.title.toLowerCase().includes(searchLower) ||
      entry.text.toLowerCase().includes(searchLower);

    // If no tag filters are selected, only use text search
    if (filterTags.length === 0) {
      return matchesSearch;
    }

    // If tag filters are selected, entry must match search AND have ALL selected tags
    const hasAllTags = filterTags.every(
      (filterTag) => entry.tags && entry.tags.includes(filterTag),
    );

    return matchesSearch && hasAllTags;
  });

  // Rich text editor for creating an entry
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: false,
        }),
        Image,
        Underline,
      ],
      content: "", // Set initial content as empty string
      onUpdate: ({ editor }) => {
        setText(editor.getHTML());
      },
      immediatelyRender: false,
      enableCoreExtensions: true,
      editorProps: {
        attributes: {
          class: "main-editor",
        },
      },
    },
    [],
  );

  // Rich text editor for editing an entry
  const editEditor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Underline,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setEditedEntry((prev) => ({ ...prev, text: editor.getHTML() }));
    },
    immediatelyRender: false,
    enableCoreExtensions: true,
    editorProps: {
      attributes: {
        class: "edit-modal-editor",
      },
    },
  });

  // Update the editor content when editing an entry
  useEffect(() => {
    if (editEditor && isEditing && selectedEntry) {
      editEditor.commands.setContent(selectedEntry.text);
    }
  }, [isEditing, selectedEntry, editEditor]);

  // For speech-to-text: update the text content when speech-to-text is active
  useEffect(() => {
    if (isListening && transcript) {
      // For main editor
      if (selectedInput === "text") {
        // Get only the new words by removing the existing text from transcript
        const existingWords = text.toLowerCase().split(/\s+/);
        const transcriptWords = transcript.toLowerCase().split(/\s+/);
        const newWords = transcriptWords.filter(
          (word) => !existingWords.includes(word),
        );

        // Only append new words
        if (newWords.length > 0) {
          const newTextValue = text + (text ? " " : "") + newWords.join(" ");
          setText(newTextValue);
          editor?.commands.setContent(newTextValue);
        }
      }
      // For edit modal editor
      else if (editSelectedInput === "text" && editedEntry) {
        const existingWords = editedEntry.text.toLowerCase().split(/\s+/);
        const transcriptWords = transcript.toLowerCase().split(/\s+/);
        const newWords = transcriptWords.filter(
          (word) => !existingWords.includes(word),
        );

        if (newWords.length > 0) {
          const newText =
            editedEntry.text +
            (editedEntry.text ? " " : "") +
            newWords.join(" ");
          setEditedEntry((prev) => ({ ...prev, text: newText }));
          editEditor?.commands.setContent(newText);
        }
      }
    }
  }, [
    transcript,
    isListening,
    selectedInput,
    editSelectedInput,
    editEditor?.commands,
    editedEntry,
    editor?.commands,
    text,
  ]);

  return (
    <>
      <Container className={styles.container} fluid>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>{t("My Journal")}</h1>
          <hr />
          <p className={styles.subtitle}>Record your thoughts...</p>
          {/* Create journal entry modal */}
          <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
            <Row className="mb-3">
              <Col className="d-flex">
                <Form.Control
                  type="text"
                  placeholder={t("Title")}
                  required
                  {...register("title", { value: titleText })}
                  className="form-control"
                  disabled={isListening}
                  value={
                    isListening && selectedInput === "title"
                      ? titleText + (transcript || "")
                      : titleText
                  }
                  onChange={(e) => {
                    setTitleText(e.target.value);
                    register("title").onChange(e);
                  }}
                />
                <button
                  onClick={(e) => startStopListening(e, "title")}
                  className={`${styles.microphone} btn-sm ms-2`}
                >
                  <FontAwesomeIcon
                    icon={
                      isListening && selectedInput === "title"
                        ? faMicrophoneSlash
                        : faMicrophone
                    }
                    size="sm"
                  />
                </button>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <JournalEntryTags
                  selectedTags={selectedTags}
                  setTags={setSelectedTags}
                  disabled={isListening}
                />
              </Col>
            </Row>
            <Row className="mb-3">
              <Col>
                <div className={styles.editor}>
                  <div
                    className={`${styles.toolbar} ${
                      isListening ? styles.disabledEditor : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={
                        editor?.isActive("bold") ? styles.isActive : ""
                      }
                    >
                      {t("Bold")}
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
                      {t("Italic")}
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
                      {t("Underline")}
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
                      {t("Bullet")} List
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
                      {t("Ordered")} List
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
                      {t("Link")}
                    </button>
                  </div>
                  <div className={isListening ? styles.disabledEditor : ""}>
                    <EditorContent editor={editor} />
                  </div>
                </div>
                {/* Text-to-speech for create mode */}
              </Col>
            </Row>
            <Row className={styles.postRow}>
              <Col className="d-flex justify-content-between align-items-center gap-2">
                <div>
                  <TextToSpeech text={text} title={titleText} />
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    className={`${styles.submitButton} btn-sm`}
                  >
                    {t("Post")}
                  </Button>
                  <button
                    onClick={(e) => startStopListening(e, "text")}
                    className={`${styles.microphone} btn-sm`}
                  >
                    <FontAwesomeIcon
                      icon={
                        isListening && selectedInput === "text"
                          ? faMicrophoneSlash
                          : faMicrophone
                      }
                      size="sm"
                    />
                  </button>
                </div>
              </Col>
            </Row>
          </Form>

          <hr />

          {/* Display saved journal entries */}
          <h1 className={styles.title}>{t("Journal Entries")}</h1>
          <Form.Group className="mb-3">
            {/* search bar */}
            <div className="d-flex">
              <Form.Control
                type="text"
                placeholder={t("Search entries...")}
                value={
                  isListening && selectedInput === "search"
                    ? searchTerm + (transcript || "")
                    : searchTerm
                }
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-3"
                disabled={isListening}
              />
              <button
                onClick={(e) => startStopListening(e, "search")}
                className={`${styles.microphone} btn-sm ms-2`}
              >
                <FontAwesomeIcon
                  icon={
                    isListening && selectedInput === "search"
                      ? faMicrophoneSlash
                      : faMicrophone
                  }
                  size="sm"
                />
              </button>
            </div>

            {/* Tag filter */}
            <div className="mb-3">
              <small className="text-muted mb-2 d-block">
                {t("Filter by tags:")}
              </small>
              <JournalEntryTags
                selectedTags={filterTags}
                setTags={setFilterTags}
                disabled={isListening}
              />
            </div>
            {(searchTerm || filterTags.length > 0) && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterTags([]);
                }}
                className="mt-2"
              >
                {t("Clear all filters")}
              </Button>
            )}
          </Form.Group>
          <div className={styles.entriesSection}>
            {filteredEntries.length === 0 ? (
              <p className="text-muted text-center">
                {searchTerm || filterTags.length > 0
                  ? t("No entries match your search and tag filters.")
                  : t("No journal entries found.")}
              </p>
            ) : (
              filteredEntries.map((entry, idx) => (
                <div key={idx} className={styles.entryCardContainer}>
                  <Card
                    key={entry.entry_id}
                    className={`${styles.entryCard} shadow-sm`}
                    onClick={() => {
                      setShowModal(true);
                      fetchEntryDetails(entry.entry_id);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <Card.Body>
                      <Card.Title className={styles.entryCardTitle}>
                        {entry.title}
                      </Card.Title>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className={styles.tagList}>
                          {entry.tags.map((tag, idx) => (
                            <span key={idx} className={styles.tag}>
                              #{t(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                      <Card.Text
                        className={styles.entryCardText}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <ViewOnlyEditor content={entry.text} />
                      </Card.Text>

                      {entry.image && (
                        <Image
                          src={entry.image}
                          alt="journal entry"
                          className={styles.tableImg}
                        />
                      )}
                      <Card.Footer className={styles.entryCardFooter}>
                        <div>
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          {new Date(entry.date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          })}
                          {entry.updated_at &&
                            (() => {
                              // Round to seconds for comparison so that the updated_at timestamp is not considered different if it differs by milliseconds from the created_at timestamp
                              const updatedTime = Math.floor(
                                new Date(entry.updated_at).getTime() / 1000,
                              );
                              const createdTime = Math.floor(
                                new Date(entry.date).getTime() / 1000,
                              );

                              return (
                                updatedTime > createdTime && (
                                  <span className="ms-2">
                                    <i style={{ color: "#666666" }}>
                                      &bull; &nbsp;{t("Last edited:")}{" "}
                                      {new Date(
                                        entry.updated_at,
                                      ).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                        hour12: true,
                                      })}
                                    </i>
                                  </span>
                                )
                              );
                            })()}
                        </div>
                      </Card.Footer>
                    </Card.Body>
                  </Card>
                  {/* Text-to-speech for saved journal entries */}
                  <TextToSpeech text={entry.text} title={entry.title} />
                </div>
              ))
            )}
          </div>
        </div>
      </Container>

      {/* Journal entry details and edit journal entry modals */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setIsEditing(false);
          setEditedEntry(null);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          {isEditing ? (
            <div className="d-flex w-100 align-items-center">
              <Form.Control
                type="text"
                value={
                  isListening && editSelectedInput === "title"
                    ? editedEntry?.title + (transcript || "")
                    : editedEntry?.title || ""
                }
                required
                onChange={(e) =>
                  setEditedEntry({ ...editedEntry, title: e.target.value })
                }
                className={`border-0 h4 flex-grow-1 me-2 ${
                  editedEntry?.title?.trim() === "" ? "is-invalid" : ""
                }`}
                disabled={isListening}
              />
              <button
                onClick={(e) => startStopListeningEdit(e, "title")}
                className={`${styles.microphone} btn-sm`}
              >
                <FontAwesomeIcon
                  icon={
                    isListening && editSelectedInput === "title"
                      ? faMicrophoneSlash
                      : faMicrophone
                  }
                  size="sm"
                />
              </button>
            </div>
          ) : (
            <Modal.Title>{selectedEntry?.title}</Modal.Title>
          )}
        </Modal.Header>
        <Modal.Body>
          {isEditing ? (
            <div>
              <div className={styles.editor}>
                <div
                  className={`${styles.toolbar} ${
                    isListening ? styles.disabledEditor : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      editEditor.chain().focus().toggleBold().run()
                    }
                    className={
                      editEditor?.isActive("bold") ? styles.isActive : ""
                    }
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editEditor.chain().focus().toggleItalic().run()
                    }
                    className={
                      editEditor?.isActive("italic") ? styles.isActive : ""
                    }
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editEditor.chain().focus().toggleUnderline().run()
                    }
                    className={
                      editEditor?.isActive("underline") ? styles.isActive : ""
                    }
                  >
                    Underline
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editEditor.chain().focus().toggleBulletList().run()
                    }
                    className={
                      editEditor?.isActive("bulletList") ? styles.isActive : ""
                    }
                  >
                    Bullet List
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      editEditor.chain().focus().toggleOrderedList().run()
                    }
                    className={
                      editEditor?.isActive("orderedList") ? styles.isActive : ""
                    }
                  >
                    Ordered List
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt("Enter the URL:");
                      if (url) {
                        editEditor.chain().focus().setLink({ href: url }).run();
                      }
                    }}
                    className={
                      editEditor?.isActive("link") ? styles.isActive : ""
                    }
                  >
                    Link
                  </button>
                </div>
                <div className="d-flex">
                  <div
                    className={`flex-grow-1 ${
                      isListening ? styles.disabledEditor : ""
                    }`}
                  >
                    <EditorContent editor={editEditor} />
                  </div>
                  <button
                    onClick={(e) => startStopListeningEdit(e, "text")}
                    className={`${styles.microphone} btn-sm ms-2 align-self-start`}
                  >
                    <FontAwesomeIcon
                      icon={
                        isListening && editSelectedInput === "text"
                          ? faMicrophoneSlash
                          : faMicrophone
                      }
                      size="sm"
                    />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <JournalEntryTags
                  selectedTags={editedEntry?.tags || []}
                  setTags={(tags) => setEditedEntry({ ...editedEntry, tags })}
                  disabled={isListening}
                />
              </div>
              {/* TextToSpeech for edit mode */}
              <TextToSpeech
                text={editedEntry?.text || ""}
                title={editedEntry?.title || ""}
              />
            </div>
          ) : (
            <div>
              <div className={styles.modalText}>
                <ViewOnlyEditor content={selectedEntry?.text} />
              </div>
              {selectedEntry?.tags && selectedEntry.tags.length > 0 && (
                <div className={styles.tagList} style={{ marginTop: "1rem" }}>
                  {selectedEntry.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {/* TextToSpeech for view mode */}
              <TextToSpeech
                text={selectedEntry?.text || ""}
                title={selectedEntry?.title || ""}
              />
            </div>
          )}
          <div className={styles.modalFooter}>
            {selectedEntry && (
              <small className="text-muted">
                {new Date(selectedEntry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}{" "}
                {new Date(selectedEntry.date).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                })}
                {selectedEntry.last_edited &&
                  selectedEntry.last_edited !== selectedEntry.date && (
                    <span className="ms-2">
                      <i style={{ color: "#666666" }}>
                        &bull; &nbsp;{t("Last edited:")}{" "}
                        {new Date(selectedEntry.last_edited).toLocaleString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          },
                        )}
                      </i>
                    </span>
                  )}
              </small>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          {isEditing ? (
            <div className="w-100 d-flex justify-content-end">
              <Button
                variant="light"
                onClick={() => {
                  setIsEditing(false);
                  setEditedEntry(null);
                }}
                className="border border-secondary"
              >
                {t("Cancel")}
              </Button>
              &nbsp;
              <Button variant="primary" onClick={handleUpdate} className="me-2">
                {t("Save Changes")}
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setDeleteConfirmed(false);
                  }}
                >
                  {t("Delete")}
                </Button>
              </div>
              <div>
                <Button
                  variant="light"
                  onClick={() => setShowModal(false)}
                  className="border border-secondary"
                >
                  {t("Close")}
                </Button>
                &nbsp;
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditedEntry({
                      ...selectedEntry,
                      tags: selectedEntry.tags || [],
                    });
                    setIsEditing(true);
                  }}
                  className={`${styles.button} me-2`}
                >
                  {t("Edit Entry")}
                </Button>
              </div>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteConfirmed(false); // Reset checkbox when modal is closed
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("Confirm Delete")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t("Are you sure you want to delete this journal entry?")}</p>
          <Form.Check
            type="checkbox"
            id="delete-confirm-checkbox"
            label={t("I understand that this action cannot be undone")}
            checked={deleteConfirmed}
            onChange={(e) => setDeleteConfirmed(e.target.checked)}
            className="mt-3"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteConfirmed(false);
            }}
          >
            {t("Cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!deleteConfirmed}
          >
            {t("Delete")}
          </Button>
        </Modal.Footer>
      </Modal>

      <IncompatibleBrowserModal
        show={showIncompatibleModal}
        onHide={() => setShowIncompatibleModal(false)}
      />

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <strong className="me-auto">{t("Notification")}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
