import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useRouter } from "next/router";
import BabyCard from "../../components/BabyCard/BabyCard";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styles from "./analysis.module.css";

export default function Analysis() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Navigate to baby's analysis page
  const handleSelectBaby = (babyId) => {
    router.push(`/baby/${babyId}/analysis`);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <Container className={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <p>{t("Loading...")}</p>
        </div>
      </Container>
    );
  }

  return (
    <div className={styles.container}>
      <Row>
        <Col>
          <div className={styles.header}>
            <h1 className={styles.title}>{t("Analysis")}</h1>
          </div>
          <p>{t("Select a baby to view their analysis")}</p>
          <BabyCard
            buttons={[
              {
                name: t("View Analysis"),
                functionHandler: handleSelectBaby,
              },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
