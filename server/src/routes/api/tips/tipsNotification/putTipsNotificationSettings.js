// src/routes/api/tips/tipsNotification/[putTipsNotificationSettings].js
// route PUT /tips/notification
// This updates the tips notification settings (in /tips page) for a user

const logger = require('../../../../utils/logger');
const {
  createSuccessResponse,
  createErrorResponse,
} = require('../../../../utils/response');
const pool = require('../../../../../database/db');
const { getUserId } = require('../../../../utils/userIdHelper');

// ROUTE: PUT /tips/notification
module.exports = async (req, res) => {
    try {
        // Step 1: Verify the user token and get user_id
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res
                .status(401)
                .json(createErrorResponse(401, "No authorization token provided"));
        }   // 401 Unauthorized

        const user_id = await getUserId(authHeader);
        if (!user_id) {
            return res.status(401).json(createErrorResponse(401, "Invalid user ID"));
        }   // 401 Unauthorized
        logger.debug(user_id, `user_id from token`);
     
        // Step 2: extract settings from request body 
        const { notification_frequency, opt_in } = req.body;
        if (!notification_frequency) {
            return res
                .status(400)
                .json(createErrorResponse(400, "notification_frequency is required"));
        }   // 400 Bad Request
        if (!opt_in) {
            return res.status(400).json(createErrorResponse(400, "opt_in is required"));
        }   // 400 Bad Request
        logger.debug(notification_frequency, `notification_frequency: `);
        logger.debug(opt_in, `opt_in: `);

        // Step 3: Update the record (or insert if it doesn't exist)
        const updateResult = await pool.query(
            `UPDATE TipsNotificationSettings 
            SET notification_frequency = $1, opt_in = $2, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $3
            RETURNING *`,
            [notification_frequency, opt_in, user_id]
        );

        if (updateResult.rows.length === 0) {
            // if no record found, create a new record with new settings
            const insertResult = await pool.query(
                `INSERT INTO TipsNotificationSettings (user_id, notification_frequency, opt_in)
                VALUES ($1, $2, $3)
                RETURNING *`,
                [user_id, notification_frequency, opt_in]
            );
            return res.status(200).json(insertResult.rows[0]);
        } else {    // if record found, just update
            return res.status(200).json(updateResult.rows[0]);
        }
    } catch (err) {
        logger.error(err, `ERROR in PUT /tips/notification, Error updating TipsNotificationSettings`);
        return res.status(500).json(createErrorResponse(500, "Server Error"));
    }
};