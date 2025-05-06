// components/BackButton.js
import React from "react";
import { Button } from "react-bootstrap";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const BackButton = () => {
  const { t } = useTranslation("common");
  const router = useRouter();

  return (
    <div style={{ margin: "1rem" }}>
      <Button variant="outline-secondary" onClick={() => router.back()}>
        {t("Go Back")}
      </Button>
    </div>
  );
};

export default BackButton;
