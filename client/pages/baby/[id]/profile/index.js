// client/pages/baby/[id]/profile/index.js
import { useForm } from "react-hook-form";
import {
  Row,
  Col,
  Form,
  Button,
  Container,
  Modal,
  Alert,
} from "react-bootstrap";
import { useRouter } from "next/router";
import styles from "./profile.module.css";
import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ProfilePictureManager from "@/components/ProfilePicture/ProfilePictureManager";

export default function BabyProfile({ baby_id }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [baby, setBaby] = useState(null);
  const { register, handleSubmit, setValue, watch } = useForm();
  const [originalData, setOriginalData] = useState(null);
  const formValues = watch();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState(null);

  // GET the baby profile information
  useEffect(() => {
    const fetchBabyProfile = async () => {
      if (baby_id) {
        try {
          setIsLoading(true);
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );

          if (!res.ok) {
            throw new Error(`Failed to fetch baby profile: ${res.status}`);
          }

          const data = await res.json();
          const babyData = data.data || data;

          // If profile_picture_url is missing in the API response, fetch it
          if (!babyData.profile_picture_url) {
            try {
              const fullProfileRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/v1/babies`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                },
              );

              if (fullProfileRes.ok) {
                const fullProfileData = await fullProfileRes.json();
                const matchingBaby = fullProfileData.babies?.find(
                  (b) => b.baby_id.toString() === baby_id.toString(),
                );

                if (matchingBaby && matchingBaby.profile_picture_url) {
                  babyData.profile_picture_url =
                    matchingBaby.profile_picture_url;
                }
              }
            } catch (error) {
              console.error("Error fetching full baby profile:", error);
            }
          }

          setBaby(babyData);

          // Convert birthdate to YYYY-MM-DD format
          const formattedBirthdate = babyData.birthdate
            ? new Date(babyData.birthdate).toISOString().split("T")[0]
            : "";

          // Form field setup
          setValue("first_name", babyData.first_name);
          setValue("last_name", babyData.last_name);
          setValue("gender", babyData.gender);
          setValue("weight", babyData.weight);

          setValue("birthdate", formattedBirthdate);
          setValue("height", babyData.height ? babyData.height : "");

          setOriginalData(babyData);
        } catch (error) {
          console.error("Error fetching baby profile:", error);
          setFormError(t("Failed to load baby profile. Please try again."));
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBabyProfile();
  }, [baby_id, setValue, t]);

  // Handle profile picture update
  const handleProfilePictureUpdate = (newUrl) => {
    setBaby((prev) => ({
      ...prev,
      profile_picture_url: newUrl,
    }));
  };

  // Check if form values have changed
  const isFormChanged = () => {
    if (!originalData) return false;
    return (
      formValues.first_name !== originalData.first_name ||
      formValues.last_name !== originalData.last_name ||
      formValues.gender !== originalData.gender ||
      formValues.weight !== originalData.weight ||
      formValues.birthdate !== originalData.birthdate ||
      formValues.height !== originalData.height
    );
  };

  // Form submission handler
  const onSubmit = async (data) => {
    try {
      setFormError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            data,
          }),
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to update baby profile: ${res.status}`);
      }

      // Show success message then redirect
      alert(t("Baby profile updated successfully."));
      router.push("/profile");
    } catch (error) {
      console.error("Error updating baby profile:", error);
      setFormError(t("Failed to update baby profile. Please try again."));
    }
  };

  // Delete handlers
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmed) return;
    try {
      setFormError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to delete baby profile: ${res.status}`);
      }

      setShowDeleteModal(false);
      router.push("/profile");
    } catch (error) {
      console.error("Error deleting baby profile:", error);
      setFormError(t("Failed to delete baby profile. Please try again."));
    }
  };

  const handleModalClose = () => {
    setShowDeleteModal(false);
    setDeleteConfirmed(false);
  };

  if (isLoading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <p>{t("Loading...")}</p>
        </div>
      </Container>
    );
  }

  if (!baby) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <p>{t("Baby profile not found")}</p>
        </div>
      </Container>
    );
  }

  return (
    <div className="d-flex">
      <Container className="py-4">
        <h2>{t("Edit Baby Profile")}</h2>

        {formError && (
          <Alert variant="danger" className="mb-3">
            {formError}
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* Profile Picture Manager */}
          <div className={styles.profilePictureContainer}>
            <ProfilePictureManager
              entityType="baby"
              entityId={baby_id}
              currentImageUrl={baby.profile_picture_url}
              onImageUpdate={handleProfilePictureUpdate}
              size={120}
            />
          </div>

          {/* Form fields */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("First Name")}</Form.Label>
                <Form.Control
                  {...register("first_name")}
                  type="text"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("Last Name")}</Form.Label>
                <Form.Control {...register("last_name")} type="text" required />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("Gender")}</Form.Label>
                <Form.Select {...register("gender")} required>
                  <option value="" disabled>
                    {t("Select Gender")}
                  </option>
                  <option value="boy">{t("Boy")}</option>
                  <option value="girl">{t("Girl")}</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("Weight")} (lbs)</Form.Label>
                <Form.Control
                  name="weight"
                  type="number"
                  placeholder={t("Weight at birth (lb)")}
                  min={5}
                  {...register("weight")}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          {/* NEW: Add DOB and Height fields */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("Date of Birth")}</Form.Label>
                <Form.Control
                  {...register("birthdate", {
                    required: true,
                    // Validation:
                    validate: (value) => {
                      const today = new Date();
                      const birthDate = new Date(value);
                      return (
                        birthDate <= today && // not in the future
                        birthDate >= new Date(today.getFullYear() - 50, 0, 1) // not earlier than 50 years ago
                      );
                    },
                  })}
                  type="date"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t("Height at birth")} (in)</Form.Label>
                <Form.Control
                  {...register("height", {
                    required: true,
                    min: 5, // min height: 5cm
                    max: 200, // max height: 2meters
                  })}
                  type="number"
                  placeholder={t("Enter height in cm")}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex">
            <Button
              type="submit"
              disabled={!isFormChanged()}
              className={styles.customButton}
            >
              {t("Save Changes")}
            </Button>
            <Button
              onClick={handleDeleteClick}
              className={styles.deleteButton}
              variant="outline-danger"
            >
              {t("Delete Profile")}
            </Button>
          </div>
        </Form>

        {/* Delete modal */}
        <Modal show={showDeleteModal} onHide={handleModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>{t("Confirm Delete")}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{t("Are you sure you want to delete this baby profile?")}</p>
            <Form.Check
              type="checkbox"
              id="delete-confirm"
              label={t(
                "I understand that this action cannot be undone and all data will be permanently deleted",
              )}
              checked={deleteConfirmed}
              onChange={(e) => setDeleteConfirmed(e.target.checked)}
              className="mb-3"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleModalClose}>
              {t("Cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={!deleteConfirmed}
            >
              {t("Delete Profile")}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export async function getServerSideProps({ params, locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      baby_id: params.id,
    },
  };
}
