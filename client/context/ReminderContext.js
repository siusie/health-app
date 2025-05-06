import { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import {
  fetchReminders as fetchRemindersService,
  addReminder,
  updateReminder,
  deleteReminders,
  toggleReminderActive
} from "../services/reminderService";
import { findNextDueReminder } from "../utils/reminderUtil";

const ReminderContext = createContext();

export const useReminders = () => useContext(ReminderContext);
export const REMINDER_COMPLETED_EVENT = 'reminderCompleted';
export const REMINDER_UPDATED_EVENT = 'reminderUpdated';

export const ReminderProvider = ({ children, babyId }) => {
  const router = useRouter();
  const [reminders, setReminders] = useState([]);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [nextReminder, setNextReminderData] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [time, setTime] = useState({ hours: "9", minutes: "00", period: "AM" });
  const [note, setNote] = useState("");
  const [reminderDate, setReminderDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [nextReminderEnabled, setNextReminderEnabled] = useState(false);
  const [reminderIn, setReminderIn] = useState("1.5 hrs");

  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/v1`;

  useEffect(() => {
    const handleReminderCompleted = (event) => {
      fetchReminders(); // Refresh the reminders list
    };
  
    const handleReminderUpdated = (event) => {
      fetchReminders(); // Refresh the reminders list
    };
  
    // Add event listeners
    window.addEventListener(REMINDER_COMPLETED_EVENT, handleReminderCompleted);
    window.addEventListener(REMINDER_UPDATED_EVENT, handleReminderUpdated);
    
    // Clean up listeners on unmount
    return () => {
      window.removeEventListener(REMINDER_COMPLETED_EVENT, handleReminderCompleted);
      window.removeEventListener(REMINDER_UPDATED_EVENT, handleReminderUpdated);
    };
  }, []);
  
  useEffect(() => {
    if (!babyId) return;
    fetchReminders();
  }, [babyId]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (reminders.length > 0) {
        const nextReminderData = findNextDueReminder(reminders);
        setNextReminderData(nextReminderData);
      }
    }, 60000);
    return () => clearInterval(intervalId);
  }, [reminders]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const fetchedReminders = await fetchRemindersService(babyId, API_BASE_URL);
      setReminders(fetchedReminders);

      const nextReminderData = findNextDueReminder(fetchedReminders);
      setNextReminderData(nextReminderData);
    } catch (err) {
      console.error("Error in fetchReminders:", err);
      setError(err.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create next reminder data
  const createNextReminderData = (originalReminder) => {
    // Parse the reminder_in value to get hours
    const hoursMatch = originalReminder.reminder_in.match(/(\d+(\.\d+)?)/);
    const hoursToAdd = hoursMatch ? parseFloat(hoursMatch[1]) : 1.5;
    
    // Parse original time
    const [hours, minutes] = originalReminder.time.split(':').map(Number);
    
    // Create a proper Date object based on the source format
    let originalDate;
    
    if (typeof originalReminder.date === 'string') {
      // For ISO format "YYYY-MM-DD"
      if (originalReminder.date.includes('-')) {
        const [year, month, day] = originalReminder.date.split('-').map(Number);
        originalDate = new Date(year, month - 1, day); // Month is 0-indexed
      } else {
        // For other string formats
        originalDate = new Date(originalReminder.date);
      }
    } else if (originalReminder.date instanceof Date) {
      // If it's already a Date object
      originalDate = new Date(originalReminder.date.getTime());
    } else {
      // Fallback
      originalDate = new Date();
      console.warn('Unknown date format, using current date');
    }
    
    // Set the specific time from the original reminder
    originalDate.setHours(hours, minutes, 0, 0);
    
    // Add hours to get the next reminder time - this correctly handles date rollover
    const nextReminderDate = new Date(originalDate.getTime());
    nextReminderDate.setTime(nextReminderDate.getTime() + (hoursToAdd * 60 * 60 * 1000));
    
    // Format time for API (24-hour format)
    const nextHours = nextReminderDate.getHours().toString().padStart(2, '0');
    const nextMinutes = nextReminderDate.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${nextHours}:${nextMinutes}`;
    
    // Format date as YYYY-MM-DD using proper method that preserves correct date
    const formattedDate = `${nextReminderDate.getFullYear()}-${(nextReminderDate.getMonth() + 1).toString().padStart(2, '0')}-${nextReminderDate.getDate().toString().padStart(2, '0')}`;
    
    // Create new reminder with updated date and time
    return {
      title: originalReminder.title,
      time: formattedTime,
      date: formattedDate,
      notes: originalReminder.notes || originalReminder.note || "",
      is_active: true,
      next_reminder: originalReminder.next_reminder,
      reminder_in: originalReminder.reminder_in,
      baby_id: parseInt(babyId)
    };
  };

  const resetForm = () => {
    setTitle("");
    setNote("");

    const now = new Date();
    setReminderDate(now.toISOString().split("T")[0]);

    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";

    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }

    setTime({
      hours: hours.toString(),
      minutes: minutes,
      period: period,
    });

    setNextReminderEnabled(false);
    setReminderIn("1.5 hrs");
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleShowAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  const handleShowEditModal = (reminder) => {
    if (!reminder || !reminder.time) {
      console.error("Invalid reminder or missing time:", reminder);
      return;
    }

    setSelectedReminder(reminder);

    try {
      let timeParts = reminder.time.split(":");
      if (!timeParts || timeParts.length < 2) {
        throw new Error(`Invalid time format: ${reminder.time}`);
      }
      let hours = parseInt(timeParts[0]);
      const minutes = timeParts[1] || "00";
      const period = hours >= 12 ? "PM" : "AM";
      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }
      setTitle(reminder.title || "");
      setTime({ hours: hours.toString(), minutes, period });
      setNote(reminder.note || "");
      if (reminder.date) {
        try {
          const reminderDateString = new Date(reminder.date)
            .toISOString()
            .split("T")[0];
          setReminderDate(reminderDateString);
        } catch (dateErr) {
          console.error("Error parsing reminder date:", dateErr);
          setReminderDate(new Date().toISOString().split("T")[0]);
        }
      } else {
        setReminderDate(new Date().toISOString().split("T")[0]);
      }

      setNextReminderEnabled(reminder.nextReminder || false);
      setReminderIn(reminder.reminderIn || "1.5 hrs");
      setShowEditModal(true);
    } catch (err) {
      console.error("Error parsing reminder time:", err);
      showToast("Error editing reminder. Invalid time format.", "error");
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteMode(false);
    const updatedReminders = reminders.map((r) => ({ ...r, selected: false }));
    setReminders(updatedReminders);
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    if (deleteMode) {
      const updatedReminders = reminders.map((r) => ({
        ...r,
        selected: false,
      }));
      setReminders(updatedReminders);
    }
  };

  const handleShowDeleteModal = () => {
    const selectedReminders = reminders.filter((r) => r.selected);
    if (selectedReminders.length > 0) {
      setShowDeleteModal(true);
    } else {
      showToast("Please select at least one reminder to delete", "error");
    }
  };

  const handleAddReminder = async (formData) => {
    try {
      // Add the initial reminder
      const response = await addReminder(babyId, formData, API_BASE_URL);
      
      // If next reminder is enabled, create it immediately
      if (formData.next_reminder && formData.reminder_in) {
        // Create the next reminder data
        const nextReminderData = createNextReminderData(formData);
        
        // Add the next reminder
        await addReminder(babyId, nextReminderData, API_BASE_URL);
      }
      
      await fetchReminders();
      handleCloseAddModal();
      showToast("Reminder added successfully", "success");
    } catch (err) {
      console.error("Error adding reminder:", err);
      showToast(err.message || "Failed to add reminder", "error");
    }
  };

  const handleUpdateReminder = async (formData) => {
    if (!selectedReminder) {
      console.error("No reminder selected for update");
      return;
    }

    try {
      // Update the selected reminder
      await updateReminder(babyId, selectedReminder.id, formData, API_BASE_URL);
      
      // If next reminder is enabled, find and update or create it
      if (formData.next_reminder && formData.reminder_in) {
        // Create the next reminder data
        const nextReminderData = createNextReminderData(formData);
        
        // Add the next reminder
        await addReminder(babyId, nextReminderData, API_BASE_URL);
      }
      
      await fetchReminders();
      handleCloseEditModal();
      showToast("Reminder updated successfully", "success");
    } catch (err) {
      console.error("Error updating reminder:", err);
      showToast(err.message || "Failed to update reminder", "error");
    }
  };

  const handleDeleteReminders = async () => {
    try {
      const selectedReminderIds = reminders
        .filter((r) => r.selected)
        .map((r) => r.id);

      if (selectedReminderIds.length === 0) return;

      const previousReminders = [...reminders];
      const updatedReminders = reminders.filter((r) => !r.selected);
      setReminders(updatedReminders);

      handleCloseDeleteModal();

      try {
        await deleteReminders(babyId, selectedReminderIds, API_BASE_URL);
        setTimeout(async () => {
          try {
            await fetchReminders();
            showToast("Reminder(s) deleted successfully", "success");
          } catch (fetchErr) {
            console.error("Error refreshing reminders after deletion:", fetchErr);
            showToast("Reminder(s) deleted successfully", "success");
          }
        }, 500);
      } catch (error) {
        setReminders(previousReminders);
        throw error;
      }
    } catch (err) {
      console.error("Error in handleDeleteReminders:", err);
      showToast(err.message || "Failed to delete reminders", "error");
      await fetchReminders();
    }
  };

  const toggleReminderSelection = (id) => {
    const updatedReminders = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, selected: !r.selected };
      }
      return r;
    });
    setReminders(updatedReminders);
  };

  const handleToggleReminderActive = async (id) => {
    try {
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) {
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Get the new active state (opposite of current)
      const newActiveState = !reminder.isActive;
      
      // Update state locally first
      const updatedReminders = reminders.map((r) => {
        if (r.id === id) {
          return { ...r, isActive: newActiveState };
        }
        return r;
      });
      setReminders(updatedReminders);

      // Update nextReminder data
      const nextReminderData = findNextDueReminder(updatedReminders);
      setNextReminderData(nextReminderData);

      // Call API to update the server
      const result = await toggleReminderActive(babyId, id, reminder, newActiveState, API_BASE_URL);
      
      // Only show success message, don't refetch
      if (result && result.success) {
        showToast(`Reminder ${newActiveState ? 'activated' : 'deactivated'} successfully`, "success");
      }
    } catch (err) {
      console.error("Error toggling reminder:", err);
      showToast(err.message || "Failed to update reminder", "error");
      
      // On error, revert local state by refetching
      await fetchReminders();
    }
  };

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const showTitleRequired = () => {
    showToast("Title field is required", "error");
  };

  const value = {
    reminders,
    loading,
    error,
    deleteMode,
    nextReminder,
    showAddModal,
    showEditModal,
    showDeleteModal,
    toastMessage,
    title,
    time,
    note,
    reminderDate,
    nextReminderEnabled,
    reminderIn,
    selectedReminder,
    setTitle,
    setTime,
    setNote,
    setReminderDate,
    setNextReminderEnabled,
    setReminderIn,
    fetchReminders,
    handleShowAddModal,
    handleCloseAddModal,
    handleShowEditModal,
    handleCloseEditModal,
    handleShowDeleteModal,
    handleCloseDeleteModal,
    handleAddReminder,
    handleUpdateReminder,
    handleDeleteReminders,
    toggleDeleteMode,
    toggleReminderSelection,
    handleToggleReminderActive,
    showToast,
    showTitleRequired
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};

export default ReminderContext;