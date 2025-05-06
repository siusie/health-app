// hooks/useBookmarks.js
// This is a custom React hook for managing bookmarked forum posts. It provides functions to fetch, toggle, and manage the state of bookmarks
import { useState, useEffect, useCallback } from "react";

export const useBookmarks = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const token = localStorage.getItem("token");

  const fetchBookmarks = useCallback(
    async (force = false) => {
      if (!token) {
        console.error("No auth token found");
        setError("Authentication required");
        return;
      }

      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        console.log("API URL:", apiUrl);

        if (!apiUrl) {
          throw new Error("API URL not configured");
        }

        const response = await fetch(`${apiUrl}/v1/forum/bookmarks`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch((err) => {
          console.error("Fetch failed:", err);
          throw new Error(`Connection failed: ${err.message}`);
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData?.error?.code?.error?.message ||
              `Server error: ${response.status}`,
          );
        }

        const data = await response.json();
        setBookmarkedPosts(data.data || []);
        setLastFetchTime(Date.now());
      } catch (err) {
        console.error("Fetch bookmarks error details:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
          token: token ? "Present" : "Missing",
        });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const toggleBookmark = async (postId) => {
    if (!token || !postId) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/bookmarks/${postId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error?.code?.error?.message || "Failed to toggle bookmark",
        );
      }

      // Update local state optimistically
      setBookmarkedPosts((prev) => {
        const isCurrentlyBookmarked = prev.some((p) => p.post_id === postId);
        return isCurrentlyBookmarked
          ? prev.filter((p) => p.post_id !== postId)
          : [...prev, { post_id: postId }];
      });

      // Only fetch fresh data if the toggle was successful
      await fetchBookmarks(true);
      return data;
    } catch (err) {
      setError(err.message);
      console.error("Toggle bookmark error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Only fetch on initial mount and token presence
  useEffect(() => {
    let mounted = true;

    const initializeFetch = async () => {
      if (token && mounted) {
        try {
          await fetchBookmarks();
        } catch (err) {
          console.error("Initial fetch failed:", err);
        }
      }
    };

    initializeFetch();

    return () => {
      mounted = false;
    };
  }, [token, fetchBookmarks]);

  return {
    bookmarkedPosts,
    loading,
    error,
    toggleBookmark,
    refreshBookmarks: () => fetchBookmarks(true),
  };
};
