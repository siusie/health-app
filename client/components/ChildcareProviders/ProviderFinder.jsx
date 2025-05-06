// client/components/ChildcareProviders/ProviderFinder.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useProviders } from '../../context/ProviderContext';
import styles from './ProviderFinder.module.css';

// FavoriteButton Component
const FavoriteButton = ({ active = false, onClick, isPremium = false }) => {
  return (
    <button
      className={`${styles.favoriteButton} ${isPremium ? styles.premiumFavoriteButton : ""}`}
      onClick={onClick}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      type="button"
    >
      <svg
        viewBox="0 0 24 24"
        className={`${styles.favoriteIcon} ${active ? styles.active : ""}`}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
};

FavoriteButton.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  isPremium: PropTypes.bool
};

// CardHeader Component
const CardHeader = ({ provider }) => {
  // Format location with postal code
  const formattedLocation = () => {
    if (!provider.location) return null;
    
    const location = provider.location;
    const postalCode = provider.postal_code;
    
    // Only show postal code if it exists
    return postalCode ? `${location} (${postalCode})` : location;
  };
  
  return (
    <div className={styles.providerHeader}>
      <div className={styles.providerImage}>
        {provider.profile_image ? (
          <img
            src={provider.profile_image}
            alt={provider.name || "Care provider"}
            className={styles.profileImage}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.jpg";
            }}
          />
        ) : (
          <div className={styles.placeholderImage}>
            {provider.name ? provider.name.charAt(0) : "?"}
          </div>
        )}
      </div>
      <div className={styles.providerInfo}>
        <h2 className={styles.providerName}>
          {provider.name || "Name unavailable"}
          {provider.age && <span className={styles.providerAge}> ({provider.age})</span>}
        </h2>
        
        {provider.location && <p className={styles.location}>{formattedLocation()}</p>}
        
        <div className={styles.providerStats}>
          {provider.hired_count > 0 && (
            <span className={styles.statItem}>
              <span className={styles.statValue}>{provider.hired_count}</span> times hired
            </span>
          )}
          
          {provider.reviews_count > 0 && (
            <span className={styles.statItem}>
              <span className={styles.statValue}>{provider.reviews_count}</span> reviews
            </span>
          )}
          
          {provider.response_rate && provider.response_rate !== 'N/A' && (
            <span className={styles.statItem}>
              <span className={styles.statValue}>{provider.response_rate}</span> response rate
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

CardHeader.propTypes = {
  provider: PropTypes.shape({
    name: PropTypes.string,
    profile_image: PropTypes.string,
    location: PropTypes.string,
    postal_code: PropTypes.string,
    hired_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    verification: PropTypes.oneOfType([PropTypes.bool, PropTypes.number, PropTypes.string]),
    provider_type: PropTypes.string,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired
};

// CardBody Component
const CardBody = ({ provider }) => {
  // Format experience text to avoid repetition (DRY principle)
  const formatExperience = () => {
    if (!provider.experience) return null;
    
    // Return null for "N/A" experience - First fix
    if (provider.experience === "N/A") return null;
    
    // Extract just the numeric part if it's a string like "10 years experience"
    let years = provider.experience;
    if (typeof years === 'string' && years.includes('years')) {
      years = years.replace(/[^0-9]/g, '');
    }
    
    return `${years} years of experience`;
  };
  
  return (
    <div className={styles.providerContent}>
      {provider.title && (
        <p className={styles.bio}>{provider.title}</p>
      )}
      {provider.experience && provider.experience !== "N/A" && (
        <p className={styles.experience}>{formatExperience()}</p>
      )}
    </div>
  );
};

CardBody.propTypes = {
  provider: PropTypes.shape({
    title: PropTypes.string,
    bio: PropTypes.string,
    experience: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hourly_rate: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired
};

// CardFooter Component
const CardFooter = ({ onViewProfile, profileUrl, hourlyRate }) => {
  return (
    <div className={styles.providerActions}>
      {hourlyRate && (
        <div className={styles.hourlyRate}>
          ${Number(hourlyRate).toFixed(2)}/hr
        </div>
      )}
      <button
        className={styles.viewProfileButton}
        onClick={() => onViewProfile(profileUrl)}
        aria-label="View provider profile"
      >
        View Profile
      </button>
    </div>
  );
};

CardFooter.propTypes = {
  onViewProfile: PropTypes.func.isRequired,
  profileUrl: PropTypes.string,
  hourlyRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// Provider Card Component
const ProviderCard = ({
  provider,
  isFavorite,
  onToggleFavorite,
  onViewProfile
}) => {
  // Function to determine card style based on provider type
  const getProviderCardClass = (providerType) => {
    switch (providerType) {
      case "after-school-care":
        return styles.afterSchoolCare;
      case "babysitters":
        return styles.babysitter;
      case "child-care":
        return styles.childCare;
      case "in-home-daycare":
        return styles.inHomeDaycare;
      case "nannies":
        return styles.nanny;
      case "special-needs":
        return styles.specialNeeds;
      case "weekend-child-care":
        return styles.weekendChildCare;
      default:
        return ""; // Default style
    }
  };

  const handleToggleFavorite = () => {
    onToggleFavorite(provider.id);
  };

  // Format provider type for display
  const formatProviderType = (type) => {
    if (!type) return "";
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Check for actual verification (not 0 or false)
  const isVerified = provider.verification === true || 
                    provider.verification === 'true' || 
                    (typeof provider.verification === 'number' && provider.verification > 0);

  return (
    <div
      className={`${styles.providerCard} ${getProviderCardClass(provider.provider_type)} ${
        provider.is_premium ? styles.premium : ""
      }`}
    >
      {/* Premium badge */}
      {provider.is_premium && (
        <div className={styles.premiumRibbon}>
          <span className={styles.premiumStar}>★</span> Premium
        </div>
      )}
      
      {/* Verified badge - only show if truly verified */}
      {isVerified && (
        <div className={styles.verifiedRibbon}>
          <span className={styles.verifiedCheck}>✓</span> Verified
        </div>
      )}
      
      {/* Heart icon for favorites with premium status */}
      <FavoriteButton 
        active={isFavorite}
        onClick={handleToggleFavorite}
        isPremium={provider.is_premium}
      />

      <CardHeader provider={provider} />
      
      {/* Provider type badge - always displayed as a badge */}
      {provider.provider_type && (
        <div className={styles.providerTypeBadge}>
          <span 
            className={`${styles.typeBadge} ${styles[provider.provider_type.replace(/-/g, "")] || ""}`}
          >
            {formatProviderType(provider.provider_type)}
          </span>
        </div>
      )}
      
      <CardBody provider={provider} />
      <CardFooter 
        onViewProfile={onViewProfile} 
        profileUrl={provider.profile_url}
        hourlyRate={provider.hourly_rate}
      />
    </div>
  );
};

ProviderCard.propTypes = {
  provider: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    provider_type: PropTypes.string,
    is_premium: PropTypes.bool,
    profile_url: PropTypes.string,
    verification: PropTypes.oneOfType([PropTypes.bool, PropTypes.number, PropTypes.string]),
    hourly_rate: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  isFavorite: PropTypes.bool.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired
};

// Pagination Component - Updated to match design in reference image
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  hasNextPage,
  hasPrevPage
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Show at most 5 page numbers
    
    if (totalPages <= maxPagesToShow) {
      // If we have 5 or fewer pages, show all of them
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);
      
      // Current page and surrounding pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if there's a gap at the beginning
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if there's a gap at the end
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always include last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  // Handle direct page input - Fix for issue #2
  const handlePageNumberClick = (page) => {
    if (page === currentPage) {
      // If clicking the current page, make it editable
      const newPage = prompt(`Enter page number (1-${totalPages}):`, currentPage);
      if (newPage !== null) {
        const pageNum = parseInt(newPage, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          onPageChange(pageNum);
        }
      }
    } else {
      onPageChange(page);
    }
  };
  
  return (
    <div className={styles.paginationContainer}>
      <div className={styles.pagination}>
        {/* Previous button */}
        <button 
          className={`${styles.paginationButton} ${!hasPrevPage ? styles.disabled : ''}`}
          onClick={() => hasPrevPage && onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          aria-label="Previous page"
        >
          ← Prev
        </button>
        
        {/* Page numbers */}
        <div className={styles.pageNumbers}>
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>...</span>
            ) : (
              <button
                key={`page-${page}`}
                className={`${styles.pageNumber} ${currentPage === page ? styles.currentPage : ''}`}
                onClick={() => handlePageNumberClick(page)}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        {/* Next button */}
        <button 
          className={`${styles.paginationButton} ${!hasNextPage ? styles.disabled : ''}`}
          onClick={() => hasNextPage && onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  hasPrevPage: PropTypes.bool.isRequired
};

// Main ProviderFinder Component
const ProviderFinder = () => {
  const {
    searchTerm,
    setSearchTerm,
    category,
    setCategory,
    sortBy,
    setSortBy,
    showOnlyFavorites,
    setShowOnlyFavorites,
    showOnlyPremium,
    setShowOnlyPremium,
    showOnlyVerified,
    setShowOnlyVerified,
    providerTypes,
    providers,
    totalItems,
    favoriteProviderIds,
    toggleFavorite,
    loading,
    error,
    isAuthenticated,
    // Pagination-related values from context
    currentPage,
    setCurrentPage,
    totalPages,
    hasNextPage,
    hasPrevPage
  } = useProviders();

  const handleViewProfile = (profileUrl) => {
    if (profileUrl) window.open(profileUrl, "_blank");
  };
  
  // Handle login redirect
  const handleLogin = () => {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  };

  const getProviderTypeClass = (typeId) => {
    let className = styles.providerTypeBtn;
    
    // Add specific type class for default styling
    switch(typeId) {
      case 'all': 
        className += ` ${styles.allBtn}`; 
        break;
      case 'babysitters': 
        className += ` ${styles.babysittersBtn}`; 
        break;
      case 'nannies': 
        className += ` ${styles.nanniesBtn}`; 
        break;
      case 'child-care': 
        className += ` ${styles.childCareBtn}`; 
        break;
      case 'after-school-care': 
        className += ` ${styles.afterSchoolBtn}`; 
        break;
      case 'in-home-daycare': 
        className += ` ${styles.homeDaycareBtn}`; 
        break;
      case 'special-needs': 
        className += ` ${styles.specialNeedsBtn}`; 
        break;
      case 'weekend-child-care': 
        className += ` ${styles.weekendBtn}`; 
        break;
    }
    
    // Add active class if this is the selected category
    if (category === typeId) {
      className += ` ${styles.active}`;
    }
    
    return className;
  };

  // Sort options
  const sortOptions = [
    { id: 'topRated', label: 'Top Rated' },
    { id: 'lowestPrice', label: 'Lowest Price' },
    { id: 'highestPrice', label: 'Highest Price' },
    { id: 'mostHired', label: 'Most Hired' },
    { id: 'mostExperience', label: 'Most Experience' },
    { id: 'reviewCount', label: 'Most Reviews' },
  ];

  // Calculate the range of items currently showing - Fix for issue #4
  const calculateItemRange = () => {
    const start = (currentPage - 1) * 20 + 1;
    const end = Math.min(currentPage * 20, totalItems);
    return `${start}-${end}`;
  };

  // Determine what to render based on auth and loading state
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className={styles.error}>
          <p>Authentication required</p>
          <button className={styles.retryButton} onClick={handleLogin}>
            Log In
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading providers...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
        </div>
      );
    }

    return (
      <>
        {/* Results Count - Updated to show correct range - Fix for issue #4 */}
        <p className={styles.resultsCount}>
          Showing {calculateItemRange()} of {totalItems} providers
          {showOnlyPremium && " (Premium only)"}
          {showOnlyVerified && " (Verified only)"}
          {showOnlyFavorites && " (Favorites only)"}
        </p>

        {/* Provider Cards */}
        <div className={styles.providersGrid}>
          {providers.length > 0 ? (
            providers.map(provider => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isFavorite={favoriteProviderIds.includes(provider.id)}
                onToggleFavorite={toggleFavorite}
                onViewProfile={handleViewProfile}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No providers found. Try changing your filters.</p>
            </div>
          )}
        </div>
        
        {/* Pagination - Only show when we have multiple pages */}
        {providers.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
          />
        )}
      </>
    );
  };

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageTitle}>Find Childcare Providers</h1>
      
      <div className={styles.filterSection}>
        {/* Search Bar */}
        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by city or postal code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Provider Types */}
        <div className={styles.providerFilters}>
          <div className={styles.filterHeading}>Provider Type</div>
          <div className={styles.providerTypes}>
            {providerTypes.map(type => (
              <button
                key={type.id}
                className={getProviderTypeClass(type.id)}
                onClick={() => setCategory(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Control Bar - Fixed alignment for issue #3 */}
        <div className={styles.controlBar}>
          <div className={styles.sortSection}>
            <div className={styles.filterHeading}>Sort by</div>
            <div className={styles.sortControls}>
              {sortOptions.map(option => (
                <button
                  key={option.id}
                  className={`${styles.sortBtn} ${sortBy === option.id ? styles.active : ''}`}
                  onClick={() => setSortBy(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterButtons}>
            {/* Verified Filter Button */}
            <button 
              className={`${styles.verifiedToggle} ${showOnlyVerified ? styles.active : ''}`}
              onClick={() => setShowOnlyVerified(!showOnlyVerified)}
            >
              <span className={styles.checkmark}>✓</span>
              Verified
            </button>
            
            {/* Premium Filter Button */}
            <button 
              className={`${styles.premiumToggle} ${showOnlyPremium ? styles.active : ''}`}
              onClick={() => setShowOnlyPremium(!showOnlyPremium)}
            >
              <span className={styles.premiumStar}>★</span>
              Premium Only
            </button>
            
            {/* Favorites Button */}
            <button 
              className={`${styles.favoriteToggle} ${showOnlyFavorites ? styles.active : ''}`}
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            >
              <span className={styles.heart}>❤</span>
              Show Favorites
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

export default ProviderFinder;