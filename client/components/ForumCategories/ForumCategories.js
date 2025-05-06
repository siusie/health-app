// components/ForumCategories/ForumCategories.js
// A component for displaying forum categories
import React from "react";
import styles from "./ForumCategories.module.css";
import { useTranslation } from "next-i18next";

const ForumCategories = ({ selectedCategory, setCategory, className }) => {
  const { t } = useTranslation("common");
  const categories = [
    { id: "general", name: "General Discussion", icon: "💬" },
    { id: "help", name: "Help & Support", icon: "❓" },
    { id: "feedback", name: "Feedback", icon: "📝" },
    { id: "other", name: "Other", icon: "📌" },
  ];

  const handleCategoryClick = (categoryId) => {
    // If clicking the already selected category, unselect it
    if (selectedCategory === categoryId) {
      setCategory("");
    } else {
      setCategory(categoryId);
    }
  };

  return (
    <div className={`${styles.categoryGrid} ${className || ""}`}>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`${styles.categoryButton} ${
            selectedCategory === category.id ? styles.selected : ""
          }`}
          onClick={() => handleCategoryClick(category.id)}
        >
          <span className={styles.categoryIcon}>{category.icon}</span>
          <span className={styles.categoryName}>{category.name}</span>
        </button>
      ))}
    </div>
  );
};

export default ForumCategories;
