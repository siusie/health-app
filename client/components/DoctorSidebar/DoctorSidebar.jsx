import React from "react";
import { Col, Nav } from "react-bootstrap";
import styles from "./DoctorSidebar.module.css";
import { useTranslation } from "next-i18next";
import Link from "next/link";

function DoctorSidebar() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;

  return (
    <Col md={2} className={styles.sidebar}>
      <Nav defaultActiveKey="/" className="flex-column">
        <Nav.Link
          as={Link}
          href={`/doctor/${localStorage.getItem("userId")}`}
          locale={locale}
          className={styles.navlink}
        >
          {t("Dashboard")}
        </Nav.Link>

        <Nav.Link
          as={Link}
          href={`/doctor/healthDocuments`}
          locale={locale}
          className={styles.navlink}
        >
          {t("Health Records")}
        </Nav.Link>
      </Nav>
    </Col>
  );
}

export default DoctorSidebar;
