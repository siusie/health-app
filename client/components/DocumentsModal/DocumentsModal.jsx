import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import styles from "./DocumentsModal.module.css";

function DocumentsModal({
  show,
  handleClose,
  documents,
  babyId,
  purpose,
  parentId,
}) {
  console.log("DocumentModal documents:", documents);
  const [selectedFile, setSelectedFile] = useState(null);
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSendNewDocument = async (file, babyId, parentId) => {
    const formData = new FormData();
    formData.append("document", file);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/doctor/${localStorage.getItem(
          "userId",
        )}/babies/${babyId}/parent/${parentId}/uploadFile`,
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
        alert("File sent successfully!");
        handleClose(); // Close the modal after sending the file
      } else {
        alert("Failed to send file. Please try again.");
      }
    } catch (error) {
      console.error("Error sending document:", error);
      alert("An error occurred while sending the document.");
    }
  };

  const handleSendFile = async () => {
    if (selectedFile) {
      handleSendNewDocument(selectedFile, babyId, parentId); // Assuming documents[0] has parent_id
    } else {
      alert("Please select a file to send.");
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/documents/${documentId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      dialogClassName="modal-dialog-scrollable"
    >
      <Modal.Header closeButton>
        {purpose === "send" ? (
          <div>
            <Modal.Title>Send health documents to baby</Modal.Title>
            <p>
              You can see the sent documents as well as send a new one to baby
            </p>
          </div>
        ) : (
          <div>
            <Modal.Title>
              Receive health documents from parent to baby
            </Modal.Title>
            <p>You can see the baby documents sent from parent</p>
          </div>
        )}
      </Modal.Header>
      <Modal.Body>
        {documents.length > 0 ? (
          <ul className={styles.documentList}>
            {documents.map((doc) => (
              <li key={doc.document_id} className={styles.documentItem}>
                <p className={styles.fileName}>File name: {doc.filename}</p>
                <Button
                  variant="link"
                  onClick={() => handleDownload(doc.document_id, doc.filename)}
                  className={styles.downloadButton}
                >
                  Download
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No documents available for this baby.</p>
        )}
        {purpose === "send" && (
          <Form.Group controlId="formFile" className="mt-3">
            <Form.Label>Select a file to send</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        {purpose === "send" && (
          <Button className={styles.sendButton} onClick={handleSendFile}>
            Send Document
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default DocumentsModal;
