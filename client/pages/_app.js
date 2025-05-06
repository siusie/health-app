// pages/_app.js
import "@/styles/globals.css";
import "bootstrap/dist/css/bootstrap.css";
import Layout from "@/components/Layout/Layout";
import { appWithTranslation } from "next-i18next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { NotificationProvider } from "@/context/NotificationContext";
import Head from "next/head";

function App({ Component, pageProps }) {
  const router = useRouter();
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  // Define page titles mapping
  const getPageTitle = () => {
    const path = router.pathname;

    if (path === "/") {
      return "Tummy Time"; // Default title for the home page
    }

    const titles = {
      "/dashboard": "Dashboard",
      "/doctor/[id]": "Dashboard",
      "/analysis": "Analysis",
      "/baby/[id]/analysis": "Baby Analysis",
      "/baby/[id]": "Baby Profile",
      "/baby/[id]/profile": "Edit Baby Profile",
      "/feeding-schedule": "Feeding Schedule",
      "/baby/[id]/feedingSchedule": "Baby Feeding Schedule",
      "/login": "Login",
      "/register": "Register",
      "/reminders": "Reminders",
      "/export": "Export Data",
      "/privacy": "Privacy Policy",
      "/terms": "Terms of Service",
      "/faq": "FAQ",
      "/baby/[id]/reminders": "Baby Reminders",
      "/forum": "Community Forum",
      "/milestones": "Milestones",
      "/baby/[id]/milestones": "Milestone Details",
      "/growth": "Height & Weight",
      "/profile": "User Profile",
      "/user/[id]/edit": "Edit User Profile",
      "/journal": "Journal",
      "/coupons": "Coupons",
      "/tips": "Tips",
      "/quiz": "Quiz",
      "/settings": "Settings",
      "/medicalProfessionals": "Medical Professionals",
      "/checkProduct": "Find Product Recalls",
      "/careServices": "Find Childcare Services",
      "/about": "About Us",
      "/faq": "FAQ",
      "/terms": "Terms of Service",
      "/privacy": "Privacy Policy",
      "/baby/[id]/growth": "Growth Data",
      "/baby/add": "Add Baby",
      "/forum/post/[post_id]": "Community Forum",
    };

    return `${titles[path] || "Page"} | Tummy Time`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Add public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/register",
      "/privacy",
      "/terms",
      "/faq",
      "/about",
    ];
    const isPublicRoute = publicRoutes.includes(router.pathname);

    if (!token || isTokenExpired(token)) {
      if (!isPublicRoute && router.pathname !== "/login") {
        router.push("/login?message=Session expired. Please log in again.");
      }
    }
    setIsCheckingToken(false);
  }, [router]);

  if (isCheckingToken && router.pathname !== "/login") {
    return null;
  }

  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <>
      <Head>
        {/* Page title on browser tabs */}
        <title>{getPageTitle()}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* favicon support */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <NotificationProvider>
        {getLayout(<Component {...pageProps} />)}
      </NotificationProvider>
    </>
  );
}

export default appWithTranslation(App);

// Helper function to check if the token is expired
const isTokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);

    return exp < currentTime;
  } catch (error) {
    console.log("Error decoding token:", error);
    return true; // Assume expired if there's an error
  }
};
