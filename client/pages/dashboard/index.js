// pages/dashboard/index.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Alert,
  Nav,
  Image,
  Badge,
  Form,
  ListGroup,
} from "react-bootstrap";
import styles from "./dashboard.module.css";
import Link from "next/link";
import VoiceControl from "@/components/VoiceControl/VoiceControl";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import MultipleFeedingSchedules from "@/components/MultipleFeedingSchedules/MultipleFeedingSchedules";
import { useConfetti } from "@/hooks/useConfetti";

// Helper function to calculate the time remaining for an event
const formatEventDate = (date, time, createdAt) => {
  if (time) {
    // Calculate time elapsed since reminder was created
    const creationTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedHours = (currentTime - creationTime) / (1000 * 60 * 60);

    // Calculate remaining time by subtracting elapsed time from reminder_in
    const remainingHours = parseFloat(time) - elapsedHours;

    // Handle cases where time has already passed
    if (remainingHours <= 0) {
      return "Overdue";
    }

    // Convert to minutes if less than 1 hour
    if (remainingHours < 1) {
      const minutes = Math.round(remainingHours * 60);
      return `In ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    // Show exact hour if between 1 and 2 hours
    if (remainingHours < 2) {
      return "In 1 hour";
    }

    // Round to nearest hour for longer durations
    return `In ${Math.round(remainingHours)} hours`;
  }

  const eventDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (eventDate.toDateString() === today.toDateString()) {
    return "Today";
  } else if (eventDate.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return `In ${Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24))} days`;
  }
};

const Dashboard = () => {
  const { t } = useTranslation("common");
  const [todayMilestones, setTodayMilestones] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [babies, setBabies] = useState([]);
  const [hiddenReminders, setHiddenReminders] = useState(new Set());
  const [user, setUser] = useState(null);
  const { ConfettiComponent, startConfetti } = useConfetti();
  const [selectedBabyId, setSelectedBabyId] = useState(null);
  const [babyStats, setBabyStats] = useState({
    feedingsToday: 0,
    milestonesToday: 0,
    currentWeight: null,
    currentHeight: null,
  });
  const [todayPosts, setTodayPosts] = useState([]);

  const handleHideReminder = (reminderId) => {
    setHiddenReminders((prev) => new Set([...prev, reminderId]));
  };

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

        if (response.status === 404) {
          console.log("No babies found");
          setBabies([]);
          return;
        }

        // Check if response is ok before parsing JSON
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === "ok" && result.babies?.length > 0) {
          setBabies(result.babies);
        } else {
          console.log("No babies found or invalid response format:", result);
          setBabies([]);
        }
      } catch (error) {
        console.error("Error in fetchBabies:", error);
        if (error.response) {
          console.error("Response:", error.response);
        }
      }
    };

    fetchBabies();
  }, []);

  useEffect(() => {
    const fetchTodayMilestones = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/milestones?today=true`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const result = await response.json();
        if (result.status === "ok") {
          setTodayMilestones(result.data);
        }
      } catch (error) {
        console.error("Error fetching today's milestones:", error);
      }
    };

    fetchTodayMilestones();
  }, []);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        // Fetch reminders for all babies in parallel
        const reminderPromises = babies.map((baby) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby.baby_id}/reminders?upcoming=true`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          ).then((res) => res.json()),
        );

        const results = await Promise.all(reminderPromises);

        // Combine and process all reminders
        const allReminders = results.flatMap((result, index) => {
          if (result.status === "ok") {
            return Object.entries(result)
              .filter(([key]) => key !== "status")
              .map(([_, reminder]) => ({
                id: reminder.reminder_id,
                title: reminder.title,
                date: reminder.date,
                // Convert minutes to hours
                time: reminder.reminder_in
                  ? (parseFloat(reminder.reminder_in) / 60).toString()
                  : null,
                created_at: reminder.created_at,
                notes: reminder.notes,
                type: reminder.type,
                next_reminder: reminder.next_reminder,
                babyName: `${babies[index].first_name} ${babies[index].last_name}`,
                baby_id: babies[index].baby_id,
              }));
          }
          return [];
        });

        // Filter and sort the combined reminders
        const sortedReminders = allReminders
          .filter((reminder) => reminder.time !== null)
          .sort((a, b) => {
            if (a.next_reminder && !b.next_reminder) return -1;
            if (!a.next_reminder && b.next_reminder) return 1;

            // Compare hours instead of minutes now
            const timeCompare = parseFloat(a.time) - parseFloat(b.time);
            if (timeCompare !== 0) return timeCompare;

            return a.babyName.localeCompare(b.babyName);
          });

        setUpcomingEvents(sortedReminders);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        setUpcomingEvents([]);
      }
    };

    if (babies.length > 0) {
      fetchUpcomingEvents();
    }
  }, [babies, selectedBabyId]);

  // Fetch user information
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/user`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.status === "ok") {
          setUser(result);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Fetch baby stats
  useEffect(() => {
    const fetchBabyStats = async () => {
      if (!selectedBabyId) return;

      try {
        // Get feeding schedules
        const feedingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedBabyId}/getFeedingSchedules`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        let feedingData;
        if (feedingResponse.status === 404) {
          // If 404, assume no feeding schedules
          feedingData = { status: "ok" };
        } else if (!feedingResponse.ok) {
          throw new Error("Failed to fetch feeding schedules");
        } else {
          feedingData = await feedingResponse.json();
        }

        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

        // Convert object to array and filter out the "status" key
        const feedingsArray = Object.entries(feedingData)
          .filter(([key]) => key !== "status")
          .map(([_, value]) => value);

        // Count feedings for today
        const feedingsToday = feedingsArray.filter((feed) => {
          const feedDate = new Date(feed.date).toISOString().split("T")[0];
          return feedDate === today;
        }).length;

        // Update state with feeding count
        setBabyStats((prevStats) => ({
          ...prevStats,
          feedingsToday: feedingsToday,
        }));

        // Get milestones for selected baby
        const milestonesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedBabyId}/milestones`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        let milestonesData;
        if (milestonesResponse.status === 404) {
          // If 404, assume no milestones
          milestonesData = { status: "ok", data: [] };
        } else if (!milestonesResponse.ok) {
          throw new Error("Failed to fetch milestones");
        } else {
          milestonesData = await milestonesResponse.json();
        }

        // Count today's milestones
        const milestonesToday =
          milestonesData.data?.filter((milestone) => {
            const milestoneDate = new Date(milestone.date)
              .toISOString()
              .split("T")[0];
            return milestoneDate === today;
          }).length || 0;

        // Update state with milestone count
        setBabyStats((prevStats) => ({
          ...prevStats,
          milestonesToday,
        }));

        // Get other baby stats
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedBabyId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch baby stats");

        const data = await response.json();

        // Get growth stats
        const growthResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedBabyId}/growth`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        let growthData;
        if (growthResponse.status === 404) {
          // If 404, set default empty state
          setBabyStats((prevStats) => ({
            ...prevStats,
            currentWeight: null,
            currentHeight: null,
          }));
          return;
        } else if (!growthResponse.ok) {
          throw new Error("Failed to fetch growth data");
        }

        growthData = await growthResponse.json();

        // Get the most recent height and weight entries
        const latestGrowth = growthData.data?.reduce(
          (latest, current) => {
            const currentDate = new Date(current.date);

            // Handle weight update
            if (
              current.weight &&
              (!latest.weightDate || currentDate > latest.weightDate)
            ) {
              latest.weight = parseFloat(current.weight);
              latest.weightDate = currentDate;
            }

            // Handle height update
            if (
              current.height &&
              (!latest.heightDate || currentDate > latest.heightDate)
            ) {
              latest.height = parseFloat(current.height);
              latest.heightDate = currentDate;
            }

            return latest;
          },
          {
            weight: null,
            height: null,
            weightDate: null,
            heightDate: null,
          },
        ) || { weight: null, height: null };

        // Single state update with all data
        setBabyStats((prevStats) => {
          return {
            ...prevStats,
            milestonesToday,
            currentWeight:
              latestGrowth.weight !== undefined ? latestGrowth.weight : null,
            currentHeight:
              latestGrowth.height !== undefined ? latestGrowth.height : null,
          };
        });
      } catch (error) {
        console.error("Error fetching baby stats:", error);
      }
    };

    fetchBabyStats();
  }, [selectedBabyId]);

  // Set initial selected baby
  useEffect(() => {
    if (babies.length > 0 && !selectedBabyId) {
      setSelectedBabyId(babies[0].baby_id);
    }
  }, [babies, selectedBabyId]);

  // Fetch today's posts from the forum
  useEffect(() => {
    const fetchTodayPosts = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/forum/posts`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        const { data } = await response.json();

        // Filter for today's posts
        const today = new Date().toISOString().split("T")[0];
        const todaysPosts = data
          .filter((post) => {
            const postDate = new Date(post.created_at)
              .toISOString()
              .split("T")[0];
            return postDate === today;
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by creation date, newest first
          .slice(0, 5); // Get only first 5 posts

        setTodayPosts(todaysPosts);
      } catch (error) {
        console.error("Error fetching forum posts:", error);
      }
    };

    fetchTodayPosts();
  }, []);

  return (
    <Container fluid className={`${styles.container} py-4 px-3 px-md-4`}>
      <h2 className={styles.heading}>
        {user ? t("Welcome") + ", " + user.first_name : t("Dashboard")}
      </h2>
      <VoiceControl />
      <br />

      {/* Stats Summary */}
      <Col xs={12} className="mb-4">
        {babies.length > 0 ? (
          <>
            {babies.length > 1 ? (
              <Row className="mb-3">
                <Col xs={12} md={5}>
                  <h3 className={`${styles.statsHeading} mb-3`}>
                    {t("{{name}}'s stats, at a glance", {
                      name:
                        babies.find(
                          (b) =>
                            b.baby_id.toString() === selectedBabyId?.toString(),
                        )?.first_name || "",
                    })}
                  </h3>
                  <Form.Select
                    value={selectedBabyId || ""}
                    onChange={(e) => {
                      const newBabyId = e.target.value;
                      // Reset stats before loading new baby's data
                      setBabyStats({
                        feedingsToday: 0,
                        milestonesToday: 0,
                        currentWeight: null,
                        currentHeight: null,
                      });
                      setSelectedBabyId(newBabyId);
                    }}
                    className={styles.babySelect}
                  >
                    {babies.map((baby) => (
                      <option key={baby.baby_id} value={baby.baby_id}>
                        {baby.first_name} {baby.last_name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            ) : (
              <Row className="mb-3">
                <Col xs={12} md={5}>
                  <h3 className={`${styles.statsHeading} mb-3`}>
                    {t("{{name}}'s stats, at a glance", {
                      name: babies[0]?.first_name || "",
                    })}
                  </h3>
                </Col>
              </Row>
            )}

            <Row className="mb-4 g-3">
              <Col xs={6} md={3}>
                <Card className={styles.statsCard}>
                  <Card.Body className="text-center">
                    <h3 className="mb-1">{babyStats.feedingsToday}</h3>

                    <small className="text-muted">
                      {babyStats.feedingsToday > 1 ||
                      babyStats.feedingsToday == 0
                        ? t("Feedings")
                        : t("Feeding")}{" "}
                      Today
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className={styles.statsCard}>
                  <Card.Body className="text-center">
                    <h3 className="mb-1">{babyStats.milestonesToday}</h3>
                    <small className="text-muted">
                      {babyStats.milestonesToday > 1 ||
                      babyStats.milestonesToday == 0
                        ? t("Milestones")
                        : t("Milestone")}{" "}
                      Today
                    </small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className={styles.statsCard}>
                  <Card.Body className="text-center">
                    <h3 className="mb-1">
                      {babyStats.currentWeight
                        ? `${babyStats.currentWeight} lbs`
                        : "-"}
                    </h3>
                    <small className="text-muted">{t("Current Weight")}</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card className={styles.statsCard}>
                  <Card.Body className="text-center">
                    <h3 className="mb-1">
                      {babyStats.currentHeight
                        ? `${babyStats.currentHeight} in`
                        : "-"}
                    </h3>
                    <small className="text-muted">{t("Current Height")}</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <div className="text-center">
            <p>{t("No babies found")}</p>
            <Link href="/baby/add">
              <Button variant="outline-primary">
                {t("Add Your First Baby")}
              </Button>
            </Link>
          </div>
        )}
        <br />
        <hr />
        <br />
        {/* Milestone Alerts */}
        {todayMilestones.length > 0 && (
          <Row className="mb-4">
            <Col xs={12}>
              <Alert variant="info" className={styles.milestoneAlert}>
                {ConfettiComponent}
                <Alert.Heading>{t("Today's Milestones 🎉🎉🎉")}</Alert.Heading>
                {todayMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className={styles.milestoneItem}
                    onMouseEnter={startConfetti}
                  >
                    <Badge bg="primary" className={styles.milestoneBadge}>
                      👶 {milestone.first_name}&nbsp;{milestone.last_name}
                    </Badge>
                    <span className={styles.milestoneDetails}>
                      <strong> {milestone.title}:</strong> {milestone.details}
                    </span>
                  </div>
                ))}

                <div className="d-flex">
                  <Link href="/milestones" className={styles.viewMoreLink}>
                    {t("Manage Milestones")} →
                  </Link>
                </div>
              </Alert>
            </Col>
          </Row>
        )}
        {/* Reminders section */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className={styles.card}>
              <Card.Body>
                <Alert.Heading>{t("🔔 Upcoming Reminders")}</Alert.Heading>
                <Table responsive borderless hover>
                  <tbody>
                    {upcomingEvents
                      .filter((event) => !hiddenReminders.has(event.id))
                      .map((event) => {
                        const isOverdue =
                          formatEventDate(
                            event.date,
                            event.time,
                            event.created_at,
                          ) === "Overdue";
                        return (
                          <tr
                            key={event.id}
                            className={isOverdue ? styles.overdueRow : ""}
                          >
                            <td className="d-flex justify-content-between align-items-center">
                              <div>
                                <Badge
                                  className="fs-6 py-2 px-3"
                                  bg={isOverdue ? "danger" : "primary"}
                                >
                                  {formatEventDate(
                                    event.date,
                                    event.time,
                                    event.created_at,
                                  )}
                                </Badge>
                                &nbsp;
                                <Badge
                                  bg="secondary"
                                  className="fs-6 py-2 px-3"
                                >
                                  👶 <small>{event.babyName}</small>
                                </Badge>
                                &nbsp;&nbsp;{event.title}
                              </div>
                              {isOverdue && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => handleHideReminder(event.id)}
                                  className="ms-2"
                                >
                                  <i className="fas fa-eye-slash"></i>{" "}
                                  {t("Hide")}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {upcomingEvents.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center text-muted">
                          {t("No upcoming events")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                <div className="d-flex mt-2">
                  <Link href="/reminders" className={styles.viewMoreLink}>
                    {t("Manage Reminders")} →
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* Feeding Schedule and Reminders Row */}
        <Row className="mb-4">
          {/* Feeding Schedule Section */}
          <Col md={8}>
            <Card className={styles.feedingCard}>
              <Card.Body>
                <Alert.Heading>{t("🍼 Feedings")}</Alert.Heading>
                <MultipleFeedingSchedules />
                <div className="mt-3">
                  <Link
                    href="/feeding-schedule"
                    className={styles.viewMoreLink}
                  >
                    {t("Manage Feedings")} →
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Quick Actions section */}
          <Col md={4}>
            <Card className={styles.quickActionsCard}>
              <Card.Body>
                <Alert.Heading>{t("Quick Actions")}</Alert.Heading>
                <div className={styles.quickActionsGrid}>
                  <Link href="/feeding-schedule" className={styles.actionLink}>
                    <Button
                      className={`${styles.actionButton} ${styles.feedButton}`}
                    >
                      <i className="fas fa-plus me-2"></i>
                      {t("Log Feeding")}
                    </Button>
                  </Link>
                  <Link href="/growth" className={styles.actionLink}>
                    <Button
                      className={`${styles.actionButton} ${styles.weightButton}`}
                    >
                      <i className="fas fa-baby me-2"></i>
                      {t("Update Weight")}
                    </Button>
                  </Link>
                  <Link href="/growth" className={styles.actionLink}>
                    <Button
                      className={`${styles.actionButton} ${styles.heightButton}`}
                    >
                      <i className="fas fa-weight me-2"></i>
                      {t("Update Height")}
                    </Button>
                  </Link>
                  <Link href="/journal" className={styles.actionLink}>
                    <Button
                      className={`${styles.actionButton} ${styles.journalButton}`}
                    >
                      <i className="fas fa-ruler-vertical me-2"></i>
                      {t("Access Journal")}
                    </Button>
                  </Link>
                  <Link href="/forum" className={styles.actionLink}>
                    <Button
                      className={`${styles.actionButton} ${styles.forumButton}`}
                    >
                      <i className="fas fa-plus me-2"></i>
                      {t("Access Forum")}
                    </Button>
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <hr /> <br />
        {/* Latest forum posts section */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className={styles.card}>
              <Card.Body>
                <Alert.Heading>{t("📌 Recent Forum Posts")}</Alert.Heading>
                {todayPosts.length > 0 ? (
                  <>
                    <ListGroup variant="flush">
                      {todayPosts.map((post) => (
                        <Link
                          href={`/forum/post/${post.post_id}`}
                          key={post.post_id}
                          className={styles.forumPostLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ListGroup.Item className={styles.forumPost}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{post.title}</h6>
                                <p className="text-muted mb-0 small">
                                  {new Date(
                                    post.created_at,
                                  ).toLocaleTimeString()}{" "}
                                  • {post.reply_count}{" "}
                                  {post.reply_count == 1 ? "reply" : "replies"}
                                </p>
                              </div>
                              <Badge bg="primary" pill>
                                New
                              </Badge>
                            </div>
                          </ListGroup.Item>
                        </Link>
                      ))}
                    </ListGroup>
                  </>
                ) : (
                  <p className="text-center text-muted my-4">
                    {t("No new posts")}
                  </p>
                )}{" "}
                <div className="mt-3">
                  <Link href="/forum" className={styles.viewMoreLink}>
                    {t("View Forum")} →
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Col>
    </Container>
  );
};

export default Dashboard;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
