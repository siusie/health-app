import React, { useEffect, useState } from "react";
import styles from "./BabiesModal.module.css";
import { Modal, Button } from "react-bootstrap";

function BabiesModal({
  show,
  handleClose,
  babies,
  onSendDocument,
  onReceiveDocument,
  parentId,
}) {
  // const [babiesWithNames, setBabiesWithNames] = useState([]);
  // useEffect(() => {
  //   const fetchBabies = async () => {
  //     try {
  //       // Fetch baby details for each baby_id
  //       const babiesWithNames = await Promise.all(
  //         babies.map(async (baby) => {
  //           const babyDetailsResponse = await fetch(
  //             `${
  //               process.env.NEXT_PUBLIC_API_URL
  //             }/v1/doctor/${localStorage.getItem("userId")}/baby/${
  //               baby.baby_id
  //             }/profile`,
  //             {
  //               headers: {
  //                 Authorization: `Bearer ${localStorage.getItem("token")}`,
  //               },
  //             },
  //           );

  //           const babyDetails = await babyDetailsResponse.json();
  //           if (babyDetails.status !== "ok") {
  //             throw new Error("Error fetching baby details");
  //           }
  //           return {
  //             ...baby,
  //             parent_id: parentId,
  //             baby_name:
  //               babyDetails.data.first_name + " " + babyDetails.data.last_name,
  //           };
  //         }),
  //       );
  //       setBabiesWithNames(babiesWithNames);
  //     } catch (error) {
  //       console.error("Error fetching babies:", error);
  //     }
  //   };
  //   // fetchBabies();
  // }, [babies, parentId]);
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Babies</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {console.log("BabiesModal babies:", babies)}
        {babies.length > 0 ? (
          <ul>
            {babies.map((baby) => (
              <li key={baby.baby_id} className={styles.babyItem}>
                <p className={styles.babyName}>Baby: {baby.baby_name}</p>
                <Button
                  variant="primary"
                  onClick={() =>
                    onSendDocument(baby.baby_id, baby.parent_id, "send")
                  }
                  className={styles.actionButton}
                >
                  Send Document
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    onReceiveDocument(baby.baby_id, baby.parent_id, "receive")
                  }
                  className={styles.actionButton}
                >
                  Receive Document
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No babies found.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BabiesModal;
