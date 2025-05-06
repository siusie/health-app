// client/utils/providerUtils.js

/**
 * Filter providers based on multiple criteria
 * 
 * @param {Array} providers - List of providers to filter
 * @param {Object} filters - Filter criteria
 * @param {string} filters.searchTerm - Search term for name, city, bio
 * @param {string} filters.category - Provider category/type
 * @param {Array} filters.favoriteIds - Array of favorite provider IDs
 * @param {boolean} filters.showOnlyFavorites - Whether to show only favorites
 * @param {boolean} filters.showOnlyPremium - Whether to show only premium providers
 * @param {boolean} filters.showOnlyVerified - Whether to show only verified providers
 * @param {string} filters.languageFilter - Filter by language
 * @param {string} filters.experienceWithFilter - Filter by experience with
 * @param {string} filters.servicesFilter - Filter by services offered
 * @param {string} filters.qualificationsFilter - Filter by qualifications
 * @param {string} filters.qualitiesFilter - Filter by qualities
 * @returns {Array} Filtered providers
 */
export const filterProviders = (providers, filters) => {
  if (!providers || !Array.isArray(providers)) {
    return [];
  }

  const { 
    searchTerm, 
    category, 
    favoriteIds, 
    showOnlyFavorites, 
    showOnlyPremium,
    showOnlyVerified,
    languageFilter,
    experienceWithFilter,
    servicesFilter,
    qualificationsFilter,
    qualitiesFilter
  } = filters;
  
  // Start with all providers
  let filteredProviders = [...providers];
  
  // Apply search filter if provided
  if (searchTerm) {
    const lowercaseSearch = searchTerm.toLowerCase().trim();
    
    filteredProviders = filteredProviders.filter((provider) => {
      // Check if searching for postal code - looking for common formats
      const isPostalCodeSearch = /^[A-Za-z][0-9][A-Za-z](\s*[0-9][A-Za-z][0-9])?$/.test(searchTerm) || // Canadian format
                                /^\d{5}(-\d{4})?$/.test(searchTerm); // US format
      
      // If we detect a postal code search pattern
      if (isPostalCodeSearch) {
        // First check the dedicated postal_code field (without spaces for comparison)
        const normalizedPostalCode = provider.postal_code?.replace(/\s+/g, '').toLowerCase();
        const normalizedSearch = lowercaseSearch.replace(/\s+/g, '');
        
        // Match if postal code starts with the search term
        if (normalizedPostalCode && normalizedPostalCode.startsWith(normalizedSearch)) {
          return true;
        }
        
        // As a fallback, check if the location field contains the postal code
        // This is needed for older data that might have postal codes in the location field
        return provider.location?.toLowerCase().includes(lowercaseSearch);
      }
      
      // For city searches
      const exactCityMatch = provider.location?.toLowerCase() === lowercaseSearch;
      
      // Prioritize exact city matches, but also allow partial matches
      if (exactCityMatch) {
        return true;
      }
      
      // For other searches, check across multiple fields
      const matchesName = provider.name?.toLowerCase().includes(lowercaseSearch);
      const matchesCity = provider.location?.toLowerCase().includes(lowercaseSearch);
      const matchesBio = provider.bio?.toLowerCase().includes(lowercaseSearch);
      const matchesTitle = provider.title?.toLowerCase().includes(lowercaseSearch);

      return matchesName || matchesCity || matchesBio || matchesTitle;
    });
  }
  
  // Apply category filter if not "all"
  if (category && category !== "all") {
    filteredProviders = filteredProviders.filter(
      (provider) => provider.provider_type === category
    );
  }
  
  // Apply verified filter if enabled - improved to check for true verification
  if (showOnlyVerified) {
    filteredProviders = filteredProviders.filter((provider) => {
      // Only include providers with actual verification (true or positive number)
      const isVerified = provider.verification === true || 
                        provider.verification === 'true' || 
                        (typeof provider.verification === 'number' && provider.verification > 0);
      return isVerified;
    });
  }
  
  // Apply favorites filter if enabled
  if (showOnlyFavorites && Array.isArray(favoriteIds)) {
    filteredProviders = filteredProviders.filter((provider) => 
      favoriteIds.includes(provider.id)
    );
  }
  
  // Apply premium filter if enabled
  if (showOnlyPremium) {
    filteredProviders = filteredProviders.filter((provider) => {
      // Check both premium and is_premium fields to be safe
      // Also handle different boolean formats (true, 'true', 1, etc.)
      return provider.is_premium === true || 
             provider.is_premium === 'true' || 
             provider.is_premium === 1 ||
             provider.premium === true || 
             provider.premium === 'true' || 
             provider.premium === 1;
    });
  }
  
  // Apply language filter if provided
  if (languageFilter) {
    filteredProviders = filteredProviders.filter((provider) => {
      if (!provider.languages) return false;
      return provider.languages.toLowerCase().includes(languageFilter.toLowerCase());
    });
  }
  
  // Apply experience with filter if provided
  if (experienceWithFilter) {
    filteredProviders = filteredProviders.filter((provider) => {
      if (!provider.experience_with) return false;
      return provider.experience_with.toLowerCase().includes(experienceWithFilter.toLowerCase());
    });
  }
  
  // Apply services filter if provided
  if (servicesFilter) {
    filteredProviders = filteredProviders.filter((provider) => {
      if (!provider.services) return false;
      return provider.services.toLowerCase().includes(servicesFilter.toLowerCase());
    });
  }
  
  // Apply qualifications filter if provided
  if (qualificationsFilter) {
    filteredProviders = filteredProviders.filter((provider) => {
      if (!provider.qualifications) return false;
      return provider.qualifications.toLowerCase().includes(qualificationsFilter.toLowerCase());
    });
  }
  
  // Apply qualities filter if provided
  if (qualitiesFilter) {
    filteredProviders = filteredProviders.filter((provider) => {
      if (!provider.qualities) return false;
      return provider.qualities.toLowerCase().includes(qualitiesFilter.toLowerCase());
    });
  }
  
  return filteredProviders;
};

