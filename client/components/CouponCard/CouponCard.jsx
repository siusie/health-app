// client/components/CouponCard/CouponCard.jsx
import React, { useState } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import Image from "next/image";
import styles from "./CouponCard.module.css";
import { useTranslation } from "next-i18next";

const CouponCard = ({ coupon }) => {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  // Format expiration date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  // Handle copy coupon code to clipboard
  const handleCopyCode = () => {
    if (coupon.discount_code) {
      navigator.clipboard.writeText(coupon.discount_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle offer click (open the affiliate link or url)
  const handleOfferClick = (e) => {
    e.preventDefault();
    const url = coupon.affiliate_link || coupon.url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Get main category for display
  const getMainCategory = () => {
    if (!coupon.categories) return null;
    return coupon.categories.split(',')[0].trim();
  };

  return (
    <Card className={styles.couponCard}>
      {/* Image section */}
      <div className={styles.cardImageWrapper}>
        {coupon.image_url ? (
          <div className={styles.imageContainer}>
            <Image
              src={coupon.image_url}
              alt={coupon.product_name}
              width={180}
              height={180}
              className={styles.cardImage}
              onError={(e) => {
                // Replace with default image on error
                e.target.src = "/images/default-coupon.png";
              }}
            />
          </div>
        ) : (
          <div className={styles.noImagePlaceholder}>
            <span>{coupon.store}</span>
          </div>
        )}
        
        {/* Badges and labels */}
        {coupon.discount_amount && (
          <div className={styles.discountBadge}>
            {coupon.discount_symbol === '%' ? `${coupon.discount_amount}% OFF` : `$${coupon.discount_amount} OFF`}
          </div>
        )}
        
        {coupon.is_featured && (
          <div className={styles.featuredBadge}>
            {t("Featured")}
          </div>
        )}
        
        <div className={`${styles.typeBadge} ${coupon.type === 'Coupon Code' ? styles.couponType : styles.dealType}`}>
          {coupon.type || t("Deal")}
        </div>
      </div>
      
      {/* Card content */}
      <Card.Body className={styles.cardBody}>
        <div className={styles.cardContent}>
          {/* Store and category info */}
          <div className={styles.storeInfo}>
            <span className={styles.storeName}>{coupon.store}</span>
            {getMainCategory() && (
              <span className={styles.category}>{getMainCategory()}</span>
            )}
          </div>
          
          {/* Offer title */}
          <h5 className={styles.offerTitle}>{coupon.product_name}</h5>
          
          {/* Description */}
          <p className={styles.description}>
            {coupon.discount_description}
          </p>
        </div>
        
        {/* Card footer with coupon code and action buttons */}
        <div className={styles.cardFooter}>
          {coupon.discount_code ? (
            <>
              <div className={styles.couponCode}>
                <span>{t("Code")}:</span>
                <strong>{coupon.discount_code}</strong>
              </div>
              <div className={styles.buttonGroup}>
                <Button
                  variant="outline-primary"
                  className={styles.copyButton}
                  onClick={handleCopyCode}
                >
                  {copied ? t("Copied!") : t("Copy")}
                </Button>
                <Button
                  variant="primary"
                  className={styles.actionButton}
                  onClick={handleOfferClick}
                >
                  {t("Get Deal")}
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="primary"
              className={styles.actionButton}
              onClick={handleOfferClick}
            >
              {t("Get Deal")}
            </Button>
          )}
          
          {/* Expiration date if available */}
          {formatDate(coupon.expiration_date) && (
            <div className={styles.expiryDate}>
              {t("Expires")}: {formatDate(coupon.expiration_date)}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default CouponCard;