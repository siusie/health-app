// client/components/[TipsNotificationPopup.js]

// Display a random tip notification:
//  - DAILY: ON INTERVAL counting EVERY [2-MIN] since user logged in (REGULARLY SINCE LOGGED IN)      ==> [FOR SPRINT3 DEMO: 20seconds]
//  - WEEKLY: [ONCE] SINCE LOGGED IN (bc JWT token will expire < 1day)
//              ==> [FOR SPRINT3 DEMO: 35seconds]
// ==> add a localStorage flag to check most recent notification timestamp
//  - EVERY TIME RELOAD OR GO TO /tips page
//  - will DISAPPEAR after ~10 seconds

// EXCEPTION: IF AFTER FILTER, number of tips is <=2 ==> SHOW ALL TIPS (ignore custom tips)

// CONSTANTS FOR TIME INTERVALS
const HIDE_INTERVAL = 7000; // 7 seconds

//TODO: UNCOMMENT THESE CONSTANTS [AFTER SPRINT3 DEMO]
const DAILY_INTERVAL = 60 * 60000; // every 1hour
const WEEKLY_INTERVAL = 7 * 24 * 60 * 60000; // 7 days

// //TODO:  [FOR SPRINT DEMO]: 15s for Daily, 30s for Weekly
// const DAILY_INTERVAL = 15000; // 15 seconds
// const WEEKLY_INTERVAL = 30000; // 30 seconds

import React, { useState, useEffect } from "react";
import { Alert, Button } from "react-bootstrap";

const TipsNotificationPopup = () => {
  const [tip, setTip] = useState(null); // Tip content
  const [show, setShow] = useState(true); // Initially show the tip

  useEffect(() => {
    // save Frequency in localStorage.
    // - If user is logged in, save the preference on the backend + localStorage
    const frequency = localStorage.getItem("notificationFrequency") || "Daily";
    localStorage.setItem("notificationFrequency", frequency);

    // check if the user is on the tips page
    const currentPath = window.location.pathname;
    const isTipsPage = currentPath === "/tips";

    // check logged in
    const token = localStorage.getItem("token");
    let apiUrl = "";
    if (token) {
      // If logged in, get notification settings + custom tips
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/tips/notification`;
    } else {
      // If not logged in, get all tips
      apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1/tips`;
    }

    // Helper function to fetch and display a tip
    const fetchAndShowTip = async () => {
      try {
        const response = await fetch(apiUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json();

        console.log(data);
        // {
        //   "notificationSettings": {
        //     "setting_id": 1,
        //     "user_id": 2,
        //     "notification_frequency": "Daily",
        //     "opt_in": true,
        //     "created_at": "2025-03-18T05:10:46.961Z",
        //     "updated_at": "2025-03-18T05:11:16.750Z"
        //   },
        //   "babiesTips": [
        //     {
        //       "tip_id": 13,...
        //       "tip_text": "Talk, sing, and read to your baby frequently to boost language skills."
        //     }
        //   ]
        // }

        let tipArray = [];
        // If API returns custom tips under babiesTips, use that array
        if (data.babiesTips && Array.isArray(data.babiesTips)) {
          tipArray = data.babiesTips;
        } else if (data.data && Array.isArray(data.data)) {
          tipArray = data.data;
        }

        // If after filter, number of custom tips is <=2, fallback to get all tips (ignore custom tips)
        // ==> BACKEND API already checks this condition
        if (tipArray.length <= 2) {
          console.log(
            `There is ONLY ${tipArray.length} custom tips. => SHOW ALL TIPS instead.`,
          );

          const fallbackResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/tips`,
            { headers: token ? { Authorization: `Bearer ${token}` } : {} },
          );
          const fallbackData = await fallbackResponse.json();

          // set tipArray
          if (fallbackData.data && Array.isArray(fallbackData.data)) {
            tipArray = fallbackData.data;
          }
        }

        if (tipArray.length > 0) {
          // show a random tip
          let randomIndex = Math.floor(Math.random() * tipArray.length);

          //CHECK LAST TIP CONTENT to avoid showing the same tip
          let lastTip = localStorage.getItem("lastTipContent") || "";
          console.log("Previous tip content:", lastTip);

          if (lastTip === tipArray[randomIndex].tip_text) {
            // If the same tip, get another random tip
            randomIndex = (randomIndex + 1) % tipArray.length;
          }
          setTip(tipArray[randomIndex]);

          //SAVE LAST TIP CONTENT
          localStorage.setItem(
            "lastTipContent",
            tipArray[randomIndex].tip_text,
          );

          setShow(true);

          // Update last tip timestamp in localStorage
          localStorage.setItem("lastTipTimestamp", Date.now().toString());

          // Hide tip after 10 seconds
          setTimeout(() => {
            setShow(false);
          }, HIDE_INTERVAL);
        }
      } catch (error) {
        console.error("Error fetching tip notification:", error);
      }
    };

    if (isTipsPage) {
      // On /tips page, always fetch tip immediately
      fetchAndShowTip();
    }

    // CALCULATE INTERVALS for Daily/Weekly to show again
    if (frequency === "Weekly") {
      // // For Weekly, show tip only [ONCE] per login (check localStorage flag)
      // if (!localStorage.getItem("lastTipTimestamp")) {
      //   fetchAndShowTip();

      const lastTimestamp = parseInt(
        localStorage.getItem("lastTipTimestamp") || "0",
        10,
      );

      const now = Date.now();
      if (now - lastTimestamp >= WEEKLY_INTERVAL) {
        fetchAndShowTip();
      }

      const intervalId = setInterval(() => {
        fetchAndShowTip();
      }, WEEKLY_INTERVAL);
      return () => clearInterval(intervalId);
    } else if (frequency === "Daily") {
      // For Daily, check if at least [15 sec] have passed since last tip
      const lastTimestamp = parseInt(
        localStorage.getItem("lastTipTimestamp") || "0",
        10,
      );

      const now = Date.now();
      if (now - lastTimestamp >= DAILY_INTERVAL) {
        fetchAndShowTip();
      }

      const intervalId = setInterval(() => {
        fetchAndShowTip();
      }, DAILY_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, []);

  if (!tip || !show) return null; // Do not render if no tip or not shown

  return (
    <Alert
      variant="info"
      style={{
        position: "fixed",
        top: "70px", // position just below the fixed navbar
        right: "20px",
        width: "300px",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: "8px",
      }}
    >
      <div>
        <strong>Tip: </strong> {tip.tip_text}
      </div>
      <Button
        variant="light"
        size="sm"
        onClick={() => setShow(false)}
        style={{ marginLeft: "10px" }}
      >
        X
      </Button>
    </Alert>
  );
};

export default TipsNotificationPopup;
