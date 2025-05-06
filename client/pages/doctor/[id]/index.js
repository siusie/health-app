// pages/doctor/[id]/index.js
import React, { useState, useEffect } from "react";
import { FaUserMd, FaSearch } from "react-icons/fa";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { format } from "date-fns";
import { useRouter } from "next/router";
import styles from "./doctor.module.css";

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const DoctorDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("vitals");
  const [healthRecords, setHealthRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Check if user is authenticated and is a medical professional
    // userRole and userId were set in register/index.js
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");

    if (!userId || userRole !== "Medical Professional") {
      router.push("/login");
      return;
    }

    const fetchBabyHealthRecords = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/doctor/${localStorage.userId}/healthRecords`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.token}`,
          },
        },
      );

      const data = await res.json();
      if (data.status === "ok") {
        setHealthRecords(data.combinedData);
      }
    };

    fetchBabyHealthRecords();
  }, [router]);

  const vitalData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Blood Pressure",
        data: [120, 125, 118, 122, 119],
        borderColor: "#3B82F6",
        tension: 0.4,
      },
    ],
  };

  const medicalHistoryData = {
    labels: ["Cardiovascular", "Respiratory", "Neurological"],
    datasets: [
      {
        data: [30, 40, 30],
        backgroundColor: ["#3B82F6", "#34D399", "#F87171"],
      },
    ],
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaUserMd className={styles.icon} />
          <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        </div>
      </div>

      <div className={styles.content}>
        {/* Overview Cards */}
        <div className={styles.overviewCard}>
          <div className={styles.card}>
            <h3 className="text-lg font-semibold mb-2">Recent Babies</h3>
            <p className={`${styles.value} ${styles.value1}`}>
              {healthRecords.length}
            </p>
          </div>
          <div className={styles.card}>
            <h3 className="text-lg font-semibold mb-2">
              Upcoming Appointments
            </h3>
            <p className={`${styles.value} ${styles.value2}`}>8</p>
          </div>
          <div className={styles.card}>
            <h3 className="text-lg font-semibold mb-2">Critical Alerts</h3>
            <p className={`${styles.value} ${styles.value3}`}>3</p>
          </div>
        </div>

        <div className={styles.mainContent}>
          {/* Patient List */}
          <div className={styles.patientList}>
            <div className={styles.patientListHeader}>
              <h2 className="text-lg font-bold">Baby Directory</h2>
              <div className={styles.searchBar}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search babies..."
                  className="pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Last Consultation</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {healthRecords &&
                    healthRecords.map((patient) => (
                      <tr key={patient.record_id} className={styles.tableRow}>
                        <td>
                          {patient.first_name} {patient.last_name}
                        </td>
                        <td>{format(new Date(patient.date), "yyyy-MM-dd")}</td>
                        <td>
                          <span
                            className={`${styles.status} ${
                              patient.status === "Critical"
                                ? styles.statusCritical
                                : patient.status === "Stable"
                                ? styles.statusStable
                                : styles.statusReview
                            }`}
                          >
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Medical Data Panel */}
          <div className={styles.medicalHistoryData}>
            <div>
              <button
                onClick={() => setActiveTab("vitals")}
                className={`px-4 py-2 rounded-md ${
                  activeTab === "vitals"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                Vitals
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-md ${
                  activeTab === "history"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                History
              </button>
            </div>

            {activeTab === "vitals" ? (
              <div className="h-64">
                <Line
                  data={vitalData}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            ) : (
              <div className="h-64">
                <Pie
                  data={medicalHistoryData}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
