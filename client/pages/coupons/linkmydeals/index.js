// client/pages/coupons/linkmydeals/index.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import styles from "./linkmydeals.module.css";
import Image from "next/image";

const LinkMyDealsPage = () => {
  const { t } = useTranslation("common");
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStore, setSelectedStore] = useState("");

  // Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        // Load offers from our local JSON file
        const response = await fetch("/data/coupons-discounts.json");

        if (!response.ok) {
          throw new Error(`Failed to fetch offers: ${response.status}`);
        }

        const data = await response.json();

        if (!data.offers || !Array.isArray(data.offers)) {
          throw new Error(
            "Invalid data format: offers not found or not an array",
          );
        }

        setOffers(data.offers);
        setFilteredOffers(data.offers);
        setLastUpdate(new Date(data.last_updated));
      } catch (err) {
        console.error("Error fetching offers:", err);
        setError(err.message || "Failed to load offers");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Filter offers whenever filters change
  useEffect(() => {
    if (!offers.length) return;

    let result = [...offers];

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (offer) =>
          (offer.title && offer.title.toLowerCase().includes(term)) ||
          (offer.offer_text && offer.offer_text.toLowerCase().includes(term)) ||
          (offer.description &&
            offer.description.toLowerCase().includes(term)) ||
          (offer.store && offer.store.toLowerCase().includes(term)),
      );
    }

    // Apply offer type filter
    if (selectedType) {
      result = result.filter((offer) => offer.type === selectedType);
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter(
        (offer) =>
          offer.categories &&
          offer.categories
            .toLowerCase()
            .includes(selectedCategory.toLowerCase()),
      );
    }

    // Apply store filter
    if (selectedStore) {
      result = result.filter((offer) => offer.store === selectedStore);
    }

    setFilteredOffers(result);
  }, [offers, searchTerm, selectedType, selectedCategory, selectedStore]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedCategory("");
    setSelectedStore("");
  };

  // Get unique categories, stores, and offer types
  const categories = [
    ...new Set(
      offers.flatMap((offer) =>
        offer.categories
          ? offer.categories.split(",").map((c) => c.trim())
          : [],
      ),
    ),
  ]
    .filter(Boolean)
    .sort();

  const stores = [...new Set(offers.map((offer) => offer.store))]
    .filter(Boolean)
    .sort();

  const offerTypes = [...new Set(offers.map((offer) => offer.type))]
    .filter(Boolean)
    .sort();

  return (
    <div className={styles.couponContainer}>
      <Container>
        <div className={styles.header}>
          <div>
            <h1>{t("LinkMyDeals Coupons & Offers")}</h1>
            <p className={styles.subtitle}>
              {t(
                "Browse the latest deals and coupons from thousands of online stores",
              )}
            </p>
          </div>
          <div className={styles.headerLinks}>
            <Link href="/coupons" className={styles.backLink}>
              {t("← Back to All Coupons")}
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <div className={styles.filtersSection}>
          <Form className={styles.searchForm}>
            <Form.Group controlId="searchTerm">
              <Form.Control
                type="text"
                placeholder={t("Search deals...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Form.Group>

            <div className={styles.filtersRow}>
              <Form.Group controlId="typeFilter">
                <Form.Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="">{t("All Types")}</option>
                  {offerTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="categoryFilter">
                <Form.Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">{t("All Categories")}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="storeFilter">
                <Form.Select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                >
                  <option value="">{t("All Stores")}</option>
                  {stores.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className={styles.filterButtons}>
                <Button
                  variant="outline-secondary"
                  onClick={handleResetFilters}
                  disabled={
                    !searchTerm &&
                    !selectedType &&
                    !selectedCategory &&
                    !selectedStore
                  }
                >
                  {t("Reset Filters")}
                </Button>
              </div>
            </div>
          </Form>
        </div>

        {/* Last Updated Info */}
        {lastUpdate && (
          <div className={styles.lastUpdate}>
            <small className="text-muted">
              {t("Data last updated")}: {lastUpdate.toLocaleString()}
            </small>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="danger" className="my-3">
            {error}
          </Alert>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className={styles.loadingContainer}>
            <Spinner animation="border" />
            <p>{t("Loading offers...")}</p>
          </div>
        )}

        {/* Results Summary */}
        {!loading && !error && (
          <div className={styles.resultsSummary}>
            <p>
              {filteredOffers.length === 0
                ? t("No matching offers found")
                : t("Showing {{count}} offers", {
                    count: filteredOffers.length,
                  })}
              {(searchTerm ||
                selectedType ||
                selectedCategory ||
                selectedStore) &&
                ` (${t("filtered from")} ${offers.length})`}
            </p>
          </div>
        )}

        {/* Offers Grid */}
        {!loading && !error && filteredOffers.length > 0 && (
          <Row>
            {filteredOffers.map((offer, index) => (
              <Col key={index} xs={12} sm={6} md={4} className="mb-4">
                <div className={styles.couponCard}>
                  <div className={styles.cardImageWrapper}>
                    {offer.image_url ? (
                      <Image
                        src={offer.image_url || "/images/default-coupon.png"} // Fallback to default image
                        alt={offer.title || offer.offer_text || "Coupon Image"}
                        width={300} // Set the desired width
                        height={200} // Set the desired height
                        className={styles.cardImage}
                        onLoadingComplete={(e) => {
                          // Optional: Handle any logic after the image is loaded
                        }}
                        unoptimized // Optional: Use this if the image is from an external URL and not optimized
                      />
                    ) : (
                      <div className={styles.cardImage}>
                        <span>{offer.store || "Offer"}</span>
                      </div>
                    )}

                    {offer.offer_value && (
                      <div className={styles.discountAmount}>
                        {offer.offer && offer.offer.includes("Percentage")
                          ? `${offer.offer_value} OFF`
                          : `${offer.offer_value} OFF`}
                      </div>
                    )}

                    {offer.featured === "Yes" && (
                      <span className={styles.featuredBadge}>
                        {t("Featured")}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardContent}>
                      <div className={styles.storeDetails}>
                        <span className={styles.storeName}>
                          {offer.store || t("Online Store")}
                        </span>
                        <span className={styles.category}>
                          {offer.categories
                            ? offer.categories.split(",")[0]
                            : ""}
                        </span>
                      </div>

                      <h5 className={styles.productTitle}>
                        {offer.title || offer.offer_text}
                      </h5>

                      <p className={styles.description}>{offer.description}</p>
                    </div>

                    <div className={styles.cardFooter}>
                      {offer.code ? (
                        <>
                          <div className={styles.couponCode}>
                            <span>{t("Code")}:</span>
                            <strong>{offer.code}</strong>
                          </div>
                          <a
                            href={
                              offer.smartLink ||
                              offer.url ||
                              offer.merchant_homepage
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.printButton}
                          >
                            {t("Get Coupon")}
                          </a>
                        </>
                      ) : (
                        <a
                          href={
                            offer.smartLink ||
                            offer.url ||
                            offer.merchant_homepage
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.printButton}
                        >
                          {t("Get Deal")}
                        </a>
                      )}

                      {offer.end_date && (
                        <div className="text-center mt-2">
                          <small className="text-muted">
                            {t("Expires")}:{" "}
                            {new Date(offer.end_date).toLocaleDateString()}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOffers.length === 0 && (
          <div className={styles.emptyState}>
            <p>{t("No offers match your current filters.")}</p>
            <Button variant="primary" onClick={handleResetFilters}>
              {t("Clear Filters")}
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};

export default LinkMyDealsPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
