// client/pages/[tips]/index.js

// When the user updates Notification settings in the modal, the preference is saved in localStorage (and updated on the backend if logged in)
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Accordion,
  Button,
  Form,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import styles from "./tips.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const CuratedTipsPage = () => {
  const { t } = useTranslation("common");
  const [tips, setTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  // FILTER inputs: Age (by month) and Gender
  const [babyAge, setBabyAge] = useState("");
  const [gender, setGender] = useState("All");
  // modal state for Settings(Daily/Weekly)
  const [showSettings, setShowSettings] = useState(false);
  const [notificationFrequency, setNotificationFrequency] = useState("Daily");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tips`)
      .then((res) => res.json())
      .then((data) => {
        // If returned data as Object { data: [...] }), or an array []
        const tipsData = data.data || data;
        setTips(tipsData);
        setFilteredTips(tipsData); // Initially display all tips
      })
      .catch((error) => console.error("Error fetching tips:", error));
  }, []); // RUN ONLY ONCE

  // FILTER function by Age and Gender
  const handleFilter = () => {
    const age = parseInt(babyAge, 10); // Convert to int`

    // FILTERING by Age and Gender
    const filtered = tips.filter((tip) => {
      let isMatchedAge = !isNaN(age)
        ? age >= tip.min_age && age <= tip.max_age
        : true;

      let isMatchedGender =
        gender === "All" ||
        tip.target_gender === "All" ||
        tip.target_gender === gender;

      return isMatchedAge && isMatchedGender;
    });

    setFilteredTips(filtered);
  };

  // GROUPING TIPS by category
  const groupedTips = {};
  for (const tip of filteredTips) {
    let cat = tip.category;
    // If category Key is not in groupedTips, add Key
    if (!groupedTips[cat]) {
      groupedTips[cat] = [];
    }

    // Push the tip into the same category Key
    groupedTips[cat].push(tip);
  }

  // Handlers for modal Notifications Settings
  const handleOpenSettings = () => setShowSettings(true);

  const handleCloseSettings = () => setShowSettings(false);

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    // If logged in, call backend route to update settings

    const token = localStorage.getItem("token");

    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tips/notification`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notification_frequency: notificationFrequency,
          opt_in: true,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Updated settings:", data);
          localStorage.setItem("notificationFrequency", notificationFrequency);
        })
        .catch((error) =>
          console.error("Error updating notification settings:", error),
        );
    } else {
      // If not logged in, save to localStorage
      localStorage.setItem("notificationFrequency", notificationFrequency);
    }

    setShowSettings(false);
  };

  // **** RENDER PAGE ****
  return (
    <Container className={styles.container}>
      <Row className="mb-3">
        <Col>
          <h1 className={styles.heading}>{t("Curated Tips")}</h1>
          <p>{t("Tips for raising a happy baby")}</p>
        </Col>
        {/* Button for modal Notification Settings */}
        <Col className="text-end">
          <Button variant="secondary" onClick={handleOpenSettings}>
            {t("Notification Settings")}
          </Button>
        </Col>
      </Row>
      {/* Filter Card */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>{t("Filter Tips")}</Card.Title>
          <Form>
            <Row>
              {/* Age Input */}
              <Col lg={4} className="mb-1">
                <Form.Group controlId="ageInput">
                  <Form.Label>{t("Baby Age (in months)")}</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder={t("Enter age in months")}
                    value={babyAge}
                    onChange={(e) => setBabyAge(e.target.value)}
                  />
                </Form.Group>
              </Col>
              {/* Gender Select */}
              <Col lg={4} className="mb-1">
                <Form.Group controlId="genderSelect">
                  <Form.Label>{t("Gender")}</Form.Label>
                  <Form.Control
                    as="select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="All">{t("All")}</option>
                    <option value="Boy">{t("Boy")}</option>
                    <option value="Girl">{t("Girl")}</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              {/* Filter Button */}
              <Col lg={4} className="d-flex align-items-end mt-2">
                <Button className={styles.button} onClick={handleFilter}>
                  {t("Filter")}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      {/* Accordion to display tips grouped by category */}
      {Object.keys(groupedTips).length === 0 ? (
        <p>{t("No tips available for selected filters.")}</p>
      ) : (
        <Accordion defaultActiveKey="0">
          {Object.keys(groupedTips).map((category, index) => (
            <Accordion.Item eventKey={index.toString()} key={category}>
              <Accordion.Header>{t(category)}</Accordion.Header>
              <Accordion.Body>
                {groupedTips[category].map((tip) => (
                  <Card className="mb-3" key={tip.tip_id}>
                    <Card.Body>
                      <Card.Title>
                        {t(tip.notification_frequency + " Tip")}
                      </Card.Title>
                      <Card.Text>{t(tip.tip_text)}</Card.Text>
                      <Card.Text>
                        <small className="text-muted">
                          {t("Age")}: {tip.min_age} - {tip.max_age}{" "}
                          {t("months")} | {t("Target")}: {t(tip.target_gender)}
                        </small>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                ))}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      {/* Settings Modal */}
      <Modal show={showSettings} onHide={handleCloseSettings}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Notification Settings")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSettingsSubmit}>
            <Form.Group controlId="notificationFrequency">
              <Form.Label>{t("Select Frequency")}</Form.Label>
              <Form.Control
                as="select"
                value={notificationFrequency}
                onChange={(e) => setNotificationFrequency(e.target.value)}
              >
                <option value="Daily">{t("Daily")}</option>
                <option value="Weekly">{t("Weekly")}</option>
              </Form.Control>
            </Form.Group>
            <Button variant="primary" type="submit" className="mt-3">
              {t("Save Settings")}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      <br />
      <br />
      <br />
    </Container>
  );
};

export default CuratedTipsPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
