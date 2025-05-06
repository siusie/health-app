// src/routes/api/parent/getFiles.js
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

// Parent get all files sent by a doctor to a baby
module.exports.getFiles = async (req, res) => {
  try {
    const { parentId, doctorId, babyId } = req.params;
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    // Query the database for files sent by a doctor to a baby
    const result = await pool.query(
      `SELECT document_id, filename, mimetype, file_data, baby_id, uploaded_by, shared_with, is_from_doctor, created_at
         FROM sharing_health_documents_baby_doctor
         WHERE is_from_doctor = true AND shared_with = $1 AND baby_id = $2
         ORDER BY created_at DESC`,
      [parentId, babyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'Files not found in database'));
    }
    return res.status(200).json(createSuccessResponse({ files: result.rows }));
  } catch (error) {
    console.error('Error getting files from all parents:', error); // Log the actual error
    return res.status(500).json(createErrorResponse(500, error));
  }
};
