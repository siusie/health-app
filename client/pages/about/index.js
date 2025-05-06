// client/pages/about/index.js
import React from "react";
import styles from "./about.module.css";
import HomePageNavBar from "@/components/Navbar/HomePageNavBar";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const AboutUs = () => {
  const { t } = useTranslation("common");
  return (
    <div className={styles.container}>
      <HomePageNavBar variant="dark" />
      <div className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>About Tummy Time</h1>
          <div className={styles.divider} />
        </header>

        <div className={styles.content}>
          <section className={styles.section}>
            <div className={styles.categoryHeader}>
              <h2>Our History</h2>
            </div>
            <div className={styles.sectionContent}>
              <p>
                Tummy Time was created as a project by a group of passionate
                students at Seneca Polytechnic. Our journey began in the
                classrooms and labs, where we aimed to make a difference in the
                way parents monitor and support their baby&apos;s development.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.categoryHeader}>
              <h2>Our Mission</h2>
            </div>
            <div className={styles.sectionContent}>
              <p>
                Our mission is to empower parents with innovative tools and
                reliable insights to help monitor their baby&apos;s health and
                development. We strive to build an engaging and supportive
                platform that combines cutting-edge technology with
                compassionate care.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.categoryHeader}>
              <h2>Our Core Values</h2>
            </div>
            <div className={styles.sectionContent}>
              <ul className={styles.valuesList}>
                <li>
                  <strong>Innovation:</strong> We embrace creative solutions.
                </li>
                <li>
                  <strong>Collaboration:</strong> We believe in teamwork.
                </li>
                <li>
                  <strong>Integrity:</strong> We operate with honesty and
                  transparency.
                </li>
                <li>
                  <strong>Empathy:</strong> We put people first.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Override the default layout for this page
AboutUs.getLayout = function getLayout(page) {
  return page;
};

export default AboutUs;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
