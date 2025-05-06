// client\pages\baby\[id]\reminders\index.js
import { Container } from "react-bootstrap";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styles from "./reminders.module.css";

// Context Provider
import {
  ReminderProvider,
  useReminders,
} from "../../../../context/ReminderContext";

// Components
import Header from "../../../../components/Reminders/Header";
import NextReminderBanner from "../../../../components/Reminders/NextReminderBanner";
import RemindersTable from "../../../../components/Reminders/ReminderTable";
import EmptyState from "../../../../components/Reminders/EmptyState";
import ToastMessage from "../../../../components/Reminders/ToastMessage";
import LoadingError from "../../../../components/Reminders/LoadingError";
import AddReminderModal from "../../../../components/Reminders/AddReminderModal";
import EditReminderModal from "../../../../components/Reminders/EditReminderModal";
import DeleteReminderModal from "../../../../components/Reminders/DeleteReminderModal";

const RemindersPageContent = () => {
  const { reminders, loading, error } = useReminders();

  // Loading or error state
  if (loading || error) {
    return <LoadingError />;
  }

  // Empty state
  if (reminders.length === 0) {
    return (
      <>
        <ToastMessage />
        <Header />
        <EmptyState />
        <AddReminderModal />
      </>
    );
  }

  // Main content with reminders
  return (
    <>
      <ToastMessage />
      <Header />
      <NextReminderBanner />
      <RemindersTable />
      <AddReminderModal />
      <EditReminderModal />
      <DeleteReminderModal />
    </>
  );
};

const RemindersPage = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className={styles.container}>
      <ReminderProvider babyId={id}>
        <RemindersPageContent />
      </ReminderProvider>
    </div>
  );
};

export default RemindersPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
