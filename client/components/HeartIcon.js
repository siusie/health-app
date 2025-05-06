// components/HeartIcon.js
import React from "react";
import styles from "../pages/careServices/careServices.module.css";

/**
 * Heart icon component for favorite functionality
 * @param {Object} props - Component props
 * @param {boolean} props.active - Whether the heart is active (filled)
 * @param {Function} props.onClick - Click handler function
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.isPremium - Whether the provider is premium (for positioning)
 * @returns {JSX.Element} Heart icon component
 */
const HeartIcon = ({ active = false, onClick, className = "", isPremium = false }) => {
  return (
    <button
      className={`${styles.favoriteButton} ${isPremium ? styles.premiumFavoriteButton : ""} ${className}`}
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

export default HeartIcon;