import React, { useState, useEffect } from "react";
import { Card, Button } from "react-bootstrap";
import styles from "./BabyCard.module.css";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import ProfilePictureManager from '@/components/ProfilePicture/ProfilePictureManager';

function BabyCard({ buttons }) {
  const { t, i18n } = useTranslation("common");
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
          },
        );
        const data = await res.json();
        if (res.ok) {
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

  // Handle profile picture update
  const handleProfilePictureUpdate = (babyId, newUrl) => {
    // Update the baby profile in the state with the new image URL
    setBabyProfiles(prevProfiles => 
      prevProfiles.map(baby => 
        baby.baby_id === babyId 
          ? { ...baby, profile_picture_url: newUrl } 
          : baby
      )
    );
  };

  return (
    <div>
      {babyProfiles.length > 0 ? (
        babyProfiles.map((baby) => (
          <Card key={baby.baby_id} className="mb-3">
            <Card.Body className="d-flex align-items-center">
              {/* ProfilePictureManager component (in read-only mode) */}
              <div className="me-3">
                <ProfilePictureManager
                  entityType="baby"
                  entityId={baby.baby_id}
                  currentImageUrl={baby.profile_picture_url}
                  onImageUpdate={(newUrl) => handleProfilePictureUpdate(baby.baby_id, newUrl)}
                  size={80}
                  readOnly={true} // Set to read-only since this is just a card display
                />
              </div>
              
              <div className="flex-grow-1">
                <Card.Title>
                  {baby.first_name} {baby.last_name}
                </Card.Title>
                <Card.Text>
                  {t("Gender")}: {baby.gender}
                </Card.Text>
                <Card.Text>
                  {t("Weight")}: {baby.weight}lbs
                </Card.Text>
              </div>

              {/* Buttons */}
              {buttons && buttons.length > 0 &&
                buttons.map((button, index) => (
                  <div key={index} className={styles.buttonContainer}>
                    {button.path ? (
                      <Link
                        href={`/baby/${baby.baby_id}/${button.path}`}
                        passHref
                      >
                        {button.functionHandler ? (
                          <Button
                            className={styles.customButton}
                            onClick={() => button.functionHandler()}
                          >
                            {button.name}
                          </Button>
                        ) : (
                          <Button className={styles.customButton}>
                            {button.name}
                          </Button>
                        )}
                      </Link>
                    ) : (
                      <Button
                        className={styles.customButton}
                        onClick={() => button.functionHandler(baby.baby_id)}
                      >
                        {button.name}
                      </Button>
                    )}
                  </div>
                ))}
            </Card.Body>
          </Card>
        ))
      ) : (
        <p>No baby profiles found.</p>
      )}
    </div>
  );
}

export default BabyCard;