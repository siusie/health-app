import React, { useState, useEffect } from "react";
import { Card, Button, Image } from "react-bootstrap";
import styles from "./BabyCardMilestone.module.css";
import { useTranslation } from "next-i18next";
import Link from "next/link";

function BabyCardMilestone({ addMilestoneBtn }) {
  const { t } = useTranslation("common");
  const [babyProfiles, setBabyProfiles] = useState([]);

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
        // console.log("Fetched baby profiles data:", data); // Log the response data
        if (res.ok) {
          // Convert the object to an array of baby profiles
          // const babyProfilesArray = Object.keys(data)
          //   .filter((key) => key !== "status")
          //   .map((key) => data[key]);
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

  return (
    <div>
      {babyProfiles.length > 0 ? (
        babyProfiles.map((baby) => (
          <Card key={baby.baby_id} className="mb-3">
            <Card.Body className="d-flex align-items-center">
              <Image
                src="https://images.unsplash.com/photo-1674650638555-8a2c68584ddc?q=80&w=2027&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Profile"
                className="rounded-circle me-3"
                style={{ width: "80px", height: "80px" }}
              />
              <div className="flex-grow-1">
                <Card.Title>
                  {baby.first_name} {baby.last_name}
                </Card.Title>
                <Card.Text>{t("Gender")}: {baby.gender}</Card.Text>
                <Card.Text>{t("Weight")}: {baby.weight}lbs</Card.Text>
              </div>

              <Link href={`/baby/${baby.baby_id}/milestones`} passHref>
                <Button className={styles.customButton}>
                  {t("View milestones")}
                </Button>
              </Link>
              <Button
                className={styles.customButton}
                onClick={() => addMilestoneBtn(baby.baby_id)}
              >
                {t("Add milestone")}
              </Button>
            </Card.Body>
          </Card>
        ))
      ) : (
        <p>No baby profiles found.</p>
      )}
    </div>
  );
}

export default BabyCardMilestone;
