import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";
import styles from "./settings.module.css";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";

function Settings() {
  const { t, i18n } = useTranslation("common");
  const [toggles, setToggles] = useState({
    en: i18n.language === "en",
    fr: i18n.language === "fr",
  });
  const router = useRouter();
  const locale = router.locale || router.defaultLocale;

  useEffect(() => {
    // Load language from localStorage if available
    const storedLanguage = localStorage.getItem("language");
    if (storedLanguage && storedLanguage !== i18n.language) {
      i18n.changeLanguage(storedLanguage);
    }

    // Sync language changes with localStorage
    const handleLanguageChange = (lang) => {
      localStorage.setItem("language", lang);
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  const handleChange = async (lang) => {
    console.log(`Changing language to ${lang}`);
    //Change
    try {
      await i18n.changeLanguage(lang);
      setToggles({
        en: lang === "en",
        fr: lang === "fr",
      });
      console.log(`Language changed to ${lang}`);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  const handleClick = () => {
    router.push("/dashboard", "/dashboard", { locale: i18n.language });
  };

  const handleToggle = (language) => {
    if (i18n.language !== language) {
      handleChange(language);
    }
    console.log(locale);
    router.push("/dashboard", "/dashboard", { locale: i18n.language });
  };

  return (
    <Container className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>{t("Language Settings")}</h1>
        </div>

        <div className={styles.section}>
          {/* <h2>{t("Language Preferences")}</h2> */}
          <p className={styles.sectionDescription}>
            {t("Choose your preferred language for the application")}
          </p>

          <div className={styles.languageBoard}>
            <ul className={styles.languageList}>
              <li>
                <div className={styles.languageOption}>
                  <div className={styles.languageInfo}>
                    <p className={styles.languageName}>{t("English")}</p>
                    <span className={styles.languageNative}>English</span>
                  </div>
                  <button
                    className={styles.toggleButton}
                    onClick={() => handleToggle("en")}
                    aria-label={t("Toggle English language")}
                  >
                    <FontAwesomeIcon
                      icon={toggles.en ? faToggleOn : faToggleOff}
                    />
                  </button>
                </div>
              </li>
              <li>
                <div className={styles.languageOption}>
                  <div className={styles.languageInfo}>
                    <p className={styles.languageName}>{t("French")}</p>
                    <span className={styles.languageNative}>Français</span>
                  </div>
                  <button
                    className={styles.toggleButton}
                    onClick={() => handleToggle("fr")}
                    aria-label={t("Toggle French language")}
                  >
                    <FontAwesomeIcon
                      icon={toggles.fr ? faToggleOn : faToggleOff}
                    />
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default Settings;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
