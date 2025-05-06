// hooks/usePost.js
// This file contains the logic for managing a single post in a forum application. It includes functions for fetching, editing, and deleting the post, as well as managing the state of the edit form and delete confirmation modal.
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export function usePost(post_id) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const router = useRouter();

  const startEditing = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category || "");
    setIsEditing(true);
  };

  useEffect(() => {
    if (!post_id) return;
    fetchPost();
  }, [post_id]);

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setPost(data.data);
      } else {
        setError("Failed to fetch post");
      }
    } catch (error) {
      setError("Error loading post");
    }
  };

  const handleEditSubmit = async (title, content, category) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            content,
            category,
          }),
        },
      );

      if (response.ok) {
        const { data } = await response.json();

        setPost((currentPost) => ({
          ...currentPost,
          title,
          content,
          category,
          updated_at: new Date().toISOString(),
        }));
        setEditContent(content);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDeleteClick = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts/${post_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Wait for the toast to show before redirecting
        await new Promise((resolve) => setTimeout(resolve, 3000));
        router.push("/forum");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return {
    post,
    error,
    isEditing,
    editTitle,
    editContent,
    editCategory,
    startEditing,
    setIsEditing,
    showDeleteModal,
    deleteConfirmed,
    setEditTitle,
    setEditContent,
    setEditCategory,
    setShowDeleteModal,
    setDeleteConfirmed,
    handleEditSubmit,
    handleDeleteClick,
  };
}
