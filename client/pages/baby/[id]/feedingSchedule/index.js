import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Alert, Row, Col } from "react-bootstrap";
import styles from "./feedingSchedule.module.css";
import { useRouter } from "next/router";
import {
  parseISO,
  format,
  compareDesc,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import { FaBaby, FaEdit, FaTrash } from "react-icons/fa";
import { AiOutlineInfoCircle } from "react-icons/ai";

import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function Feeding({ baby_id }) {
  const { t, i18n } = useTranslation("common");
  const [feedingSchedule, setFeedingSchedule] = useState([]);
  const [babyId, setBabyId] = useState("");
  const [modalError, setModalError] = useState("");
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
  const [exportModalShow, setExportModalShow] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportError, setExportError] = useState("");
  const [addFeedModalShow, setAddFeedModalShow] = useState(false);
  const [newMeal, setNewMeal] = useState("Breakfast");
  const [newHour, setNewHour] = useState("9");
  const [newMinute, setNewMinute] = useState("41");
  const [newAmPm, setNewAmPm] = useState("AM");
  const [newType, setNewType] = useState("Baby formula");
  const [newAmount, setNewAmount] = useState("");
  const [newIssues, setNewIssues] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newModalError, setNewModalError] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [remindMinutes, setRemindMinutes] = useState("30");
  const [toasts, setToasts] = useState([]);
  const [modalShow, setModalShow] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (router.isReady && baby_id) {
      // console.log("Fetching feeding schedule for baby ID:", baby_id);
      if (baby_id) {
        async function fetchFeedingSchedule() {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${baby_id}/getFeedingSchedules`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              },
            );
            const data = await res.json();
            // console.log("Fetched feeding schedule data:", data);
            if (res.ok) {
              //  Convert the response to an array of feeding schedules
              const feedingScheduleArray = Object.keys(data)
                .filter((key) => key !== "status")
                .map((key) => data[key]);
              setFeedingSchedule(feedingScheduleArray);
            } else {
              console.error("Failed to fetch feeding schedule:", data);
            }
          } catch (error) {
            console.error("Error fetching feeding schedule:", error);
          }
        }
        fetchFeedingSchedule();
      } else {
        console.log("No baby ID found.");
      }
    }
  }, [baby_id, router.isReady]);

  let sortedData = [...feedingSchedule].sort((a, b) =>
    compareDesc(parseISO(a.date), parseISO(b.date)),
  );
  let hasAnyMeals = sortedData.some((d) => d.meal && d.meal.length > 0);

  // Fixed date formatting function
  const formatDate = (dateString) => {
    try {
      // Check if date string is valid
      if (!dateString || typeof dateString !== 'string') {
        console.error("Invalid date string:", dateString);
        return { dayNumber: "?", restOfDate: "Invalid date" };
      }
      
      // Parse date parts from the YYYY-MM-DD format
      const [year, month, day] = dateString.split('-').map(part => parseInt(part, 10));
      
      // Use UTC to avoid timezone issues
      const date = new Date(Date.UTC(year, month - 1, day));
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date created from:", dateString);
        return { dayNumber: "?", restOfDate: "Invalid date" };
      }
      
      // Format the day number
      const dayNumber = date.getUTCDate().toString();
      
      // Format the rest of date (Month, Day of week, Year)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const restOfDate = `${months[date.getUTCMonth()]}, ${days[date.getUTCDay()]} ${date.getUTCFullYear()}`;
      
      return { dayNumber, restOfDate };
    } catch (error) {
      console.error("Date parsing error:", error, "for dateString:", dateString);
      return { dayNumber: "?", restOfDate: "Invalid date" };
    }
  };

  // NEW: Function to format time properly in 12-hour format (HH:MM AM/PM)
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return "";
    
    try {
      // First, check if it's already in the right format with AM/PM
      if (/\d{1,2}:\d{2}\s?[AP]M/i.test(timeString)) {
        // It's already in the correct format, just ensure consistent spacing
        return timeString.replace(/(\d{1,2}:\d{2})\s?([AP]M)/i, "$1 $2");
      }
      
      // Check for malformed times like "01:2500" or "18:2600"
      const complexTimeMatch = timeString.match(/(\d{1,2}):(\d{2})(\d{2})/);
      if (complexTimeMatch) {
        const hours = parseInt(complexTimeMatch[1], 10);
        const minutes = parseInt(complexTimeMatch[2], 10);
        
        // Convert to 12-hour format
        const ampm = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        
        // Format properly as HH:MM AM/PM
        return `${hours12}:${String(minutes).padStart(2, "0")} ${ampm}`;
      }
      
      // Handle regular 24-hour format
      const timeParts = timeString.match(/(\d{1,2}):(\d{2})/);
      if (timeParts) {
        const hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        
        // Convert to 12-hour format
        const ampm = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        
        // Format properly as HH:MM AM/PM
        return `${hours12}:${String(minutes).padStart(2, "0")} ${ampm}`;
      }
      
      // If nothing else worked, return the original
      return timeString;
    } catch (error) {
      console.error("Error formatting time:", error, "timeString:", timeString);
      return timeString;
    }
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

  // SAVE meal
  const handleSaveMeal = async () => {
    setModalError("");
    const meal_id = selectedMeal ? selectedMeal.feeding_schedule_id : null;
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

    try {
      // Update meal in the database
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${selectedMeal.baby_id}/updateFeedingSchedule/${meal_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            meal,
            time: timeStr,
            type,
            amount: parsedAmount,
            issues,
            notes,
          }),
        },
      );

      const data = await res.json();
      if (data.status === "ok") {
        setModalShow(false);
        showToast("Feed updated!");
        router.reload();
      }
    } catch (error) {
      console.log(error);
      showToast("Error saving feed to server.", "danger");
    }
  };

  const handleSaveNewFeed = () => {
    setNewModalError("");
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
    const parsedAmount = parseFloat(newAmount) || 0;
    if (parsedAmount <= 0) {
      setNewModalError("Amount must be greater than 0.");
      return;
    }
    const timeStr = formatTime(
      parsedHour,
      String(parsedMinute).padStart(2, "0"),
      newAmPm,
    );
    const newFeed = {
      meal: newMeal,
      time: timeStr,
      type: newType,
      amount: parsedAmount,
      issues: newIssues || "",
      notes: newNote || "",
      reminderOn: reminderEnabled,
      remindIn: remindMinutes,
    };
    const todayString = getLocalTodayString();
    let foundToday = false;
    const updated = feedingSchedule.map((day) => {
      if (day.date === todayString) {
        foundToday = true;
        return { ...day, meals: [...day.meals, newFeed] };
      }
      return day;
    });
    if (!foundToday) {
      updated.push({ date: todayString, meals: [newFeed] });
    }
    mockApi.updateSchedule(updated).then((res) => {
      if (res.success) {
        setFeedingSchedule(res.data);
        setAddFeedModalShow(false);
        showToast("Feed added! The next feed is due in 2 hours.");
      }
    });

    // Make API call to add schedule
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/addSchedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        date: todayString,
        time: timeStr,
        meal: newMeal,
        amount: parsedAmount,
        type: newType,
        issues: newIssues,
        notes: newNote,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showToast("Feed added to server!");
        } else {
          showToast("Failed to add feed to server.", "danger");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showToast("Error adding feed to server.", "danger");
      });
  };

  // DELETE meal
  const handleDeleteMeal = async (mealItem, date) => {
    const meal_id = mealItem.feeding_schedule_id;
    try {
      // Delete meal in the database
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${mealItem.baby_id}/deleteFeedingSchedule/${meal_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();
      if (data.status === "ok") {
        setModalShow(false);
        showToast("Feed deleted!");
        router.reload();
      }
    } catch (error) {
      console.log(error);
      showToast("Error deleting feed.", "danger");
    }
    // const updated = scheduleData.map((day) => {
    //   if (day.date === date) {
    //     return {
    //       ...day,
    //       meals: day.meals.filter((m) => m !== mealItem),
    //     };
    //   }
    //   return day;
    // });
    // mockApi.updateSchedule(updated).then((res) => {
    //   if (res.success) {
    //     setScheduleData(res.data);
    //     showToast("Feed deleted.", "warning");
    //   }
    // });
  };

  function formatTime(h, m, ampm) {
    return `${h}:${m} ${ampm}`;
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
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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

  const showToast = (message, variant = "success") => {
    const id = createToastId();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Improved function to get today's date in YYYY-MM-DD format
  function getLocalTodayString() {
    const now = new Date();
    // Use UTC methods to avoid timezone issues
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }

  // Group meals by date
  const groupMealsByDate = (meals) => {
    return meals.reduce((acc, meal) => {
      const date = meal.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(meal);
      return acc;
    }, {});
  };
  const groupedMeals = groupMealsByDate(sortedData);

  // Added function to check if a date is today, using UTC to avoid timezone issues
  const isDateToday = (dateString) => {
    if (!dateString) return false;
    
    try {
      // Get today's date in UTC
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      
      // Parse the input date
      const [year, month, day] = dateString.split('-').map(part => parseInt(part, 10));
      const dateUTC = new Date(Date.UTC(year, month - 1, day));
      
      // Compare the dates (ignoring time)
      return todayUTC.getTime() === dateUTC.getTime();
    } catch (e) {
      console.error("Error checking if date is today:", e);
      return false;
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {Object.entries(groupedMeals).map((mealsOnSameDate) => {
        const meals = mealsOnSameDate[1];
        const date = mealsOnSameDate[0];
        const { dayNumber, restOfDate } = formatDate(date);
        const today = isDateToday(date);

        return (
          <div key={date} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <div className={styles.dayInfo}>
                {today ? (
                  <div className={styles.dateCircle}>{dayNumber}</div>
                ) : (
                  <div className={styles.dateNumber}>{dayNumber}</div>
                )}
                <span className={styles.dateText}>{restOfDate}</span>
              </div>
              {today && (
                <div className={styles.dayHeaderRight}>
                  <span className={styles.todayMeals}>
                    {t("Today's Meals")}
                  </span>
                </div>
              )}
            </div>
            <table className={styles.mealsTable}>
              <thead>
                <tr>
                  <th>{t("Meal")}</th>
                  <th>{t("Time")}</th>
                  <th>{t("Type")}</th>
                  <th>{t("Amount")} (oz)</th>
                  <th>{t("Issues")}</th>
                  <th>{t("Notes")}</th>
                  <th style={{ width: "60px" }}></th>
                </tr>
              </thead>
              <tbody>
                {meals.map((meal, idx) => (
                  <tr key={idx}>
                    <td>{meal.meal}</td>
                    <td>{formatTimeDisplay(meal.time)}</td>
                    <td>{meal.type}</td>
                    <td>{meal.amount > 0 ? meal.amount + " oz" : "0 oz"}</td>
                    <td>{meal.issues || "None"}</td>
                    <td>{meal.notes || "None"}</td>
                    <td className={styles.actionCell}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleOpenModal(meal, meal.date)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteMeal(meal, meal.date)}
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
      <Modal show={modalShow} onHide={() => setModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedMeal ? "Edit Meal" : "Add Meal"}</Modal.Title>
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
                    placeholder="Hrs" /* NEW placeholder */
                    onChange={(e) => setHour(e.target.value)}
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className={styles.timeBox}
                    value={minute}
                    placeholder="Min" /* NEW placeholder */
                    onChange={(e) => setMinute(e.target.value)}
                  />
                </div>
                <div className={styles.amPmSegment}>
                  <button
                    type="button"
                    className={
                      amPm === "AM" ? styles.amPmBtnActive : styles.amPmBtn
                    }
                    onClick={() => setAmPm("AM")}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={
                      amPm === "PM" ? styles.amPmBtnActive : styles.amPmBtn
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
              <Form.Label>{t("Amount")} (oz)</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                placeholder="E.g. 7" /* NEW placeholder */
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="issues" className="mt-3">
              <Form.Label>{t("Issue")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder={t("Describe any feeding issues")}
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="notes" className="mt-3">
              <Form.Label>{t("Notes")}</Form.Label>
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
            {t("Cancel")}
          </Button>
          <Button className={styles.btnSave} onClick={handleSaveMeal}>
            {t("Save")}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={addFeedModalShow} onHide={() => setAddFeedModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add a feed</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {newModalError && <Alert variant="danger">{newModalError}</Alert>}
          <Form>
            <Form.Group controlId="newMeal">
              <Form.Label>Meal</Form.Label>
              <Form.Select
                value={newMeal}
                onChange={(e) => setNewMeal(e.target.value)}
              >
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snack</option>
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="time" className="mt-3">
              <Form.Label>Time</Form.Label>
              <div className={styles.timeRow}>
                <div className={styles.timeSegment}>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className={styles.timeBox}
                    value={newHour}
                    placeholder="Hrs" /* NEW placeholder */
                    onChange={(e) => setNewHour(e.target.value)}
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className={styles.timeBox}
                    value={newMinute}
                    placeholder="Min" /* NEW placeholder */
                    onChange={(e) => setNewMinute(e.target.value)}
                  />
                </div>
                <div className={styles.amPmSegment}>
                  <button
                    type="button"
                    className={
                      newAmPm === "AM" ? styles.amPmBtnActive : styles.amPmBtn
                    }
                    onClick={() => setNewAmPm("AM")}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={
                      newAmPm === "PM" ? styles.amPmBtnActive : styles.amPmBtn
                    }
                    onClick={() => setNewAmPm("PM")}
                  >
                    PM
                  </button>
                </div>
              </div>
            </Form.Group>
            <Form.Group controlId="newType" className="mt-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option>Baby formula</option>
                <option>Breastmilk</option>
                <option>Solid food</option>
                <option>Snack</option>
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="newAmount" className="mt-3">
              <Form.Label>Amount (oz)</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                placeholder="E.g. 7"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="newIssues" className="mt-3">
              <Form.Label>Issue</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Describe any feeding issues"
                value={newIssues}
                onChange={(e) => setNewIssues(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="newNote" className="mt-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Any additional notes?"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </Form.Group>
            <div className={`${styles.reminderRow} form-switch`}>
              <Form.Check
                type="switch"
                id="reminderSwitch"
                checked={reminderEnabled}
                onChange={() => setReminderEnabled(!reminderEnabled)}
                label="Next feed reminder"
              />
              {reminderEnabled && (
                <>
                  <p className={styles.reminderInfo}>
                    You should be feeding your baby every 1–2 hours. Set a
                    reminder before your next feed.
                  </p>
                  <Form.Label>Remind me in</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="minutes"
                    value={remindMinutes}
                    onChange={(e) => setRemindMinutes(e.target.value)}
                  />
                </>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            className={styles.btnCancel}
            onClick={() => setAddFeedModalShow(false)}
          >
            Cancel
          </Button>
          <Button className={styles.btnSave} onClick={handleSaveNewFeed}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Feeding;

// export async function getStaticPaths() {
//   // Fetch the token from localStorage on the client side
//   if (typeof window !== "undefined") {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       return {
//         paths: [],
//         fallback: false,
//       };
//     }

//     // Fetch the list of baby IDs from your custom API route
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/babies`, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("token")}`,
//       },
//     });
//     const data = await res.json();

//     if (data.status !== "ok") {
//       return {
//         paths: [],
//         fallback: false,
//       };
//     }

//     // Generate the paths for each baby ID
//     const paths = data.babies.map((baby) => ({
//       params: { id: baby.baby_id.toString() },
//     }));

//     return {
//       paths,
//       fallback: false, // See the "fallback" section below
//     };
//   }

//   return {
//     paths: [],
//     fallback: false,
//   };
// }

export async function getServerSideProps({ params, locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      baby_id: params.id,
    },
  };
}