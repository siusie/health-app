// client/services/reminderService.js

// Service functions for CRUD operations on reminders

/**
 * Fetches all reminders for a baby
 * @param {string} id - Baby ID
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<Array>} Array of reminders
 */
export const fetchReminders = async (id, apiBaseUrl) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const response = await fetch(`${apiBaseUrl}/baby/${id}/reminders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);

      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || "Failed to load reminders");
      } catch (parseErr) {
        throw new Error(`Failed to load reminders: ${response.status}`);
      }
    }

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("Failed to parse response as JSON:", parseErr);
      throw new Error("Invalid response format");
    }

    let remindersArray = [];

    if (responseData && typeof responseData === "object") {
      const keys = Object.keys(responseData);
      const numericKeys = keys.filter((k) => !isNaN(parseInt(k)));

      if (numericKeys.length > 0) {
        remindersArray = numericKeys
          .map((key) => responseData[key])
          .filter(
            (item) => item && typeof item === "object" && item.reminder_id,
          );
      } else if (responseData.data && Array.isArray(responseData.data)) {
        remindersArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        remindersArray = responseData;
      }
    }

    const fetchedReminders = remindersArray
      .map((reminder) => {
        if (!reminder) return null;

        try {
          // Parse date correctly to preserve timezone
          let reminderDate;
          if (reminder.date) {
            if (typeof reminder.date === 'string') {
              // Split the date string and create a new date with components
              // This ensures the date is interpreted in the local timezone
              const [year, month, day] = reminder.date.split('-').map(Number);
              reminderDate = new Date(year, month - 1, day); // month is 0-indexed
            } else {
              reminderDate = new Date(reminder.date);
            }
          } else {
            reminderDate = new Date();
          }

          return {
            id: reminder.reminder_id,
            babyId: reminder.baby_id,
            title: reminder.title || "Untitled",
            time: reminder.time || "12:00",
            note: reminder.notes || "",
            date: reminderDate,
            isActive:
              reminder.is_active !== undefined ? reminder.is_active : true,
            selected: false,
            nextReminder: reminder.next_reminder || false,
            reminderIn: reminder.reminder_in || "1.5 hrs",
            createdAt: reminder.created_at,
            updatedAt: reminder.updated_at,
          };
        } catch (err) {
          console.error(
            `Error mapping reminder ${reminder.reminder_id}:`,
            err,
          );
          return null;
        }
      })
      .filter(Boolean);
    return fetchedReminders;
  } catch (err) {
    console.error("Error in fetchReminders:", err);
    throw err;
  }
};

/**
 * Add a new reminder for a baby
 * @param {string} id - Baby ID
 * @param {Object} reminderData - Reminder data
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<Object>} Response data
 */
export const addReminder = async (id, reminderData, apiBaseUrl) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    // Add baby_id to the data object
    const completeData = {
      ...reminderData,
      baby_id: parseInt(id)
    };

    const response = await fetch(`${apiBaseUrl}/baby/${id}/reminders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(completeData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || "Failed to add reminder");
      } catch (parseErr) {
        throw new Error(`Failed to add reminder: ${response.status}`);
      }
    }
    return responseText ? JSON.parse(responseText) : { success: true };
  } catch (err) {
    console.error("Error adding reminder:", err);
    throw err;
  }
};

/**
 * Update an existing reminder
 * @param {string} babyId - Baby ID
 * @param {string} reminderId - Reminder ID
 * @param {Object} reminderData - Updated reminder data
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<Object>} Response data
 */
export const updateReminder = async (babyId, reminderId, reminderData, apiBaseUrl) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }
    const updateResponse = await fetch(
      `${apiBaseUrl}/baby/${babyId}/reminders/${reminderId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminderData),
      },
    );

    const updateResponseText = await updateResponse.text();

    if (!updateResponse.ok) {
      try {
        const errorData = JSON.parse(updateResponseText);
        throw new Error(
          errorData.message ||
            `Failed to update reminder: ${updateResponse.status}`,
        );
      } catch (parseErr) {
        throw new Error(
          `Failed to update reminder: ${updateResponse.status}`,
        );
      }
    }

    return updateResponseText ? JSON.parse(updateResponseText) : { success: true };
  } catch (err) {
    console.error("Error updating reminder:", err);
    throw err;
  }
};

/**
 * Delete reminders
 * @param {string} babyId - Baby ID
 * @param {Array} reminderIds - Array of reminder IDs to delete
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<Object>} Response data
 */
export const deleteReminders = async (babyId, reminderIds, apiBaseUrl) => {
  try {
    if (reminderIds.length === 0) {
      throw new Error("No reminders selected for deletion");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const response = await fetch(`${apiBaseUrl}/baby/${babyId}/reminders`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reminderIds }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Failed to delete reminders: ${response.status}`);
    }

    return responseText ? JSON.parse(responseText) : { success: true };
  } catch (err) {
    console.error("Error in deleteReminders:", err);
    throw err;
  }
};

/**
 * Toggle the active state of a reminder
 * @param {string} babyId - Baby ID
 * @param {string} reminderId - Reminder ID
 * @param {Object} reminder - Reminder object
 * @param {boolean} newActiveState - New active state
 * @param {string} apiBaseUrl - Base URL for API calls
 * @returns {Promise<Object>} Response data
 */
export const toggleReminderActive = async (babyId, reminderId, reminder, newActiveState, apiBaseUrl) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const updateData = {
      title: reminder.title,
      time: reminder.time,
      date:
        reminder.date instanceof Date
          ? reminder.date.toISOString().split("T")[0]
          : reminder.date,
      notes: reminder.notes || reminder.note,
      is_active: newActiveState,
      next_reminder: reminder.nextReminder,
      reminder_in: reminder.reminderIn,
    };

    const updateResponse = await fetch(
      `${apiBaseUrl}/baby/${babyId}/reminders/${reminderId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!updateResponse.ok) {
      const updateResponseText = await updateResponse.text();
      throw new Error(`Failed to update reminder: ${updateResponse.status}`);
    }

    return { success: true };
  } catch (err) {
    console.error("Error toggling reminder active state:", err);
    throw err;
  }
};
