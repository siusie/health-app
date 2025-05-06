// pages/faq/index.js
import { useEffect, useState } from "react";
import HomePageNavBar from "@/components/Navbar/HomePageNavBar";
import styles from "./faq.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import BackButton from "@/components/BackButton/BackButton";
import { jwtDecode } from "jwt-decode";

const FAQCategory = ({ title, questions, france = "false" }) => {
  const { t } = useTranslation("common");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className={styles.section}>
      <div
        className={styles.categoryHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2>{title}</h2>
        <span className={styles.expandIcon}>
          &nbsp;{isExpanded ? "−" : "+"}
        </span>
      </div>
      {isExpanded && (
        <div className={styles.questionsList}>
          {questions.map((qa, index) => (
            <div key={index} className={styles.questionItem}>
              <h3>{qa.question}</h3>
              <p>{qa.answer}</p>
              {qa.links && (
                <div className={styles.relatedLinks}>
                  {france === "true" ? (
                    <span>Connexe: </span>
                  ) : (
                    <span>Related: </span>
                  )}

                  {qa.links.map((link, i) => (
                    <a key={i} href={link.url} className={styles.link}>
                      {link.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const FAQ = () => {
  const { t } = useTranslation("common");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenExpired(token) === true) {
      setIsLoggedIn(false);
    } else if (token && isTokenExpired(token) === false) {
      setIsLoggedIn(true);
    }
  }, []);

  const faqData = [
    {
      category: t("Getting Started"),
      questions: [
        {
          question: t("What is TummyTime?"),
          answer: t(
            "TummyTime is a baby tracking application that helps you monitor feeding schedules, growth, milestones and more for your little one.",
          ),
        },
        {
          question: t("How do I start using TummyTime?"),
          answer: t(
            "Create an account, add your baby's profile, and start tracking their daily activities like feeding times, growth measurements, and milestones.",
          ),
          links: [{ text: t("Quick Start Guide"), url: "/guide/quickstart" }],
        },
      ],
    },
    {
      category: t("Feeding Tracking"),
      questions: [
        {
          question: t("How do I log a feeding?"),
          answer: t(
            "Go to your baby's feeding schedule page, click 'Add Feed', and enter details like time, food type, and amount.",
          ),
        },
        {
          question: t("Can I set feeding reminders?"),
          answer: t(
            "Yes! When adding or editing a feed, enable the reminder option and set how many minutes before the next feed you'd like to be notified.",
          ),
        },
      ],
    },
    {
      category: t("Growth Tracking"),
      questions: [
        {
          question: t("How do I track my baby's growth?"),
          answer: t(
            "Visit the Growth section to record your baby's height and weight measurements. You can view trends over time and compare to standard growth charts.",
          ),
        },
        {
          question: t("How often should I update growth measurements?"),
          answer: t(
            "We recommend updating growth measurements monthly for babies under 1 year, and every 2-3 months for older babies, or as recommended by your pediatrician.",
          ),
        },
      ],
    },
    {
      category: t("Milestones"),
      questions: [
        {
          question: t("What kind of milestones can I track?"),
          answer: t(
            "You can track all types of developmental milestones including first smile, rolling over, first steps, and more. Add photos and notes to capture these special moments.",
          ),
        },
        {
          question: t("Can I export milestone data?"),
          answer: t(
            "Yes! Use our export feature to download all milestone data in various formats for easy sharing or record keeping.",
          ),
        },
      ],
    },
    {
      category: t("Product Safety"),
      questions: [
        {
          question: t("How does the product safety scanner work?"),
          answer: t(
            "Use your computer's (or tablet's) camera to scan product barcodes or search by product name. We'll check against recall databases and safety alerts to ensure the product is safe for your baby.",
          ),
        },
        {
          question: t("Where do you get safety data from?"),
          answer: t(
            "We aggregate safety data from multiple official sources including government consumer safety databases and manufacturer recall notices.",
          ),
        },
      ],
    },
    {
      category: t("Technical Support"),
      questions: [
        {
          question: t("What devices support TummyTime?"),
          answer: t(
            "TummyTime works on all modern browsers including Chrome, Firefox, Safari, and Edge.",
          ),
        },
        {
          question: t("Is my data secure?"),
          answer: t(
            "Yes! We use industry-standard encryption to protect all your data. Your baby's information is private and only accessible to authorized caregivers you approve.",
          ),
        },
      ],
    },
    {
      category: t("Account Management"),
      questions: [
        {
          question: t("How do I create an account?"),
          answer: t(
            "To create an account, click the 'Get Started' button in the top right corner and follow the registration process. You'll need to provide your email, create a password, and verify your account.",
          ),
          links: [{ text: t("Sign Up Guide"), url: "/guide/signup" }],
        },
      ],
    },
    {
      category: t("Technical Support"),
      questions: [
        {
          question: t("What browsers are supported?"),
          answer: t(
            "Our application supports the latest versions of Chrome, Firefox, Safari, and Edge.",
          ),
        },
        {
          question: t("The app isn't working on my device"),
          answer: t(
            "Try clearing your browser cache and cookies. If the issue persists, please contact our support team.",
          ),
          links: [
            { text: t("Contact Support"), url: "mailto:privacy@tummytime.com" },
          ],
        },
      ],
    },
  ];

  return (
    <div className={styles.container}>
      {isLoggedIn ? <BackButton /> : <HomePageNavBar variant="dark" />}
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("Frequently Asked Questions")}</h1>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.content}>
          {faqData.map((category, index) => (
            <FAQCategory
              key={index}
              title={category.category}
              questions={category.questions}
              france="true"
            />
          ))}
        </div>

        <footer className={styles.footer}>
          <p>
            {t("Can not find what you are looking for?")}
            <a href="mailto:support@tummytime.com" className={styles.link}>
              {t("Contact Support")}
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
};

FAQ.getLayout = function getLayout(page) {
  return <>{page}</>;
};

export default FAQ;

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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
