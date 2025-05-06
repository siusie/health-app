// client/pages/baby/[id]/growth/index.js
// route /baby/[id]/growth

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaEdit, FaTrashAlt, FaRulerCombined, FaWeight } from "react-icons/fa";
import { Modal, Button, Table, Alert } from "react-bootstrap";
import { format, parseISO, set } from "date-fns";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import styles from "./growth.module.css";

// Fetch Growth records for a specific baby
const fetchGrowthData = async (babyId) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/growth`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    const jsonData = await res.json();
    // console.log(
    //   `Fetched growth data for baby ${babyId} from ${process.env.NEXT_PUBLIC_API_URL}/baby/${babyId}/growth/ is:`,
    //   jsonData,
    // );

    // if Not Found, return empty array
    if (!res.ok && res.status === 404) return [];

    if (!res.ok) throw new Error("Failed to fetch growth data");

    return jsonData.data;
  } catch (err) {
    console.error("Error fetching growth data:", err);
    return [];
  }
};

// Add or update a growth record
const saveGrowthRecord = async (babyId, record, isEdit, recordId = null) => {
  console.log(
    `Starting saveGrowthRecord(), babyId: ${babyId}, record:`,
    record,
  );
  console.log(`isEdit: ${isEdit}, recordId: ${recordId}`);

  try {
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/growth/${recordId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/growth`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(record),
    });

    console.log(
      `In saveGrowthRecord(), ${method} to ${url} with data:`,
      record,
    );

    if (!res.ok) throw new Error("Failed to save growth record");
    return await res.json();
  } catch (err) {
    console.error("Error saving growth record:", err);
  }
};

// Delete a growth record
const deleteGrowthRecord = async (babyId, recordId) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}/growth/${recordId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    if (!res.ok) throw new Error("Failed to delete growth record");
  } catch (err) {
    console.error("Error deleting growth record:", err);
  }
};

// const CustomStatsCard = ({
//   label,
//   value,
//   difference,
//   isHeight = true,
//   lastCheckIn,
// }) => {
//   const { t } = useTranslation("common");
//   const icon = isHeight ? (
//     <FaRulerCombined size={24} color="#FFFFFF" />
//   ) : (
//     <FaWeight size={24} color="#FFFFFF" />
//   );

//   let differenceArrow = "↑";

