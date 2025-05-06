// src/routes/api/doctor/getSentFiles.js
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

// Doctor get all sent files to parents
module.exports.getSentFiles = async (req, res) => {
  try {
    const { doctorId } = req.params;
    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    // Query the database for sent files sent by doctor to parents
    const result = await pool.query(
      `SELECT document_id, filename, mimetype, file_data, baby_id, uploaded_by, shared_with, is_from_doctor, created_at
         FROM sharing_health_documents_baby_doctor
         WHERE is_from_doctor = true AND uploaded_by = $1
         ORDER BY created_at DESC`,
      [doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'Files not found in database'));
    }

    // Map the result to include shared_with and baby_id explicitly
    const files = result.rows.map((file) => ({
      document_id: file.document_id,
      filename: file.filename,
      mimetype: file.mimetype,
      file_data: file.file_data,
      baby_id: file.baby_id,
      shared_with: file.shared_with,
      is_from_doctor: file.is_from_doctor,
      created_at: file.created_at,
    }));

    return res.status(200).json(createSuccessResponse({ files }));
  } catch (error) {
    console.error('Error getting files from all parents:', error); // Log the actual error
    return res.status(500).json(createErrorResponse(500, error));
  }
};
