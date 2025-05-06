// client/pages/profile/index.js
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import { useRouter } from "next/router";
import styles from "./profile.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import ProfilePictureManager from "@/components/ProfilePicture/ProfilePictureManager";

function ProfilePage() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language;

  const [profile, setProfile] = useState(null);
  const [babyProfiles, setBabyProfiles] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      // Fetches the user's profile
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error ${res.status}`);
        }

        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError(t("Failed to fetch user profile. Please try again."));
      } finally {
        setLoading(false);
      }
    }

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

        // Handle 404 specifically, so that the app doesn't crash if no babies are found
        if (res.status === 404) {
          console.log("No babies found");
          setBabyProfiles([]);
          return;
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error ${res.status}`);
        }

        const data = await res.json();
        // Direct access to the babies array
        setBabyProfiles(data.babies || []);
      } catch (error) {
        console.error("Error fetching baby profiles:", error);
        setError(t("Failed to fetch baby profiles. Please try again."));
        setBabyProfiles([]);
      }
    }

    fetchProfile();
    fetchBabyProfiles();
  }, [t]); // Run only once on mount

  const handleEditButton = () => {
    if (!profile) return;

    router.push({
      pathname: `/user/${profile.user_id}/edit`,
      query: { profile: JSON.stringify(profile), locale },
    });
  };

  const handleProfilePictureUpdate = (newUrl) => {
    // Update the profile state with the new image URL
    setProfile((prevProfile) => ({
      ...prevProfile,
      profile_picture_url: newUrl,
    }));
  };

  if (loading) {
    return (
      <Container className={styles.container}>
        <div className="text-center py-5">
          <p>{t("Loading...")}</p>
        </div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className={styles.container}>
        <div className="text-center py-5">
          <p>{t("No profile data found. Please try again later.")}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.container} fluid>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Profile Section */}
      <Row>
        <Col>
          <div className={styles.header}>
            <h1>{t("Profile")}</h1>
          </div>
          <p>{t("Manage your profile information")}</p>
          <Card className="mb-3">
            <Card.Body className="d-flex align-items-center flex-wrap">
              {/* Profile Picture Section */}
              <div className="me-4">
                <ProfilePictureManager
                  entityType="user"
                  entityId={profile.user_id}
                  currentImageUrl={profile.profile_picture_url}
                  onImageUpdate={handleProfilePictureUpdate}
                  size={80}
                />
              </div>

              {/* Profile Info Section */}
              <div className="flex-grow-1">
                <Card.Title>
                  {profile.first_name} {profile.last_name}
                </Card.Title>
                <Card.Text>{t(profile.role)}</Card.Text>
              </div>

              {/* Edit Button */}
              <Button
                variant="outline-secondary"
                onClick={handleEditButton}
                className={styles.customButton}
              >
                {t("Edit")}
              </Button>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>{t("Baby Profiles")}</h2>
            <Link href={`/baby/add`} locale={locale}>
              <Button variant="primary" className={styles.customButton}>
                {t("Add Baby")}
              </Button>
            </Link>
          </div>

          {/* Baby profiles */}
          {babyProfiles.length > 0 ? (
            babyProfiles.map((baby) => (
              <Link
                href={{
                  pathname: `/baby/${baby.baby_id}/profile`,
                }}
                key={baby.baby_id}
                style={{ textDecoration: "none", cursor: "pointer" }}
              >
                <Card
                  className={`mb-3 ${styles.hoverCard}`}
                  style={{ transition: "all 0.2s ease" }}
                >
                  <Card.Body className="d-flex align-items-center">
                    {/* Use ProfilePictureManager in read-only mode */}
                    <div className="me-3">
                      <ProfilePictureManager
                        entityType="baby"
                        entityId={baby.baby_id}
                        currentImageUrl={baby.profile_picture_url}
                        size={80}
                        readOnly={true}
                      />
                    </div>

                    <div className="flex-grow-1">
                      <Card.Title>
                        {baby.first_name} {baby.last_name}
                      </Card.Title>
                      <Card.Text>
                        {t("Gender")}: {t(baby.gender)}
                      </Card.Text>
                      <Card.Text>
                        {t("Weight")}: {baby.weight}lbs
                      </Card.Text>
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            ))
          ) : (
            <p>{t("No baby profiles found")}</p>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
