import React, { useState, useEffect } from "react";
import styles from "./medicalProfessional.module.css";
import Image from "next/image";
import BabyListModal from "@/components/BabyListModal/BabyListModal";
import SendDocumentsModal from "@/components/SendDocumentsModal/SendDocumentModal";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function MedicalProfessional() {
  const { t } = useTranslation("common");
  const [medicalProfessional, setMedicalProfessional] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [babies, setBabies] = useState([]);
  const [assignedBabies, setAssignedBabies] = useState({});
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [files, setFiles] = useState([]);

  // States for getting send files from parent to a doctor for a baby
  const [showSendModal, setShowSendModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);

  useEffect(() => {
    const fetchMedicalProfessional = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/medical-professional`,
      );
      const data = await res.json();
      if (data.status === "ok") {
        setMedicalProfessional(data.medicalProfessional);
      }
    };

    const fetchBabies = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/babies`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const data = await res.json();
        if (res.ok) {
          // Direct access to the babies array
          setBabies(data.babies);
        } else {
          console.error("Failed to fetch baby profiles:", data);
        }
      } catch (error) {
        console.error("Error fetching baby profiles:", error);
      }
    };

    fetchMedicalProfessional();
    fetchBabies();
  }, []);

  useEffect(() => {
    const fetchAssignedBabies = async (doctor_id) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/medical-professional/${doctor_id}/getAssignedBabiesToDoctor`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const data = await res.json();
        if (data.status === "ok") {
          setAssignedBabies((prev) => ({
            ...prev,
            [doctor_id]: data.babies,
          }));
        } else {
          console.log("Failed to fetch assigned babies:", data);
        }
      } catch (error) {
        console.error("Error fetching assigned babies:", error);
      }
    };
    medicalProfessional.forEach((doctor) => {
      fetchAssignedBabies(doctor.user_id);
    });
  }, [medicalProfessional]);

  const handleConnectClick = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  const handleSelectBaby = async (baby) => {
    setShowModal(false);
    console.log(selectedDoctor);
    // Send baby info to the doctor
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/medical-professional/${selectedDoctor.user_id}/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          baby_id: baby.baby_id,
          doctor_id: selectedDoctor.user_id,
        }),
      },
    );

    const data = await res.json();
    if (data.status === "ok") {
      alert("Baby assigned to doctor successfully");
    } else {
      alert("Failed to assign baby to doctor");
    }
  };

  const getFiles = async (babyId, doctorId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/parent/${localStorage.getItem(
          "userId",
        )}/doctors/${doctorId}/babies/${babyId}/getFiles`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();
      if (data.status === "ok") {
        setFiles(data.files);
        setShowFilesModal(true);
      } else {
        setFiles([]);
        setShowFilesModal(true);
        console.error("Failed to fetch files:", data);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const getSentFiles = async (babyId, doctorId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/parent/${localStorage.getItem(
          "userId",
        )}/babies/${babyId}/doctors/${doctorId}/getSentFiles`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await res.json();
      if (data.status === "ok") {
        setDocuments(data.files);
        setSelectedBaby(babyId);
        setSelectedDoctor(doctorId);
        setShowSendModal(true);
      } else {
        setDocuments([]);
        setSelectedBaby(babyId);
        setSelectedDoctor(doctorId);
        setShowSendModal(true);
        console.error("Failed to fetch sent files:", data);
      }
    } catch (error) {
      console.log("Error sending files:", error);
    }
  };

  const sendNewDocument = async (file) => {
    const formData = new FormData();
    formData.append("document", file);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/parent/${localStorage.getItem(
          "userId",
        )}/babies/${selectedBaby}/doctors/${selectedDoctor}/uploadFile`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );
      const data = await res.json();
      if (data.status === "ok") {
        alert("File sent successfully");
        setShowSendModal(false);
      } else {
        alert("Failed to send file");
      }
    } catch (error) {
      console.error("Error sending file:", error.message);
    }
  };

  return (
    <div className={styles.container}>
      {medicalProfessional && (
        <div>
          {medicalProfessional.map((medicalProfessional) => (
            <div
              className={styles.profileCard}
              key={medicalProfessional.user_id}
            >
              <div className={styles.profileHeader}>
                <Image
                  className={styles.profileImage}
                  src={"/doctor.jpg"}
                  width={200}
                  height={200}
                  alt="profile"
                />
                <h2>
                  Dr. {medicalProfessional.first_name}{" "}
                  {medicalProfessional.last_name}
                </h2>
                <p className={styles.specialization}>
                  {t(medicalProfessional.role)}
                </p>
              </div>
              <div className={styles.profileContact}>
                <p className={styles.email}>{medicalProfessional.email}</p>
              </div>
              <div className={styles.profileActions}>
                <button
                  className={styles.button}
                  onClick={() => handleConnectClick(medicalProfessional)}
                >
                  {t("Connect")}
                </button>
              </div>
              <div className={styles.babyList}>
                <h3>{t("Assigned Babies")}</h3>
                {console.log("assignedBabies", medicalProfessional)}
                {assignedBabies[medicalProfessional.user_id] ? (
                  assignedBabies[medicalProfessional.user_id].length > 0 ? (
                    assignedBabies[medicalProfessional.user_id].map((baby) => (
                      <div key={baby.baby_id} className={styles.assignedBabies}>
                        <p className={styles.babyName}>
                          {t("Baby")}: {baby.baby_name}
                        </p>
                        <button
                          className={styles.button}
                          onClick={() =>
                            getFiles(baby.baby_id, medicalProfessional.user_id)
                          }
                        >
                          {t("Health Documents")}
                        </button>

                        <button
                          className={styles.button}
                          onClick={() =>
                            getSentFiles(
                              baby.baby_id,
                              medicalProfessional.user_id,
                            )
                          }
                        >
                          {t("Send Documents")}
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>{t("No assigned babies")}</p>
                  )
                ) : (
                  <p>{t("No assigned babies")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BabyListModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        babies={babies}
        onSelectBaby={handleSelectBaby}
      />

      <SendDocumentsModal
        show={showFilesModal}
        handleClose={() => setShowFilesModal(false)}
        documents={files}
        onSendNewDocument={() => console.log("Send new document")}
        purpose="getSentFilesFromDoctor"
      />

      <SendDocumentsModal
        show={showSendModal}
        handleClose={() => setShowSendModal(false)}
        documents={documents}
        onSendNewDocument={sendNewDocument}
        purpose="getSentFilesFromParent"
      />
    </div>
  );
}

export default MedicalProfessional;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
