// server/src/routes/api/baby/reminders/getReminders.js
const logger = require('../../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const { getUserId } = require('../../../../utils/userIdHelper');
const { checkBabyBelongsToUser } = require('../../../../utils/babyAccessHelper');

module.exports.getReminders = async (req, res) => {
  try {
    const { babyId } = req.params;
    const { upcoming } = req.query; // Add this to check if we want upcoming reminders
    logger.info(`Fetching reminders for babyId: ${babyId}, upcoming: ${upcoming}`);

    // Validate babyId format
    const numericBabyId = parseInt(babyId, 10);
    logger.info(`Parsed babyId=${babyId} to numericBabyId=${numericBabyId}`);
    if (!/^\d+$/.test(babyId) || Number.isNaN(numericBabyId) || numericBabyId < 1) {
      logger.info(`Invalid babyId format: ${babyId}`);
      return res.status(400).json(createErrorResponse(400, 'Invalid babyId format'));
    }

    // Get user ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header found');
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));  
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, 'User not found')); 
    }
    
   // {CHECK OWNERSHIP of BABY}
    // Verify user has access to this baby  
    const hasBabyAccess = await checkBabyBelongsToUser(numericBabyId, userId);
    if (!hasBabyAccess) {
      return res
        .status(403)
        .json(createErrorResponse(403, 'Access denied: Baby does not belong to current user')); 
    }

    // Use different queries based on whether we want upcoming reminders
    const query = upcoming
      ? `SELECT 
          reminder_id,
          baby_id,
          title,
          time,
          TO_CHAR(date, 'YYYY-MM-DD') AS date,
          notes,
          is_active,
          next_reminder,
          reminder_in,
          created_at,
          updated_at,
          'reminder' as type
        FROM reminders 
        WHERE baby_id = $1 
          AND date >= CURRENT_DATE
          AND is_active = true
        ORDER BY date ASC, time ASC
        LIMIT 5`
      : `SELECT 
          reminder_id,
          baby_id,
          title,
          time,
          TO_CHAR(date, 'YYYY-MM-DD') AS date,
          notes,
          is_active,
          next_reminder,
          reminder_in,
          created_at,
          updated_at
        FROM reminders 
        WHERE baby_id = $1 
        ORDER BY date DESC, time ASC`;

    const result = await pool.query(query, [numericBabyId]);

    if (result.rows.length === 0) {
      logger.info(`No reminders found for babyId: ${numericBabyId}`);
      return res.status(200).json(createSuccessResponse([])); // Return empty array instead of 404
    }

    logger.info(`Found ${result.rows.length} reminders for babyId=${numericBabyId}`);
    return res.status(200).json(createSuccessResponse(result.rows)); 
  } catch (dbError) {
    logger.error('Database error in getReminders:', dbError); 
    return res.status(500).json(createErrorResponse(500, 'Internal server error'));
  }
};