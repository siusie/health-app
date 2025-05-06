// client/pages/coupons/index.js
import React, { useState, useEffect } from "react";
import Carousel from "react-multi-carousel";
import {
  Form,
  Spinner,
  Alert,
  Container,
  Row,
  Col,
  Button,
} from "react-bootstrap";
import "react-multi-carousel/lib/styles.css";
import styles from "./coupons.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import CouponCard from "@/components/CouponCard/CouponCard";

const CouponPage = () => {
  const { t } = useTranslation("common");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [allOffers, setAllOffers] = useState([]);
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [babyOffers, setBabyOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [noResultsSearch, setNoResultsSearch] = useState(false);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);

  // Fetch all offers on component mount
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

        // Set all offers
        setAllOffers(data.offers);

        // Set featured offers
        const featured = data.offers.filter(
          (offer) => offer.featured === "Yes",
        );
        setFeaturedOffers(featured);

        // Set baby-related offers
        const babyRelated = data.offers.filter((offer) => {
          const categories = offer.categories || "";
          const title = offer.title || offer.offer_text || "";
          const description = offer.description || "";

          const babyKeywords = [
            "baby",
            "infant",
            "toddler",
            "child",
            "kid",
            "diaper",
            "toy",
          ];

          return (
            babyKeywords.some((keyword) =>
              categories.toLowerCase().includes(keyword),
            ) ||
            babyKeywords.some((keyword) =>
              title.toLowerCase().includes(keyword),
            ) ||
            babyKeywords.some((keyword) =>
              description.toLowerCase().includes(keyword),
            )
          );
        });
        setBabyOffers(babyRelated);

        // Extract all unique categories and stores for filters
        const allCategories = new Set();
        const allStores = new Set();

        data.offers.forEach((offer) => {
          if (offer.categories) {
            offer.categories.split(",").forEach((category) => {
              allCategories.add(category.trim());
            });
          }

          if (offer.store) {
            allStores.add(offer.store);
          }
        });

        setCategories(Array.from(allCategories).sort());
        setStores(Array.from(allStores).sort());

        // Set the last update time
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

  // Filter offers when search terms or filters change
  useEffect(() => {
    if (!searchTerm && !selectedCategory && !selectedStore) {
      setFilteredOffers([]);
      setNoResultsSearch(false);
      return;
    }

    const filtered = allOffers.filter((offer) => {
      // Search text matches
      const textMatch =
        !searchTerm ||
        (offer.title &&
          offer.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (offer.offer_text &&
          offer.offer_text.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (offer.description &&
          offer.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (offer.store &&
          offer.store.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category matches
      const categoryMatch =
        !selectedCategory ||
        (offer.categories &&
          offer.categories
            .toLowerCase()
            .includes(selectedCategory.toLowerCase()));

      // Store matches
      const storeMatch =
        !selectedStore || (offer.store && offer.store === selectedStore);

      return textMatch && categoryMatch && storeMatch;
    });

    setFilteredOffers(filtered);
    setNoResultsSearch(filtered.length === 0);
  }, [searchTerm, selectedCategory, selectedStore, allOffers]);

  // Reset filters function
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedStore("");
  };

  // Helper function to transform offer to consistent format
  const transformOfferToCoupon = (offer) => {
    return {
      id: offer.lmd_id,
      product_name: offer.title || offer.offer_text,
      discount_description: offer.description || "",
      discount_code: offer.code || "",
      discount_amount: offer.offer_value || "",
      discount_symbol:
        offer.offer && offer.offer.includes("Percentage") ? "%" : "$",
      store: offer.store || "Online Store",
      city: "",
      image_url: offer.image_url || "",
      expiration_date: offer.end_date || "",
      is_featured: offer.featured === "Yes",
      affiliate_link: offer.smartLink || "",
      url: offer.url || offer.merchant_homepage || "",
      type: offer.type || "Deal",
      categories: offer.categories || "",
    };
  };

  // Carousel responsive settings
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 5000, min: 1333 },
      items: 5,
      slidesToSlide: 3,
    },
    desktop: {
      breakpoint: { max: 1333, min: 999 },
      items: 4,
      slidesToSlide: 3,
    },
    tablet: {
      breakpoint: { max: 999, min: 777 },
      items: 3,
      slidesToSlide: 2,
    },
    mobile: {
      breakpoint: { max: 777, min: 0 },
      items: 1,
      slidesToSlide: 1,
    },
  };

  return (
    <div className="container mt-5">
      {/* // <div className={styles.couponContainer}> */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner animation="border" variant="primary" />
          <span>{t("Loading offers...")}</span>
        </div>
      ) : error ? (
        <Alert variant="danger" className="m-4">
          {error}
        </Alert>
      ) : (
        <Container fluid className={styles.contentContainer}>
          {/* Header Section */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.mainTitle}>{t("Discounts and Coupons")}</h1>
              <p className={styles.subtitle}>
                {t(
                  "As part of our partner program, find deals and discounts you won't find anywhere else!",
                )}
              </p>
            </div>
          </div>

          {/* Filters Section */}
          <div className={styles.filtersSection}>
            <Form className={styles.searchForm}>
              <Row className={styles.searchRow}>
                <Col md={6} lg={4}>
                  <Form.Group controlId="searchTerm" className="mb-3 mb-md-0">
                    <Form.Control
                      type="text"
                      placeholder={t("Search by keyword...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} lg={3}>
                  <Form.Group
                    controlId="categoryFilter"
                    className="mb-3 mb-md-0"
                  >
                    <Form.Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">{t("All Categories")}</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} lg={3}>
                  <Form.Group controlId="storeFilter" className="mb-3 mb-md-0">
                    <Form.Select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">{t("All Stores")}</option>
                      {stores.map((store) => (
                        <option key={store} value={store}>
                          {store}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} lg={2}>
                  <Button
                    variant="outline-secondary"
                    onClick={handleResetFilters}
                    disabled={
                      !searchTerm && !selectedCategory && !selectedStore
                    }
                    className={styles.resetButton}
                  >
                    {t("Reset Filters")}
                  </Button>
                </Col>
              </Row>
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

          {/* Search Results */}
          {(searchTerm || selectedCategory || selectedStore) && (
            <>
              {noResultsSearch ? (
                <div className={styles.noResultsFound}>
                  <h5 className="text-muted">
                    {t("No offers found matching your criteria")}
                  </h5>
                  <Button
                    variant="primary"
                    onClick={handleResetFilters}
                    className={styles.resetButtonCenter}
                  >
                    {t("Clear Filters")}
                  </Button>
                </div>
              ) : (
                filteredOffers.length > 0 && (
                  <div className={styles.searchResultsSection}>
                    <h3 className={styles.sectionTitle}>
                      {t("Search Results")} ({filteredOffers.length})
                    </h3>
                    <div className={styles.couponGrid}>
                      <Row>
                        {filteredOffers.map((offer, index) => (
                          <Col
                            key={index}
                            xs={12}
                            sm={6}
                            md={4}
                            lg={3}
                            className="mb-4"
                          >
                            <CouponCard
                              coupon={transformOfferToCoupon(offer)}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </div>
                )
              )}
            </>
          )}

          {/* Featured Offers Section */}
          {!filteredOffers.length && featuredOffers.length > 0 && (
            <div className={styles.featuredSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  {t("Featured Discounts")}
                </h3>
                <Button
                  variant="link"
                  onClick={() => setSelectedCategory("featured")}
                  className={styles.viewMoreButton}
                >
                  {t("View all")}
                </Button>
              </div>
              <Carousel
                swipeable={true}
                draggable={true}
                showDots={true}
                responsive={responsive}
                ssr={true}
                infinite={true}
                autoPlay={true}
                autoPlaySpeed={4000}
                keyBoardControl={true}
                customTransition="transform 0.5s ease-in-out"
                transitionDuration={500}
                containerClass={styles.carouselContainer}
                dotListClass={styles.carouselDots}
                itemClass={styles.carouselItem}
                rewind={true}
                rewindWithAnimation={true}
              >
                {featuredOffers.map((offer, index) => (
                  <div key={index} className={styles.carouselCard}>
                    <CouponCard coupon={transformOfferToCoupon(offer)} />
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* Baby Products Section */}
          {!filteredOffers.length && babyOffers.length > 0 && (
            <div className={styles.babySection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  {t("Baby Product Deals")}
                </h3>
                <Button
                  variant="link"
                  onClick={() => setSelectedCategory("Baby Products")}
                  className={styles.viewMoreButton}
                >
                  {t("View all")}
                </Button>
              </div>
              <Carousel
                swipeable={true}
                draggable={true}
                showDots={true}
                responsive={responsive}
                ssr={true}
                infinite={true}
                autoPlay={true}
                autoPlaySpeed={4000}
                keyBoardControl={true}
                customTransition="transform 0.5s ease-in-out"
                transitionDuration={500}
                containerClass={styles.carouselContainer}
                dotListClass={styles.carouselDots}
                itemClass={styles.carouselItem}
                rewind={true}
                rewindWithAnimation={true}
              >
                {babyOffers.map((offer, index) => (
                  <div key={index} className={styles.carouselCard}>
                    <CouponCard coupon={transformOfferToCoupon(offer)} />
                  </div>
                ))}
              </Carousel>
            </div>
          )}

          {/* All Offers Section (only show when no filters are active) */}
          {!filteredOffers.length && allOffers.length > 0 && (
            <div className={styles.allOffersSection}>
              <h3 className={styles.sectionTitle}>{t("All Offers")}</h3>
              <div className={styles.couponGrid}>
                <Row>
                  {allOffers.slice(0, 8).map((offer, index) => (
                    <Col
                      key={index}
                      xs={12}
                      sm={6}
                      md={4}
                      lg={3}
                      className="mb-4"
                    >
                      <CouponCard coupon={transformOfferToCoupon(offer)} />
                    </Col>
                  ))}
                </Row>
                {allOffers.length > 8 && (
                  <div className={styles.viewAllContainer}>
                    <Button
                      variant="primary"
                      className={styles.viewAllButton}
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                    >
                      {`${t("Browse all")} ${allOffers.length} ${t("offers")}`}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </Container>
      )}
    </div>
  );
};

export default CouponPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
