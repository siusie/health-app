// src/routes/api/journal/putJournalEntry.js
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

// PUT /v1/journal/:id
// Update a journal entry
module.exports = async (req, res) => {
  try {
    // Validate entry_id
    const entryId = parseInt(req.params.id);
    if (isNaN(entryId) || entryId <= 0) {
      return res.status(400).json({
        error: 'Invalid entry ID provided',
      });
    }

    // Validate authorization header
    if (!req.headers.authorization) {
      return res.status(401).json({
        error: 'No authorization token provided',
      });
    }

    // Validate request body
    const { title, text, tags } = req.body;
    if (!title || !text) {
      return res.status(400).json({
        error: 'Title and text are required',
      });
    }

    // Add tags validation before the database query
    if (tags) {
      try {
        // Check if tags is an array
        if (!Array.isArray(tags)) {
          return res.status(400).json({
            error: 'Invalid tags format',
          });
        }

        // Check maximum number of tags
        if (tags.length > 10) {
          return res.status(400).json({
            error: 'Maximum 10 tags allowed',
          });
        }

        // Check tag length
        if (tags.some((tag) => typeof tag !== 'string' || tag.length > 30)) {
          return res.status(400).json({
            error: 'Tags must be strings of 30 characters or less',
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid tags format',
        });
      }
    }

    const userId = await getUserId(req.headers.authorization);
    if (!userId) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Check if entry exists and belongs to user
    const entryResult = await pool.query('SELECT user_id FROM journalentry WHERE entry_id = $1', [
      entryId,
    ]);

    if (entryResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Journal entry not found',
      });
    }

    // Convert user_id from the database, userId from the token to a number and compare
    if (Number(entryResult.rows[0].user_id) !== Number(userId)) {
      return res.status(403).json({
        error: 'You can only edit your own journal entries',
      });
    }

    // Update the entry including tags
    const updateResult = await pool.query(
      'UPDATE journalentry SET title = $1, text = $2, tags = $3, updated_at = NOW() WHERE entry_id = $4 AND user_id = $5 RETURNING *',
      [req.body.title, req.body.text, tags, entryId, userId]
    );

    return res.status(200).json({
      status: 'ok',
      data: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error updating journal entry:', error);

    if (error.code === '22P02') {
      return res.status(400).json({
        error: 'Invalid tag format',
      });
    }

    return res.status(500).json({
      error: 'Database error',
    });
  }
};
