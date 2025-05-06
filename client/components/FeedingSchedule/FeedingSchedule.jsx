// This component gets the feeding schedule of a baby and displays it in a table.
import React, { useEffect, useState } from "react";
import { Alert, Table, Button } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { format, parseISO, set } from "date-fns";

const FeedingSchedule = ({ babyId }) => {
  const { t } = useTranslation("common");
  const [feedingSchedules, setFeedingSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedingSchedules = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/getFeedingSchedules`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch feeding schedules");
        const data = await response.json(); // `data` is an object with a `status` field and the feeding schedules
        // Convert object to array and filter out the status field
        const scheduleArray = Object.keys(data)
          .filter((key) => key !== "status")
          .map((key) => data[key]);
        setFeedingSchedules(scheduleArray);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (babyId) {
      fetchFeedingSchedules();
    }
  }, [babyId]);

  const getLatestFeed = () => {
    if (!feedingSchedules.length) return null;

    // Sort feeds by date and time
    const sortedFeeds = [...feedingSchedules].sort((a, b) => {
      const dateA = new Date(
        parseInt(a.time.split("-")[0]),
        parseInt(a.time.split("-")[1]) - 1,
        parseInt(a.time.split("-")[2]),
      );
      const dateB = new Date(
        parseInt(b.time.split("-")[0]),
        parseInt(b.time.split("-")[1]) - 1,
        parseInt(b.time.split("-")[2]),
      );
      return dateB - dateA;
    });

    return sortedFeeds[0];
  };

  if (loading)
    return <Alert variant="info">{t("Loading feeding schedule...")}</Alert>;
  if (error) return <p>{t("No feeding schedules found for this baby.")}</p>;

  const latestFeed = getLatestFeed();

  return (
    <>
      {latestFeed && (
        <Alert variant="info" className="my-3">
          {t("Last feed details")}
          <br />
          <small>
            {t("Last feed at {{time}} - {{amount}}oz - {{type}}", {
              time: latestFeed.time,
              amount: latestFeed.amount,
              type: latestFeed.type,
            })}
          </small>
        </Alert>
      )}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>{t("Date")}</th>
            <th>{t("Time")}</th>
            <th>{t("Meal")}</th>
            <th>{t("Type")}</th>
            <th>{t("Amount")}</th>
            <th>{t("Notes")}</th>
          </tr>
        </thead>
        <tbody>
          {feedingSchedules.map((feed, index) => (
            <tr key={feed.feeding_schedule_id}>
              <td>
                {format(
                  new Date(
                    parseInt(feed.date.split("-")[0]),
                    parseInt(feed.date.split("-")[1]) - 1,
                    parseInt(feed.date.split("-")[2]),
                  ).toString(),
                  "MMM d, yyyy",
                )}
              </td>
              <td>{feed.time}</td>
              <td>{feed.meal}</td>
              <td>{feed.type}</td>
              <td>{`${feed.amount} oz`}</td>
              <td>{feed.notes || feed.issues || "-"}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default FeedingSchedule;
