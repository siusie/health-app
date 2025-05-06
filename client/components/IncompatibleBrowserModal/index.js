/**
 * This modal is shown when the user's browser (Firefox) is not compatible with the speech recognition feature.
 * It provides instructions on how to enable speech recognition in Firefox.
 */
import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import styles from "./incompatibleBrowserModal.module.css";

const IncompatibleBrowserModal = ({ show, onHide }) => {
  const { t } = useTranslation("common");

  return (
    <div className={show ? styles.modalOverlay : ""}>
      <Modal
        show={show}
        onHide={onHide}
        centered
        dialogClassName={styles.modalContent}
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("Browser Configuration Required")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{t("To use speech recognition in Firefox:")}</p>
          <ol style={{ textAlign: "left" }}>
            <li>
              {t("Type")} <strong>about:config</strong>{" "}
              {t("in your address bar")}
            </li>
            <li>{t("Accept the warning")}</li>
            <li>
              {t("Search for")}{" "}
              <strong>media.webspeech.recognition.enable</strong>
            </li>
            <li>
              {t("Set it to")} <strong>true</strong>
            </li>
            <li>{t("Restart Firefox")}</li>
          </ol>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-primary"
            onClick={onHide}
            className={styles.closeButton}
          >
            {t("Close")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default IncompatibleBrowserModal;
