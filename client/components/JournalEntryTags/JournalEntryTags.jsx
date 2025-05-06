import React from "react";
import styles from "./JournalEntryTags.module.css";
import { useTranslation } from "next-i18next";

// Predefined tags list
const PREDEFINED_TAGS = [
  "personal",
  "work",
  "health",
  "family",
  "goals",
  "gratitude",
  "reflection",
  "ideas",
  "memories",
  "achievements",
];

const JournalEntryTags = ({ selectedTags, setTags, disabled = false }) => {
  const { t } = useTranslation("common");

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setTags(selectedTags.filter((t) => t !== tag));
    } else {
      setTags([...selectedTags, tag]);
    }
  };

  return (
    <div className={styles.tagContainer}>
      <div className={styles.tagList}>
        {PREDEFINED_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagToggle(tag)}
            className={`${styles.tag} ${
              selectedTags.includes(tag) ? styles.tagSelected : ""
            }`}
            disabled={disabled}
            type="button"
          >
            #{t(tag)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default JournalEntryTags;
