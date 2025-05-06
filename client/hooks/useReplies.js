// hooks/useReplies.js
// This file contains the logic for managing replies to a post in a forum application. It includes functions for fetching, adding, editing, and deleting replies, as well as managing the state of the reply input fields and modals.
import { useState, useEffect } from "react";

export function useReplies(post_id) {
  const [replies, setReplies] = useState([]);
  const [error, setError] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [showDeleteReplyModal, setShowDeleteReplyModal] = useState(false);
  const [deleteReplyConfirmed, setDeleteReplyConfirmed] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState(null);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleStartReplyEdit = (reply) => {
    if (!reply) return;
    setEditingReplyId(reply.reply_id);
    setEditReplyContent(reply.content);
  };

  const handleStartReplyDelete = (reply) => {
    if (!reply) return;
    setReplyToDelete(reply);
    setShowDeleteReplyModal(true);
  };

  const fetchReplies = async () => {
    if (!post_id) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}/replies`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch replies");
      }

      const data = await response.json();
      if (!data || !data.data) {
        throw new Error("Invalid response format");
      }

      setReplies(data.data);
      setShouldRefresh(false); // Reset refresh flag
    } catch (error) {
      setError(error.message || "Failed to fetch replies");
      console.error("Error fetching replies:", error);
    }
  };

  useEffect(() => {
    const loadReplies = async () => {
      if (!post_id) return;
      await fetchReplies();
    };

    loadReplies();
  }, [post_id, shouldRefresh]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: replyContent }),
        },
      );

      if (response.ok) {
        setReplyContent(""); // Clear the reply input

        // Show success message and wait before refresh
        const showToastAndRefresh = async () => {
          // Set a success flag that the component can use to show toast
          setToastMessage("Reply posted successfully!");
          setShowToast(true);

          // Wait for 1.5 seconds
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Refresh the page
          window.location.reload();
        };

        showToastAndRefresh();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to post reply");
      }
    } catch (error) {
      setError("Error posting reply");
    }
  };

  const handleReplyEdit = async (replyId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/replies/${replyId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: editReplyContent,
          }),
        },
      );

      if (response.ok) {
        // Update the replies state with the edited reply
        setReplies(
          replies.map((reply) =>
            reply.reply_id === replyId
              ? {
                  ...reply,
                  content: editReplyContent,
                  updated_at: new Date().toISOString(),
                }
              : reply,
          ),
        );
        setEditingReplyId(null);
        setEditReplyContent("");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update reply");
      }
    } catch (error) {
      setError("Error updating reply");
    }
  };

  const handleReplyDelete = async (replyId) => {
    if (!replyId) {
      setError("Invalid reply ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/replies/${replyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Update local state to remove the deleted reply
        setReplies((prevReplies) =>
          prevReplies.filter((reply) => reply.reply_id !== replyId),
        );

        // Reset modal state
        setShowDeleteReplyModal(false);
        setReplyToDelete(null);
        setDeleteReplyConfirmed(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete reply");
      }
    } catch (error) {
      setError(error.message || "Error deleting reply");
      // Reset modal state even if there's an error
      setShowDeleteReplyModal(false);
      setReplyToDelete(null);
      setDeleteReplyConfirmed(false);
    }
  };

  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditReplyContent("");
  };

  return {
    replies,
    error,
    replyContent,
    editingReplyId,
    editReplyContent,
    showDeleteReplyModal,
    deleteReplyConfirmed,
    replyToDelete,
    shouldRefresh,
    setReplyContent,
    setEditingReplyId,
    setEditReplyContent,
    setShowDeleteReplyModal,
    setDeleteReplyConfirmed,
    setReplyToDelete,
    setShouldRefresh,
    handleReplySubmit,
    handleReplyEdit,
    handleReplyDelete,
    handleStartReplyEdit,
    handleStartReplyDelete,
    handleCancelReplyEdit,
    fetchReplies,
    showToast,
    toastMessage,
    setShowToast,
    setToastMessage,
  };
}
