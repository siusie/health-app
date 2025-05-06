import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Tab, Nav, Form } from "react-bootstrap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { parseISO, format } from "date-fns";
import {
  hasEnoughDataPoints,
  validateDateRange,
  compareDates,
  filterDataByRange,
  findDateRange,
  calculateStartDate,
  getDataAvailabilityMessage,
  getLastLoggedDate,
  getLastLoggedDateInRange,
  findOptimalDateRange
} from "../../../../utils/dateUtils";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styles from "./analysis.module.css";

// Helper functions moved to utils/dateUtils.js

function convertResponseToArray(data) {
  if (!data || typeof data !== "object") return [];
  return Object.keys(data)
    .filter((k) => k !== "status")
    .map((k) => data[k]);
}

function flattenApiData(apiData) {
  if (!apiData) return [];
  if (Array.isArray(apiData)) {
    if (apiData.length === 1 && apiData[0] && typeof apiData[0] === "object") {
      const numericKeys = Object.keys(apiData[0]).filter(
        (k) => !isNaN(Number(k)),
      );
      if (numericKeys.length > 0) return numericKeys.map((k) => apiData[0][k]);
    }
    return apiData;
  }
  if (typeof apiData === "object") {
    return Object.keys(apiData)
      .filter((k) => !isNaN(Number(k)))
      .map((k) => apiData[k]);
  }
  return [];
}

function formatTimeToHourMinuteAmPm(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  let minute = parts[1].split(".")[0];
  let amPm = "AM";
  if (hour === 0) hour = 12;
  else if (hour === 12) amPm = "PM";
  else if (hour > 12) {
    hour -= 12;
    amPm = "PM";
  }
  minute = minute.padStart(2, "0");
  return `${hour}:${minute} ${amPm}`;
}

function CustomFeedTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const { total, feedings = [] } = payload[0].payload;
  const parsedDate = parseISO(label);
  const formattedDate = isNaN(parsedDate)
    ? label
    : format(parsedDate, "MMM do, yyyy");
  return (
    <div
      style={{
        background: "#f9f9f9",
        border: "1px solid #ccc",
        padding: "12px",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        maxWidth: "280px",
      }}
    >
      <div
        style={{ marginBottom: "8px", fontWeight: "bold", fontSize: "1rem" }}
      >
        {formattedDate}
      </div>
      {feedings.map((feed, idx) => {
        const displayTime = formatTimeToHourMinuteAmPm(feed.time);
        return (
          <div key={idx} style={{ marginBottom: "10px", lineHeight: 1.4 }}>
            <div style={{ fontWeight: "bold" }}>
              {feed.meal || "Meal"}: {feed.type || "N/A"}
            </div>
            <div
              style={{ fontSize: "0.9rem", color: "#666", marginLeft: "12px" }}
            >
              {displayTime} - {feed.amount} oz
            </div>
            {feed.notes && (
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#666",
                  marginLeft: "12px",
                }}
              >
                Notes: {feed.notes}
              </div>
            )}
            {feed.issues && (
              <div
                style={{
                  fontSize: "0.9rem",
                  color: "#b00",
                  marginLeft: "12px",
                }}
              >
                Issues: {feed.issues}
              </div>
            )}
          </div>
        );
      })}
      <hr
        style={{
          margin: "0 0 8px 0",
          border: "none",
          borderTop: "1px solid #ccc",
        }}
      />
      <div style={{ fontWeight: "bold" }}>Daily Total: {total} oz</div>
    </div>
  );
}

function CustomStoolTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const slice = payload[0].payload;
  return (
    <div
      style={{ background: "#fff", border: "1px solid #ccc", padding: "8px" }}
    >
      <p style={{ margin: 0, fontWeight: "bold" }}>
        {slice.name}: {slice.value}
      </p>
      {slice.name === "Other" && slice.details && (
        <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
          {Object.entries(slice.details).map(([subColor, count]) => (
            <li key={subColor} style={{ listStyleType: "disc" }}>
              {subColor}: {count}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildStoolColorData(stools) {
  const colorCount = { Brown: 0, Green: 0, Yellow: 0, Other: 0 };
  const otherMap = {};
  stools.forEach((item) => {
    let c = item.color || "Unknown";
    if (c === "Greenish") c = "Green";
    if (c === "Brown" || c === "Green" || c === "Yellow") {
      colorCount[c]++;
    } else {
      colorCount.Other++;
      otherMap[c] = (otherMap[c] || 0) + 1;
    }
  });
  return [
    { name: "Brown", value: colorCount.Brown },
    { name: "Green", value: colorCount.Green },
    { name: "Yellow", value: colorCount.Yellow },
    { name: "Other", value: colorCount.Other, details: otherMap },
  ];
}

export default function Analysis() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { id } = router.query;

  const [feedData, setFeedData] = useState([]);
  const [stoolData, setStoolData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize dates - using 2025-04-12 as the current date
  const [feedStart, setFeedStart] = useState("");
  const [feedEnd, setFeedEnd] = useState("2025-04-12");
  const [feedTimeRange, setFeedTimeRange] = useState("month");

  const [stoolStart, setStoolStart] = useState("");
  const [stoolEnd, setStoolEnd] = useState("2025-04-12");

  const [growthStart, setGrowthStart] = useState("");
  const [growthEnd, setGrowthEnd] = useState("2025-04-12");
  const [growthTimeRange, setGrowthTimeRange] = useState("month");

  // Track earliest and latest
  const [minLoggedDate, setMinLoggedDate] = useState("");
  const [maxLoggedDate, setMaxLoggedDate] = useState("");
  
  // Flag to indicate data is loaded and dates have been processed
  const [datesInitialized, setDatesInitialized] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const feedRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${id}/getFeedingSchedules`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (!feedRes.ok)
          throw new Error(`Failed to fetch feeding data: ${feedRes.status}`);
        const feedJson = await feedRes.json();
        const rawFeedData = feedJson.status === "ok" ? convertResponseToArray(feedJson) : [];
        
        // Sort feed data by date (newest first)
        rawFeedData.sort(compareDates);
        setFeedData(rawFeedData);

        const stoolRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${id}/stool`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (!stoolRes.ok) {
          console.error(`Failed to fetch stool data: ${stoolRes.status}`);
          setStoolData([]);
        } else {
          const stoolJson = await stoolRes.json();
          const rawStoolData = stoolJson.status === "ok" ? convertResponseToArray(stoolJson) : [];
          
          // Sort stool data by date (newest first)
          rawStoolData.sort(compareDates);
          setStoolData(rawStoolData);
        }

        const growthRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${id}/growth`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        if (!growthRes.ok) {
          console.error(`Failed to fetch growth data: ${growthRes.status}`);
          setGrowthData([]);
        } else {
          const growthJson = await growthRes.json();
          const rawGrowth = growthJson.data ? growthJson.data : growthJson;
          const rawGrowthData = !growthJson.status || growthJson.status === "ok"
            ? flattenApiData(rawGrowth)
            : [];
          
          // Sort growth data by date (newest first)
          rawGrowthData.sort(compareDates);
          setGrowthData(rawGrowthData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Process all datasets to find the date range once data is loaded
  useEffect(() => {
    if (loading || (!feedData.length && !stoolData.length && !growthData.length)) return;
    
    console.log("Processing data to determine date ranges");
    
    // Find date range across all datasets
    const { minDate: newMinDate, maxDate: newMaxDate } = findDateRange([feedData, stoolData, growthData]);
    
    if (newMinDate && newMaxDate) {
      console.log(`Date range detected: ${newMinDate} to ${newMaxDate}`);
      
      // Update the state with the min and max dates
      setMinLoggedDate(newMinDate);
      setMaxLoggedDate(newMaxDate);
      
      // Initialize all date pickers once we know the date range
      if (!datesInitialized) {
        console.log("Initializing date pickers with appropriate dates");
        
        // Current date is set to 2025-04-12
        const currentDate = "2025-04-12";
        
        // Keep the current date (2025-04-12) as end date if it's within or before the logged date range
        // otherwise use the max logged date
        if (parseISO(newMaxDate) < parseISO(currentDate)) {
          console.log("Max logged date is earlier than current date, using max logged date");
          setFeedEnd(newMaxDate);
          setStoolEnd(newMaxDate);
          setGrowthEnd(newMaxDate);
        } else {
          console.log("Using current date (2025-04-12) for end dates");
          // Keep the current date (already set in state initialization)
        }
        
        // Calculate start dates based on the time range and end date
        const feedStartDate = calculateStartDate(
          feedEnd !== "" ? feedEnd : currentDate,
          feedTimeRange,
          newMinDate
        );
        setFeedStart(feedStartDate);
        
        // Similar calculations for stool and growth start dates
        const stoolStartDate = calculateStartDate(
          stoolEnd !== "" ? stoolEnd : currentDate,
          "month",
          newMinDate
        );
        setStoolStart(stoolStartDate);
        
        const growthStartDate = calculateStartDate(
          growthEnd !== "" ? growthEnd : currentDate,
          growthTimeRange,
          newMinDate
        );
        setGrowthStart(growthStartDate);
        
        setDatesInitialized(true);
        console.log("Date pickers initialized with data-based range");
      }
    } else {
      console.warn("No valid dates found in any dataset");
    }
  }, [feedData, stoolData, growthData, loading, feedTimeRange, growthTimeRange, datesInitialized, feedEnd, stoolEnd, growthEnd]);

  // Double-check to ensure dates are set to current date (2025-04-12) or max logged date
  useEffect(() => {
    if (maxLoggedDate && !datesInitialized) {
      console.log("Second check: Ensuring end dates are not after max logged date");
      // Compare dates properly using Date objects instead of string comparison
      if (parseISO(maxLoggedDate) < parseISO("2025-04-12")) {
        setFeedEnd(maxLoggedDate);
        setStoolEnd(maxLoggedDate);
        setGrowthEnd(maxLoggedDate);
      }
    }
  }, [maxLoggedDate, datesInitialized]);

  // Update date range when time range changes
  const handleTimeRangeChange = (newRange) => {
    setFeedTimeRange(newRange);
    
    console.log(`Changing feed time range to: ${newRange}`);
    
    // Find optimal date range based on available data
    const { start, end } = findOptimalDateRange(
      feedData,
      feedEnd,
      newRange,
      minLoggedDate,
      maxLoggedDate
    );
    
    console.log(`Optimal date range: ${start} to ${end}`);
    
    // Update state with optimal date range
    setFeedStart(start);
    setFeedEnd(end);
  };

  // Update growth date range when time range changes
  const handleGrowthTimeRangeChange = (newRange) => {
    setGrowthTimeRange(newRange);
    
    console.log(`Changing growth time range to: ${newRange}`);
    
    // Find optimal date range based on available data
    const { start, end } = findOptimalDateRange(
      growthData,
      growthEnd,
      newRange,
      minLoggedDate,
      maxLoggedDate
    );
    
    console.log(`Optimal growth date range: ${start} to ${end}`);
    
    // Update state with optimal date range
    setGrowthStart(start);
    setGrowthEnd(end);
  };

  // Handle feed date changes with validation and respect time range selection
  const handleFeedStartChange = (newStart) => {
    console.log("Feed start date changing to:", newStart, "with time range:", feedTimeRange);
    
    // If time range is set, we need to adjust the end date based on the selected start date
    if (feedTimeRange === "week" || feedTimeRange === "month") {
      const startDate = parseISO(newStart);
      const endDate = new Date(startDate);
      
      // Calculate end date based on time range (add 6 days for week, 29 days for month)
      feedTimeRange === "week"
        ? endDate.setDate(endDate.getDate() + 6)
        : endDate.setDate(endDate.getDate() + 29);
      
      // Ensure end date doesn't exceed max logged date (compare as Date objects)
      if (maxLoggedDate && endDate > parseISO(maxLoggedDate)) {
        // If end date would exceed max logged date, adjust start date instead
        const maxDate = parseISO(maxLoggedDate);
        const adjustedStart = new Date(maxDate);
        feedTimeRange === "week"
          ? adjustedStart.setDate(adjustedStart.getDate() - 6)
          : adjustedStart.setDate(adjustedStart.getDate() - 29);
        
        // Ensure adjusted start isn't before min logged date
        if (minLoggedDate && format(adjustedStart, "yyyy-MM-dd") < minLoggedDate) {
          // If we can't satisfy both constraints, use min to max range
          setFeedStart(minLoggedDate);
          setFeedEnd(maxLoggedDate);
        } else {
          // Use adjusted start and max end
          setFeedStart(format(adjustedStart, "yyyy-MM-dd"));
          setFeedEnd(maxLoggedDate);
        }
      } else {
        // Normal case: set start to selected date and calculate appropriate end date
        setFeedStart(newStart);
        setFeedEnd(format(endDate, "yyyy-MM-dd"));
      }
    } else {
      // If no time range constraint, fall back to general validation
      const validated = validateDateRange(
        newStart,
        feedEnd,
        minLoggedDate,
        maxLoggedDate,
        feedTimeRange
      );
      setFeedStart(validated.start);
      setFeedEnd(validated.end);
    }
  };

  const handleFeedEndChange = (newEnd) => {
    console.log("Feed end date changing to:", newEnd, "with time range:", feedTimeRange);
    
    // If time range is set, we need to adjust the start date based on the selected end date
    if (feedTimeRange === "week" || feedTimeRange === "month") {
      const endDate = parseISO(newEnd);
      const startDate = new Date(endDate);
      
      // Calculate start date based on time range (subtract 6 days for week, 29 days for month)
      feedTimeRange === "week"
        ? startDate.setDate(startDate.getDate() - 6)
        : startDate.setDate(startDate.getDate() - 29);
      
      // Ensure start date isn't before min logged date
      if (minLoggedDate && format(startDate, "yyyy-MM-dd") < minLoggedDate) {
        // If start date would be before min logged date, adjust end date instead
        const minDate = parseISO(minLoggedDate);
        const adjustedEnd = new Date(minDate);
        feedTimeRange === "week"
          ? adjustedEnd.setDate(adjustedEnd.getDate() + 6)
          : adjustedEnd.setDate(adjustedEnd.getDate() + 29);
        
        // Ensure adjusted end isn't after max logged date
        if (maxLoggedDate && format(adjustedEnd, "yyyy-MM-dd") > maxLoggedDate) {
          // If we can't satisfy both constraints, use min to max range
          setFeedStart(minLoggedDate);
          setFeedEnd(maxLoggedDate);
        } else {
          // Use min start and adjusted end
          setFeedStart(minLoggedDate);
          setFeedEnd(format(adjustedEnd, "yyyy-MM-dd"));
        }
      } else {
        // Normal case: set end to selected date and calculate appropriate start date
        setFeedEnd(newEnd);
        setFeedStart(format(startDate, "yyyy-MM-dd"));
      }
    } else {
      // If no time range constraint, fall back to general validation
      const validated = validateDateRange(
        feedStart,
        newEnd,
        minLoggedDate,
        maxLoggedDate,
        feedTimeRange
      );
      setFeedStart(validated.start);
      setFeedEnd(validated.end);
    }
  };

  // Handle stool date changes with validation
  const handleStoolStartChange = (newStart) => {
    const validated = validateDateRange(
      newStart,
      stoolEnd,
      minLoggedDate,
      maxLoggedDate,
      "month"
    );
    setStoolStart(validated.start);
    setStoolEnd(validated.end);
  };

  const handleStoolEndChange = (newEnd) => {
    const validated = validateDateRange(
      stoolStart,
      newEnd,
      minLoggedDate,
      maxLoggedDate,
      "month"
    );
    setStoolStart(validated.start);
    setStoolEnd(validated.end);
  };

  // Handle growth date changes with validation
  const handleGrowthStartChange = (newStart) => {
    // If time range is set, we need to adjust the end date based on the selected start date
    if (growthTimeRange === "week" || growthTimeRange === "month") {
      const startDate = parseISO(newStart);
      const endDate = new Date(startDate);
      
      // Calculate end date based on time range (add 6 days for week, 29 days for month)
      growthTimeRange === "week"
        ? endDate.setDate(endDate.getDate() + 6)
        : endDate.setDate(endDate.getDate() + 29);
      
      // Ensure end date doesn't exceed max logged date
      if (maxLoggedDate && endDate > parseISO(maxLoggedDate)) {
        // If end date would exceed max logged date, adjust start date instead
        const maxDate = parseISO(maxLoggedDate);
        const adjustedStart = new Date(maxDate);
        growthTimeRange === "week"
          ? adjustedStart.setDate(adjustedStart.getDate() - 6)
          : adjustedStart.setDate(adjustedStart.getDate() - 29);
        
        // Ensure adjusted start isn't before min logged date
        if (minLoggedDate && format(adjustedStart, "yyyy-MM-dd") < minLoggedDate) {
          // If we can't satisfy both constraints, use min to max range
          setGrowthStart(minLoggedDate);
          setGrowthEnd(maxLoggedDate);
        } else {
          // Use adjusted start and max end
          setGrowthStart(format(adjustedStart, "yyyy-MM-dd"));
          setGrowthEnd(maxLoggedDate);
        }
      } else {
        // Normal case: set start to selected date and calculate appropriate end date
        setGrowthStart(newStart);
        setGrowthEnd(format(endDate, "yyyy-MM-dd"));
      }
    } else {
      // If no time range constraint, fall back to general validation
      const validated = validateDateRange(
        newStart,
        growthEnd,
        minLoggedDate,
        maxLoggedDate,
        growthTimeRange
      );
      setGrowthStart(validated.start);
      setGrowthEnd(validated.end);
    }
  };

  const handleGrowthEndChange = (newEnd) => {
    // If time range is set, we need to adjust the start date based on the selected end date
    if (growthTimeRange === "week" || growthTimeRange === "month") {
      const endDate = parseISO(newEnd);
      const startDate = new Date(endDate);
      
      // Calculate start date based on time range (subtract 6 days for week, 29 days for month)
      growthTimeRange === "week"
        ? startDate.setDate(startDate.getDate() - 6)
        : startDate.setDate(startDate.getDate() - 29);
      
      // Ensure start date isn't before min logged date
      if (minLoggedDate && format(startDate, "yyyy-MM-dd") < minLoggedDate) {
        // If start date would be before min logged date, adjust end date instead
        const minDate = parseISO(minLoggedDate);
        const adjustedEnd = new Date(minDate);
        growthTimeRange === "week"
          ? adjustedEnd.setDate(adjustedEnd.getDate() + 6)
          : adjustedEnd.setDate(adjustedEnd.getDate() + 29);
        
        // Ensure adjusted end isn't after max logged date
        if (maxLoggedDate && format(adjustedEnd, "yyyy-MM-dd") > maxLoggedDate) {
          // If we can't satisfy both constraints, use min to max range
          setGrowthStart(minLoggedDate);
          setGrowthEnd(maxLoggedDate);
        } else {
          // Use min start and adjusted end
          setGrowthStart(minLoggedDate);
          setGrowthEnd(format(adjustedEnd, "yyyy-MM-dd"));
        }
      } else {
        // Normal case: set end to selected date and calculate appropriate start date
        setGrowthEnd(newEnd);
        setGrowthStart(format(startDate, "yyyy-MM-dd"));
      }
    } else {
      // If no time range constraint, fall back to general validation
      const validated = validateDateRange(
        growthStart,
        newEnd,
        minLoggedDate,
        maxLoggedDate,
        growthTimeRange
      );
      setGrowthStart(validated.start);
      setGrowthEnd(validated.end);
    }
  };

  function getFeedChartData(feeds) {
    if (!Array.isArray(feeds) || feeds.length === 0) return [];
    const grouped = {};
    feeds.forEach((item) => {
      let d = item.date || item.timestamp || item.created_at;
      if (d && d.includes("T")) d = d.split("T")[0];
      if (!d) return;
      if (!grouped[d]) grouped[d] = { date: d, total: 0, feedings: [] };
      const amt = parseFloat(item.amount || item.feed_amount || 0) || 0;
      grouped[d].total += amt;
      grouped[d].feedings.push({
        meal: item.meal || "Meal",
        type: item.type || "N/A",
        amount: amt,
        time: item.time || "",
        notes: item.notes || "",
        issues: item.issues || "",
      });
    });
    
    // Convert to array and sort by date (oldest to newest for chart display)
    return Object.values(grouped).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function buildGrowthChartData(growth) {
    if (!Array.isArray(growth) || growth.length === 0) return [];
    const mapped = growth.map((item) => {
      let d =
        item.date || item.timestamp || item.created_at || item.measurement_date;
      if (d && d.includes("T")) d = d.split("T")[0];
      return {
        date: d,
        height: parseFloat(item.height || item.height_inches || 0),
        weight: parseFloat(item.weight || item.weight_lbs || 0),
      };
    });
    
    // Sort by date (oldest to newest for chart display)
    return mapped
      .filter((x) => x.date)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  // filterDataByRange function moved to utils/dateUtils.js

  const rawFeedChartData = getFeedChartData(feedData);
  const rawGrowthData = buildGrowthChartData(growthData);
  const filteredFeedChartData = filterDataByRange(
    rawFeedChartData,
    feedStart,
    feedEnd,
    feedTimeRange
  );
  const filteredStoolData = filterDataByRange(stoolData, stoolStart, stoolEnd, "month");
  const stoolColorData = buildStoolColorData(filteredStoolData);
  const filteredGrowthData = filterDataByRange(
    growthData,
    growthStart,
    growthEnd,
    growthTimeRange
  );
  const growthChartData = buildGrowthChartData(filteredGrowthData);

  // Debug log the current date states and verify we're using 2025-04-12
  console.log("Current feed dates:", { feedStart, feedEnd, minLoggedDate, maxLoggedDate });
  console.log("Current growth dates:", { growthStart, growthEnd, growthTimeRange });
  console.log("Current date for the app:", "2025-04-12");

  if (loading) {
    return (
      <Container>
        <Row>
          <Col>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "300px",
              }}
            >
              <p>{t("Loading analysis data...")}</p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
  if (error) {
    return (
      <Container>
        <Row>
          <Col>
            <div className="alert alert-danger">
              <p>
                {t("Error loading analysis data")}: {error}
              </p>
              <button className="btn btn-primary" onClick={() => router.back()}>
                {t("Go Back")}
              </button>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  const PIE_COLORS = ["#A0522D", "#2E8B57", "#FFD700", "#999999"];

  return (
    <Container className={styles.analysisContainer}>
      <Row>
        <Col>
          <h1>{t("Analytics")}</h1>
          <p className="text-muted">
            {t("Select a tab to view Feed, Stool, or Growth charts.")}
          </p>
          <Tab.Container defaultActiveKey="feed">
            <Nav variant="tabs" className={styles.customNavTabs}>
              <Nav.Item>
                <Nav.Link eventKey="feed">{t("Feed")}</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="stool">{t("Stool")}</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="growth">{t("Growth")}</Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content className={styles.noPaneBorder + " py-4"}>
              <Tab.Pane eventKey="feed">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>{t("From")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={feedStart}
                      onChange={(e) => handleFeedStartChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={feedEnd}
                      onChange={(e) => handleFeedEndChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                      // Force the max attribute to be respected
                      onInput={(e) => {
                        console.log("Date input event:", e.target.value, "Max:", maxLoggedDate);
                        if (maxLoggedDate && parseISO(e.target.value) > parseISO(maxLoggedDate)) {
                          console.log("Forcing date to max logged date");
                          e.target.value = maxLoggedDate;
                          setFeedEnd(maxLoggedDate);
                        }
                      }}
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-end">
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => handleTimeRangeChange("week")}
                        className={`${styles.toggleButton} ${
                          feedTimeRange === "week"
                            ? styles.toggleButtonActive
                            : ""
                        }`}
                      >
                        {t("Week")}
                      </button>
                      <button
                        onClick={() => handleTimeRangeChange("month")}
                        className={`${styles.toggleButton} ${
                          feedTimeRange === "month"
                            ? styles.toggleButtonActive
                            : ""
                        }`}
                      >
                        {t("Month")}
                      </button>
                    </div>
                  </Col>
                </Row>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("Feed Chart (Daily Total)")}</Card.Title>
                    {filteredFeedChartData.length === 0 ? (
                      <p>
                        {t("No feed data found for your selected date range.")}
                      </p>
                    ) : !hasEnoughDataPoints(filteredFeedChartData, feedTimeRange, "feed") ? (
                      <div className="alert alert-info">
                        {t(getDataAvailabilityMessage("feed", feedTimeRange, getLastLoggedDateInRange(feedData, feedStart, feedEnd)))}                          
                      </div>
                    ) : (
                      <div className={styles.chartContainer}>
                        <ResponsiveContainer>
                          <LineChart data={filteredFeedChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(dateStr) => {
                                const parsed = parseISO(dateStr);
                                return isNaN(parsed)
                                  ? dateStr
                                  : format(parsed, "MMM d");
                              }}
                            />
                            <YAxis />
                            <Tooltip content={<CustomFeedTooltip />} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#8884d8"
                              strokeWidth={2}
                              name={t("Total Ounces")}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="stool">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>{t("From")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={stoolStart}
                      onChange={(e) => handleStoolStartChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={stoolEnd}
                      onChange={(e) => handleStoolEndChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                      onInput={(e) => {
                        if (maxLoggedDate && parseISO(e.target.value) > parseISO(maxLoggedDate)) {
                          e.target.value = maxLoggedDate;
                          setStoolEnd(maxLoggedDate);
                        }
                      }}
                    />
                  </Col>
                </Row>
                <Card>
                  <Card.Body>
                    <Card.Title>{t("Stool Color Chart")}</Card.Title>
                    {filteredStoolData.length === 0 ? (
                      <p>
                        {t("No stool data found for your selected date range.")}
                      </p>
                    ) : !hasEnoughDataPoints(filteredStoolData, "month", "stool") ? (
                      <div className="alert alert-info">
                        {t(getDataAvailabilityMessage("stool", "month", getLastLoggedDateInRange(stoolData, stoolStart, stoolEnd)))}
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: 300 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={stoolColorData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={100}
                              label
                            >
                              {stoolColorData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Legend />
                            <Tooltip content={<CustomStoolTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="growth">
                <Row className="mb-3">
                  <Col xs="auto">
                    <Form.Label>{t("From")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={growthStart}
                      onChange={(e) => handleGrowthStartChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                    />
                  </Col>
                  <Col xs="auto">
                    <Form.Label>{t("To")}</Form.Label>
                    <Form.Control
                      type="date"
                      value={growthEnd}
                      onChange={(e) => handleGrowthEndChange(e.target.value)}
                      min={minLoggedDate || ""}
                      max={maxLoggedDate || ""}
                      onInput={(e) => {
                        if (maxLoggedDate && parseISO(e.target.value) > parseISO(maxLoggedDate)) {
                          e.target.value = maxLoggedDate;
                          setGrowthEnd(maxLoggedDate);
                        }
                      }}
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-end">
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => handleGrowthTimeRangeChange("week")}
                        className={`${styles.toggleButton} ${
                          growthTimeRange === "week"
                            ? styles.toggleButtonActive
                            : ""
                        }`}
                      >
                        {t("Week")}
                      </button>
                      <button
                        onClick={() => handleGrowthTimeRangeChange("month")}
                        className={`${styles.toggleButton} ${
                          growthTimeRange === "month"
                            ? styles.toggleButtonActive
                            : ""
                        }`}
                      >
                        {t("Month")}
                      </button>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Card className="mb-4">
                      <Card.Body>
                        <Card.Title>{t("Height Growth")}</Card.Title>
                        {growthChartData.length === 0 ? (
                          <p>
                            {t(
                              "No growth data found for your selected date range.",
                            )}
                          </p>
                        ) : !hasEnoughDataPoints(growthChartData, growthTimeRange, "growth") ? (
                          <div className="alert alert-info">
                            {t(getDataAvailabilityMessage("growth", growthTimeRange, getLastLoggedDateInRange(growthData, growthStart, growthEnd)))}
                          </div>
                        ) : (
                          <div style={{ width: "100%", height: 300 }}>
                            <ResponsiveContainer>
                              <LineChart data={growthChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="date"
                                  tickFormatter={(dateStr) => {
                                    const parsed = parseISO(dateStr);
                                    return isNaN(parsed)
                                      ? dateStr
                                      : format(parsed, "MMM d");
                                  }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="height"
                                  stroke="#82ca9d"
                                  strokeWidth={2}
                                  name={t("Height (in)")}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <Card.Body>
                        <Card.Title>{t("Weight Growth")}</Card.Title>
                        {growthChartData.length === 0 ? (
                          <p>
                            {t(
                              "No growth data found for your selected date range.",
                            )}
                          </p>
                        ) : !hasEnoughDataPoints(growthChartData, growthTimeRange, "growth") ? (
                          <div className="alert alert-info">
                            {t(getDataAvailabilityMessage("growth", growthTimeRange, getLastLoggedDateInRange(growthData, growthStart, growthEnd)))}
                          </div>
                        ) : (
                          <div style={{ width: "100%", height: 300 }}>
                            <ResponsiveContainer>
                              <LineChart data={growthChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="date"
                                  tickFormatter={(dateStr) => {
                                    const parsed = parseISO(dateStr);
                                    return isNaN(parsed)
                                      ? dateStr
                                      : format(parsed, "MMM d");
                                  }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="weight"
                                  stroke="#FF8042"
                                  strokeWidth={2}
                                  name={t("Weight (lbs)")}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}