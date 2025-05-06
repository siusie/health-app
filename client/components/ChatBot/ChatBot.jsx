import React, { useState, useRef, useEffect } from "react";
import {
  FaRobot,
  FaUser,
  FaPaperPlane,
  FaTimes,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { useRouter } from "next/router";
import styles from "./ChatBot.module.css";
import openRouterService from "../../services/openRouterService";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { jwtDecode } from "jwt-decode";

import { useTranslation } from "next-i18next";
// import { serverSideTranslations } from "next-i18next/serverSideTranslations";

// View-only editor component - identical to Journal's approach
const ViewOnlyEditor = ({ content }) => {
  const editor = useEditor(
    {
      extensions: [StarterKit, Link, Underline],
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

// Check if a token is expired - reusing the function from _app.js
const isTokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return exp < currentTime;
  } catch (error) {
    console.log("Error decoding token:", error);
    return true; // Assume expired if there's an error
  }
};

const ChatBot = () => {
  const { t } = useTranslation("common");
  const router = useRouter();

  // Check authentication using the same method as your _app.js
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(token && !isTokenExpired(token));
    };

    checkAuthStatus();

    // Listen for storage changes (login/logout) to update auth state
    window.addEventListener("storage", checkAuthStatus);
    return () => {
      window.removeEventListener("storage", checkAuthStatus);
    };
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your baby care assistant. How can I help you today?",
      isBot: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
  });
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] =
    useState("New conversation");
  const messagesEndRef = useRef(null);
  const [shouldSaveOnClose, setShouldSaveOnClose] = useState(false);

  // Track if the conversation has meaningful content to save
  useEffect(() => {
    // Only mark for saving if there's user interaction (more than just the welcome message)
    if (messages.length > 1 && hasUserInteracted) {
      setShouldSaveOnClose(true);
    }
  }, [messages, hasUserInteracted]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track page navigation to save conversation
  useEffect(() => {
    // Function to handle route change start (before navigation)
    const handleRouteChangeStart = () => {
      saveConversationIfNeeded();
      resetChatBot();
    };

    // Add router event listeners
    router.events.on("routeChangeStart", handleRouteChangeStart);

    // Clean up event listeners
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router, shouldSaveOnClose, messages, conversationTitle]);

  // Load or create conversation if user is authenticated
  useEffect(() => {
    // Only load stored conversation if user is authenticated and chat is open
    if (isAuthenticated && isOpen) {
      loadOrCreateConversation();
    }
  }, [isAuthenticated, isOpen]);

  // Save conversation to localStorage and reset state
  const saveConversationIfNeeded = () => {
    // Only save if there's meaningful conversation to save
    if (!shouldSaveOnClose || messages.length <= 1) return;

    // Create a new conversation entry
    const newId = Date.now().toString();
    const newConversation = {
      id: newId,
      title: conversationTitle,
      lastUpdated: new Date().toISOString(),
      messages: messages,
    };

    // Get existing conversations
    const storedConversations = localStorage.getItem(
      "babyAssistantConversations",
    );
    const conversations = storedConversations
      ? JSON.parse(storedConversations)
      : [];

    // Add new conversation to the beginning of the array
    localStorage.setItem(
      "babyAssistantConversations",
      JSON.stringify([newConversation, ...conversations]),
    );

    // Reset the save flag
    setShouldSaveOnClose(false);
  };

  // Reset the ChatBot to initial state
  const resetChatBot = () => {
    setMessages([
      {
        text: "Hello! I'm your baby care assistant. How can I help you today?",
        isBot: true,
      },
    ]);
    setConversationTitle("New conversation");
    setHasUserInteracted(false);
    setConversationId(null);
    setShouldSaveOnClose(false);
  };

  const toggleChat = () => {
    const newIsOpen = !isOpen;

    // If closing, save conversation and reset
    if (!newIsOpen && shouldSaveOnClose) {
      saveConversationIfNeeded();
      resetChatBot();
    }

    setIsOpen(newIsOpen);

    // If opening chat and authenticated, load conversation
    if (newIsOpen && isAuthenticated && !conversationId) {
      loadOrCreateConversation();
    }
  };

  const showTemporaryNotification = (message, duration = 3000) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: "" });
    }, duration);
  };

  const loadOrCreateConversation = () => {
    if (!isAuthenticated) return;

    // Check localStorage for existing conversations
    const storedConversations = localStorage.getItem(
      "babyAssistantConversations",
    );

    if (storedConversations) {
      try {
        const parsedConversations = JSON.parse(storedConversations);

        // Find most recent conversation or create new one
        if (parsedConversations.length > 0) {
          const recentConversation = parsedConversations[0];
          setConversationId(recentConversation.id);
          setConversationTitle(recentConversation.title || "New conversation");
          setMessages(recentConversation.messages);
          return;
        }
      } catch (error) {
        console.error("Error parsing conversations:", error);
      }
    }

    // Create new conversation if none exists
    createNewConversation();
  };

  const createNewConversation = () => {
    if (!isAuthenticated) return;

    const newId = Date.now().toString();
    setConversationId(newId);
    setConversationTitle("New conversation");

    // Reset messages to initial state
    setMessages([
      {
        text: "Hello! I'm your baby care assistant. How can I help you today?",
        isBot: true,
      },
    ]);

    // Save the new conversation
    const newConversation = {
      id: newId,
      title: "New conversation",
      lastUpdated: new Date().toISOString(),
      messages: [
        {
          text: "Hello! I'm your baby care assistant. How can I help you today?",
          isBot: true,
        },
      ],
    };

    const storedConversations = localStorage.getItem(
      "babyAssistantConversations",
    );
    const conversations = storedConversations
      ? JSON.parse(storedConversations)
      : [];

    localStorage.setItem(
      "babyAssistantConversations",
      JSON.stringify([newConversation, ...conversations]),
    );
  };

  const updateStoredConversation = (updatedMessages, title = null) => {
    if (!isAuthenticated || !conversationId) return;

    const storedConversations = localStorage.getItem(
      "babyAssistantConversations",
    );
    if (!storedConversations) return;

    try {
      const conversations = JSON.parse(storedConversations);
      const updatedTitle = title || conversationTitle;

      const updatedConversations = conversations.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            title: updatedTitle,
            messages: updatedMessages,
            lastUpdated: new Date().toISOString(),
          };
        }
        return conv;
      });

      localStorage.setItem(
        "babyAssistantConversations",
        JSON.stringify(updatedConversations),
      );

      setConversationTitle(updatedTitle);
    } catch (error) {
      console.error("Error updating conversation:", error);
    }
  };

  // Function to convert markdown-like text to HTML
  const convertToHtml = (text) => {
    if (!text) return "";

    let html = text;

    // Convert numbered lists
    html = html.replace(/^(\d+)\.\s+(.+)$/gm, "<li>$2</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ol>$&</ol>");

    // Convert bullet points
    html = html.replace(/^\*\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/^-\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return match.includes("<ol>") ? match : "<ul>" + match + "</ul>";
    });

    // Convert bold text
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Convert italic text
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Convert paragraphs
    html = html.replace(/(.+?)(\n\n|$)/g, "<p>$1</p>");

    return html;
  };

  const isRelevantQuery = (query) => {
    if (!query || query.trim() === "") return false;

    const RELEVANT_KEYWORDS = [
      "baby",
      "infant",
      "child",
      "toddler",
      "newborn",
      "kids",
      "childhood",
      "feeding",
      "formula",
      "breastfeed",
      "milk",
      "bottle",
      "diaper",
      "sleep",
      "crying",
      "colic",
      "fever",
      "vaccine",
      "growth",
      "development",
      "milestone",
      "weight",
      "height",
      "crawl",
      "walk",
      "talk",
      "teeth",
      "teething",
      "solid food",
      "symptom",
      "doctor",
      "pediatrician",
      "stool",
      "poop",
      "cough",
      "cold",
      "rash",
      "temperature",
      "allergy",
      "eczema",
      "constipation",
      "diarrhea",
      "nap",
      "routine",
      "schedule",
      "cry",
      "fussy",
      "reflux",
      "jaundice",
      "umbilical",
      "bath",
      "potty",
      "toilet",
      "pacifier",
      "toy",
      "tummy time",
      "checkup",
      "appointment",
      "prenatal",
      "postnatal",
      "premature",
      "nutrition",
      "preschool",
      "daycare",
    ];

    const normalizedQuery = query.toLowerCase();
    return RELEVANT_KEYWORDS.some((keyword) =>
      normalizedQuery.includes(keyword),
    );
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    setHasUserInteracted(true);

    if (!inputText.trim()) {
      setMessages((prev) => [
        ...prev,
        { text: "Your message was empty. Please try again.", isBot: true },
      ]);
      return;
    }

    const userMessage = { text: inputText, isBot: false };
    const currentInput = inputText;
    setMessages([...messages, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      let botResponse;
      let conversationTitle;

      if (!isRelevantQuery(currentInput)) {
        botResponse =
          "<p>I'm specialized in helping with questions about babies and children ages 0-7. " +
          "If you have questions about feeding, growth, development, symptoms, or " +
          "other child-related topics, I'd be happy to assist. Could you please ask " +
          "a question related to infant or child care?</p>";
        conversationTitle = "Baby Care Assistant";
      } else {
        const conversationHistory = messages.slice(1).map((msg) => ({
          role: msg.isBot ? "assistant" : "user",
          content: msg.text,
        }));

        const enhancedPrompt = `As an expert in infant and child care (ages 0-7), please answer the following question: ${currentInput}`;

        const response = await openRouterService.generateResponse(
          enhancedPrompt,
          conversationHistory,
        );

        if (response && response.conversationTitle && response.responseText) {
          // The API successfully returned JSON with title and response
          conversationTitle = response.conversationTitle;
          botResponse = response.responseText;
        } else if (typeof response === "object" && response.responseText) {
          // Legacy format - just get the response text
          botResponse = response.responseText;
          conversationTitle = "Baby Care Advice";
        } else if (typeof response === "string") {
          // Plain string response
          botResponse = response;
          conversationTitle = "Baby Care Advice";
        } else {
          // Fallback
          botResponse = "Sorry, I couldn't generate a response";
          conversationTitle = "Baby Care Assistance";
        }

        // Check if the response is already in HTML format
        if (!botResponse.includes("<p>") && !botResponse.includes("<li>")) {
          botResponse = convertToHtml(botResponse);
        }
      }

      const botMessage = { text: botResponse, isBot: true };
      const updatedMessages = [...messages, userMessage, botMessage];

      setMessages(updatedMessages);
      setConversationTitle(conversationTitle);

      // Update conversation if authenticated
      if (isAuthenticated) {
        updateStoredConversation(updatedMessages, conversationTitle);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "<p>Sorry, I encountered an error. Please try again later.</p>",
          isBot: true,
        },
      ]);
      showTemporaryNotification(
        "Error connecting to the assistant. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatbotContainer}>
      {isOpen && (
        <div className={styles.chatWindow}>
          {notification.show && (
            <div className={styles.notification}>
              <div className={styles.notificationContent}>
                <FaInfoCircle className={styles.notificationIcon} />
                <span className={styles.notificationMessage}>
                  {notification.message}
                </span>
              </div>
            </div>
          )}

          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <div className={styles.logoWrapper}>
                <FaRobot className={styles.botIcon} />
              </div>
              <span>{t("Baby Care Assistant")}</span>
            </div>
            <button
              className={styles.closeButton}
              onClick={toggleChat}
              aria-label="Close chat"
            >
              <FaTimes />
            </button>
          </div>

          <div className={styles.chatMessages}>
            {hasUserInteracted && (
              <div className={styles.disclaimer}>
                <div className={styles.disclaimerContent}>
                  <FaExclamationTriangle className={styles.disclaimerIcon} />
                  <p className={styles.disclaimerText}>
                    Information provided may not be 100% accurate. Always
                    consult with a healthcare professional for medical advice.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.isBot ? styles.botMessage : styles.userMessage
                }`}
              >
                {message.isBot ? (
                  <div className={styles.viewOnlyEditorWrapper}>
                    <ViewOnlyEditor content={message.text} />
                  </div>
                ) : (
                  <div className={styles.messageText}>{message.text}</div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className={styles.inputArea} onSubmit={sendMessage}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t("Type your message...")}
              className={styles.inputField}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || !inputText.trim()}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}

      <button
        className={styles.chatButton}
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
      </button>
    </div>
  );
};

export default ChatBot;
