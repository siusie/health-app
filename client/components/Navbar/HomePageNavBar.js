// components/Navbar/HomePageNavBar.js
// This is a component for the navigation bar on the home page
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "./HomePageNavBar.module.css";
import Link from "next/link";

const HomePageNavBar = ({ variant = "default" }) => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`${styles.navContainer} ${styles[variant]}`}>
      <Link href="/" className={styles.brand}>
        <Image
          src="/logo.png"
          alt="Tummy Time Logo"
          className={styles.logo}
          width={40}
          height={40}
          priority
        />
        <span className={styles.brandName}>Tummy Time</span>
      </Link>
      <div className={styles.topNav}>
        <Button
          variant="light"
          className="mx-2"
          onClick={() =>
            (window.location.href =
              "https://us-east-26an90qfwo.auth.us-east-2.amazoncognito.com/signup?client_id=aiir77i4edaaitkoi3l132an0&redirect_uri=https%3A%2F%2Fteam-06-prj-666-winter-2025.vercel.app%2Flogin&response_type=code&scope=openid")
          }
        >
          Get Started
        </Button>
        <Button
          variant="outline-light"
          className="mx-2"
          onClick={() => router.push("/login")}
        >
          Log In
        </Button>
      </div>
    </div>
  );
};

export default HomePageNavBar;
