import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import NavBar from "../Navbar/NavBar";
import Footer from "../Footer/Footer";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css";
import { Container } from "react-bootstrap";
import DoctorSidebar from "../DoctorSidebar/DoctorSidebar";
import TipsNotificationPopup from "../tipsNotificationPopup/tipsNotificationPopup";
import BackButton from "../BackButton/BackButton";
import dynamic from "next/dynamic";

const ChatBot = dynamic(() => import("../ChatBot/ChatBot"), { ssr: false });
const GlobalReminderPopup = dynamic(() => import("../Reminders/GlobalPopup"), {
  ssr: false,
});

export default function Layout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();
  const isHomePage = router.pathname === "/"; // Hide the side bar on home page

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    if (token && userId) {
      setIsAuthenticated(true);
      setUserRole(userRole);
    } else {
      setIsAuthenticated(false);
    }
  }, [isAuthenticated]);

  return (
    <>
      {!isHomePage && <NavBar />}
      <TipsNotificationPopup />
      {isAuthenticated && <GlobalReminderPopup />}
      <Container fluid className={styles.container}>
        {!isHomePage && isAuthenticated ? (
          userRole === "Parent" || userRole === "Caregiver" ? (
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          ) : (
            <DoctorSidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          )
        ) : null}
        <main
          className={`${styles.main} ${isSidebarCollapsed ? styles.mainCollapsed : ""}`}
        >
          {children}
          <BackButton />
        </main>
      </Container>
      <ChatBot />
      <Footer />
    </>
  );
}
