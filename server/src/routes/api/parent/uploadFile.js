// src/routes/api/parent/uploadFile.js
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

module.exports.uploadFile = async (req, res) => {
  try {
    const { parentId, babyId, doctorId } = req.params;
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    if (!req.file || !req.file.fieldname) {
      return res.status(400).json(createErrorResponse(400, 'No file uploaded'));
    }
    const file = req.file;

    const result = await pool.query(
      `INSERT INTO sharing_health_documents_baby_doctor (
        filename, file_data, mimetype, baby_id, uploaded_by, shared_with, is_from_doctor)
        VALUES ( $1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [file.originalname, file.buffer, file.mimetype, babyId, parentId, doctorId, false]
    );
    if (!result.rows[0]) {
      return res.status(404).json(createErrorResponse(404, 'File not found in database'));
    }

    return res.json(createSuccessResponse({ file: result.rows[0] }));
  } catch (error) {
    console.error('Error uploading file:', error); // Log the actual error
    return res.status(500).json(createErrorResponse(500, error));
  }
};
