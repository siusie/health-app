// src/routes/api/journal/deleteJournalEntry.js
const pool = require('../../../../database/db');
const logger = require('../../../utils/logger');
const { getUserId } = require('../../../utils/userIdHelper');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');

// DELETE /v1/journal/:id
// Delete a journal entry
module.exports = async (req, res) => {
  let client; // Create a client to connect to the database
  try {
    const entry_id = req.params.id;

    // Validate entry_id
    if (!entry_id || isNaN(entry_id)) {
      return createErrorResponse(res, 400, 'Invalid entry ID provided');
    }

    // Validate authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.error('No authorization header found');
      return createErrorResponse(res, 401, 'No authorization token provided');
    }

    // Get user_id using the helper function
    const userId = await getUserId(authHeader);
    if (!userId) {
      return createErrorResponse(res, 404, 'User not found');
    }

    client = await pool.connect();
    await client.query('BEGIN'); // Start transaction with BEGIN (ensures that the query is atomic since we are doing multiple queries)

    // Check if entry exists and user owns it
    const entryResult = await client.query('SELECT user_id FROM journalentry WHERE entry_id = $1', [
      entry_id,
    ]);

    if (entryResult.rows.length === 0) {
      logger.warn(`Journal entry not found with ID: ${entry_id}`);
      await client.query('ROLLBACK');
      return createErrorResponse(res, 404, 'Journal entry not found');
    }

    // Check if user owns the journal entry
    if (Number(entryResult.rows[0].user_id) !== Number(userId)) {
      logger.warn(`Unauthorized deletion attempt for journal entry ${entry_id} by user ${userId}`);
      await client.query('ROLLBACK');
      return createErrorResponse(res, 403, 'You can only delete your own journal entries');
    }

    // Delete the journal entry
    await client.query('DELETE FROM journalentry WHERE entry_id = $1', [entry_id]);
    await client.query('COMMIT');
    logger.info(`Successfully deleted journal entry ${entry_id}`);

    res.json(createSuccessResponse('Journal entry deleted successfully'));
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch((rollbackError) => {
        logger.error(`Rollback failed: ${rollbackError.message}`);
      });
    }

    logger.error(`Error deleting journal entry: ${err.message}`);
    logger.error(err.stack);

    return createErrorResponse(res, 500, 'Server error while deleting journal entry');
  } finally {
    if (client) {
      client.release();
    }
  }
};
