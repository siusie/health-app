// client/context/ProviderContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { filterProviders, sortProviders, paginateResults } from "../utils/providerUtils";
import { toggleFavoriteProvider, getFavoriteProviders } from "../services/addFavoriteChildcareService";

// Create the context
const ProviderContext = createContext();

/**
 * Provider Context Provider component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider context provider
 */
export const ProviderContextProvider = ({ children }) => {
  // Global state for providers data
  const [allProviders, setAllProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Favorites state
  const [favoriteProviderIds, setFavoriteProviderIds] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnlyPremium, setShowOnlyPremium] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  
  // Advanced filter states
  const [languageFilter, setLanguageFilter] = useState("");
  const [experienceWithFilter, setExperienceWithFilter] = useState("");
  const [servicesFilter, setServicesFilter] = useState("");
  const [qualificationsFilter, setQualificationsFilter] = useState("");
  const [qualitiesFilter, setQualitiesFilter] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Sort options definition - for reuse in UI
  const sortOptions = [
    { id: "rating", label: "Top Rated" },
    { id: "hourly_rate_asc", label: "Lowest Price" },
    { id: "hourly_rate_desc", label: "Highest Price" },
    { id: "hired_count", label: "Most Hired" },
    { id: "experience", label: "Most Experience" },
  ];

  // Provider types definition - for reuse in UI (removed Child Care as it's general)
  const providerTypes = [
    { id: "all", label: "All" },
    { id: "after-school-care", label: "After School Care" },
    { id: "babysitters", label: "Babysitters" },
    { id: "in-home-daycare", label: "In-Home Daycare" },
    { id: "nannies", label: "Nannies" },
    { id: "special-needs", label: "Special Needs" },
    { id: "weekend-child-care", label: "Weekend Child Care" },
  ];

  // Processed providers based on filters, sorting and pagination
  const filteredProviders = useMemo(() => {
    const filtered = filterProviders(allProviders, {
      searchTerm,
      category,
      favoriteIds: favoriteProviderIds,
      showOnlyFavorites,
      showOnlyPremium,
      showOnlyVerified,
      languageFilter,
      experienceWithFilter,
      servicesFilter,
      qualificationsFilter,
      qualitiesFilter
    });
    
    // Make sure sortProviders exists and is a function
    if (typeof sortProviders === 'function') {
      return sortProviders(filtered, sortBy);
    }
    
    // Fallback if sortProviders is not available
    console.warn("sortProviders function not available, using default sort");
    return filtered;
  }, [allProviders, searchTerm, category, favoriteProviderIds, showOnlyFavorites, showOnlyPremium, showOnlyVerified, languageFilter, experienceWithFilter, servicesFilter, qualificationsFilter, qualitiesFilter, sortBy]);
  
  // Calculate total premium providers for accurate count display
  const totalPremiumProviders = useMemo(() => {
    if (!showOnlyPremium) return null;
    
    return allProviders.filter(provider => {
      return (
        provider.is_premium === true || 
        provider.is_premium === 'true' || 
        provider.is_premium === 1 ||
        provider.premium === true || 
        provider.premium === 'true' || 
        provider.premium === 1
      );
    }).length;
  }, [allProviders, showOnlyPremium]);

  // Paginated providers - final data to be displayed
  const paginatedData = useMemo(() => {
    // Make sure paginateResults exists and is a function
    if (typeof paginateResults === 'function') {
      return paginateResults(filteredProviders, currentPage, itemsPerPage);
    }
    
    // Fallback if paginateResults is not available
    console.warn("paginateResults function not available, using basic pagination");
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      items: filteredProviders.slice(startIndex, endIndex),
      totalItems: filteredProviders.length,
      totalPages: Math.ceil(filteredProviders.length / itemsPerPage),
      currentPage,
      hasNextPage: currentPage < Math.ceil(filteredProviders.length / itemsPerPage),
      hasPrevPage: currentPage > 1
    };
  }, [filteredProviders, currentPage, itemsPerPage]);

  // Check authentication and load initial data
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setError("Please log in to view care services");
        setLoading(false);
        return false;
      }

      // Basic token validation
      if (typeof token !== "string" || token.trim() === "") {
        setIsAuthenticated(false);
        setError("Invalid authentication token. Please log in again.");
        setLoading(false);
        localStorage.removeItem("token");
        return false;
      }

      setIsAuthenticated(true);
      return true;
    };

    const authStatus = checkAuth();
    if (authStatus) {
      fetchData();
      fetchFavorites();
    }
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm, 
    category, 
    showOnlyFavorites, 
    showOnlyPremium,
    showOnlyVerified,
    languageFilter,
    experienceWithFilter,
    servicesFilter,
    qualificationsFilter,
    qualitiesFilter,
    sortBy
  ]);

  // Fetch providers data with authentication
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const finalUrl = `${apiUrl}/v1/careServices`;

      const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch. Status: ${response.status}`);
      }

      const data = await response.json();
      const providers = data.providers || data.data?.providers || [];
      setAllProviders(providers);
    } catch (err) {
      console.error("Error fetching providers:", err);
      setError(err.message || "Error fetching providers");
      setAllProviders([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's favorite providers
  const fetchFavorites = async () => {
    try {
      const favorites = await getFavoriteProviders();
      setFavoriteProviderIds(favorites || []);
    } catch (err) {
      console.error("Unexpected error fetching favorites:", err);
      setFavoriteProviderIds([]);
    }
  };

  // Handle toggling a provider favorite status
  const handleToggleFavorite = async (providerId) => {
    try {
      const isFavorite = !favoriteProviderIds.includes(providerId);

      // Optimistically update UI
      if (isFavorite) {
        setFavoriteProviderIds((prev) => [...prev, providerId]);
      } else {
        setFavoriteProviderIds((prev) =>
          prev.filter((id) => id !== providerId),
        );
      }

      // Call API
      const result = await toggleFavoriteProvider(providerId, isFavorite);

      if (!result.success) {
        // If API call failed, revert optimistic update
        console.error("Error toggling favorite:", result.message);

        if (isFavorite) {
          setFavoriteProviderIds((prev) =>
            prev.filter((id) => id !== providerId),
          );
        } else {
          setFavoriteProviderIds((prev) => [...prev, providerId]);
        }
      }
    } catch (err) {
      console.error("Unexpected error toggling favorite:", err);
      fetchFavorites(); // Refresh favorites on error
    }
  };

  // Value object to be provided to context consumers
  const value = {
    // Data
    providers: paginatedData.items,
    allProviders,
    favoriteProviderIds,
    loading,
    error,
    isAuthenticated,
    
    // Filter state
    searchTerm,
    category,
    showOnlyFavorites,
    showOnlyPremium,
    showOnlyVerified,
    languageFilter,
    experienceWithFilter,
    servicesFilter,
    qualificationsFilter,
    qualitiesFilter,
    sortBy,
    
    // Pagination data
    currentPage,
    totalPages: paginatedData.totalPages,
    totalItems: showOnlyPremium && totalPremiumProviders ? totalPremiumProviders : paginatedData.totalItems,
    hasNextPage: paginatedData.hasNextPage,
    hasPrevPage: paginatedData.hasPrevPage,
    
    // Reference data
    sortOptions,
    providerTypes,
    
    // Actions
    setSearchTerm,
    setCategory,
    setShowOnlyFavorites,
    setShowOnlyPremium,
    setShowOnlyVerified,
    setLanguageFilter,
    setExperienceWithFilter,
    setServicesFilter,
    setQualificationsFilter,
    setQualitiesFilter,
    setSortBy,
    setCurrentPage,
    toggleFavorite: handleToggleFavorite,
    refreshData: fetchData,
    refreshFavorites: fetchFavorites,
  };

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
};

/**
 * Hook to use the provider context
 * @returns {Object} Provider context
 */
export const useProviders = () => {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error("useProviders must be used within a ProviderContextProvider");
  }
  return context;
};

export default ProviderContext;