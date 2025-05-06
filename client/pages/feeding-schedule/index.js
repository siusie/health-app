// client/pages/feeding-schedule/index.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Alert,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import {
  parseISO,
  format,
  compareDesc,
  isAfter,
  isBefore,
  isSameDay,
} from "date-fns";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FaBell, FaBabyCarriage, FaEdit, FaTrash } from "react-icons/fa";
import styles from "./feeding-schedule.module.css";
import BabyCard from "@/components/BabyCard/BabyCard";
import { useRouter } from "next/router";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function getLocalTodayString() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const localTime = new Date(now.getTime() - offsetMs);
  return localTime.toISOString().split("T")[0];
}

function getCurrentLocalTimeParts() {
  const now = new Date();
  const hh = now.getHours();
  const mm = now.getMinutes();
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 || 12;
  return {
    hour: String(hour12),
    minute: String(mm).padStart(2, "0"),
    amPm: ampm,
  };
}

function formatTime(h, m, ampm) {
  return `${h}:${m} ${ampm}`;
}

// FIXED FUNCTION: Calculate reminder time properly with AM/PM handling and consistent date transitions
function calculateReminderTime(baseHour, baseMinute, baseAmPm, addMinutes) {
  // Convert to 24-hour format for calculation
  let hour24 = parseInt(baseHour, 10);
  const minute = parseInt(baseMinute, 10);

  // Convert to 24-hour format
  if (baseAmPm === "PM" && hour24 < 12) {
    hour24 += 12;
  } else if (baseAmPm === "AM" && hour24 === 12) {
    hour24 = 0;
  }

  // Create a Date object with the current date and the provided time
  const now = new Date();
  const baseTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour24,
    minute,
    0,
    0
  );

  // Add the specified minutes to get the reminder time
  const reminderTime = new Date(baseTime.getTime() + addMinutes * 60000);

  // Convert back to 12-hour format
  let reminderHour = reminderTime.getHours();
  const reminderMinute = reminderTime.getMinutes();
  const reminderAmPm = reminderHour >= 12 ? "PM" : "AM";

  // Convert hour back to 12-hour format
  reminderHour = reminderHour % 12 || 12;
  
  // Check if the date is the same as the base date
  const isSameDay = 
    reminderTime.getDate() === now.getDate() && 
    reminderTime.getMonth() === now.getMonth() && 
    reminderTime.getFullYear() === now.getFullYear();
  
  // Use the current date if it's still the same day, otherwise use the next day's date
  // Format date correctly as YYYY-MM-DD
  const formattedDate = `${reminderTime.getFullYear()}-${String(reminderTime.getMonth() + 1).padStart(2, '0')}-${String(reminderTime.getDate()).padStart(2, '0')}`;

  // Format the time
  return {
    hour: reminderHour,
    minute: String(reminderMinute).padStart(2, "0"),
    amPm: reminderAmPm,
    formattedTime: `${reminderHour}:${String(reminderMinute).padStart(
      2,
      "0",
    )} ${reminderAmPm}`,
    // Return the date, matching how it's done in the reminders page
    date: formattedDate, 
    isSameDay: isSameDay // Include flag to indicate if date changed for debugging
  };
}

function generateCSV(dayArray) {
  let csv = "Date,Meal,Time,Type,Amount,Issue,Notes\n";
  dayArray.forEach((day) => {
    if (day.meals && day.meals.length > 0) {
      day.meals.forEach((m) => {
        const row = [
          day.date,
          m.meal,
          m.time,
          m.type,
          m.amount || 0,
          m.issues || "None",
          m.notes || "None",
        ]
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(",");
        csv += row + "\n";
      });
    }
  });
  return csv;
}

