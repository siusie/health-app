import React, { useState, useRef } from "react";
import styles from "./SearchByCategoryBox.module.css";
import { useTranslation } from "next-i18next";

function SearchByCategoryBox() {
  const { t } = useTranslation("common");
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [isRecallListExpanded, setIsRecallListExpanded] = useState(true);
  const recallListRef = useRef(null);

  const contructQuery = (category, searchTerm) => {
    const categoryCodes = {
      clothing: "67000000",
      food: "50000000",
      toys: "86000000",
      electronics: "78000000",
      furniture: "75000000",
      personalCare: "53000000",
    };
    const gpcCode = categoryCodes[category];
    if (!gpcCode) {
      return;
    }

    if (!searchTerm) {
      return `(gs1-gpc-segment:${gpcCode})`;
    } else {
      return `${encodeURIComponent(searchTerm)} (gs1-gpc-segment:${gpcCode})`;
    }
  };

  const handleSearch = async () => {
    setSearchTerm("");
    const query = contructQuery(category, searchTerm);
    const apiUrl = `https://globalrecalls.oecd.org/ws/search.xqy?end=20&lang=en&order=desc&q=${query}&sort=date&start=0&uiLang=en`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      console.log("Data:", data);
      if (data.results?.length > 0) {
        setResults(data.results || []);
        setError("");
      } else {
        setError(
          "No results found. Plase try again with correct product name or category",
        );
        setResults([]);
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
      setError("Failed to fetch search results");
      setResults([]);
    }
  };
  return (
    <div className={styles.searchByCategoryBox}>
      <h1>{t("Search By Category")}</h1>
      <div className={styles.searchByCategory}>
        <select
          id={styles.categoryDropdown}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">{t("All Categories")}</option>
          <option value="food">{t("Food")}</option>
          <option value="toys">{t("Toys")}</option>
          <option value="clothing">{t("Clothing")}</option>
          <option value="electronics">{t("Electronics")}</option>
          <option value="furniture">{t("Furniture")}</option>
          <option value="personalCare">{t("Personal Care")}</option>
        </select>
        <input
          type="text"
          id={styles.searchInput}
          placeholder={t("Enter your search term...")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button id={styles.searchButton} onClick={handleSearch}>
          {t("Search")}
        </button>
      </div>

      <div className={styles.searchResults}>
        {results && (
          <div>
            <h4>{/* {t("Search")}: {results.product} */}</h4>

            <button
              onClick={() => setIsRecallListExpanded(!isRecallListExpanded)}
              className={`${styles.collapseBtn} ${
                isRecallListExpanded ? styles.expanded : ""
              }`}
              aria-label={
                isRecallListExpanded
                  ? "Collapse all recalls"
                  : "Expand all recalls"
              }
            >
              {isRecallListExpanded ? "▲ Collapse" : "▼ Expand"}
            </button>

            <div
              ref={recallListRef}
              className={`${styles.recallsList} ${
                isRecallListExpanded ? styles.expanded : ""
              }`}
              style={{
                maxHeight: isRecallListExpanded
                  ? `${recallListRef.current?.scrollHeight}px`
                  : "0px",
              }}
            >
              {results.map((item, index) => (
                <div className={styles.resultItem} key={index}>
                  <h4>{item["product.name"]}</h4>
                  <p>
                    <a href={item.extUrl} className={styles.itemLink}>
                      {t("View Recall Details")}
                    </a>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    </div>
  );
}

export default SearchByCategoryBox;
