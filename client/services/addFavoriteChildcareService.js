// services/api/addFavouriteChildcareService.js

/**
 * Toggle the favorite status of a childcare provider
 * @param {number} providerId - The ID of the childcare provider
 * @param {boolean} isFavorite - The new favorite status (true to add, false to remove)
 * @returns {Promise} - A promise that resolves to the API response
 */
export const toggleFavoriteProvider = async (providerId, isFavorite) => {
  try {
    // Get the token from localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No authentication token found");
      return { success: false, message: "Authentication required" };
    }

    // API base URL (from .env or fallback)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Full endpoint
    const finalUrl = `${apiUrl}/v1/careServices/favorites`;

    // Make the request with Bearer token
    const response = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // Include cookies if your auth system uses them
      body: JSON.stringify({
        providerId,
        isFavorite,
      }),
    });

    // Handle response based on status
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      console.warn("Session expired while toggling favorite");
      return {
        success: false,
        message: "Session expired. Please log in again.",
      };
    }

    // For 404 errors (endpoint not found), provide more helpful message
    if (response.status === 404) {
      console.error("Favorites API endpoint not found (404)");
      return {
        success: false,
        message:
          "Favorites feature unavailable. Please check if the API is configured correctly.",
      };
    }

    if (!response.ok) {
      console.error(
        `Server returned error ${response.status} while toggling favorite`,
      );
      // Try to get error message from response body
      try {
        const errorData = await response.json();
        return {
          success: false,
          message:
            errorData.error?.message ||
            `Failed to update favorite. Status: ${response.status}`,
        };
      } catch (jsonError) {
        return {
          success: false,
          message: `Failed to update favorite. Status: ${response.status}`,
        };
      }
    }

    // Parse and return the response
    const data = await response.json();
    return { success: true, ...data };
  } catch (error) {
    console.error("Error toggling provider favorite:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    };
  }
};

/**
 * Get all favorite childcare providers for the current user
 * @returns {Promise} - A promise that resolves to an array of favorite provider IDs
 */
export const getFavoriteProviders = async () => {
  try {
    // Get the token from localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No authentication token found");
      return []; // Return empty array if not authenticated
    }

    // API base URL (from .env or fallback)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // Full endpoint
    const finalUrl = `${apiUrl}/v1/careServices/favorites`;

    // Make the request with Bearer token
    const response = await fetch(finalUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // Include cookies if your auth system uses them
    });

    // Handle response based on status - always return an array
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      console.warn("Session expired, returning empty favorites");
      return [];
    }

    // Handle any error gracefully by returning empty array
    // User having no favorites is not an error condition
    if (!response.ok) {
      console.warn(`API returned ${response.status}, assuming empty favorites`);
      return [];
    }

    // Parse the response
    const data = await response.json();

    // Always return an array, even if favorites is null/undefined
    return Array.isArray(data.favorites) ? data.favorites : [];
  } catch (error) {
    console.error("Error fetching favorite providers:", error);
    return []; // Always return empty array on error, don't throw
  }
};
