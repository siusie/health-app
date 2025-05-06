// File: client/context/NotificationContext.js

import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import * as reminderService from "@/services/reminderService";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userBabies, setUserBabies] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dismissedReminderIds, setDismissedReminderIds] = useState(new Set());
  const checkIntervalRef = useRef(null);
  const lastCheckRef = useRef(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/v1`
    : "/api/v1";

  // Audio state management
  const audioRef = useRef(null);
  const isPlayingAudio = useRef(false);

  // Handle server-side rendering safely
  useEffect(() => {
    setIsClient(true);
    lastCheckRef.current = new Date();

    // Check authentication status
    const token = localStorage.getItem("token");
    const isAuth = !!token;
    setIsAuthenticated(isAuth);
  }, []);

  // Load previously dismissed reminders from localStorage
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedDismissed = localStorage.getItem("dismissedReminders");
      if (savedDismissed) {
        const parsedIds = JSON.parse(savedDismissed);
        if (Array.isArray(parsedIds)) {
          setDismissedReminderIds(new Set(parsedIds));
        }
      }
    } catch (err) {
      console.error("Error loading dismissed reminders:", err);
    }
  }, [isClient]);

  // Only run client-side code after component mounts
  useEffect(() => {
    if (!isClient) return;

    if (!isAuthenticated) {
      return;
    }

    // Fetch all babies belonging to user
    const fetchUserBabies = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          return;
        }

        const url = `${API_BASE_URL}/babies`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          console.error(
            `API Error: ${response.status} - ${response.statusText}:
            This could be user is logged in as doctor, or user trying to get babies from another user`,
          );
        }

        // Read response as text first
        const text = await response.text();

        if (!text || text.trim() === "") {
          return;
        }

        // Safely parse the response
        try {
          // Some validation to avoid common parsing errors
          const trimmedText = text.trim();
          if (!trimmedText.startsWith("{") && !trimmedText.startsWith("[")) {
            return;
          }

          const data = JSON.parse(trimmedText);

          // Check for various response formats
          if (data && typeof data === "object") {
            let babiesArray = [];

            if (Array.isArray(data)) {
              // Direct array of babies
              babiesArray = data;
            } else if (data.data && Array.isArray(data.data)) {
              // Wrapped in a data property
              babiesArray = data.data;
            } else if (data.babies && Array.isArray(data.babies)) {
              // Wrapped in a babies property
              babiesArray = data.babies;
            }

            if (babiesArray.length > 0) {
              // Validate that the array contains proper baby objects
              const validBabies = babiesArray.filter(
                (baby) =>
                  baby && typeof baby === "object" && (baby.baby_id || baby.id),
              );

              if (validBabies.length > 0) {
                // Normalize the baby objects to ensure they have a consistent structure
                const normalizedBabies = validBabies.map((baby) => ({
                  baby_id: baby.baby_id || baby.id,
                  name:
                    baby.name ||
                    baby.first_name ||
                    baby.baby_name ||
                    `Baby ${baby.baby_id || baby.id}`,
                }));

                setUserBabies(normalizedBabies);
              }
            }
          }
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError);
          console.error("Raw response:", text);
        }
      } catch (error) {
        console.error("Error fetching babies:", error);
      }
    };

    fetchUserBabies();
  }, [isClient, isAuthenticated, API_BASE_URL]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!isClient || isPlayingAudio.current) return;

    if (audioRef.current) {
      try {
        isPlayingAudio.current = true;
        audioRef.current
          .play()
          .then(() => {
            setTimeout(() => {
              isPlayingAudio.current = false;
            }, 1000);
          })
          .catch((err) => {
            isPlayingAudio.current = false;
          });
      } catch (err) {
        isPlayingAudio.current = false;
      }
    }
  }, [isClient]);

  // Check for reminders - but only on client side
  const checkForReminders = useCallback(async () => {
    if (!isClient || !isAuthenticated) {
      return;
    }

    if (userBabies.length === 0) {
      return;
    }

    const now = new Date();
    const allNotifications = [];
    let newNotificationsFound = false;

    // Get the current dismissed IDs
    const currentDismissedIds = Array.from(dismissedReminderIds);

    // Clean up expired dismissed reminders (older than 1 hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const expiredDismissals = [];

    for (const baby of userBabies) {
      try {
        let reminders = [];

        try {
          reminders = await reminderService.fetchReminders(
            baby.baby_id,
            API_BASE_URL,
          );
        } catch (err) {
          console.error(
            `Error fetching reminders for baby ${baby.baby_id}:`,
            err,
          );
          continue;
        }

        // Find all active reminders
        const activeReminders = reminders.filter((r) => r.isActive);

        // Process each active reminder
        for (const reminder of activeReminders) {
          // Skip reminders that have been recently dismissed
          if (dismissedReminderIds.has(reminder.id)) {
            continue;
          }

          // Create a consistent date object at noon to avoid timezone issues
          let reminderDate;

          if (reminder.date instanceof Date) {
            reminderDate = new Date(
              reminder.date.getFullYear(),
              reminder.date.getMonth(),
              reminder.date.getDate(),
              12,
              0,
              0,
            );
          } else if (typeof reminder.date === "string") {
            const [year, month, day] = reminder.date.split("-").map(Number);
            reminderDate = new Date(year, month - 1, day, 12, 0, 0);
          } else {
            console.warn("Unsupported date format:", reminder.date);
            continue;
          }

          // Now get the actual time components and set them on the date
          if (!reminder.time || typeof reminder.time !== "string") {
            console.warn("Invalid time format:", reminder.time);
            continue;
          }

          const [hours, minutes] = reminder.time.split(":").map(Number);

          // Reset the hours and minutes (keeping the noon date for day comparison)
          const reminderDateTime = new Date(reminderDate);
          reminderDateTime.setHours(hours, minutes, 0, 0);

          // Get today's date with consistent noon time for day comparison
          const today = new Date();
          const todayAtNoon = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            12,
            0,
            0,
          );

          // Check if the reminder is for today by comparing the noon times
          const dayDiff = Math.abs(
            reminderDate.getTime() - todayAtNoon.getTime(),
          );
          const isToday = dayDiff < 24 * 60 * 60 * 1000; // Less than one day difference

          // Show today's reminders AND any past reminders
          if (isToday || reminderDate < todayAtNoon) {
            // Check if the reminder is due now or is overdue
            const timeDiffMs = reminderDateTime - now;
            const isOverdue = timeDiffMs < 0;

            // Use 60 minutes window for testing
            const isDue = Math.abs(timeDiffMs) < 60 * 60 * 1000; // Within 60 minutes

            // Always show overdue reminders from past dates
            const isPastDate = reminderDate < todayAtNoon;

            // Add if it's due or overdue or from a past date
            if (isDue || isOverdue || isPastDate) {
              // Find the baby's real name
              const babyName = baby.name || `Baby ${baby.baby_id}`;

              allNotifications.push({
                id: reminder.id,
                babyId: reminder.babyId || baby.baby_id,
                babyName: babyName,
                title: reminder.title,
                note: reminder.note || "",
                time: reminderDateTime,
                isOverdue: isOverdue || isPastDate, // Mark past date reminders as overdue
                isEarlyNotification: false,
                addedAt: new Date(), // Track when notification was added
              });

              newNotificationsFound = true;
            }
          }
        }
      } catch (error) {
        console.error(
          `Error checking reminders for baby ${baby.baby_id}:`,
          error,
        );
      }
    }

    // If we found any notifications, update the state
    if (allNotifications.length > 0) {
      setActiveNotifications((prev) => {
        // Add only new notifications (not already in the list)
        const existingIds = new Set(prev.map((n) => n.id));
        const newNotifications = allNotifications.filter(
          (n) => !existingIds.has(n.id),
        );

        if (newNotifications.length > 0) {
          // Play sound only for new notifications
          if (newNotifications.length > 0) {
            playNotificationSound();
          }

          return [...prev, ...newNotifications];
        }
        return prev;
      });
    } 

    lastCheckRef.current = now;
  }, [
    userBabies,
    API_BASE_URL,
    isClient,
    isAuthenticated,
    dismissedReminderIds,
    playNotificationSound,
  ]);

  // Setup reminder check interval - only on client side
  useEffect(() => {
    if (!isClient || !isAuthenticated) return;

    // Check right away
    checkForReminders();

    // Then check every 30 seconds
    const intervalId = setInterval(checkForReminders, 30000);
    checkIntervalRef.current = intervalId;

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkForReminders, isClient, isAuthenticated]);

  // Save dismissed reminder IDs to localStorage when they change
  useEffect(() => {
    if (!isClient) return;

    if (dismissedReminderIds.size > 0) {
      const idsArray = Array.from(dismissedReminderIds);
      localStorage.setItem("dismissedReminders", JSON.stringify(idsArray));
    }
  }, [dismissedReminderIds, isClient]);

  // Notification actions
  const dismissNotification = useCallback(
    async (id, delayMinutes = 5) => {
      if (!isClient || !isAuthenticated) return;

      try {
        const notification = activeNotifications.find((n) => n.id === id);
        if (!notification) {
          return;
        }

        // Add to dismissed set to prevent re-showing
        setDismissedReminderIds((prev) => {
          const updated = new Set(prev);
          updated.add(id);
          return updated;
        });

        // Remove from active notifications
        setActiveNotifications((prev) => prev.filter((n) => n.id !== id));

        // Reset to first notification if needed
        if (currentIndex >= activeNotifications.length - 1) {
          setCurrentIndex(0);
        }

        // Only delay if minutes specified
        if (delayMinutes > 0) {
          try {
            const reminders = await reminderService.fetchReminders(
              notification.babyId,
              API_BASE_URL,
            );
            const reminder = reminders.find((r) => r.id === id);
            if (!reminder) {
              return;
            }

            // Calculate new reminder time (current time + delay)
            const newTime = new Date();
            newTime.setMinutes(newTime.getMinutes() + delayMinutes);

            const hours = newTime.getHours().toString().padStart(2, "0");
            const minutes = newTime.getMinutes().toString().padStart(2, "0");

            // Update the reminder
            await reminderService.updateReminder(
              notification.babyId,
              id,
              {
                ...reminder,
                time: `${hours}:${minutes}`,
                date: newTime.toISOString().split("T")[0],
              },
              API_BASE_URL,
            );

            // Important: Dispatch a custom event to notify the ReminderContext
            // that a reminder has been updated via notification
            window.dispatchEvent(
              new CustomEvent("reminderUpdated", {
                detail: { id, babyId: notification.babyId, action: "delay" },
              }),
            );

            // Schedule removal from dismissed after delay expires
            setTimeout(() => {
              setDismissedReminderIds((prev) => {
                const updated = new Set(prev);
                updated.delete(id);
                return updated;
              });
            }, delayMinutes * 60 * 1000); // Convert minutes to milliseconds
          } catch (err) {
            console.error("Error updating reminder:", err);
          }
        }
      } catch (error) {
        console.error("Error dismissing notification:", error);
      }
    },
    [
      activeNotifications,
      currentIndex,
      API_BASE_URL,
      isClient,
      isAuthenticated,
    ],
  );

  // Mark reminder as complete
  const completeReminder = useCallback(
    async (id) => {
      if (!isClient || !isAuthenticated) return;
  
      try {
        const notification = activeNotifications.find((n) => n.id === id);
        if (!notification) {
          return;
        }
  
        // Add to dismissed set to prevent re-showing (permanent)
        setDismissedReminderIds((prev) => {
          const updated = new Set(prev);
          updated.add(id);
          return updated;
        });
  
        // Always remove from notifications
        setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
  
        // Reset index if needed
        if (currentIndex >= activeNotifications.length - 1) {
          setCurrentIndex(0);
        }
  
        try {
          // Get full reminder data
          const reminders = await reminderService.fetchReminders(
            notification.babyId,
            API_BASE_URL,
          );
          const reminder = reminders.find((r) => r.id === id);
          if (!reminder) {
            return;
          }
  
          // Update to mark as inactive
          await reminderService.updateReminder(
            notification.babyId,
            id,
            { ...reminder, is_active: false },
            API_BASE_URL,
          );
  
          // Create next reminder if enabled
          if (reminder.nextReminder && reminder.reminderIn) {
            // Parse the reminder_in value to get hours
            const hoursMatch = reminder.reminderIn.match(/(\d+(\.\d+)?)/);
            const hoursToAdd = hoursMatch ? parseFloat(hoursMatch[1]) : 1.5;
            
            // Calculate new time
            const reminderDate = new Date();
            reminderDate.setHours(reminderDate.getHours() + hoursToAdd);
            
            // Format time for new reminder (24 hour format for API)
            const hours = reminderDate.getHours().toString().padStart(2, '0');
            const minutes = reminderDate.getMinutes().toString().padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;
            
            // Create new reminder with same details but updated time
            const newReminderData = {
              title: reminder.title,
              time: formattedTime,
              date: reminderDate.toISOString().split('T')[0],
              notes: reminder.notes || reminder.note || "",
              is_active: true,
              next_reminder: reminder.nextReminder,
              reminder_in: reminder.reminderIn,
              baby_id: notification.babyId
            };
            
            // Add the new reminder
            await reminderService.addReminder(
              notification.babyId,
              newReminderData,
              API_BASE_URL,
            );
          }
  
          // Important: Dispatch a custom event to notify the ReminderContext
          // that a reminder has been completed via notification
          window.dispatchEvent(
            new CustomEvent("reminderCompleted", {
              detail: { id, babyId: notification.babyId },
            }),
          );
        } catch (err) {
          console.error("Error updating reminder:", err);
        }
      } catch (error) {
        console.error("Error completing reminder:", error);
      }
    },
    [
      activeNotifications,
      currentIndex,
      API_BASE_URL,
      isClient,
      isAuthenticated,
    ],
  );

  // Navigation between multiple notifications
  const showNextNotification = useCallback(() => {
    if (activeNotifications.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeNotifications.length);
  }, [activeNotifications]);

  const showPrevNotification = useCallback(() => {
    if (activeNotifications.length <= 1) return;
    setCurrentIndex((prev) =>
      prev === 0 ? activeNotifications.length - 1 : prev - 1,
    );
  }, [activeNotifications]);

  // Get current notification
  const currentNotification = activeNotifications[currentIndex];

  // Context value
  const value = {
    hasNotifications: activeNotifications.length > 0,
    totalNotifications: activeNotifications.length,
    currentNotification,
    currentIndex,
    dismissNotification,
    completeReminder,
    showNextNotification,
    showPrevNotification,
    isClient,
    isAuthenticated,
    audioRef,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {isClient && (
        <audio
          ref={audioRef}
          src="/sounds/notification.mp3"
          preload="auto"
          style={{ display: "none" }}
        />
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
