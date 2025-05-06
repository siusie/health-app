// server/src/routes/api/baby/reminders/postReminder.js
// Fix time format handling in the API endpoint

const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const { getUserId } = require('../../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

module.exports.createReminder = async (req, res) => {
  const { babyId } = req.params;
  const { title, time, date, notes, isActive, nextReminder, reminderIn } = req.body;

  logger.info(`Creating reminder for babyId: ${babyId}`);
  logger.info(`Received time value: ${time}`);

  // Validate babyId format
  const numericBabyId = parseInt(babyId, 10);
  logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
  if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
    logger.info(`Invalid babyId format: ${babyId}`);
    return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
  }

  // Validate required fields
  if (!title || !time || !date) {
    logger.info(`Missing required fields. title=${title}, time=${time}, date=${date}`);
    return res.status(400).json(createErrorResponse(400, 'Missing required reminder data (title, time, date)'));
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

    // Validate and format the time
    let formattedTime = time;
    
    // Check if the time already includes AM/PM
    if (time && !(/\s(AM|PM)$/i.test(time))) {
      // If not, check if we have information about AM/PM from client
      const amPm = req.body.amPm;
      if (amPm) {
        formattedTime = `${time} ${amPm}`;
        logger.info(`Appended AM/PM to time: ${formattedTime}`);
      }
    }
    
    logger.info(`Final formatted time: ${formattedTime}`);

    // Insert the reminder into the database
    const insertQuery = `
      INSERT INTO reminders (baby_id, title, time, date, notes, is_active, next_reminder, reminder_in)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      numericBabyId,
      title,
      formattedTime || null,
      date,
      notes || null,
      isActive !== undefined ? isActive : true,
      nextReminder || false,
      reminderIn || null
    ]);

    const newReminder = result.rows[0];
    logger.info(`Created reminder with ID=${newReminder.reminder_id} for babyId=${babyId}`);

    // Return success response
    return res.status(201).json(createSuccessResponse(newReminder));

  } catch (error) {
    logger.error(error, `ERROR in POST /baby/${babyId}/reminders`);
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};