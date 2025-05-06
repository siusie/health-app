import React from "react";
import { Modal, Button, ListGroup } from "react-bootstrap";
import { useTranslation } from "next-i18next";

function BabyListModal({ show, handleClose, babies, onSelectBaby }) {
  const { t } = useTranslation("common");

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{t("Select a baby")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup>
          {babies.map((baby) => (
            <ListGroup.Item
              key={baby.baby_id}
              action
              onClick={() => onSelectBaby(baby)}
            >
              {baby.first_name} {baby.last_name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          {t("Close")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BabyListModal;
