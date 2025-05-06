// pages/forum/index.js
import { useForm } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Container, Form, Button, Row, Col, Card } from "react-bootstrap";
import styles from "./forum.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import useSpeechToText from "@/hooks/useSpeechToText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
} from "@fortawesome/free-solid-svg-icons";
import TextToSpeech from "@/components/TextToSpeech/TextToSpeech";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import CategorySelector from "@/components/ForumCategories/ForumCategories";
import ForumToast from "@/components/Forum/ForumToast";

// View-only editor for displaying rich text in posts and replies
function ViewOnlyEditor({ content }) {
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
    },
    [content],
  );

  // Only render editor content after mounting
  if (!mounted || !editor) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <EditorContent editor={editor} />;
}

export default function Forum() {
  const { t } = useTranslation("common");
  const { register, handleSubmit, reset, setValue } = useForm();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const router = useRouter();
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [titleText, setTitleText] = useState("");
  const [selectedInput, setSelectedInput] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // const { isListening, transcript, startListening, stopListening } =
  //   useSpeechToText({
  //     continuous: true,
  //     interimResults: true,
  //     lang: "en-US",
  //   });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Underline,
    ],
    content: "",
    onCreate: ({ editor }) => {
      // Initialize with empty content
      editor.commands.setContent("");
    },
    onUpdate: ({ editor }) => {
      setText(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "main-editor",
      },
    },
  });

  //// Speech recognition
  // const startStopListening = (e, inputType) => {
  //   e.preventDefault();
  //   if (isListening) {
  //     stopVoiceInput(inputType);
  //   } else {
  //     setSelectedInput(inputType);
  //     startListening();
  //   }
  // };

  // const stopVoiceInput = (inputType) => {
  //   if (transcript) {
  //     if (inputType === "title") {
  //       const newTitle = titleText + " " + transcript.trim();
  //       setTitleText(newTitle);
  //       setValue("title", newTitle);
  //     } else if (inputType === "content" && editor) {
  //       // Insert text at current cursor position instead of setting entire content
  //       editor.commands.insertContent(transcript.trim());
  //     }
  //   }
  //   stopListening();
  //   setSelectedInput(null);
  // };

  const handleTitleChange = (e) => {
    setTitleText(e.target.value);
    setValue("title", e.target.value);
  };

  const fetchPosts = async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const postsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (postsResponse.ok) {
        const response = await postsResponse.json();
        if (response.status === "ok" && Array.isArray(response.data)) {
          setPosts(response.data);
        }
      }
    } catch (error) {
      setError("Failed to fetch posts");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onSubmit = async (data) => {
    try {
      const editorContent = editor?.getHTML() || "";
      if (!editorContent.trim()) return;

      const postData = {
        title: data.title.trim(),
        content: editorContent.trim(),
        category: selectedCategory || null,
        date: new Date().toISOString(),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(postData),
        },
      );

      if (res.status === 201) {
        // Clear form
        reset();
        editor?.commands.setContent("");
        setTitleText("");
        setSelectedCategory("");

        // Show success toast
        setToastMessage({
          type: "success",
          message: t("Post created successfully!"),
        });

        // Hide toast after 5 seconds
        setTimeout(() => {
          setToastMessage(null);
        }, 5000);

        // Update posts state and fetch fresh data
        await fetchPosts();
      } else {
        const errorText = await res.text();
        setToastMessage({
          type: "error",
          message: t("Failed to add post: ") + errorText,
        });
      }
    } catch (error) {
      setToastMessage({
        type: "error",
        message: t("Error creating post: ") + error.message,
      });
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.display_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <Container className={styles.container} fluid>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>{t("Community Forum")}</h1>

        <Card className="mb-4">
          <Card.Header className={styles.createPostHeader}>
            <h5 className={styles.createPostTitle}>
              {t(
                "Ask questions, seek advice, get to know other Tummy Time users, and more!",
              )}
            </h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Row className="mb-3">
                <Col className="d-flex align-items-center">
                  <Form.Control
                    type="text"
                    placeholder={t("Title")}
                    required
                    {...register("title")}
                    onChange={handleTitleChange}
                    value={titleText}
                    className="flex-grow-1"
                  />
                </Col>
              </Row>

              <Row className="mb-3">
                <Col xs={12} lg={8}>
                  <Form.Label>{t("Category (optional)")}</Form.Label>
                  <CategorySelector
                    selectedCategory={selectedCategory}
                    setCategory={setSelectedCategory}
                    className={styles.categorySelector}
                  />
                </Col>
              </Row>

              <div className={styles.editor}>
                <div className={styles.toolbar}>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor?.isActive("bold") ? styles.isActive : ""}
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
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
                    className={editor?.isActive("link") ? styles.isActive : ""}
                  >
                    Link
                  </button>
                </div>
                <EditorContent editor={editor} />
              </div>

              <div className={styles.formActions}>
                <div className={styles.leftActions}>
                  <TextToSpeech
                    text={editor?.getHTML() || ""}
                    title={titleText || ""}
                  />
                </div>
                <div className={styles.rightActions}>
                  <Button
                    variant="primary"
                    type="submit"
                    className={styles.submitButton}
                  >
                    {t("Post")}
                  </Button>
                </div>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Search for a post */}
        <Row className="mb-3">
          <Col>
            <Form.Control
              type="text"
              placeholder={t("Search posts by title, content, or author")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </Col>
        </Row>
        {searchQuery && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setSearchQuery("");
            }}
            className="mt-2 mb-3"
          >
            {t("Clear search")}
          </Button>
        )}

        {/* Display saved journal posts */}
        <h2 className={styles.title}>{t("Latest Posts")}</h2>
        <div className={styles.postsSection}>
          {Array.isArray(filteredPosts) && filteredPosts.length > 0 ? (
            [...filteredPosts]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((post, idx) => (
                <div key={idx}>
                  <Card className={styles.postCard}>
                    <Card.Body>
                      <div
                        onClick={() =>
                          router.push(`/forum/post/${post.post_id}`)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        {post.category && (
                          <div className={styles.categoryBadge}>
                            {t(post.category)}
                          </div>
                        )}
                        <Card.Title className={styles.postCardTitle}>
                          {post.title}
                        </Card.Title>
                        <div
                          className={`${styles.postCardText} ${styles.truncateText}`}
                        >
                          <ViewOnlyEditor
                            key={post.post_id}
                            content={post.content}
                          />
                        </div>
                        <div className={styles.postMetadata}>
                          <small>
                            {t("Posted by:")} {post.display_name} on{" "}
                            {new Date(post.created_at).toLocaleDateString()} at{" "}
                            {new Date(post.created_at).toLocaleTimeString()}
                          </small>
                          <small>Replies: {post.reply_count}</small>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <TextToSpeech text={post.content} title={post.title} />
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))
          ) : (
            <div className={styles.noPostsMessage}>{t("No posts found")}</div>
          )}
        </div>
      </div>
      <ForumToast
        message={toastMessage?.message}
        type={toastMessage?.type}
        onClose={() => setToastMessage(null)}
      />
    </Container>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
