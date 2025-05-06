// pages/login/index.js
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, InputGroup, Alert } from "react-bootstrap";
import styles from "./login.module.css";
import Link from "next/link";
import { Container } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function Login() {
  const { t, i18n } = useTranslation("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  const router = useRouter();

  const validateEmail = (email) => {
    // Only check if email has @ and at least one character before and after
    const re = /^.+@.+\..+$/;
    return re.test(String(email).toLowerCase());
  };

  // Validate form fields before submission
  const validateForm = () => {
    let valid = true;
    const errors = {
      email: "",
      password: "",
      general: "",
    };

    // Email validation
    if (!email) {
      errors.email = "Email is required";
      valid = false;
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
      valid = false;
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required";
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };
  // This message is used to show the error message when the token is expired, it redirects to login page
  const { message } = router.query;

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Reset errors
    setError("");
    setFormErrors({
      email: "",
      password: "",
      general: "",
    });

    // Validate both empty fields and email format before submission
    let isValid = true;
    const errors = {
      email: "",
      password: "",
      general: "",
    };

    // Check for empty fields and validate email format
    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    }

    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.redirect === "/register") {
          console.log("Login successfully, please complete your registration");
          localStorage.setItem("token", data.token);
          router.push("/register");
        } else {
          const userRole = data.userRole;
          console.log(`Login as ${userRole} successfully`);
          localStorage.setItem("token", data.token);
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("userRole", userRole);
          if (userRole === "Parent") router.push("/profile");
          else if (userRole === "Medical Professional")
            router.push(`/doctor/${data.userId}`);
        }
      } else {
        setFormErrors({
          ...formErrors,
          general: "Email or password is invalid",
        });
        setIsLoading(false);
      }
    } catch (error) {
      setFormErrors({
        ...formErrors,
        general: "An error occurred. Please try again later.",
      });
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container className={styles.container} fluid>
      <div className={styles.formContainer}>
        {message && (
          <Alert variant="danger" className={styles.alert}>
            {message}{" "}
          </Alert>
        )}
        <Form className={styles.form} onSubmit={handleSubmit} noValidate>
          <p className={styles.title}>{t("Welcome back !")}</p>

          {formErrors.general && (
            <div className={styles.errorMessage}>{formErrors.general}</div>
          )}

          <Form.Group className="mb-3" controlId="emailLogin">
            <div className={styles.inputWithFeedback}>
              <Form.Control
                type="email"
                placeholder={t("Enter email")}
                className={`${styles.formControl} ${
                  formErrors.email ? styles.inputError : ""
                }`}
                value={email}
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear email error when user starts typing
                  if (formErrors.email) {
                    setFormErrors({ ...formErrors, email: "" });
                  }
                }}
              />
              {formErrors.email && (
                <div className={styles.inlineErrorMessage}>
                  <span className={styles.errorIcon}>!</span> {formErrors.email}
                </div>
              )}
            </div>
          </Form.Group>

          <Form.Group className="mb-3" controlId="passwordLogin">
            <div className={styles.inputWithFeedback}>
              <InputGroup className={styles.inputGroup}>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder={t("Password")}
                  className={`${styles.formControl} ${
                    formErrors.password ? styles.inputError : ""
                  }`}
                  value={password}
                  required
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear password error when user starts typing
                    if (formErrors.password) {
                      setFormErrors({ ...formErrors, password: "" });
                    }
                  }}
                />
                <Button
                  variant="outline-secondary"
                  onClick={togglePasswordVisibility}
                  className={`${styles.passwordToggle} ${
                    formErrors.password ? styles.inputError : ""
                  }`}
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </InputGroup>
              {formErrors.password && (
                <div className={styles.inlineErrorMessage}>
                  <span className={styles.errorIcon}>!</span>{" "}
                  {formErrors.password}
                </div>
              )}
            </div>
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : t("Login")}
          </Button>

          <div className="mt-3">
            <p>
              {t("Dont have an account ?")}{" "}
              <Link
                href="https://us-east-26an90qfwo.auth.us-east-2.amazoncognito.com/signup?client_id=aiir77i4edaaitkoi3l132an0&redirect_uri=https%3A%2F%2Fteam-06-prj-666-winter-2025.vercel.app%2Flogin&response_type=code&scope=openid"
                className={styles.link}
              >
                {t("Sign up")}
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </Container>
  );
}

Login.getLayout = function getLayout(page) {
  return <>{page}</>;
};

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
