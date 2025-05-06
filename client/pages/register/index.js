// pages/register/index.js
import React, { useState } from "react";
import { Button, Container, Form, Modal } from "react-bootstrap";
import styles from "./register.module.css";
import Image from "next/image";
import { useRouter } from "next/router";
import NavBar from "@/components/Navbar/NavBar";

function Register() {
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleClose = () => setShow(false);
  const handleShow = (event) => {
    const image = event.target;
    if (image.alt === "caregiver") {
      setRole("Caregiver");
    } else if (image.alt === "medicalProf") {
      setRole("Medical Professional");
    } else if (image.alt === "parent") {
      setRole("Parent");
    }

    setShow(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    if (form.checkValidity() === true) {
      setValidated(true);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          role,
        }),
      });

      const data = await res.json();

      if (data.status === "ok") {
        localStorage.setItem("userId", data.user_id);
        localStorage.setItem("userRole", role);
        console.log("User's information has been created successfully");
        handleClose();

        // Role-based routing (since doctors have a different dashboard)
        if (role === "Medical Professional") {
          router.push(`/doctor/${data.user_id}`);
        } else if (role === "Caregiver" || role === "Parent") {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      } else {
        setError(data.message);
      }
    }
  };

  return (
    <Container fluid className={styles.about}>
      <NavBar />
      <svg
        width="38"
        height="38"
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32.3333 17.3334C34.1667 15 34.5 11.8334 33.5 9.16669L34.8333 7.83336C35.4522 7.21452 35.7998 6.3752 35.7998 5.50003C35.7998 4.62486 35.4522 3.78553 34.8333 3.16669C34.2145 2.54786 33.3752 2.2002 32.5 2.2002C31.6248 2.2002 30.7855 2.54786 30.1667 3.16669L28.8333 4.50003C27.4792 4.01953 26.0288 3.87467 24.6064 4.07787C23.184 4.28107 21.8321 4.82627 20.6667 5.66669M15.6667 10.6667L3.5 22.8334C2 24.3334 2 27 3.5 28.5L9.5 34.5C11 36 13.6667 36 15.1667 34.5L27.3333 22.3334M5.66667 20.6667L9 24M10.6667 15.6667L14 19M17.8333 5.16669C18.1449 4.86132 18.5637 4.69026 19 4.69026C19.4363 4.69026 19.8551 4.86132 20.1667 5.16669L32.8333 17.8334C33.1387 18.1449 33.3098 18.5638 33.3098 19C33.3098 19.4363 33.1387 19.8551 32.8333 20.1667L30.1667 22.8334C29.8551 23.1387 29.4363 23.3098 29 23.3098C28.5637 23.3098 28.1449 23.1387 27.8333 22.8334L15.1667 10.1667C14.8613 9.85515 14.6902 9.43628 14.6902 9.00003C14.6902 8.56377 14.8613 8.14491 15.1667 7.83336L17.8333 5.16669Z"
          stroke="#65558F"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <h3>
        Let&apos;s start creating your profile! <br /> I am a ...
      </h3>
      <div className={styles.icons}>
        <button onClick={handleShow}>
          <Image
            src="/parent.svg"
            alt="parent"
            width={200}
            height={200}
            priority
          />
        </button>
        <button onClick={handleShow}>
          <Image
            src="/caregiver.svg"
            alt="caregiver"
            width={200}
            height={200}
          />
        </button>
        <button onClick={handleShow}>
          <Image
            src="/MedicalProf-removebg.png"
            alt="medicalProf"
            width={200}
            height={200}
            priority
          />
        </button>
      </div>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create a {role} account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form
            noValidate
            validated={validated}
            className={styles.form}
            onSubmit={handleSubmit}
          >
            <Form.Group className="mb-3" controlId="firstName">
              <Form.Control
                type="text"
                placeholder="First Name"
                className={styles.formControl}
                value={firstName}
                required
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="lastName">
              <Form.Control
                type="text"
                placeholder="Last Name"
                className={styles.formControl}
                value={lastName}
                required
                onChange={(e) => setLastName(e.target.value)}
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="email">
              <Form.Control
                type="email"
                placeholder="Email"
                className={styles.formControl}
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
              <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            </Form.Group>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <Button variant="primary" type="submit" className={styles.button}>
              Create account
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

// THIS PREVENTS THE SIDEBAR FROM SHOWING ON THIS PAGE
// Override the default layout by returning the page without a layout
Register.getLayout = function getLayout(page) {
  return page;
};

export default Register;
