// This component displays a list of babies and their feeding schedules. It fetches the list of babies from the API and then renders a FeedingSchedule component for each baby.
import React, { useEffect, useState } from "react";
import { Accordion } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import FeedingSchedule from "../FeedingSchedule/FeedingSchedule";
import styles from "./MultipleFeedingSchedules.module.css";

const MultipleFeedingSchedules = () => {
  const { t } = useTranslation("common");
  const [babies, setBabies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBabies = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/babies`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch babies");
        const data = await response.json();
        setBabies(data.babies);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBabies();
  }, []);

  if (loading)
    return <div className={styles.statusMessage}>{t("Loading babies...")}</div>;
  if (error)
    return (
      <div className={styles.statusMessage}>{t("No babies found")}</div>
    );
  if (!babies.length)
    return <div className={styles.statusMessage}>{t("No babies found")}</div>;

  return (
    <Accordion className={styles.customAccordion}>
      {babies.map((baby) => (
        <Accordion.Item
          key={baby.baby_id}
          eventKey={baby.baby_id.toString()}
          style={{ overflow: "hidden" }}
        >
          <Accordion.Header>
            <strong>
              {baby.first_name}&nbsp;{baby.last_name}
            </strong>
            {baby.date_of_birth && (
              <span className="ms-3 text-muted">
                ({t("Born")}:{" "}
                {new Date(baby.date_of_birth).toLocaleDateString()})
              </span>
            )}
          </Accordion.Header>
          <Accordion.Body style={{ overflowX: "auto" }}>
            <FeedingSchedule babyId={baby.baby_id} />
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};

export default MultipleFeedingSchedules;
