// pages/privacy/index.js
import React, { useState } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import HomePageNavBar from "@/components/Navbar/HomePageNavBar";
import styles from "./privacy.module.css";

const PrivacyPolicy = () => {
  const [openSections, setOpenSections] = useState({
    section1: true,
    section2: true,
    section3: true,
    section4: true,
    section5: true,
  }); // Initial state for all sections is open

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className={styles.container}>
      <HomePageNavBar variant="dark" />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("section1")}
              style={{ cursor: "pointer" }}
            >
              <h2 className={styles.heading}>
                1. Information We Collect {openSections.section1 ? "−" : "+"}
              </h2>
            </div>
            {openSections.section1 && (
              <p className={styles.description}>
                We collect information that you provide directly to us,
                including personal information such as your name, email address,
                and any other information you choose to provide when using our
                services.
              </p>
            )}
          </section>

          <section className={styles.section}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("section2")}
              style={{ cursor: "pointer" }}
            >
              <h2 className={styles.heading}>
                2. How We Use Your Information{" "}
                {openSections.section2 ? "−" : "+"}
              </h2>
            </div>
            {openSections.section2 && (
              <>
                <p className={styles.description}>
                  We use the information we collect to:
                </p>
                <ul className={styles.list}>
                  <li>Provide, maintain, and improve our services</li>
                  <li>Communicate with you about our services</li>
                  <li>Protect against fraud and unauthorized access</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </>
            )}
          </section>

          <section className={styles.section}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("section3")}
              style={{ cursor: "pointer" }}
            >
              <h2 className={styles.heading}>
                3. Data Security {openSections.section3 ? "−" : "+"}
              </h2>
            </div>
            {openSections.section3 && (
              <p className={styles.description}>
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized or
                unlawful processing, accidental loss, destruction, or damage.
              </p>
            )}
          </section>

          <section className={styles.section}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("section4")}
              style={{ cursor: "pointer" }}
            >
              <h2 className={styles.heading}>
                4. Your Rights {openSections.section4 ? "−" : "+"}
              </h2>
            </div>
            {openSections.section4 && (
              <p className={styles.description}>
                You have the right to access, correct, or delete your personal
                information. You may also object to or restrict certain
                processing of your information or request data portability.
              </p>
            )}
          </section>

          <section className={styles.section}>
            <div
              className={styles.sectionHeader}
              onClick={() => toggleSection("section5")}
              style={{ cursor: "pointer" }}
            >
              <h2 className={styles.heading}>
                5. Contact Us {openSections.section5 ? "−" : "+"}
              </h2>
            </div>
            {openSections.section5 && (
              <p className={styles.description}>
                If you have any questions about this Privacy Policy, please
                contact us at{" "}
                <a href="mailto:privacy@tummytime.com" className={styles.link}>
                  privacy@tummytime.com
                </a>
                .
              </p>
            )}
          </section>
        </div>

        <footer className={styles.footer}>Last updated: April 3, 2025</footer>
      </main>
    </div>
  );
};

// Override the default layout by returning the page without a layout
PrivacyPolicy.getLayout = function getLayout(page) {
  return page;
};

export default PrivacyPolicy;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
