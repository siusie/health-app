import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import Image from "next/image";
import styles from "./NavBar.module.css";
import { useTranslation } from "next-i18next";
import Link from "next/link";

function NavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState({ firstName: '', role: '' });
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      // Fetch user info from API
      fetchUserInfo(token);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
 
      if (response.ok) {
        const userData = await response.json();
        setUserInfo({
          firstName: userData.first_name || '',
          role: userData.role || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleLogoutBtn = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("firstName");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    setUserInfo({ firstName: '', role: '' });
  };

  return (
    <Navbar expand="lg" fixed="top" className={styles.navContainer}>
      <Link href="/dashboard" className={styles.brand}>
        <Image
          src="/logo.png"
          alt="Tummy Time Logo"
          width={40}
          height={40}
          priority
          className={styles.logo}
        />
        <span className={styles.brandName}>Tummy Time</span>
      </Link>
      <div className={styles.topNav}>
        {isAuthenticated && (Object.values(userInfo).every(str => str != ""))? (
          <>
            <span className={styles.userInfo}>
              {userInfo.firstName} &#40;{userInfo.role}&#41;
            </span>
            <Nav.Link href="/" onClick={handleLogoutBtn}>
              {t("Log out")}
            </Nav.Link>
          </>
        ) : (
          <Nav.Link as={Link} href="/login" locale={locale}>
            {t("Login")}
          </Nav.Link>
        )}
      </div>
    </Navbar>
  );
}

export default NavBar;
