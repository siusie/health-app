// server/src/utils/uploadHandler.js
const multer = require('multer');
const { validateImage, sanitizeFilename, SUPPORTED_EXTENSIONS } = require('./imageProcessing');
const logger = require('./logger');
const path = require('path');

/**
 * Creates a configured multer middleware for image uploads
 * with comprehensive validation and sanitization
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.maxSize - Maximum file size in bytes (default 5MB)
 * @param {string} options.fieldName - Form field name (default 'image')
 * @returns {Function} - Configured multer middleware
 */
function createImageUploadHandler(options = {}) {
  const { 
    maxSize = 5 * 1024 * 1024, // 5MB default
    fieldName = 'profilePicture'
  } = options;
  
  // Configure multer storage
  const storage = multer.memoryStorage();
  
  // Configure file filter for basic extension check
  const fileFilter = (req, file, cb) => {
    try {
      // First level basic check based on extension
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Unsupported file extension: ${ext}. Only image files are allowed.`), false);
      }
      
      // Sanitize the filename to prevent security issues
      file.originalname = sanitizeFilename(file.originalname);
      
      // We'll do a more thorough check after the file is uploaded
      cb(null, true);
    } catch (error) {
      logger.error({ error }, 'Error in file filter');
      cb(new Error('File validation failed'), false);
    }
  };
  
  // Create the multer upload middleware
  const upload = multer({
    storage,
    limits: {
      fileSize: maxSize,
    },
    fileFilter
  }).single(fieldName);
  
  // Return a wrapped middleware that performs additional validation
  return function(req, res, next) {
    upload(req, res, async function(err) {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            error: {
              message: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB`
            }
          });
        }
        return res.status(400).json({
          status: 'error', 
          error: {
            message: err.message || 'File upload failed'
          }
        });
      }
      
      // If no file was uploaded (optional upload)
      if (!req.file) {
        return next();
      }
      
      try {
        // Perform deep validation of the file content
        const validation = await validateImage(req.file.buffer, req.file.originalname);
        
        if (!validation.valid) {
          return res.status(400).json({
            status: 'error',
            error: {
              message: validation.error || 'Invalid image file'
            }
          });
        }
        
        // Update the file's mimetype to the detected one for accuracy
        if (validation.mimeType) {
          req.file.mimetype = validation.mimeType;
        }
        
        // Continue to the next middleware/route handler
        next();
      } catch (error) {
        logger.error({ error }, 'Error validating uploaded file');
        return res.status(400).json({
          status: 'error',
          error: {
            message: 'File validation failed: ' + (error.message || 'Unknown error')
          }
        });
      }
    });
  };
}

module.exports = { 
  createImageUploadHandler
};