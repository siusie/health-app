// CouponCardCarousel
import React from "react";
import { Image } from "react-bootstrap";
import styles from "./CouponCardCarousel.module.css";
import printCoupon from "@/utils/printCoupon";
import { useTranslation } from "next-i18next";

function CouponCardCarousel({ coupon }) {
  const { t } = useTranslation("common");
  
  return (
    <div className={styles.carouselCard}>
      <button className={styles.carouselCardButton} tabIndex="0" type="button">
        <div className={styles.carouselImageContainer}>
          <Image
            src={coupon.image_url}
            alt="Coupon Image"
            className={styles.carouselImage}
          />
        </div>
        <div className={styles.carouselCardContent}>
          <h6>{coupon.product_name}</h6>
          <div className={styles.cardText}>
            <p className="text-muted">{coupon.discount_description}</p>
            <p>{coupon.store ? coupon.store : "Online"}</p>
            <p>Expires: {coupon.expiration_date.substring(0, 10)}</p>
            <p className={styles.discountCode}>Code: {coupon.discount_code}</p>
          </div>

          {/* PRINT BUTTON */}
          <a
            href="#"
            className={styles.printButtonCarousel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              printCoupon(coupon);
            }}
          >
            {t("Print")}
          </a>
        </div>
      </button>{" "}
      {/* End of main button */}
    </div>
  );
}

export default CouponCardCarousel;
