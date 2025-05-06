// client/pages/user/[id]/edit/index.js
import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Container,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import styles from "./user.module.css";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import ProfilePictureManager from "@/components/ProfilePicture/ProfilePictureManager";

export default function EditUserProfile() {
  const { t, i18n } = useTranslation("common");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "",
    },
  });

  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async (userId) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setValue("first_name", userData?.first_name);
          setValue("last_name", userData?.last_name);
          setValue("email", userData?.email);
          setValue("role", userData?.role);
        } else {
          console.error("Failed to fetch user profile");
          setFormError(t("Failed to load user profile. Please try again."));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setFormError(t("Failed to load user profile. Please try again."));
      }
    };

    if (router.isReady) {
      const { id } = router.query;
      const locale = router.query?.locale;

      if (router.query?.profile) {
        try {
          const userProfile = JSON.parse(router.query.profile);
          setUser(userProfile);

          setValue("first_name", userProfile?.first_name);
          setValue("last_name", userProfile?.last_name);
          setValue("email", userProfile?.email);
          setValue("role", userProfile?.role);
        } catch (error) {
          console.error("Error parsing profile from query:", error);
          // Fallback to fetching from API if parsing fails
          fetchUserProfile(id);
        }
      } else if (id) {
        fetchUserProfile(id);
      }
    }
  }, [router.isReady, router.query, setValue, t]);

  const submitForm = async (data) => {
    if (!user || !user.user_id) {
      console.error("Missing user ID for form submission");
      setFormError(t("Missing user ID. Unable to update profile."));
      return;
    }

    try {
      setFormError(null);
      setFormSuccess(null);

      // Add created_at key
      data.created_at = new Date().toISOString();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/user/${user.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(data),
        },
      );

      if (res.ok) {
        const updatedUser = await res.json();
        setFormSuccess(t("User information updated successfully!"));

        // Update local user state
        setUser({
          ...user,
          ...data,
        });

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      } else {
        const errorData = await res.json();
        console.error(`Error updating user ${user.user_id}: `, errorData);
        setFormError(t("Error updating user information. Please try again."));
      }
    } catch (err) {
      console.error(`Error updating user ${user.user_id}: `, err);
      setFormError(t("Error updating user information. Please try again."));
    }
  };

  const handleDelete = async () => {
    if (!user || !user.user_id) {
      console.error("Missing user ID for deletion");
      return;
    }

    try {
      setFormError(null);

      // Deleting User
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/user/${user.user_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();

      if (data.status === "ok") {
        // Clear user data from localStorage
        localStorage.removeItem("userId");
        localStorage.removeItem("token");

        // Show success message and redirect
        setFormSuccess(t("User deleted successfully!"));
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setFormError(t("Error deleting user information. Please try again."));
      }

      setShowDeleteModal(false);
    } catch (err) {
      console.error(`Error deleting user: `, err);
      setFormError(t("Error deleting user information. Please try again."));
      setShowDeleteModal(false);
    }
  };

  // Handle profile picture update
  const handleProfilePictureUpdate = (newUrl) => {
    // Update local user state with new image URL
    setUser({
      ...user,
      profile_picture_url: newUrl,
    });
  };

  if (!user) {
    return (
      <Container className={styles.container} fluid>
        <div className="text-center p-5">
          <p>{t("Loading user information...")}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.container} fluid>
      <div className={styles.formContainer}>
        {formError && (
          <Alert variant="danger" className="mb-3">
            {formError}
          </Alert>
        )}

        {formSuccess && (
          <Alert variant="success" className="mb-3">
            {formSuccess}
          </Alert>
        )}

        <div className="text-center mb-4">
          <ProfilePictureManager
            entityType="user"
            entityId={user.user_id}
            currentImageUrl={user.profile_picture_url}
            onImageUpdate={handleProfilePictureUpdate}
            size={150}
          />
        </div>

        <Form onSubmit={handleSubmit(submitForm)}>
          {/* Title */}
          <p className={styles.title}>{t("Edit Your User Information")}</p>

          {/* Name Field */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder={t("First name")}
                  {...register("first_name", {
                    required: t("First name is required."),
                  })}
                  isInvalid={!!errors?.first_name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.first_name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  placeholder={t("Last name")}
                  {...register("last_name", {
                    required: t("Last name is required."),
                  })}
                  isInvalid={!!errors?.last_name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.last_name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Email Field */}
          <Row className="mb-3">
            <Col>
              <Form.Group className="mb-3">
                <Form.Control
                  name="email"
                  type="email"
                  placeholder={t("Email")}
                  {...register("email", {
                    required: t("Email is required."),
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: t("Email is not valid."),
                    },
                  })}
                  isInvalid={!!errors?.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.email?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Role Field */}
          <Row className="mb-3">
            <Col>
              <Form.Group className="mb-3">
                <Form.Select
                  name="role"
                  type="text"
                  placeholder={t("Role")}
                  {...register("role", {
                    required: t("Role is required."),
                  })}
                  isInvalid={!!errors?.role}
                >
                  <option value="Parent">{t("Parent")}</option>
                  <option value="Caregiver">{t("Caregiver")}</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors?.role?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            {/* Save Button */}
            <Col>
              <Button
                variant="primary"
                type="submit"
                className={styles.submitButton}
              >
                {t("Save Changes")}
              </Button>
            </Col>
          </Row>

          {/* Delete Button */}
          <Row className="mb-3">
            <Col>
              <Button
                variant="danger"
                className={styles.deleteButton}
                onClick={() => setShowDeleteModal(true)}
              >
                {t("Delete User Profile")}
              </Button>
            </Col>
          </Row>
        </Form>

        {/* Delete Modal */}
        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          aria-labelledby="user-profile-delete-modal"
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              {t("Confirm Delete User Profile")}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>{t("Are you sure you want to delete your profile?")}</h5>
            <p>
              {t("This action cannot be undone. All your data will be lost.")}
            </p>
          </Modal.Body>
          <Modal.Footer>
            {/* Cancel Button */}
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              {t("Cancel")}
            </Button>
            {/* Delete Button */}
            <Button variant="danger" onClick={handleDelete}>
              {t("Delete User Profile")}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </Container>
  );
}

export async function getServerSideProps({ params, locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      userId: params.id,
    },
  };
}
