// client/pages/coupons/[featuredCoupons]/index.js
import React, { useState, useEffect } from "react";
import { Button, Form, Container, Row, Col, Card } from "react-bootstrap";
import "react-multi-carousel/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./coupons.module.css";
import CouponCard from "@/components/CouponCard/CouponCard";

const CouponPage = () => {
  const [city, setCity] = useState("");
  const [noResultsearch, setnoResultsearch] = useState(false);
  const [dataSearch, setDataSearch] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  const [featuredCoupons, setFeaturedCoupons] = useState([]);

  // ================== Fetch Coupons Data ==================
  // ***** useEffect for allCoupons and featuredCoupons *****
  useEffect(() => {
    // Fetch all coupons for (featured and Baby Products)
    const getAllCoupons = async () => {
      const couponsData = await fetchCoupons("", "true", "is_featured");
      setAllCoupons(couponsData);

      // Fetch featured coupons
      const featuredCouponsData = couponsData.filter(
        (coupon) => coupon.is_featured,
      );
      setFeaturedCoupons(featuredCouponsData);
    };

    getAllCoupons();
  }, []); // only run ONCE

  // ***** useEffect for SEARCH when city changes *****
  useEffect(() => {
    const getCouponsByCity = async () => {
      // SEARCH: Fetch all coupons for the city
      if (city !== "") {
        const couponsData = await fetchCoupons(city, "true", "is_featured");
        setDataSearch(couponsData);
        setnoResultsearch(couponsData.length === 0);
      } else {
        setnoResultsearch(false);
      }
    };

    getCouponsByCity();
  }, [city]); // only run when city changes

  // fetching for allCoupons, featuredCoupons, and search results by city
  const fetchCoupons = async (
    city = "",
    filterValue = "",
    filterField = "",
  ) => {
    let data = [];
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/coupons`);
      data = await res.json();

      // data: { status: "ok", data: (49) […] }
      data = data.data;

      // if no city selected, return all coupons
      if (city == "") {
        data = data;
      } else {
        // if city is selected, filter by city
        data = data.filter((coupon) => {
          return coupon.city.toLowerCase() === city.toLowerCase();
        });
      }

      // if filterValue and filterField are provided, filter by them
      if (filterValue !== "" && filterField !== "") {
        // if city is empty => IGNORE CITY CHECK
        if (city == "") {
          data = data.filter((coupon) => {
            return (
              coupon[filterField].toString().toLowerCase() ===
              filterValue.toLowerCase() // in case boolean/number ->convert it to string
            );
          });
        } else {
          // if city is selected, filter by city and filterValue/filterField
          data = data.filter((coupon) => {
            return (
              coupon.city.toLowerCase() === city.toLowerCase() &&
              coupon[filterField].toString().toLowerCase() ===
                filterValue.toLowerCase() // in case boolean/number ->convert it to string
            );
          });
        }
      }

      return data;
    } catch (error) {
      console.error("Error fetching coupons data:", error);
      return [];
    }
  };

  // ================== /end Fetch Coupons ==================

  // ================== Card components ==================
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 3000, min: 1333 },
      items: 7,
      slidesToSlide: 5, // optional, default to 1.
    },
    desktop: {
      breakpoint: { max: 1333, min: 999 },
      items: 6,
      slidesToSlide: 4, // optional, default to 1.
    },
    tablet: {
      breakpoint: { max: 999, min: 777 },
      items: 5,
      slidesToSlide: 4, // optional, default to 1.
    },
    mobile: {
      breakpoint: { max: 777, min: 0 },
      items: 2,
      slidesToSlide: 2, // optional, default to 1.
    },
  };

  // *** Render Page ***
  return (
    <div className={styles.couponContainer}>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Featured Discounts and Coupons</h1>
        <p className="text-gray-600">
          As part of our partner program, find featured discounts and coupons
          from various stores and brands.
        </p>
        {/**
         *
         *
         *
         *
         *  SEARCH FORM by city */}
        <Form
          className="mb-4 d-flex"
          onSubmit={(e) => {
            e.preventDefault();
            fetchCoupons();
          }}
        >
          <Form.Control
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => {
              setCity(e.target.value.trim());
              setnoResultsearch(false);
            }}
            style={{ width: "88%" }}
            className="border rounded me-2"
          />
        </Form>

        {/**
         *
         *
         *
         *
         *
         *
         *  Grid of SEARCHED COUPONS Cards*/}
        <br />
        {/* if city is filled AND has RESULT , show header with capital first letter */}
        {city !== "" && !noResultsearch && dataSearch.length > 0 && (
          <h3 className="text-2xl font-bold mb-3">
            Featured Discounts near{" "}
            {city.charAt(0).toUpperCase() + city.slice(1)}
          </h3>
        )}
        <Container>
          {/* For last row to be left-aligned, use 
          <Row className="justify-content-start">
          <Col xs={12} sm={6} md={4} lg={4} key={index} className="mb-4">
           */}
          <Row className="justify-content-start">
            {/* if city is filled  but noResultsearch is true, show nothing */}
            {city !== "" && noResultsearch === true && (
              // IF no coupons found
              <h5 className="mb-2 text-muted" style={{ fontWeight: "bold" }}>
                No featured coupons found in this city: {city}
              </h5>
            )}

            {/* if city is filled with noResultsearch false, show all coupons
             */}
            {city !== "" &&
              noResultsearch === false &&
              dataSearch?.map((coupon, index) => (
                <Col xs={12} sm={6} md={4} lg={4} key={index} className="mb-4">
                  <CouponCard coupon={coupon} />
                </Col>
              ))}

            {/* if city is empty, show all coupons */}
            {city == "" &&
              featuredCoupons?.map((coupon, index) => (
                <Col xs={12} sm={6} md={4} lg={4} key={index} className="mb-4">
                  <CouponCard coupon={coupon} />
                </Col>
              ))}
          </Row>
        </Container>
      </div>
      <br />
      <br />
    </div> //end couponCONTAINER div
  );
};

export default CouponPage;
