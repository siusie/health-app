import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Modal, Form, Button, Alert } from "react-bootstrap";
import { useRouter } from "next/router";
import { format, parseISO, isSameDay } from "date-fns";
import { FaToilet, FaEdit, FaTrash } from "react-icons/fa";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styles from "./stool.module.css";

function BabyStool() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { id: babyId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [stoolData, setStoolData] = useState([]);
  const [babyInfo, setBabyInfo] = useState(null);
  const [modalShow, setModalShow] = useState(false);
  const [selectedStool, setSelectedStool] = useState(null);
  const [color, setColor] = useState("");
  const [consistency, setConsistency] = useState("");
  const [notes, setNotes] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [amPm, setAmPm] = useState("AM");
  const [toasts, setToasts] = useState([]);
  const [modalError, setModalError] = useState("");

  // Function to show toast notifications
  const showToast = useCallback((message, variant = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch baby details and stool data
  useEffect(() => {
    if (!babyId) return;

    const fetchBabyInfo = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (data.status === "ok") {
          setBabyInfo(data.data);
        } else {
          showToast("Error fetching baby information", "error");
        }
      } catch (error) {
        console.error("Error fetching baby info:", error);
        showToast("Error connecting to server", "error");
      }
    };

    const fetchStoolData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/stool`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        // Check if status is 404 (no stool records found)
        if (res.status === 404) {
          console.log("No stool records found for this baby (404 response)");
          setStoolData([]);
          setLoading(false);
          return;
        }
        
        // Parse the response
        const data = await res.json();
        console.log("Data received from stool:", data);
        
        // Check if we have stool data in the expected format
        if (data) {
          // Handle case where API returns an object with numeric keys and status property
          if (data.status === "ok" && typeof data === "object") {
            // Get only the numeric keys that contain stool entries
            const stoolEntries = Object.keys(data)
              .filter(key => !isNaN(parseInt(key)))
              .map(key => data[key])
              .filter(entry => entry && entry.stool_id);
            
            if (stoolEntries.length > 0) {
              const groupedData = groupStoolDataByDate(stoolEntries);
              setStoolData(groupedData);
              setLoading(false);
              return;
            }
          }
          // Handle case where API returns a single object directly (not in array or with status/data)
          else if (data.stool_id) {
            // If it's a single object with stool_id, we know it's a stool entry
            const groupedData = groupStoolDataByDate([data]);
            setStoolData(groupedData);
          } 
          // Handle case with status/data format
          else if (data.status === "ok" && data.data) {
            const groupedData = groupStoolDataByDate(
              Array.isArray(data.data) ? data.data : [data.data]
            );
            setStoolData(groupedData);
          } 
          // Handle case with direct array
          else if (Array.isArray(data)) {
            const groupedData = groupStoolDataByDate(data);
            setStoolData(groupedData);
          } 
          else {
            console.log("Unexpected data format:", data);
            setStoolData([]);
          }
        } else {
          console.log("No data returned from API");
          setStoolData([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stool data:", error);
        showToast("Error connecting to server", "error");
        setLoading(false);
      }
    };

    fetchBabyInfo();
    fetchStoolData();
  }, [babyId, showToast]);

  // Group stool data by date
  const groupStoolDataByDate = (stoolEntries) => {
    // Handle null or undefined stoolEntries
    if (!stoolEntries) {
      console.log("No stool entries to group");
      return [];
    }
    
    // Handle case where data might not be an array (single entry response)
    if (!Array.isArray(stoolEntries)) {
      console.log("Converting single stool entry to array:", stoolEntries);
      // If stoolEntries is a single object, convert to array with one item
      stoolEntries = [stoolEntries];
    }
    
    // Handle empty array
    if (stoolEntries.length === 0) {
      console.log("Empty stool entries array");
      return [];
    }
    
    console.log("Processing stool entries:", stoolEntries);
    
    // Initialize an object to store entries grouped by date
    const groupedByDate = {};
    
    stoolEntries.forEach(entry => {
      // Skip entries without timestamp
      if (!entry.timestamp) {
        console.log("Skipping entry without timestamp:", entry);
        return;
      }
      
      // Parse the ISO timestamp from the server (which should be in UTC)
      const utcDate = new Date(entry.timestamp);
      
      // Format the date component in YYYY-MM-DD for grouping
      const year = utcDate.getUTCFullYear();
      const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(utcDate.getUTCDate()).padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          changes: []
        };
      }
      
      // Format time in 12-hour format directly from UTC
      let hours = utcDate.getUTCHours();
      const minutes = utcDate.getUTCMinutes();
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12
      
      // Format time with padded minutes
      const formattedMinutes = String(minutes).padStart(2, '0');
      const time = `${hours}:${formattedMinutes} ${ampm}`;
      
      // Add entry to the group
      groupedByDate[date].changes.push({
        stool_id: entry.stool_id,
        time,
        color: entry.color,
        consistency: entry.consistency,
        notes: entry.notes || "",
        timestamp: entry.timestamp,
        baby_id: entry.baby_id
      });
    });
    
    // Convert to array and sort by date (most recent first)
    return Object.values(groupedByDate).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  };

  // Handle opening the edit modal
  const handleOpenModal = (stoolItem) => {
    setModalError("");
    setSelectedStool(stoolItem);
    
    if (stoolItem) {
      // Edit existing stool entry
      setColor(stoolItem.color || "");
      setConsistency(stoolItem.consistency || "");
      setNotes(stoolItem.notes || "");
      
      // Parse time (assuming format like "7:30 PM")
      const timeMatch = stoolItem.time.match(/([0-9]+):([0-9]+)\s?(AM|PM)/i);
      if (timeMatch) {
        setHour(timeMatch[1]);
        setMinute(timeMatch[2]);
        setAmPm(timeMatch[3].toUpperCase());
      } else {
        // Default time if parsing fails
        const now = new Date();
        setHour(now.getHours() % 12 || 12);
        setMinute(String(now.getMinutes()).padStart(2, "0"));
        setAmPm(now.getHours() >= 12 ? "PM" : "AM");
      }
    }
    
    setModalShow(true);
  };

  // Handle saving a stool entry
  const handleSaveStool = async () => {
    setModalError("");
    
    // Validate inputs
    if (!color) {
      setModalError("Color is required");
      return;
    }
    
    if (!consistency) {
      setModalError("Consistency is required");
      return;
    }
    
    // Format time
    const timeStr = `${hour}:${minute} ${amPm}`;
    
    // Create the stool data object
    const stoolDataObj = {
      color,
      consistency,
      notes: notes || "",
      // Create a timestamp from the date and time inputs
      timestamp: formatTimeToISO(timeStr)
    };
    
    try {
      // Update existing stool entry
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/stool/${selectedStool.stool_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(stoolDataObj),
        }
      );
      
      const data = await response.json();
      
      if (data.status === "ok") {
        showToast("Stool entry updated successfully");
        setModalShow(false);
        
        // Refresh stool data
        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/stool`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        const refreshData = await refreshResponse.json();
        console.log("Refresh data received:", refreshData);
        
        if (refreshData.status === "ok") {
          // Check if refreshData has numeric keys with stool entries
          if (typeof refreshData === "object") {
            const stoolEntries = Object.keys(refreshData)
              .filter(key => !isNaN(parseInt(key)))
              .map(key => refreshData[key])
              .filter(entry => entry && entry.stool_id);
            
            if (stoolEntries.length > 0) {
              const groupedData = groupStoolDataByDate(stoolEntries);
              setStoolData(groupedData);
              return;
            }
          }
          
          // Handle other formats
          const groupedData = groupStoolDataByDate(refreshData.data || []);
          setStoolData(groupedData);
        }
      } else {
        setModalError(data.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error saving stool entry:", error);
      setModalError("Error connecting to server");
    }
  };

  // Handle deleting a stool entry
  const handleDeleteStool = async (stoolItem) => {
    if (!window.confirm(t("Are you sure you want to delete this stool entry?"))) {
      return;
    }
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/stool/${stoolItem.stool_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (data.status === "ok") {
        showToast("Stool entry deleted successfully");
        
        // Refresh stool data
        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/stool`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        const refreshData = await refreshResponse.json();
        console.log("Refresh data received:", refreshData);
        
        if (refreshData.status === "ok") {
          // Check if refreshData has numeric keys with stool entries
          if (typeof refreshData === "object") {
            const stoolEntries = Object.keys(refreshData)
              .filter(key => !isNaN(parseInt(key)))
              .map(key => refreshData[key])
              .filter(entry => entry && entry.stool_id);
            
            if (stoolEntries.length > 0) {
              const groupedData = groupStoolDataByDate(stoolEntries);
              setStoolData(groupedData);
              return;
            }
          }
          
          // Handle other formats
          const groupedData = groupStoolDataByDate(refreshData.data || []);
          setStoolData(groupedData);
        } else {
          setStoolData([]);
        }
      } else {
        showToast(data.message || "An error occurred while deleting", "error");
      }
    } catch (error) {
      console.error("Error deleting stool entry:", error);
      showToast("Error connecting to server", "error");
    }
  };

  // Format date for display using UTC to avoid timezone issues
  const formatDateDisplay = (dateString) => {
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

  // Convert time string to ISO format for API using UTC to avoid timezone issues
  const formatTimeToISO = (timeStr) => {
    // Parse the time string (e.g., "7:30 PM")
    const match = timeStr.match(/([0-9]+):([0-9]+)\s?(AM|PM)/i);
    if (!match) return new Date().toISOString();
    
    let [_, hours, minutes, period] = match;
    
    // Convert hours to 24-hour format
    hours = parseInt(hours, 10);
    if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
    
    // Get the current date in UTC
    const now = new Date();
    
    // Create a UTC date to ensure consistent timezone handling
    const date = new Date(Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      parseInt(minutes, 10),
      0,
      0
    ));
    
    return date.toISOString();
  };

  // Toast notification component
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

  // Toast container component
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

  // Loading state
  if (loading) {
    return (
      <Container className={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <p>{t("Loading...")}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className={styles.headerRow}>
        <h1 className={styles.title}>
          {babyInfo ? `${babyInfo.first_name}'s ${t("Stool Tracking")}` : t("Stool Tracking")}
        </h1>
      </div>
      
      {/* Next stool check reminder box */}
      <div className={styles.reminderBox}>
        <div className={styles.reminderIcon}>
          <FaToilet size={20} color="#674ea7" />
        </div>
        <div>
          <p className={styles.reminderMain}>{t("Regular stool tracking helps monitor baby's digestive health")}</p>
          <p className={styles.reminderSub}>
            {stoolData.length > 0 && stoolData[0].changes.length > 0 
              ? `${t("Last recorded")}: ${stoolData[0].changes[0].time} • ${stoolData[0].changes[0].color}` 
              : t("No stool records yet.")}
          </p>
        </div>
      </div>

      {/* Display stool data by date */}
      {stoolData.length > 0 ? (
        stoolData.map((day, idx) => {
          const { dayNumber, restOfDate } = formatDateDisplay(day.date);
          const today = new Date().toISOString().split('T')[0] === day.date;
          
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
                  <span className={styles.todayChanges}>
                    {today ? t("Today's Changes") : t("Changes")}
                  </span>
                </div>
              </div>
              
              <table className={styles.stoolTable}>
                <thead>
                  <tr>
                    <th>{t("Time")}</th>
                    <th>{t("Color")}</th>
                    <th>{t("Consistency")}</th>
                    <th>{t("Notes")}</th>
                    <th style={{ width: "80px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {day.changes.map((stoolItem, stoolIdx) => (
                    <tr key={stoolIdx}>
                      <td>
                        <div className={styles.stoolTime}>{stoolItem.time}</div>
                      </td>
                      <td>{stoolItem.color || "—"}</td>
                      <td>{stoolItem.consistency || "—"}</td>
                      <td>{stoolItem.notes || "—"}</td>
                      <td className={styles.actionCell}>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleOpenModal(stoolItem)}
                          aria-label={t("Edit")}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteStool(stoolItem)}
                          aria-label={t("Delete")}
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
        })
      ) : (
        <div className={styles.noDataContainer}>
          <p>{t("No stool records found.")}</p>
        </div>
      )}

      {/* Edit Stool Modal */}
      <Modal show={modalShow} onHide={() => setModalShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {t("Edit Stool Entry")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}
          <Form>
            <Form.Group controlId="stoolTime" className="mb-3">
              <Form.Label>{t("Time")}</Form.Label>
              <div className={styles.timeRow}>
                <div className={styles.timeSegment}>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className={styles.timeBox}
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                  />
                  <span className={styles.colon}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className={styles.timeBox}
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                  />
                </div>
                <div className={styles.amPmSegment}>
                  <button
                    type="button"
                    className={amPm === "AM" ? styles.amPmBtnActive : styles.amPmBtn}
                    onClick={() => setAmPm("AM")}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={amPm === "PM" ? styles.amPmBtnActive : styles.amPmBtn}
                    onClick={() => setAmPm("PM")}
                  >
                    PM
                  </button>
                </div>
              </div>
            </Form.Group>

            <Form.Group controlId="stoolColor" className="mb-3">
              <Form.Label>{t("Color")}</Form.Label>
              <Form.Select 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                required
              >
                <option value="">{t("Select color")}</option>
                <option value="Brown">{t("Brown")}</option>
                <option value="Green">{t("Green")}</option>
                <option value="Yellow">{t("Yellow")}</option>
                <option value="Black">{t("Black")}</option>
                <option value="Red">{t("Red")}</option>
                <option value="White">{t("White")}</option>
                <option value="Other">{t("Other")}</option>
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="stoolConsistency" className="mb-3">
              <Form.Label>{t("Consistency")}</Form.Label>
              <Form.Select
                value={consistency}
                onChange={(e) => setConsistency(e.target.value)}
                required
              >
                <option value="">{t("Select consistency")}</option>
                <option value="Solid">{t("Solid")}</option>
                <option value="Soft">{t("Soft")}</option>
                <option value="Loose">{t("Loose")}</option>
                <option value="Watery">{t("Watery")}</option>
                <option value="Hard">{t("Hard")}</option>
                <option value="Mucousy">{t("Mucousy")}</option>
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="stoolNotes" className="mb-3">
              <Form.Label>{t("Notes")}</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("Optional notes about the stool or baby's behavior")}
              />
              <Form.Text className="text-muted">
                {`${notes.length}/255 ${t("characters")}`}
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setModalShow(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            className={styles.btnSave}
            onClick={handleSaveStool}
          >
            {t("Save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default BabyStool;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}