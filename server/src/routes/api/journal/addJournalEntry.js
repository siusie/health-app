// src/routes/api/journal/addJournalEntry.js
const pool = require('../../../../database/db');
const formidable = require('formidable');
const { getUserId } = require('../../../utils/userIdHelper');
const logger = require('../../../utils/logger');

// Validation constants
const MAX_TITLE_LENGTH = 255;
const MAX_TEXT_LENGTH = 10000;

module.exports.config = {
  api: { bodyParser: false },
};

// POST /v1/journal
module.exports = async (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      logger.error('Form parsing error:', {
        error: err.message,
        stack: err.stack,
        code: err.code,
      });
      return res.status(500).json({ error: 'Error processing form data' });
    }

    try {
      // Validate and sanitize inputs
      const { title, text, date, tags } = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]])
      );

      // Parse tags if provided
      let parsedTags = [];
      if (fields.tags?.[0]) {
        try {
          parsedTags = JSON.parse(fields.tags[0]);
          if (!Array.isArray(parsedTags)) {
            return res.status(400).json({
              errors: ['Invalid tags format'],
            });
          }
        } catch (error) {
          return res.status(400).json({
            errors: ['Invalid tags format'],
          });
        }
      }

      // Input validation
      const validationErrors = [];

      if (!title?.trim()) validationErrors.push('Title is required');
      else if (title.length > MAX_TITLE_LENGTH)
        validationErrors.push(`Title must be ${MAX_TITLE_LENGTH} characters or less`);

      if (!text?.trim()) validationErrors.push('Text content is required');
      else if (text.length > MAX_TEXT_LENGTH)
        validationErrors.push(`Text must be ${MAX_TEXT_LENGTH} characters or less`);

      if (!date) validationErrors.push('Date is required');
      else if (isNaN(new Date(date).getTime())) validationErrors.push('Invalid date format');

      // Tags validation
      if (parsedTags.length > 10) {
        validationErrors.push('Maximum 10 tags allowed');
      }

      if (parsedTags.some((tag) => typeof tag !== 'string' || tag.length > 30)) {
        validationErrors.push('Tags must be strings of 30 characters or less');
      }

      if (validationErrors.length > 0) {
        logger.warn('Validation failed for journal entry:', {
          errors: validationErrors,
          fields: {
            hasTitle: !!title?.trim(),
            hasText: !!text?.trim(),
            hasDate: !!date,
          },
        });
        return res.status(400).json({ errors: validationErrors });
      }

      // Validate authorization header
      if (!req.headers.authorization) {
        return res.status(401).json({
          error: 'No authorization token provided',
        });
      }

      const userId = await getUserId(req.headers.authorization);
      if (!userId) {
        logger.warn('User not found when creating journal entry', {
          hasTitle: !!title?.trim(),
          hasDate: !!date,
        });
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Database operation
      const journalEntry = await pool.query(
        'INSERT INTO journalentry (user_id, title, text, date, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, title.trim(), text.trim(), new Date(date).toISOString(), parsedTags]
      );

      if (!journalEntry?.rows?.[0]) {
        logger.error('Failed to create journal entry:', {
          hasTitle: !!title?.trim(),
        });
        return res.status(500).json({ error: 'Failed to create journal entry' });
      }

      logger.info('Journal entry created successfully', {
        entryId: journalEntry.rows[0].id,
        hasTitle: !!title?.trim(),
      });

      return res.status(201).json(journalEntry.rows[0]);
    } catch (error) {
      logger.error('Database error while creating journal entry:', {
        error: error.message,
        stack: error.stack,
        fields: {
          hasFields: !!fields,
        },
      });

      if (error.code === '23505') {
        return res.status(409).json({ error: 'Duplicate entry' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
};
