import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import styles from "./SendDocumentsModal.module.css";

const SendDocumentsModal = ({
  show,
  handleClose,
  documents,
  onSendNewDocument,
  purpose,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSendFile = () => {
    if (selectedFile) {
      onSendNewDocument(selectedFile);
    } else {
      alert("Please select a file to send.");
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/documents/${documentId}/download`,
        {
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

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
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
      <Modal.Header closeButton className={styles.modalHeader}>
        {purpose === "getSentFilesFromParent" ? (
          <div>
            <Modal.Title>Sending Documents</Modal.Title>
            <p className={styles.modalNote}>
              Here you can view the documents already sent and send new ones.
            </p>
          </div>
        ) : (
          <div>
            <Modal.Title>Get Documents</Modal.Title>
            <p className={styles.modalNote}>
              Here you can view the documents already sent by doctor for your
              baby.
            </p>
          </div>
        )}
      </Modal.Header>

      <Modal.Body>
        {purpose === "getSentFilesFromParent" && (
          <Form.Group controlId="formFile" className="mt-3 mb-3">
            <Form.Label>Select a file to send</Form.Label>
            <Form.Control
              type="file"
              name="document"
              onChange={handleFileChange}
              accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
          </Form.Group>
        )}

        {documents.length > 0 ? (
          <ul className={styles.fileList}>
            {documents.map((doc) => (
              <li key={doc.document_id} className={styles.fileItem}>
                <p className={styles.fileName}>{doc.filename}</p>
                <Button
                  varient="link"
                  className={styles.downloadLink}
                  onClick={() => handleDownload(doc.document_id, doc.filename)}
                >
                  Download
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No documents available</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        {purpose === "getSentFilesFromParent" ? (
          <div>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button className={styles.sendButton} onClick={handleSendFile}>
              Send File
            </Button>
          </div>
        ) : (
          <div>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SendDocumentsModal;
