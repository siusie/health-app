import React, { useState, useEffect } from "react";
import { Card, Button, Image, Container } from "react-bootstrap";
import styles from "./BabyCardGrowth.module.css";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";


function BabyCardGrowth({ buttons }) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;
  const [babyProfiles, setBabyProfiles] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    async function fetchBabyProfiles() {
      // Fetches the user's baby profiles
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/babies`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok) {
          // Direct access to the babies array
          setBabyProfiles(data.babies);
        } else {
          console.error("Failed to fetch baby profiles:", data);
        }
      } catch (error) {
        console.error("Error fetching baby profiles:", error);
      }
    }

    fetchBabyProfiles();
  }, []); // Ensure the dependency array is empty to run only once on mount

    const addMealBtn = (babyId) => {
    router.push({
      pathname: `/baby/${babyId}/addMeal`,
      query: { user_id: localStorage.getItem("userId") },
    });
  };

  return (
    <Container className={styles.container} fluid>
      {babyProfiles.length > 0 ? (
        babyProfiles.map((baby) => (
          <Card key={baby.baby_id} className={styles.card}>
            <Card.Body className={styles.cardBody}>
              <Image
                src="https://images.unsplash.com/photo-1674650638555-8a2c68584ddc?q=80&w=2027&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Profile"
                className={styles.profileImage}
              />
              <div className={styles.cardContent}>
                <Card.Title className={styles.cardTitle}>
                  {baby.first_name} {baby.last_name}
                </Card.Title>
                <Card.Text className={styles.cardText}>
                  {t("Gender")}: {baby.gender}
                </Card.Text>
                <Card.Text className={styles.cardText}>
                  {t("Weight")}: {baby.weight}lbs
                </Card.Text>
              </div>

              {/* Buttons */}
              {buttons.length > 0 && buttons.map((button, index) => (
                <Link
                  key={`${baby.baby_id}-${button.path}`}
                  href={`/baby/${baby.baby_id}/${button.path}`}
                  locale={locale}
                >
                  <Button className={styles.customButton}>
                    {t(button.name)}
                  </Button>
                </Link>
              ))}
            </Card.Body>
          </Card>
        ))
      ) : (
        <p>No baby profiles found.</p>
      )}
    </Container>
  );
}

export default BabyCardGrowth;
