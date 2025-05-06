import React, { useState } from "react";
import { Container, Row, Col, Modal, Button, Alert } from "react-bootstrap";
import styles from "./growth.module.css";
import BabyCard from "@/components/BabyCard/BabyCard";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { format, parseISO } from "date-fns";

function Growth() {
  const { t } = useTranslation("common");
  const router = useRouter();
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [modalData, setModalData] = useState({
    date: new Date().toISOString().split("T")[0],
    height: "",
    weight: "",
    notes: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    height: false,
    weight: false,
  });

  // Function to handle "View Details" action
  const handleViewDetails = (babyId) => {
    router.push(`/baby/${babyId}/growth`);
  };

  // Function to handle "Add Growth Entry" action
  const handleAddGrowth = (babyId) => {
    setSelectedBaby(babyId);
    setModalData({
      date: new Date().toISOString().split("T")[0],
      height: "",
      weight: "",
      notes: "",
    });
    setValidationErrors({ height: false, weight: false });
    setShowModal(true);
  };

  // Handle save growth record
  const handleSave = async () => {
    const isHeightEmpty = !modalData.height;
    const isWeightEmpty = !modalData.weight;

    // Validate height and weight
    if (isHeightEmpty || isWeightEmpty) {
      setValidationErrors({ height: isHeightEmpty, weight: isWeightEmpty });
      return;
    }

    // Validate that height and weight are NUMBER(5,2)
    const isHeightValid = /^\d{1,3}(\.\d{1,2})?$/.test(modalData.height);
    const isWeightValid = /^\d{1,3}(\.\d{1,2})?$/.test(modalData.weight);

    if (!isHeightValid || !isWeightValid) {
      setValidationErrors({
        height: !isHeightValid,
        weight: !isWeightValid,
      });
      return;
    }

    const formattedDate = format(parseISO(modalData.date), "yyyy-MM-dd");

    const sendingData = {
      date: formattedDate,
      height: modalData.height,
      weight: modalData.weight,
      notes: modalData.notes || "",
    };

    try {
      // Save the growth record
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedBaby}/growth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(sendingData),
        }
      );

      const data = await res.json();
      
      if (res.ok) {
        // Close modal and show success message (you could add a toast here)
        setShowModal(false);
        // Optionally, redirect to the baby's growth page to see the new entry
        router.push(`/baby/${selectedBaby}/growth`);
      } else {
        console.error("Failed to save growth record:", data);
      }
    } catch (error) {
      console.error("Error saving growth record:", error);
    }
  };

  return (
    <Container className={styles.container} fluid>
      <Row className={styles.headerRow}>
        <Col>
          <h1 className={styles.title}>{t("Growths")}</h1>
          <p>{t("Manage your baby's height and weight data")}</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <BabyCard
            buttons={[
              {
                name: t("See Details"),
                functionHandler: handleViewDetails,
              },
              {
                name: t("Add Growth Entry"),
                functionHandler: handleAddGrowth,
              },
            ]}
          />
        </Col>
      </Row>

      {/* Add Growth Entry Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Add New Growth Entry")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {validationErrors.height && (
            <Alert variant="danger">
              {t("Height is required and must be less than 999.99.")}
            </Alert>
          )}
          {validationErrors.weight && (
            <Alert variant="danger">
              {t("Weight is required and must be less than 999.99.")}
            </Alert>
          )}
          <div className="mb-3">
            <label>{t("Date")}</label>
            <input
              type="date"
              className="form-control"
              value={modalData.date}
              onChange={(e) =>
                setModalData({ ...modalData, date: e.target.value })
              }
            />
          </div>
          <div className="mb-3">
            <label>{t("Height")}</label>
            <input
              type="number"
              className="form-control"
              placeholder="Enter height (in inches)"
              value={modalData.height}
              onChange={(e) =>
                setModalData({ ...modalData, height: e.target.value })
              }
              style={{
                borderColor: validationErrors.height ? "red" : "",
              }}
            />
          </div>
          <div className="mb-3">
            <label>{t("Weight")}</label>
            <input
              type="number"
              className="form-control"
              placeholder="Enter weight (in lbs)"
              value={modalData.weight}
              onChange={(e) =>
                setModalData({ ...modalData, weight: e.target.value })
              }
              style={{
                borderColor: validationErrors.weight ? "red" : "",
              }}
            />
          </div>
          <div className="mb-3">
            <label>{t("Notes")}</label>
            <textarea
              className="form-control"
              placeholder="Add a note (e.g., Example note: Monthly check-up)"
              value={modalData.notes}
              onChange={(e) =>
                setModalData({ ...modalData, notes: e.target.value })
              }
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {t("Cancel")}
          </Button>
          <Button className={styles.button} onClick={handleSave}>
            {t("Save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Growth;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}