function downloadCSV(csvString, fileName = "feeding-schedule.csv") {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ToastMessage = ({ message, variant = "success", onClose }) => (
  <div className={styles.toastMessage}>
    <div
      className={
        variant === "error"
          ? `${styles.toastIconCircle} ${styles.error}`
          : variant === "warning"
          ? `${styles.toastIconCircle} ${styles.warning}`
          : styles.toastIconCircle
      }
    >
      <AiOutlineInfoCircle />
    </div>
    <span>{message}</span>
    <button className={styles.toastClose} onClick={onClose}>
      ×
    </button>
  </div>
);

const ToastContainer = ({ toasts, removeToast }) => (
  <div className={styles.toastContainer}>
    {toasts.map((toast) => (
      <ToastMessage
        key={toast.id}
        message={toast.message}
        variant={toast.variant}
        onClose={() => removeToast(toast.id)}
      />
    ))}
  </div>
);

let toastIdCounter = 1;
const createToastId = () => {
  return toastIdCounter++;
};

// Format reminder notes for display with proper line breaks
const formatReminderNotes = (notes) => {
  if (!notes) return "";

  // Split by line breaks and add appropriate HTML
  return notes.split("\n\n").map((paragraph, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {paragraph}
    </React.Fragment>
  ));
};

const FeedingSchedule = () => {
  const { t, i18n } = useTranslation("common");
  const router = useRouter();
  const [scheduleData, setScheduleData] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [meal, setMeal] = useState("");
  const [hour, setHour] = useState("1");
  const [minute, setMinute] = useState("00");
  const [amPm, setAmPm] = useState("AM");
  const [type, setType] = useState("Baby formula");
  const [amount, setAmount] = useState("");
  const [issues, setIssues] = useState("");
  const [notes, setNotes] = useState("");
  const [modalError, setModalError] = useState("");
  const [exportModalShow, setExportModalShow] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportError, setExportError] = useState("");
  const [addFeedModalShow, setAddFeedModalShow] = useState(false);
  const [newMeal, setNewMeal] = useState("Breakfast");
  const [newHour, setNewHour] = useState("10");
  const [newMinute, setNewMinute] = useState("10");
  const [newAmPm, setNewAmPm] = useState("AM");
  const [newType, setNewType] = useState("Baby formula");
  const [newAmount, setNewAmount] = useState("");
  const [newIssues, setNewIssues] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newModalError, setNewModalError] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);

  // Enhanced reminder customization
  const [reminderCustomTitle, setReminderCustomTitle] = useState("");
  const [reminderPresets] = useState([
    { label: "1 hour", value: "60" },
    { label: "2 hours", value: "120", default: true },
    { label: "3 hours", value: "180" },
  ]);

  // Initialize with the default preset (2 hours)
  const defaultPreset = reminderPresets.find((preset) => preset.default);
  const [remindMinutes, setRemindMinutes] = useState(
    defaultPreset ? defaultPreset.value : "120",
  );

  // NextFeedingReminderBanner component with better error handling
  const NextFeedingReminderBanner = ({ babyId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextReminder, setNextReminder] = useState(null);
    const [lastFeed, setLastFeed] = useState(null);

    useEffect(() => {
      // Skip if no babyId is provided
      if (!babyId) return;

      const fetchReminders = async () => {
        try {
          setLoading(true);

          // Try to fetch reminders, but handle API errors gracefully
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/reminders`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              },
            );

            if (response.ok) {
              const data = await response.json();

              // Instead of throwing an error, just log it and continue
              if (!data.success) {
                console.warn("API returned unsuccessful response:", data);
                // Set error state but don't throw
                setError(data.message || "API returned unsuccessful response");
              } else {
                // Process the successful data
                const upcomingReminders = (data.data || [])
                  .filter((r) => r.is_active && r.next_reminder)
                  .sort((a, b) => {
                    // Compare dates first
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    if (dateA < dateB) return -1;
                    if (dateA > dateB) return 1;

                    // If same date, compare times
                    return a.time.localeCompare(b.time);
                  });

                setNextReminder(
                  upcomingReminders.length > 0 ? upcomingReminders[0] : null,
                );
              }
            } else {
              console.warn("Reminders API returned status:", response.status);
              setError(`API returned status ${response.status}`);
            }
          } catch (remindersError) {
            console.error("Error fetching reminders:", remindersError);
            setError("Could not connect to reminders service");
            // Continue to try fetching latest feed even if reminders fail
          }

          // Try to fetch the latest feed as a separate operation
          try {
            const feedResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/getLatestFeed`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              },
            );

            if (feedResponse.ok) {
              const feedData = await feedResponse.json();
              if (feedData.success && feedData.data) {
                setLastFeed(feedData.data);
              }
            }
          } catch (feedError) {
            console.error("Error fetching latest feed:", feedError);
            // Don't set error state here, we'll just have no last feed info
          }
        } finally {
          setLoading(false);
        }
      };

      fetchReminders();

      // Disable auto-refresh for now until the API issues are fixed
      // const intervalId = setInterval(fetchReminders, 60000);
      // return () => clearInterval(intervalId);
    }, [babyId]);

    // Show nothing if loading or if there's an error but no last feed
    if (loading || (error && !lastFeed)) {
      return null;
    }

    // If no reminder, show last feed info if available
    if (!nextReminder) {
      if (lastFeed) {
        return (
          <div className={styles.feedDueBox}>
            <div className={styles.feedDueIcon}>
              <FaBabyCarriage size={20} color="#674ea7" />
            </div>
            <div>
              <p className={styles.feedDueMain}>Last feed recorded</p>
              <p className={styles.feedDueSub}>
                {lastFeed.time} • {lastFeed.type} • {lastFeed.amount} oz
              </p>
            </div>
          </div>
        );
      }

      return null;
    }

    // Calculate time remaining until reminder
    const getReminderTimeString = () => {
      const now = new Date();
      const reminderDate = new Date(nextReminder.date);

      // Parse the time (HH:MM format)
      const [hours, minutes] = nextReminder.time.split(":").map(Number);
      reminderDate.setHours(hours);
      reminderDate.setMinutes(minutes);

      const timeDiffMs = reminderDate - now;

      // If reminder is in the past
      if (timeDiffMs < 0) {
        return "Reminder is due now";
      }

      // Convert to minutes
      const minutesRemaining = Math.ceil(timeDiffMs / (1000 * 60));

      if (minutesRemaining < 60) {
        return `in ${minutesRemaining} minute${
          minutesRemaining === 1 ? "" : "s"
        }`;
      }

      const hoursRemaining = Math.floor(minutesRemaining / 60);
      const remainingMinutes = minutesRemaining % 60;

      if (remainingMinutes === 0) {
        return `in ${hoursRemaining} hour${hoursRemaining === 1 ? "" : "s"}`;
      }

      return `in ${hoursRemaining} hour${
        hoursRemaining === 1 ? "" : "s"
      } and ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}`;
    };

    return (
      <div className={styles.feedDueBox}>
        <div className={styles.feedDueIcon}>
          <FaBell size={20} color="#674ea7" />
        </div>
        <div>
          <p className={styles.feedDueMain}>
            {nextReminder.title || "Feed is due"} {getReminderTimeString()}
          </p>
          <p className={styles.feedDueSub}>
            {lastFeed
              ? `Last feed at ${lastFeed.time} • ${lastFeed.amount} oz`
              : "Set up regular feeding times for your baby"}
          </p>
        </div>
      </div>
    );
  };

  // Mock API for now - replace with actual API calls
  const mockApi = {
    updateSchedule: (updatedSchedule) =>
      Promise.resolve({ success: true, data: updatedSchedule }),
  };

  useEffect(() => {
    // Add your data fetching logic here if needed
  }, [selectedBaby]);

  const formatDate = (dateString) => {
    const parsed = parseISO(dateString);
    return {
      dayNumber: format(parsed, "d"),
      restOfDate: format(parsed, "MMM, EEE yyyy"),
    };
  };

  let sortedData = [...scheduleData].sort((a, b) =>
    compareDesc(parseISO(a.date), parseISO(b.date)),
  );

  let hasAnyMeals = sortedData.some((d) => d.meals && d.meals.length > 0);

  const showToast = (message, variant = "success") => {
    const id = createToastId();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // EXPORT data
  const handleExport = () => {
    if (!startDate || !endDate) {
      setExportError("Please select a valid start and end date.");
      return;
    }
    let sDate = parseISO(startDate);
    let eDate = parseISO(endDate);
    if (isAfter(sDate, eDate)) {
      [sDate, eDate] = [eDate, sDate];
    }
    const filtered = scheduleData.filter((day) => {
      const dayDate = parseISO(day.date);
      return !isBefore(dayDate, sDate) && !isAfter(dayDate, eDate);
    });
    const foundMeals = filtered.some((d) => d.meals && d.meals.length > 0);
    if (!foundMeals) {
      setExportModalShow(false);
      showToast("No feed data found in that range.", "warning");
      return;
    }
    const csvString = generateCSV(filtered);
    downloadCSV(csvString);
    setExportModalShow(false);
    showToast("Exported successfully!");
  };

  const handleOpenModal = (mealItem, date) => {
    setModalError("");
    setSelectedMeal(mealItem);
    setSelectedDate(date);
    if (mealItem) {
      setMeal(mealItem.meal);
      const parts = /(\d+):(\d+)\s?(AM|PM)/i.exec(mealItem.time || "");
      if (parts) {
        setHour(parts[1]);
        setMinute(parts[2]);
        setAmPm(parts[3].toUpperCase());
      } else {
        const { hour, minute, amPm } = getCurrentLocalTimeParts();
        setHour(hour);
        setMinute(minute);
        setAmPm(amPm);
      }
      setType(mealItem.type || "Baby formula");
      setAmount(String(mealItem.amount || ""));
      setIssues(mealItem.issues || "");
      setNotes(mealItem.notes || "");
    } else {
      setMeal("Breakfast");
      const { hour, minute, amPm } = getCurrentLocalTimeParts();
      setHour(hour);
      setMinute(minute);
      setAmPm(amPm);
      setType("Baby formula");
      setAmount("");
      setIssues("");
      setNotes("");
    }
    setModalShow(true);
  };

  // SAVE meal
  const handleSaveMeal = async () => {
    setModalError("");
    const parsedHour = parseInt(hour, 10);
    const parsedMinute = parseInt(minute, 10);
    if (
      parsedHour < 1 ||
      parsedHour > 12 ||
      parsedMinute < 0 ||
      parsedMinute > 59
    ) {
      setModalError(
        "Please enter a valid time (1-12 for hour, 0-59 for minute).",
      );
      return;
    }
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      setModalError("Amount must be greater than 0.");
      return;
    }
    const timeStr = formatTime(
      parsedHour,
      String(parsedMinute).padStart(2, "0"),
      amPm,
    );
    const updated = scheduleData.map((day) => {
      if (day.date === selectedDate) {
        const updatedMeals = selectedMeal
          ? day.meals.map((m) =>
              m === selectedMeal
                ? {
                    meal,
                    time: timeStr,
                    type,
                    amount: parsedAmount,
                    issues,
                    notes,
                  }
                : m,
            )
          : [
              ...day.meals,
              {
                meal,
                time: timeStr,
                type,
                amount: parsedAmount,
                issues,
                notes,
              },
            ];
        return { ...day, meals: updatedMeals };
      }
      return day;
    });
    try {
      const res = await mockApi.updateSchedule(updated);
      if (res.success) {
        setScheduleData(res.data);
        setModalShow(false);
        showToast("Feed saved! The next feed is due in 2 hours.");
      }

      // Make API call to add schedule
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/addSchedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            date: selectedDate,
            time: timeStr,
            meal: meal,
            amount: parsedAmount,
            type,
            issues,
            notes,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        showToast("Feed saved to server!");
      } else {
        showToast("Failed to save feed to server.", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error saving feed to server.", "danger");
    }
  };

  // DELETE meal
  const handleDeleteMeal = (mealItem, date) => {
    const updated = scheduleData.map((day) => {
      if (day.date === date) {
        return {
          ...day,
          meals: day.meals.filter((m) => m !== mealItem),
        };
      }
      return day;
    });
    mockApi.updateSchedule(updated).then((res) => {
      if (res.success) {
        setScheduleData(res.data);
        showToast("Feed deleted.", "warning");
      }
    });
  };

  // Function to handle both feed and reminder creation
  const saveFeedAndCreateReminder = async (feedData, reminderData, babyId) => {
    try {
      // Step 1: Save the feed entry
      const feedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/addFeedingSchedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            meal: feedData.meal,
            time: feedData.time,
            type: feedData.type,
            amount: feedData.amount,
            issues: feedData.issues,
            notes: feedData.notes,
            date: getLocalTodayString(),
          }),
        },
      );

      const feedResult = await feedResponse.json();

      if (feedResult.status !== "ok") {
        throw new Error("Failed to save feed entry");
      }

      // Step 2: Create a reminder if enabled
      if (reminderData) {
        try {
          // IMPORTANT: Make sure we send the full formatted time with AM/PM
          // Format the time to ensure it includes AM/PM
          const reminderTime = reminderData.time;
          const reminderTimeWithAmPm = `${reminderTime} ${reminderData.amPm}`;

          console.log("Sending reminder with time:", reminderTimeWithAmPm);

          const reminderResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/reminders`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                title: reminderData.title,
                time: reminderTimeWithAmPm, // Use the full time with AM/PM
                date: reminderData.date,
                notes: reminderData.notes,
                isActive: reminderData.isActive,
                nextReminder: reminderData.nextReminder,
                reminderIn: reminderData.reminderIn,
              }),
            },
          );

          if (reminderResponse.ok) {
            showToast("Feed and reminder saved successfully!");
            return { feedSaved: true, reminderSaved: true };
          } else {
            const reminderResult = await reminderResponse.json();
            console.warn(
              "Reminder creation returned unsuccessful response:",
              reminderResult,
            );
            showToast(
              "Feed saved successfully, but reminder creation failed.",
              "warning",
            );
            return { feedSaved: true, reminderSaved: false };
          }
        } catch (reminderError) {
          console.error("Error creating reminder:", reminderError);
          showToast(
            "Feed saved successfully, but reminder creation failed.",
            "warning",
          );
          return { feedSaved: true, reminderSaved: false };
        }
      } else {
        // No reminder requested
        showToast("Feed saved successfully!");
        return { feedSaved: true, reminderSaved: false };
      }
    } catch (error) {
      console.error("Error saving feed and creating reminder:", error);
      showToast("Error saving feed: " + error.message, "error");
      return { feedSaved: false, reminderSaved: false };
    }
  };

  const handleOpenAddFeedModal = (baby_id) => {
    setNewModalError("");
    setNewMeal("Breakfast");
    const { hour, minute, amPm } = getCurrentLocalTimeParts();
    setNewHour(hour);
    setNewMinute(minute);
    setNewAmPm(amPm);
    setNewType("Baby formula");
    setNewAmount("");
    setNewIssues("");
    setNewNote("");
    setReminderEnabled(false);
    setReminderCustomTitle("");

    // Reset to default reminder time (2 hours)
    const defaultPreset = reminderPresets.find((preset) => preset.default);
    setRemindMinutes(defaultPreset ? defaultPreset.value : "120");

    setAddFeedModalShow(true);
    setSelectedBaby(baby_id);
  };

  // UPDATED: handleSaveNewFeed with proper time calculation and correct date handling
  const handleSaveNewFeed = async () => {
    setNewModalError("");

    // Validate time inputs
    const parsedHour = parseInt(newHour, 10);
    const parsedMinute = parseInt(newMinute, 10);

    if (
      parsedHour < 1 ||
      parsedHour > 12 ||
      parsedMinute < 0 ||
      parsedMinute > 59
    ) {
      setNewModalError(
        "Please enter a valid time (1-12 for hour, 0-59 for minute).",
      );
      return;
    }

    // Validate amount
    const parsedAmount = parseFloat(newAmount) || 0;
    if (parsedAmount <= 0) {
      setNewModalError("Amount must be greater than 0.");
      return;
    }

    // Format time string
    const timeStr = `${parsedHour}:${String(parsedMinute).padStart(
      2,
      "0",
    )} ${newAmPm}`;

    // Create feed data object
    const feedData = {
      meal: newMeal,
      time: timeStr,
      type: newType,
      amount: parsedAmount,
      issues: newIssues,
      notes: newNote,
    };

    // Create reminder data if enabled
    let reminderData = null;
    if (reminderEnabled) {
      const parsedReminderMinutes = parseInt(remindMinutes, 10);
      if (isNaN(parsedReminderMinutes) || parsedReminderMinutes < 1) {
        setNewModalError("Please enter a valid reminder time (minutes).");
        return;
      }

      // Calculate reminder time using our improved function
      const reminderTimeResult = calculateReminderTime(
        newHour,
        newMinute,
        newAmPm,
        parsedReminderMinutes,
      );

      // Use the custom title if provided, otherwise use the default format
      const reminderTitle =
        reminderCustomTitle || `Next feeding time (after ${newMeal})`;

      // Format notes with proper line breaks and sections
      let reminderNotes = `Last meal: ${newMeal} - ${newType} (${parsedAmount} oz)`;

      // Add any issues if present
      if (newIssues && newIssues.trim()) {
        reminderNotes += `\n\nIssues: ${newIssues}`;
      }

      // Add any additional notes if present
      if (newNote && newNote.trim()) {
        reminderNotes += `\n\nNotes: ${newNote}`;
      }

      // IMPORTANT: Include the complete time information including AM/PM
      reminderData = {
        title: reminderTitle,
        time: `${reminderTimeResult.hour}:${reminderTimeResult.minute}`, // Store without AM/PM for server
        amPm: reminderTimeResult.amPm, // Store AM/PM separately to ensure it's sent correctly
        date: reminderTimeResult.date,
        notes: reminderNotes,
        isActive: true,
        nextReminder: true,
        reminderIn: parsedReminderMinutes,
      };

    }

    try {
      // Save the feed and create reminder
      const result = await saveFeedAndCreateReminder(
        feedData,
        reminderData,
        selectedBaby,
      );

      if (result.feedSaved) {
        setAddFeedModalShow(false);
        router.reload();
      }
    } catch (error) {
      console.error("Error in handleSaveNewFeed:", error);
      setNewModalError("Something went wrong. Please try again.");
    }
  };
  // Improved helper function to calculate and format preview time with date information
  const calculatePreviewTime = (hour, minute, amPm, addMinutes) => {
    // Convert hour to 24-hour format for calculations
    let hour24 = parseInt(hour, 10);
    if (amPm === "PM" && hour24 < 12) {
      hour24 += 12;
    } else if (amPm === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    // Create a date object with current date and specified time
    const now = new Date();
    const baseTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour24,
      parseInt(minute, 10),
      0,
      0
    );

    // Add the specified minutes
    const reminderTime = new Date(
      baseTime.getTime() + parseInt(addMinutes, 10) * 60000,
    );

    // Format the time back to 12-hour format
    let reminderHour = reminderTime.getHours();
    const reminderMinute = reminderTime.getMinutes();
    const reminderAmPm = reminderHour >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    reminderHour = reminderHour % 12 || 12;
    
    // Check if the date is the same as the base date
    const isSameDay = 
      reminderTime.getDate() === now.getDate() && 
      reminderTime.getMonth() === now.getMonth() && 
      reminderTime.getFullYear() === now.getFullYear();
      
    const formattedTime = `${reminderHour}:${String(reminderMinute).padStart(2, "0")} ${reminderAmPm}`;
    
    // Only add date information if the reminder crosses to the next day
    if (!isSameDay) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${formattedTime} (${monthNames[reminderTime.getMonth()]} ${reminderTime.getDate()})`;
    }
    
    return formattedTime;
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className={styles.container}>
        <Row>
          <Col>
            <div className={styles.headerRow}>
              <h1 className={styles.title}>{t("Feeding Schedule")}</h1>
              <div className={styles.headerActions}>
                {/* Additional header buttons can be added here if needed */}
              </div>
            </div>

            {/* Temporarily comment out this line if you're still having issues */}
            {selectedBaby && (
              <NextFeedingReminderBanner babyId={selectedBaby} />
            )}

            <BabyCard
              buttons={[
                { name: t("See details"), path: "feedingSchedule" },
                {
                  name: t("Add meal"),
                  functionHandler: handleOpenAddFeedModal,
                },
              ]}
            />

            {/* Display feeding schedule data here if needed */}
            {sortedData.map((day, idx) => {
              if (!day.meals || day.meals.length === 0) return null;
              const { dayNumber, restOfDate } = formatDate(day.date);
              const today = isSameDay(new Date(), parseISO(day.date));
              return (
                <div key={idx} className={styles.dayCard}>
                  <div className={styles.dayHeader}>
                    <div className={styles.dayInfo}>
                      {today ? (
                        <div className={styles.dateCircle}>{dayNumber}</div>
                      ) : (
                        <div className={styles.dateNumber}>{dayNumber}</div>
                      )}
                      <span className={styles.dateText}>{restOfDate}</span>
                    </div>
                    <div className={styles.dayHeaderRight}>
                      <span className={styles.todayMeals}>
                        Today&apos;s Meals
                      </span>
                    </div>
                  </div>
                  <table className={styles.mealsTable}>
                    <thead>
                      <tr>
                        <th>Meal</th>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Amount (oz)</th>
                        <th>Issue</th>
                        <th>Notes</th>
                        <th style={{ width: "60px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.meals.map((mealItem, mealIdx) => (
                        <tr key={mealIdx}>
                          <td>{mealItem.meal}</td>
                          <td>{mealItem.time}</td>
                          <td>{mealItem.type}</td>
                          <td>
                            {mealItem.amount > 0
                              ? mealItem.amount + " oz"
                              : "0 oz"}
                          </td>
                          <td>{mealItem.issues || "None"}</td>
                          <td>{mealItem.notes || "None"}</td>
                          <td className={styles.actionCell}>
                            <button
                              className={styles.editBtn}
                              onClick={() =>
                                handleOpenModal(mealItem, day.date)
                              }
                            >
                              <FaEdit />
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() =>
                                handleDeleteMeal(mealItem, day.date)
                              }
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* Edit Meal Modal */}
            <Modal show={modalShow} onHide={() => setModalShow(false)}>
              <Modal.Header closeButton>
                <Modal.Title>
                  {selectedMeal ? t("Edit Meal") : t("Add Meal")}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {modalError && <Alert variant="danger">{modalError}</Alert>}
                <Form>
                  <Form.Group controlId="meal">
                    <Form.Label>{t("Meal")}</Form.Label>
                    <Form.Select
                      value={meal}
                      onChange={(e) => setMeal(e.target.value)}
                    >
                      <option>{t("Breakfast")}</option>
                      <option>{t("Lunch")}</option>
                      <option>{t("Dinner")}</option>
                      <option>{t("Snack")}</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="time" className="mt-3">
                    <Form.Label>{t("Time")}</Form.Label>
                    <div className={styles.timeRow}>
                      <div className={styles.timeSegment}>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          className={styles.timeBox}
                          value={hour}
                          placeholder="Hrs"
                          onChange={(e) => setHour(e.target.value)}
                        />
                        <span className={styles.colon}>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          className={styles.timeBox}
                          value={minute}
                          placeholder="Min"
                          onChange={(e) => setMinute(e.target.value)}
                        />
                      </div>
                      <div className={styles.amPmSegment}>
                        <button
                          type="button"
                          className={
                            amPm === "AM"
                              ? styles.amPmBtnActive
                              : styles.amPmBtn
                          }
                          onClick={() => setAmPm("AM")}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          className={
                            amPm === "PM"
                              ? styles.amPmBtnActive
                              : styles.amPmBtn
                          }
                          onClick={() => setAmPm("PM")}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </Form.Group>
                  <Form.Group controlId="type" className="mt-3">
                    <Form.Label>{t("Type")}</Form.Label>
                    <Form.Select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option>{t("Baby formula")}</option>
                      <option>{t("Breastmilk")}</option>
                      <option>{t("Solid food")}</option>
                      <option>{t("Snack")}</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="amount" className="mt-3">
                    <Form.Label>Amount (oz)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      placeholder="E.g. 7"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="issues" className="mt-3">
                    <Form.Label>Issue</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder={t("Describe any feeding issues")}
                      value={issues}
                      onChange={(e) => setIssues(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="notes" className="mt-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder={t("Any additional notes?")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className={styles.btnCancel}
                  onClick={() => setModalShow(false)}
                >
                  Cancel
                </Button>
                <Button className={styles.btnSave} onClick={handleSaveMeal}>
                  Save
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Add Feed Modal with Enhanced Reminder Section */}
            <Modal
              show={addFeedModalShow}
              onHide={() => setAddFeedModalShow(false)}
            >
              <Modal.Header closeButton>
                <Modal.Title>{t("Add a feed")}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {newModalError && (
                  <Alert variant="danger">{newModalError}</Alert>
                )}
                <Form>
                  <Form.Group controlId="newMeal">
                    <Form.Label>{t("Meal")}</Form.Label>
                    <Form.Select
                      value={newMeal}
                      onChange={(e) => setNewMeal(e.target.value)}
                    >
                      <option>{t("Breakfast")}</option>
                      <option>{t("Lunch")}</option>
                      <option>{t("Dinner")}</option>
                      <option>{t("Snack")}</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="time" className="mt-3">
                    <Form.Label>{t("Time")}</Form.Label>
                    <div className={styles.timeRow}>
                      <div className={styles.timeSegment}>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          className={styles.timeBox}
                          value={newHour}
                          placeholder="Hrs"
                          onChange={(e) => setNewHour(e.target.value)}
                        />
                        <span className={styles.colon}>:</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          className={styles.timeBox}
                          value={newMinute}
                          placeholder="Min"
                          onChange={(e) => setNewMinute(e.target.value)}
                        />
                      </div>
                      <div className={styles.amPmSegment}>
                        <button
                          type="button"
                          className={
                            newAmPm === "AM"
                              ? styles.amPmBtnActive
                              : styles.amPmBtn
                          }
                          onClick={() => setNewAmPm("AM")}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          className={
                            newAmPm === "PM"
                              ? styles.amPmBtnActive
                              : styles.amPmBtn
                          }
                          onClick={() => setNewAmPm("PM")}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </Form.Group>
                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group controlId="newType">
                        <Form.Label>{t("Type")}</Form.Label>
                        <Form.Select
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                        >
                          <option>{t("Baby formula")}</option>
                          <option>{t("Breastmilk")}</option>
                          <option>{t("Solid food")}</option>
                          <option>{t("Snack")}</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="newAmount">
                        <Form.Label>{t("Amount")} (oz)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.1"
                          placeholder="E.g. 7"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group controlId="newIssues" className="mt-3">
                    <Form.Label>{t("Issue")}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder={t("Describe any feeding issues")}
                      value={newIssues}
                      onChange={(e) => setNewIssues(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group controlId="newNote" className="mt-3">
                    <Form.Label>{t("Notes")}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder={t("Any additional notes?")}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                  </Form.Group>

                  {/* Enhanced Feeding Reminder Section */}
                  <div className="mt-4 mb-2 pt-3 border-top">
                    <div className="d-flex align-items-center">
                      <FaBell className="me-2" style={{ color: "#674ea7" }} />
                      <h6 className="mb-0">{t("Feeding Reminder")}</h6>
                    </div>
                    <p className="text-muted small mt-1">
                      {t("Set a reminder for the next feeding time")}
                    </p>
                  </div>

                  <div className={`${styles.reminderRow} form-switch`}>
                    <Form.Check
                      type="switch"
                      id="reminderSwitch"
                      checked={reminderEnabled}
                      onChange={() => {
                        setReminderEnabled(!reminderEnabled);
                        // Set default values when enabling reminder
                        if (!reminderEnabled) {
                          const defaultPreset = reminderPresets.find(
                            (preset) => preset.default,
                          );
                          setRemindMinutes(
                            defaultPreset ? defaultPreset.value : "120",
                          );
                          setReminderCustomTitle("");
                        }
                      }}
                      label={t("Next feed reminder")}
                    />

                    {reminderEnabled && (
                      <div className={styles.reminderContainer}>
                        <p className={styles.reminderInfo}>
                          {t(`You should be feeding your baby every 1–2 hours. Set a
                          reminder for the next feeding time.`)}
                        </p>

                        {/* Reminder Title Customization */}
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Reminder Title")}</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder={t(
                              `Next feeding time (after ${newMeal})`,
                            )}
                            value={reminderCustomTitle}
                            onChange={(e) =>
                              setReminderCustomTitle(e.target.value)
                            }
                          />
                          <Form.Text className="text-muted">
                            {t("Leave blank to use the default title")}
                          </Form.Text>
                        </Form.Group>

                        {/* Reminder Timing Options */}
                        <Form.Group className="mb-3">
                          <Form.Label>{t("Remind me in")}</Form.Label>
                          <div className="d-flex flex-wrap gap-2 mb-2">
                            {reminderPresets.map((preset) => (
                              <Button
                                key={preset.value}
                                variant="outline-secondary"
                                size="sm"
                                className={
                                  remindMinutes === preset.value ? "active" : ""
                                }
                                onClick={() => setRemindMinutes(preset.value)}
                              >
                                {preset.label}
                              </Button>
                            ))}
                          </div>
                          <InputGroup>
                            <Form.Control
                              type="number"
                              min="1"
                              placeholder="Custom time"
                              value={remindMinutes}
                              onChange={(e) => setRemindMinutes(e.target.value)}
                            />
                            <InputGroup.Text>{t("minutes")}</InputGroup.Text>
                          </InputGroup>
                        </Form.Group>

                        {/* UPDATED: Reminder Preview with correct time calculation */}
                        <div className={styles.reminderPreview}>
                          <div className={styles.reminderPreviewTitle}>
                            {t("Reminder Preview:")}
                          </div>
                          <div className={styles.reminderPreviewItem}>
                            <span className={styles.reminderPreviewLabel}>
                              {t("Title:")}
                            </span>
                            <span className={styles.reminderPreviewValue}>
                              {reminderCustomTitle ||
                                t(`Next feeding time (after ${newMeal})`)}
                            </span>
                          </div>
                          <div className={styles.reminderPreviewItem}>
                            <span className={styles.reminderPreviewLabel}>
                              {t("When:")}
                            </span>
                            <span className={styles.reminderPreviewValue}>
                              {t("In")} {remindMinutes} {t("minutes")} (
                              {calculatePreviewTime(
                                newHour,
                                newMinute,
                                newAmPm,
                                remindMinutes,
                              )}
                              )
                            </span>
                          </div>
                          <div className={styles.reminderPreviewItem}>
                            <span className={styles.reminderPreviewLabel}>
                              {t("Notes:")}
                            </span>
                            <div className={styles.reminderPreviewValue}>
                              {t("Last meal:")} {newMeal} - {newType}{" "}
                              {newAmount ? `(${newAmount} oz)` : ""}
                              {newIssues && (
                                <div>
                                  <strong>{t("Issues:")}</strong> {newIssues}
                                </div>
                              )}
                              {newNote && (
                                <div>
                                  <strong>{t("Notes:")}</strong> {newNote}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className={styles.btnCancel}
                  onClick={() => setAddFeedModalShow(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button className={styles.btnSave} onClick={handleSaveNewFeed}>
                  {t("Save")}
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Export Modal */}
            <Modal
              show={exportModalShow}
              onHide={() => setExportModalShow(false)}
            >
              <Modal.Header closeButton>
                <Modal.Title>Export</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p className={styles.exportModalSubtext}>
                  Select a date or date range to export feed data. It will be
                  exported to your desktop.
                </p>
                <Form>
                  <Form.Group controlId="exportDate" className="mb-3">
                    <Form.Label className={styles.exportModalLabel}>
                      Date
                    </Form.Label>
                    <div className={styles.exportDateRow}>
                      <Form.Control
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={styles.dateInput}
                      />
                      <Form.Control
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={styles.dateInput}
                      />
                    </div>
                  </Form.Group>
                </Form>
                {exportError && (
                  <p className={styles.exportError}>{exportError}</p>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className={styles.btnCancel}
                  onClick={() => setExportModalShow(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button className={styles.btnSave} onClick={handleExport}>
                  {t("Export")}
                </Button>
              </Modal.Footer>
            </Modal>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default FeedingSchedule;
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