//   return (
//     <div className={styles.statsCard}>
//       <div className={styles.iconContainer}>{icon}</div>
//       <div className={styles.statsContent}>
//         <div className={styles.statsLabel}>{label}</div>
//         <div className={styles.valueRow}>
//           <div className={styles.valueText}>{value}</div>
//           <div className={styles.differenceContainer}>
//             <span className={styles.differenceArrow}>{differenceArrow}</span>
//             {difference}
//           </div>
//         </div>
//         <div className={styles.lastCheckInRow}>
//           <div>{t("Last check in")}</div>
//           <div className={styles.lastCheckInDate}>{lastCheckIn}</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// RENDERING STATS CARD COMPONENT
// checkIns is an ARRAY [{ date: "2023-01-01", value: 20 }, ...]
const CustomStatsCard = ({ label, isHeight = true, checkIns }) => {
  const { t } = useTranslation("common");
  const icon = isHeight ? (
    <FaRulerCombined size={24} color="#FFFFFF" />
  ) : (
    <FaWeight size={24} color="#FFFFFF" />
  );

  // If no check‑in records provided, show a default display.
  if (!checkIns || checkIns.length === 0) {
    return (
      <div className={styles.statsCard}>
        <div className={styles.iconContainer}>{icon}</div>
        <div className={styles.statsContent}>
          <div className={styles.statsLabel}>{label}</div>
          <div className={styles.valueRow}>
            <div className={styles.valueText}>--</div>
            <div className={styles.differenceContainer}>
              <span className={styles.differenceArrow}>–</span>0
            </div>
          </div>
          <div className={styles.lastCheckInRow}>
            <div>{t("Last check in")}</div>
            <div className={styles.lastCheckInDate}>N/A</div>
          </div>
        </div>
      </div>
    );
  }

  // Filter out entries that do not have a valid measurement value.
  const validCheckIns = checkIns.filter((item) =>
    isHeight
      ? item.height !== undefined && item.height !== null && item.height !== ""
      : item.weight !== undefined && item.weight !== null && item.weight !== "",
  );
  // If there are no valid check‑ins after filtering, return the default card.
  if (validCheckIns.length === 0) {
    return (
      <div className={styles.statsCard}>
        <div className={styles.iconContainer}>{icon}</div>
        <div className={styles.statsContent}>
          <div className={styles.statsLabel}>{label}</div>
          <div className={styles.valueRow}>
            <div className={styles.valueText}>--</div>
            <div className={styles.differenceContainer}>
              <span className={styles.differenceArrow}>–</span>0
            </div>
          </div>
          <div className={styles.lastCheckInRow}>
            <div>{t("Last check in")}</div>
            <div className={styles.lastCheckInDate}>N/A</div>
          </div>
        </div>
      </div>
    );
  }

  // Sort valid check‑ins by date descending (latest first) regardless of any parent ordering.
  const sortedCheckIns = [...validCheckIns].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  // Use the two most recent check‑ins
  const latestCheckIn = sortedCheckIns[0];
  const previousCheckIn = sortedCheckIns[1];
  const latestValue = isHeight
    ? parseFloat(latestCheckIn.height)
    : parseFloat(latestCheckIn.weight);

  const previousValue = previousCheckIn
    ? isHeight
      ? parseFloat(previousCheckIn.height)
      : parseFloat(previousCheckIn.weight)
    : latestValue; // if no previous, use same value so difference becomes 0

  const difference = latestValue - previousValue;
  const differenceArrow = difference < 0 ? "↓" : "↑";

  // Format the date from the latest check‑in
  const formattedDate = format(parseISO(latestCheckIn.date), "MMM d, yyyy");

  return (
    <div className={styles.statsCard}>
      <div className={styles.iconContainer}>{icon}</div>
      <div className={styles.statsContent}>
        <div className={styles.statsLabel}>{label}</div>
        <div className={styles.valueRow}>
          <div className={styles.valueText}>
            {latestValue}
            {isHeight ? " in" : " lbs"}
          </div>
          <div className={styles.differenceContainer}>
            <span className={styles.differenceArrow}>{differenceArrow}</span>
            {Math.abs(difference)}
            {isHeight ? " in" : " lbs"}
          </div>
        </div>
        <div className={styles.lastCheckInRow}>
          <div>{t("Last check in")}</div>
          <div className={styles.lastCheckInDate}>{formattedDate}</div>
        </div>
      </div>
    </div>
  );
};

