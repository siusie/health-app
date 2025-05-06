// server/src/routes/api/reminders/putReminder.js
// Route for PUT /baby/:babyId/reminders/:reminderId
// Update an existing reminder for a specific baby

const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const { getUserId } = require('../../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

module.exports.updateReminder = async (req, res) => {
  const { babyId, reminderId } = req.params;
  const { title, time, date, notes, isActive, nextReminder, reminderIn } = req.body;

  logger.info(`Updating reminder ID=${reminderId} for babyId=${babyId}`);

  // Validate babyId format
  const numericBabyId = parseInt(babyId, 10);
  logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
  if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
    logger.info(`Invalid babyId format: ${babyId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
  }

  // Validate reminderId format
  const numericReminderId = parseInt(reminderId, 10);
  logger.info(`Parsed reminderId=${reminderId} to numericReminderId=${numericReminderId}`);
  if (!/^\d+$/.test(reminderId) || Number.isNaN(numericReminderId) || numericReminderId < 1) {
    logger.info(`Invalid reminderId format: ${reminderId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid reminderId format'));
  }

  try {
    // Get user ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error("No authorization header found");
      return res.status(401).json(createErrorResponse(401, "No authorization token provided"));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, "User not found"));
    }

       // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby
    const hasBabyAccess = await checkBabyBelongsToUser(numericBabyId, userId);
    if (!hasBabyAccess) {
      return res.status(403).json(createErrorResponse(403, "Access denied: Baby does not belong to current user"));
    }

    // Check if the reminder exists for this baby
    const reminderCheck = await pool.query(
      'SELECT * FROM reminders WHERE reminder_id = $1 AND baby_id = $2',
      [numericReminderId, numericBabyId]
    );

    if (reminderCheck.rows.length === 0) {
      logger.info(`No reminder found with ID=${reminderId} for babyId=${babyId}`);
      return res.status(404).json(createErrorResponse(404, 'Reminder not found'));
    }

    // Update reminder using COALESCE for partial updates
    const updateQuery = `
      UPDATE reminders
      SET title = COALESCE($1, title),
          time = COALESCE($2, time),
          date = COALESCE($3, date),
          notes = COALESCE($4, notes),
          is_active = COALESCE($5, is_active),
          next_reminder = COALESCE($6, next_reminder),
          reminder_in = COALESCE($7, reminder_in),
          updated_at = CURRENT_TIMESTAMP
      WHERE reminder_id = $8 AND baby_id = $9
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [
      title,
      time,
      date,
      notes,
      isActive,
      nextReminder,
      reminderIn,
      numericReminderId,
      numericBabyId
    ]);

    const updatedReminder = updateResult.rows[0];
    logger.info(`Updated reminder ID=${reminderId} for babyId=${babyId}`);

    return res.status(200).json(createSuccessResponse(updatedReminder));

  } catch (error) {
    logger.error(error, `ERROR in PUT /baby/${babyId}/reminders/${reminderId}`);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
