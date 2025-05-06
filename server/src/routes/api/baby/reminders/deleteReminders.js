// server/src/routes/api/reminders/deleteReminder.js
// Route for DELETE /baby/:babyId/reminders
// Delete one or multiple reminders for a specific baby

const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const { getUserId } = require('../../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

module.exports.deleteReminders = async (req, res) => {
  const { babyId } = req.params;
  const { reminderId, reminderIds } = req.body;

  // Determine if it's a single or bulk deletion request
  let idsToDelete = [];

  if (reminderId) {
    // Single deletion
    idsToDelete = [reminderId];
    logger.info(`Deleting single reminder ID=${reminderId} for babyId=${babyId}`);
  } else if (reminderIds && Array.isArray(reminderIds)) {
    // Bulk deletion
    idsToDelete = reminderIds;
    logger.info(`Bulk deleting reminders (${reminderIds.join(', ')}) for babyId=${babyId}`);
  } else {
    logger.info('No valid reminder IDs provided for deletion');
    return res.status(400).json(createErrorResponse(400, 'Please provide either reminderId or reminderIds array'));
  }

  if (idsToDelete.length === 0) {
    logger.info('Empty reminderIds array provided');
    return res.status(400).json(createErrorResponse(400, 'No reminder IDs provided for deletion'));
  }

  // Validate babyId format
  const numericBabyId = parseInt(babyId, 10);
  logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
  if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
    logger.info(`Invalid babyId format: ${babyId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
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

    // Convert all reminderIds to integers
    const numericReminderIds = idsToDelete.map(id => parseInt(id, 10));

    // Verify all IDs are valid integers
    if (numericReminderIds.some(id => Number.isNaN(id) || id < 1)) {
      logger.info('One or more invalid reminder ID formats');
      return res.status(400).json(createErrorResponse(400, 'One or more invalid reminder ID formats'));
    }

    // Delete the reminders
    const result = await pool.query(
      'DELETE FROM reminders WHERE reminder_id = ANY($1) AND baby_id = $2 RETURNING reminder_id',
      [numericReminderIds, numericBabyId]
    );

    const deletedCount = result.rowCount;
    const deletedIds = result.rows.map(row => row.reminder_id);

    logger.info(`Deleted ${deletedCount} reminders for babyId=${babyId}`);

    if (deletedCount === 0) {
      return res.status(404).json(createErrorResponse(404, 'No matching reminders found'));
    }

    // Compose response message based on number of deleted items
    const message = deletedCount === 1
      ? 'Reminder deleted successfully'
      : `${deletedCount} reminders deleted successfully`;

    return res.status(200).json(createSuccessResponse({
      message,
      deletedIds
    }));

  } catch (error) {
    logger.error(error, `ERROR in DELETE /baby/${babyId}/reminders`);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};