/**
 * Sort providers based on specified criteria
 * 
 * @param {Array} providers - List of providers to sort
 * @param {string} sortOption - Sort option (rating, hourly_rate_asc, etc.)
 * @returns {Array} Sorted providers
 */
export const sortProviders = (providers, sortOption) => {
  if (!providers || !Array.isArray(providers)) {
    return [];
  }
  
  const sortedProviders = [...providers];
  
  switch (sortOption) {
    case "rating":
    case "topRated":
      return sortedProviders.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
    case "hourly_rate_asc":
    case "lowestPrice":
      return sortedProviders.sort(
        (a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0)
      );
      
    case "hourly_rate_desc":
    case "highestPrice":
      return sortedProviders.sort(
        (a, b) => (b.hourly_rate || 0) - (a.hourly_rate || 0)
      );
      
    case "hired_count":
    case "mostHired":
      return sortedProviders.sort(
        (a, b) => (b.hired_count || 0) - (a.hired_count || 0)
      );
      
    case "experience":
    case "mostExperience":
      return sortedProviders.sort((a, b) => {
        const expA = a.experience ? parseInt(a.experience, 10) : 0;
        const expB = b.experience ? parseInt(b.experience, 10) : 0;
        return expB - expA;
      });

    // Additional sort options
    case "reviewCount":
      return sortedProviders.sort((a, b) => {
        const reviewsA = a.reviews_count || 0;
        const reviewsB = b.reviews_count || 0;
        return reviewsB - reviewsA;
      });

    case "verified":
      return sortedProviders.sort((a, b) => {
        // Sort verified providers first (boolean sort)
        const isVerifiedA = a.verification === true || 
                           a.verification === 'true' || 
                           (typeof a.verification === 'number' && a.verification > 0);
        
        const isVerifiedB = b.verification === true || 
                           b.verification === 'true' || 
                           (typeof b.verification === 'number' && b.verification > 0);
        
        return (isVerifiedB ? 1 : 0) - (isVerifiedA ? 1 : 0);
      });
      
    default:
      // Default to rating
      return sortedProviders.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
};

/**
 * Create paginated results from an array
 * 
 * @param {Array} items - Items to paginate
 * @param {number} page - Current page (1-based)
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Object} Pagination data with items, total pages, etc.
 */
export const paginateResults = (items, page = 1, itemsPerPage = 20) => {
  if (!items || !Array.isArray(items)) {
    return {
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
      hasNextPage: false,
      hasPrevPage: false
    };
  }
  
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    items: paginatedItems,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

/**
 * Process provider type for display
 * @param {string} type - Provider type
 * @returns {string} Formatted provider type
 */
export const formatProviderType = (type) => {
  if (!type) return "";
  return type
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Get the CSS class name for a provider type
 * @param {string} providerType - The type of provider
 * @returns {string} CSS class name
 */
export const getProviderTypeClass = (providerType) => {
  switch (providerType) {
    case "after-school-care":
      return "afterSchoolCare";
    case "babysitters":
      return "babysitter";
    case "child-care":
      return "childCare";
    case "in-home-daycare":
      return "inHomeDaycare";
    case "nannies":
      return "nanny";
    case "special-needs":
      return "specialNeeds";
    case "weekend-child-care":
      return "weekendChildCare";
    default:
      return ""; 
  }
};