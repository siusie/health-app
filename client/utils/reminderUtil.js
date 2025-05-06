// Utility functions for handling reminders, time formatting, and date operations
import { format, parse } from "date-fns";
/**
 * Formats time from 24h to 12h format with AM/PM
 * @param {string} timeStr - Time string in format "HH:MM"
 * @returns {string} Formatted time string in 12h format
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const [rawHour, rawMinute] = timeStr.split(":");
  let hour = parseInt(rawHour, 10);
  let minute = parseInt(rawMinute || "0", 10);

  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour === 0) {
    hour = 12; // midnight hour
  } else if (hour > 12) {
    hour -= 12;
  }
  const minuteStr = minute.toString().padStart(2, "0");
  return `${hour}:${minuteStr} ${ampm}`;
}

/**
 * Formats a date object into a readable day format
 * @param {Date|string} date - Date to format
 * @returns {Object} Formatted date information
 */
export const formatDay = (dateStr) => {
  // First determine what format we're getting
  let parsedDate;
  
  // Try to parse assuming it's already a date string (e.g., "Wed Apr 08 2025")
  try {
    parsedDate = parse(dateStr, "EEE MMM dd yyyy", new Date());
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid date parsed");
    }
  } catch (err) {
    // If that fails, try ISO format (e.g., "2025-04-08")
    try {
      parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date parsed");
      }
    } catch (err2) {
      // As a last resort, just create a date from the string
      parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        // If all parsing attempts fail, use current date
        console.error("Failed to parse date:", dateStr);
        parsedDate = new Date();
      }
    }
  }
  
  // Extract the day number, formatted date text, and check if it's today
  const date = format(parsedDate, "d"); // Day number (e.g., 27)
  const dateText = format(parsedDate, "MMM, yyyy"); // Month and year format
  
  // Use direct string comparison of dates to check if it's today
  const today = new Date();
  const isToday = 
    parsedDate.getFullYear() === today.getFullYear() && 
    parsedDate.getMonth() === today.getMonth() && 
    parsedDate.getDate() === today.getDate();

  return { date, dateText, isToday };
};

/**
 * Identifies the next upcoming reminder from a list
 * @param {Array} remindersList - List of reminders to check
 * @returns {Object|null} Next reminder information or null if none found
 */
export function findNextDueReminder(remindersList) {
  if (!remindersList || remindersList.length === 0) {
    return null;
  }

  const now = new Date();
  const today = now.toDateString();
  const activeReminders = remindersList.filter((r) => r.isActive);

  if (activeReminders.length === 0) {
    return null;
  }

  const todaysReminders = activeReminders.filter(
    (reminder) => reminder.date && reminder.date.toDateString() === today,
  );

  const sortedReminders = todaysReminders.sort((a, b) => {
    if (!a.time || !b.time) return 0;
    let timeA = a.time.split(":");
    let timeB = b.time.split(":");
    if (!timeA || !timeA[0] || !timeB || !timeB[0]) return 0;
    const dateA = new Date();
    dateA.setHours(parseInt(timeA[0]), parseInt(timeA[1] || 0), 0);
    const dateB = new Date();
    dateB.setHours(parseInt(timeB[0]), parseInt(timeB[1] || 0), 0);
    return dateA - dateB;
  });

  const upcomingReminders = sortedReminders.filter((reminder) => {
    if (!reminder.time) return false;
    let timeParts = reminder.time.split(":");
    if (!timeParts || !timeParts[0]) return false;
    const reminderTime = new Date();
    reminderTime.setHours(
      parseInt(timeParts[0]),
      parseInt(timeParts[1] || 0),
      0,
    );
    return reminderTime > now;
  });

  if (upcomingReminders.length > 0) {
    const next = upcomingReminders[0];
    let timeParts = next.time.split(":");
    const reminderTime = new Date();
    reminderTime.setHours(
      parseInt(timeParts[0]),
      parseInt(timeParts[1] || 0),
      0,
    );

    const diffMs = reminderTime - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeText = "";
    if (diffHrs > 0) {
      timeText = `${diffHrs} hour${diffHrs > 1 ? "s" : ""}`;
      if (diffMins > 0) {
        timeText += ` and ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
      }
    } else {
      timeText = `${diffMins} minute${diffMins > 1 ? "s" : ""}`;
    }

    let hours = parseInt(timeParts[0]);
    let minutes = timeParts[1] || "00";
    const ampm = hours >= 12 ? "PM" : "AM";
    if (hours === 0) {
      hours = 12;
    } else if (hours > 12) {
      hours -= 12;
    }
    const formattedTime = `${hours}:${minutes} ${ampm}`;

    return {
      reminder: next,
      timeLeft: timeText,
      formattedTime,
    };
  }

  return null;
}

/**
 * Groups reminders by date for display
 * @param {Array} reminders - List of reminders to group
 * @returns {Object} Reminders grouped by date
 */
// Replace the existing groupRemindersByDate function with this improved version
export function groupRemindersByDate(reminders) {
  return reminders.reduce((acc, reminder) => {
    if (!reminder || !reminder.date) return acc;
    
    try {
      // Create a date that preserves the day regardless of timezone
      let dateObj;
      
      if (reminder.date instanceof Date) {
        // If it's already a Date object, create a new one at noon to avoid timezone issues
        dateObj = new Date(
          reminder.date.getFullYear(),
          reminder.date.getMonth(),
          reminder.date.getDate(),
          12, 0, 0
        );
      } else if (typeof reminder.date === 'string') {
        // If it's a string like "2025-04-08", parse it carefully
        if (reminder.date.includes('-')) {
          // ISO format (YYYY-MM-DD)
          const [year, month, day] = reminder.date.split('-').map(Number);
          dateObj = new Date(year, month - 1, day, 12, 0, 0); // Month is 0-indexed in JS
        } else {
          // Try to parse as a regular date, but set to noon
          dateObj = new Date(reminder.date);
          dateObj.setHours(12, 0, 0, 0);
        }
      } else {
        console.error("Unexpected date format:", reminder.date);
        return acc;
      }
      
      // Use a consistent string representation
      const dateStr = dateObj.toDateString();
      
      // Group by this date string
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(reminder);
    } catch (err) {
      console.error("Error processing reminder for grouping:", err, reminder);
    }
    
    return acc;
  }, {});
}

/**
 * Constructs a formatted time string from hours, minutes, and period
 * @param {Object} timeObj - Object containing hours, minutes, and period
 * @returns {string} Formatted time string in 24h format
 */
export function constructTimeString(timeObj) {
  let hours = parseInt(timeObj.hours);
  if (timeObj.period === "PM" && hours < 12) {
    hours += 12;
  } else if (timeObj.period === "AM" && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, "0")}:${timeObj.minutes.padStart(
    2,
    "0",
  )}`;
}