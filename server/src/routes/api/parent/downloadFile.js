// src/routes/api/parent/downloadFile.js
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

module.exports.downloadFile = async (req, res) => {
  try {
    const { document_id } = req.params;

    // Decode the token to get the user ID
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json(createErrorResponse(401, 'No authorization token provided'));
    }

    const userId = await getUserId(authHeader);
    if (!userId) {
      return res.status(404).json(createErrorResponse(404, 'User not found'));
    }

    // Query the database to get the file by its ID
    const result = await pool.query(
      `SELECT filename, mimetype, file_data
        FROM sharing_health_documents_baby_doctor
        WHERE document_id = $1`,
      [document_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse(404, 'File not found in database'));
    }

    const { filename, mimetype, file_data } = result.rows[0];

    // Set headers to indicate a file download
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send the file data as the response
    return res.status(200).send(file_data);
  } catch (error) {
    console.error('Error downloading file:', error); // Log the actual error
    return res.json(createErrorResponse(500, error));
  }
};
