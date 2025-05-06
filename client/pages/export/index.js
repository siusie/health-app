// client/pages/[export]/index.js
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./export.module.css";
import { Container } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const ExportDataPage = () => {
  const { t } = useTranslation("common");

  const [selectedOptions, setSelectedOptions] = useState({
    babyInfo: true,
    growthRecords: true,
    milestones: true,
    feedingSchedule: true,
    stoolRecords: true,
  });
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [error, setError] = useState(""); // DISPLAY ERROR TO USER
  const [downloadLink, setDownloadLink] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  // Choose API endpoint based on export format
  const endpoint = exportFormat === "pdf" ? "/v1/export/pdf" : "/v1/export/csv";

  // Fetch user info to set default start date
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        if (res.ok && data && data.created_at) {
          setStartDate(new Date(data.created_at));
        } else {
          console.error("Failed to fetch profile:", data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }
    fetchProfile();
  }, []);

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedOptions((prev) => ({ ...prev, [name]: checked }));
  };

  const validateData = () => {
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return false;
    }
    return true;
  };

  const handleExport = async () => {
    setError("");
    if (!validateData()) return;

    // Build query parameters for the backend request
    const queryParams = new URLSearchParams({
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      babyInfo: selectedOptions.babyInfo,
      growthRecords: selectedOptions.growthRecords,
      milestones: selectedOptions.milestones,
      feedingSchedule: selectedOptions.feedingSchedule,
      stoolRecords: selectedOptions.stoolRecords,
    });

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }${endpoint}?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      // error	Object { code: 404, message: "No baby profiles found for this user" }
      if (!response.ok) {
        // Extract error message from response and SHOW ERROR TO USER
        const errorData = await response.json();
        console.log("Error response:", errorData);

        let errorMessage = "Export failed. Please try again later.";
        if (errorData.error.message) {
          errorMessage = "Export failed: " + errorData.error.message;
        }

        console.error(errorMessage);

        setError(errorMessage);
        return;
      }

      // Parse the filename from the header "exportfilename"
      const disposition = response.headers.get("exportfilename");
      let filename = exportFormat === "pdf" ? "download.pdf" : "download.csv";
      if (disposition) {
        filename = disposition;
      }
      setDownloadFileName(filename);

      // Convert the response to a blob and generate a download URL
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob); // Create a URL for the blob
      setDownloadLink(url);
      setModalVisible(true);
    } catch (error) {
      console.error("Export error:", error);
      setError("There was an error exporting the data.");
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    window.URL.revokeObjectURL(downloadLink);
    setDownloadLink("");
    setDownloadFileName("");
  };

  return (
    <Container className={styles.container}>
      <div className={styles.header}>
        <h1>Export Baby Health Data</h1>
        <div className="card p-4 mt-4">
          {/* Select Types of Data to Export */}
          <h4>Select Data to Export</h4>
          {Object.keys(selectedOptions).map((option) => (
            <div className="form-check" key={option}>
              <input
                className="form-check-input"
                type="checkbox"
                id={option}
                name={option}
                checked={selectedOptions[option]}
                onChange={handleCheckboxChange}
              />
              <label className="form-check-label" htmlFor={option}>
                {option === "babyInfo" && "Baby Information"}
                {option === "growthRecords" && "Growth Records"}
                {option === "milestones" && "Milestones Information"}
                {option === "feedingSchedule" && "Feeding Schedule"}
                {option === "stoolRecords" && "Stool Records"}
              </label>
            </div>
          ))}
          <hr />

          {/* Select Export Format */}
          <h4>Select Export Format</h4>
          <div className="form-check">
            <input
              type="radio"
              id="csv"
              name="exportFormat"
              value="csv"
              checked={exportFormat === "csv"}
              onChange={(e) => setExportFormat(e.target.value)}
              className="form-check-input"
            />
            <label htmlFor="csv" className="form-check-label">
              CSV
            </label>
          </div>
          <div className="form-check">
            <input
              type="radio"
              id="pdf"
              name="exportFormat"
              value="pdf"
              checked={exportFormat === "pdf"}
              onChange={(e) => setExportFormat(e.target.value)}
              className="form-check-input"
            />
            <label htmlFor="pdf" className="form-check-label">
              PDF
            </label>
          </div>
          <hr />

          {/* Enter Dates */}
          <h4>Enter Dates</h4>
          <div className="row">
            <div className="col-md-6">
              <label>Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div className="col-md-6">
              <label>End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                maxDate={new Date()}
              />
            </div>
          </div>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          <button className={styles.button} onClick={handleExport}>
            Export Data
          </button>
        </div>

        {/* Modal to show download link */}
        {modalVisible && (
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
          >
            <div className="modal-dialog" style={{ zIndex: 1050 }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Export Successful</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Your export {exportFormat.toUpperCase()} is ready.</p>
                  <a href={downloadLink} download={downloadFileName}>
                    Download {exportFormat.toUpperCase()}
                  </a>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
            <div
              className="modal-backdrop fade show"
              style={{ zIndex: 1040 }}
            ></div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default ExportDataPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
