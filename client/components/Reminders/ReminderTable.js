import { Form } from "react-bootstrap";
import { useTranslation } from "next-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { useReminders } from "../../context/ReminderContext";
import {
  formatDay,
  formatTime12h,
  groupRemindersByDate,
} from "../../utils/reminderUtil";
import styles from "../../pages/baby/[id]/reminders/reminders.module.css";

const RemindersTable = () => {
  const { t } = useTranslation("common");
  const {
    reminders,
    deleteMode,
    toggleReminderSelection,
    handleShowEditModal,
    handleToggleReminderActive,
  } = useReminders();

  const groupedReminders = groupRemindersByDate(reminders);
  return (
    <>
      {Object.keys(groupedReminders).map((dateStr) => {
        const { date, dateText, isToday } = formatDay(dateStr);
        const dateReminders = groupedReminders[dateStr];

        return (
          <div key={dateStr} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <div className={styles.dayInfo}>
                {isToday ? (
                  <div className={styles.dateCircle}>{date}</div>
                ) : (
                  <div className={styles.dateNoCircle}>{date}</div>
                )}
                <div className={styles.dateText}>{dateText}</div>
              </div>
              {isToday && (
                <div className={styles.dayHeaderRight}>
                  <span className={styles.todayMeals}>{t("Today")}</span>
                </div>
              )}
            </div>

            <table className={styles.mealsTable}>
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>{t("Title")}</th>
                  <th style={{ width: "15%" }}>{t("Time")}</th>
                  <th style={{ width: "40%" }}>{t("Notes")}</th>
                  <th style={{ width: "15%" }}></th>
                </tr>
              </thead>
              <tbody>
                {dateReminders.map((reminder) => (
                  <tr key={reminder.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {deleteMode && (
                          <div
                            className={`${styles.reminderCheckbox} ${
                              reminder.selected ? styles.checked : ""
                            }`}
                            onClick={() => toggleReminderSelection(reminder.id)}
                          ></div>
                        )}
                        {reminder.title}
                      </div>
                    </td>
                    <td>{formatTime12h(reminder.time)}</td>
                    <td>{reminder.note}</td>
                    <td className={styles.actionCell}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleShowEditModal(reminder)}
                      >
                        <FontAwesomeIcon icon={faPencilAlt} />
                      </button>
                      <Form.Check
                        type="switch"
                        id={`reminder-switch-${reminder.id}`}
                        checked={reminder.isActive}
                        onChange={() => handleToggleReminderActive(reminder.id)}
                        className={styles.reminderSwitch}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
};

export default RemindersTable;