const Growth = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { id: babyId } = router.query;

  const [data, setData] = useState([]);
  const [babyName, setBabyName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    date: new Date().toISOString().split("T")[0],
    height: "",
    weight: "",
    notes: "",
  });
  // editIndex is the index of the entry being edited
  const [editIndex, setEditIndex] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "descending",
  });
  const [validationErrors, setValidationErrors] = useState({
    height: false,
    weight: false,
  });

  useEffect(() => {
    // fetch growth data for the baby
    if (babyId) {
      fetchGrowthData(babyId).then((fetchedData) => {
        setData(fetchedData);
      });
    }
  }, [babyId]);

  useEffect(() => {
    if (babyId) {
      // Fetch baby info
      const fetchBabyInfo = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/v1/baby/${babyId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
          const data = await res.json();
          if (data.status === "ok") {
            setBabyName(data.data.first_name);
          }
        } catch (error) {
          console.error("Error fetching baby info:", error);
        }
      };

      fetchBabyInfo();
    }
  }, [babyId]);

  const handleShowModal = (index = null) => {
    if (index !== null) {
      // EDIT GROWTH RECORD => show MODAL to UPDATE
      const entry = data[index];
      setModalData({
        date: entry.date,
        height: entry.height.replace(" in", ""),
        weight: entry.weight.replace(" lbs", ""),
        notes: entry.notes,
      });
      setEditIndex(index);
    } else {
      // ADD GROWTH RECORD  => show MODAL to SAVE
      setModalData({
        date: new Date().toISOString().split("T")[0],
        height: "",
        weight: "",
        notes: "",
      });
      setEditIndex(null);
    }
    setShowModal(true);
  };

  // SAVE/UPDATE GROWTH RECORD
  const handleSave = async () => {
    const isHeightEmpty = !modalData.height;
    const isWeightEmpty = !modalData.weight;

    // Validate height and weight
    if (isHeightEmpty || isWeightEmpty) {
      setValidationErrors({ height: isHeightEmpty, weight: isWeightEmpty });
      return;
    }

    // Validate that height and weight are NUMBER(5,2)
    const isHeightValid = /^\d{1,3}(\.\d{1,2})?$/.test(modalData.height);
    const isWeightValid = /^\d{1,3}(\.\d{1,2})?$/.test(modalData.weight);

    if (!isHeightValid || !isWeightValid) {
      setValidationErrors({
        height: !isHeightValid,
        weight: !isWeightValid,
      });
      return;
    }

    const formattedDate = format(parseISO(modalData.date), "yyyy-MM-dd"); // format date to ISO before "T" in : 2025-01-31T05:00:00.000Z

    const sendingData = {
      date: formattedDate,
      height: modalData.height,
      weight: modalData.weight,
      notes: modalData.notes || "",
    };

    console.log(
      `data[editIndex]?.growth_id  : ${JSON.stringify(data[editIndex])}`,
    );

    if (editIndex !== null && !data[editIndex]?.growth_id) {
      console.error("Error: Missing growth_id in data[editIndex].");
    }

    // Save the updated entry to db
    const savedRecord = await saveGrowthRecord(
      babyId,
      sendingData,
      editIndex !== null, // isEdit: true if editing an existing record with editIndex
      data[editIndex]?.growth_id, // recordId
    );

    console.log("After saveGrowthRecord(), savedRecord:", savedRecord);

    // SHOWING THE UPDATED ENTRY
    if (savedRecord && savedRecord.growth_id) {
      const updatedEntry = {
        growth_id: savedRecord.growth_id,
        date: modalData.date, // Preserve the formatted date
        height: `${modalData.height}`,
        weight: `${modalData.weight}`,
        notes: modalData.notes || "",
      };

      // Save the updated entry (UI-ONLY, not to db)
      if (editIndex !== null) {
        const updatedData = [...data];
        updatedData[editIndex] = updatedEntry;
        setData(updatedData);
      } else {
        setData([updatedEntry, ...data]);
      }
    } else {
      console.error("Error: Missing growth_id in saved record.");
    }

    // Clear validation errors and close the modal
    setValidationErrors({ height: false, weight: false });
    setShowModal(false);
  };

  const handleDelete = async (index) => {
    // Delete the entry from db
    const recordId = data[index]?.growth_id;
    await deleteGrowthRecord(babyId, recordId);

    // Delete the entry (UI-ONLY, not to db)
    setData(data.filter((_, i) => i !== index));
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }

    const sortedData = [...data].sort((a, b) => {
      if (key === "date") {
        return direction === "ascending"
          ? parseISO(a[key]) - parseISO(b[key])
          : parseISO(b[key]) - parseISO(a[key]);
      }
      return direction === "ascending"
        ? a[key].localeCompare(b[key])
        : b[key].localeCompare(a[key]);
    });

    setSortConfig({ key, direction });
    setData(sortedData);
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? (
        <>
          <span style={{ color: "#b3a6d9", opacity: 0.5 }}>▲</span>
          <span style={{ color: "#6a5dcb" }}>▼</span>
        </>
      ) : (
        <>
          <span style={{ color: "#6a5dcb" }}>▲</span>
          <span style={{ color: "#b3a6d9", opacity: 0.5 }}>▼</span>
        </>
      );
    }
    return (
      <>
        <span style={{ color: "#b3a6d9", opacity: 0.5 }}>▲</span>
        <span style={{ color: "#b3a6d9", opacity: 0.5 }}>▼</span>
      </>
    );
  };

  const latestEntry = data[0] || {};
  const previousEntry = data[1] || {};

  // ---------------------------------------------------------------------------
  // RENDERING PAGE
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.growthContainer}>
      <h1 className={styles.heading}>
        {babyName ? `${babyName}'s height and weight` : "Height and weight"}
      </h1>
      {/* Measurement Cards */}
      <div className={styles.cardsRow}>
        {/* Height Stats Card */}
        <CustomStatsCard label={t("Height")} isHeight={true} checkIns={data} />

        {/* Weight Stats Card */}
        <CustomStatsCard label={t("Weight")} isHeight={false} checkIns={data} />
      </div>

      {/* Chart Header */}
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartHeaderText}>{t("Chart")}</h3>
          <p className={styles.chartSubtext}>
            {t("Check in is every month after the baby’s birthday")}
          </p>
        </div>
        <Button
          onClick={() => handleShowModal()}
          className={styles.addNewButton}
        >
          {t("Add New")}
        </Button>
      </div>

      {/* Table */}
      <Table hover className={styles.customTable}>
        <thead>
          <tr className={styles.tableHeadRow}>
            <th
              className={styles.tableHeadCell}
              onClick={() => handleSort("date")}
              style={{ cursor: "pointer" }}
            >
              {t("Date")} {renderSortIndicator("date")}
            </th>
            <th
              className={styles.tableHeadCell}
              onClick={() => handleSort("height")}
              style={{ cursor: "pointer" }}
            >
              {t("Height")} {renderSortIndicator("height")}
            </th>
            <th
              className={styles.tableHeadCell}
              onClick={() => handleSort("weight")}
              style={{ cursor: "pointer" }}
            >
              {t("Weight")} {renderSortIndicator("weight")}
            </th>
            <th className={styles.tableHeadCell}>{t("Notes")}</th>
            <th className={styles.tableHeadCell}>{t("Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {/* Growth data rows */}
          {Array.isArray(data) &&
            data?.map((row, index) => (
              <tr key={index}>
                <td className={styles.tableBodyCell}>
                  {row?.date
                    ? format(
                        new Date(
                          parseInt(row.date.split("-")[0]),
                          parseInt(row.date.split("-")[1]) - 1,
                          parseInt(row.date.split("-")[2]),
                        ).toString(),
                        "MMM d, yyyy",
                      )
                    : "--"}
                </td>
                <td className={styles.tableBodyCell}>
                  {row?.height ? `${row.height} in` : "--"}
                </td>
                <td className={styles.tableBodyCell}>
                  {row?.weight ? `${row.weight} lbs` : "--"}
                </td>
                <td className={styles.tableBodyCell}>
                  {(row && row.notes) || "No notes provided"}
                </td>
                <td className={styles.tableBodyCell}>
                  <Button
                    size="sm"
                    className={styles.editButton}
                    onClick={() => handleShowModal(index)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    size="sm"
                    className={styles.deleteButton}
                    onClick={() => handleDelete(index)}
                  >
                    <FaTrashAlt />
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editIndex !== null ? t("Edit Entry") : t("Add New Entry")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {validationErrors.height && (
            <Alert variant="danger">
              {t("Height is required and less than 999.99.")}
            </Alert>
          )}
          {validationErrors.weight && (
            <Alert variant="danger">
              {t("Weight is required and less than 999.99.")}
            </Alert>
          )}
          <div className="mb-3">
            <label>{t("Date")}</label>
            <input
              type="date"
              className="form-control"
              value={modalData.date}
              onChange={(e) =>
                setModalData({ ...modalData, date: e.target.value })
              }
            />
          </div>
          <div className="mb-3">
            <label>{t("Height")}</label>
            <input
              type="number"
              className="form-control"
              placeholder="Enter height (in inches)"
              value={modalData.height}
              onChange={(e) =>
                setModalData({ ...modalData, height: e.target.value })
              }
              style={{
                borderColor: validationErrors.height ? "red" : "",
              }}
            />
          </div>
          <div className="mb-3">
            <label>{t("Weight")}</label>
            <input
              type="number"
              className="form-control"
              placeholder="Enter weight (in lbs)"
              value={modalData.weight}
              onChange={(e) =>
                setModalData({ ...modalData, weight: e.target.value })
              }
              style={{
                borderColor: validationErrors.weight ? "red" : "",
              }}
            />
          </div>
          <div className="mb-3">
            <label>{t("Notes")}</label>
            <textarea
              className="form-control"
              placeholder="Add a note (e.g., Example note: Monthly check-up)"
              value={modalData.notes}
              onChange={(e) =>
                setModalData({ ...modalData, notes: e.target.value })
              }
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            {t("Cancel")}
          </Button>
          <Button className={styles.button} onClick={handleSave}>
            {t("Save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Growth;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
