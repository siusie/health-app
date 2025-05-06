// server/src/utils/imageProcessing.js
const sharp = require('sharp');
const logger = require('./logger');
const path = require('path');

// Constants for image optimization
const MAX_DIMENSION = 300; // pixels
const JPEG_QUALITY = 80; // 0-100, 80 is a good balance
const WEBP_QUALITY = 75; // 0-100, 75 is good for WebP
const AVIF_QUALITY = 60; // 0-100, 60 is good for AVIF
const PNG_COMPRESSION = 9; // 0-9, 9 is maximum compression

// List of supported image MIME types and their extensions
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
  'image/webp', 'image/avif', 'image/bmp', 'image/tiff'
];

const SUPPORTED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff', '.tif'
];

/**
 * Validates if the file appears to be a valid image based on extension and initial check
 * @param {Buffer} buffer - The file buffer to check
 * @param {string} filename - Original filename
 * @returns {Promise<{valid: boolean, mimeType: string|null, error: string|null}>} Validation result
 */
async function validateImage(buffer, filename) {
  try {
    // Check file extension
    if (!filename) {
      return { valid: false, mimeType: null, error: 'Missing filename' };
    }
    
    const ext = path.extname(filename).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return { 
        valid: false, 
        mimeType: null, 
        error: `Unsupported file extension: ${ext}. Only images are allowed.` 
      };
    }
    
    // Map extension to mime type
    let mimeType;
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      case '.avif':
        mimeType = 'image/avif';
        break;
      case '.bmp':
        mimeType = 'image/bmp';
        break;
      case '.tiff':
      case '.tif':
        mimeType = 'image/tiff';
        break;
      default:
        mimeType = 'application/octet-stream';
    }
    
    // Try to process with sharp to ensure it's a valid image
    try {
      const metadata = await sharp(buffer).metadata();
      if (!metadata.width || !metadata.height) {
        return { valid: false, mimeType, error: 'Invalid image dimensions' };
      }
      
      return { valid: true, mimeType, error: null };
    } catch (sharpError) {
      return { valid: false, mimeType, error: 'Invalid image content' };
    }
  } catch (error) {
    logger.error({ error }, 'Error validating image');
    return { valid: false, mimeType: null, error: 'File validation failed' };
  }
}

/**
 * Optimize an image for storage in the database
 * Supports multiple input formats and optimizes to WebP/AVIF
 * 
 * @param {Buffer} imageBuffer - The original image buffer
 * @param {string} mimeType - Original mime type
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} - Optimized image buffer and metadata
 */
async function optimizeImage(imageBuffer, mimeType, filename) {
  try {
    // Validate the image first
    const validation = await validateImage(imageBuffer, filename);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image file');
    }
    
    // Use the detected mime type from validation for more accuracy
    mimeType = validation.mimeType || mimeType;
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // Preserve animation for GIFs
    const isAnimated = mimeType === 'image/gif' && metadata.pages && metadata.pages > 1;
    
    // Determine if resizing is needed
    let width = metadata.width;
    let height = metadata.height;
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width > height) {
        // Landscape image
        height = Math.round((height / width) * MAX_DIMENSION);
        width = MAX_DIMENSION;
      } else {
        // Portrait image
        width = Math.round((width / height) * MAX_DIMENSION);
        height = MAX_DIMENSION;
      }
      
      // Ensure minimum dimension is at least 200px for better quality thumbnails
      if (Math.min(width, height) < 200) {
        const aspectRatio = width / height;
        if (width < height) {
          width = 200;
          height = Math.round(width / aspectRatio);
        } else {
          height = 200;
          width = Math.round(height * aspectRatio);
        }
      }
    }
    
    // If it's an animated GIF, optimize while preserving animation
    if (isAnimated) {
      logger.info("Animated GIF detected, preserving animation");
      
      // For smaller GIFs, just return the original if reasonably sized 
      if (metadata.width <= MAX_DIMENSION * 1.5 && metadata.height <= MAX_DIMENSION * 1.5 && 
          imageBuffer.length < 1024 * 500) { // Under 500KB
        logger.info("Small animated GIF, preserving original");
        return {
          buffer: imageBuffer,
          width: metadata.width,
          height: metadata.height,
          mimeType: 'image/gif',
          fileSize: imageBuffer.length,
          isAnimated: true
        };
      }
      
      // Only resize if absolutely necessary
      try {
        logger.info("Resizing animated GIF while preserving animation");
        const processedImageBuffer = await sharp(imageBuffer, {
          animated: true,
          pages: -1,
          limitInputPixels: false
        })
        .resize({
          width: width > MAX_DIMENSION ? MAX_DIMENSION : width,
          height: height > MAX_DIMENSION ? MAX_DIMENSION : height,
          fit: 'inside',
          withoutEnlargement: true
        })
        .gif({ 
          loop: 0,            // infinite looping
          delay: metadata.delay || undefined,  // preserve original frame timing
          dither: 0           // no dithering for cleaner output
        })
        .toBuffer();
        
        return {
          buffer: processedImageBuffer,
          width: Math.min(width, MAX_DIMENSION),
          height: Math.min(height, MAX_DIMENSION),
          mimeType: 'image/gif',
          fileSize: processedImageBuffer.length,
          isAnimated: true
        };
      } catch (gifError) {
        logger.warn({ error: gifError }, 'GIF processing failed, returning original');
        // Fallback to original if processing fails
        return {
          buffer: imageBuffer,
          width: metadata.width,
          height: metadata.height,
          mimeType: 'image/gif',
          fileSize: imageBuffer.length,
          isAnimated: true
        };
      }
    }
    
    // For static images, try modern formats
    let imageProcessor = sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      });
    
    // Try AVIF first (better compression but less support)
    try {
      logger.info("Attempting AVIF conversion");
      const avifBuffer = await imageProcessor
        .avif({ quality: AVIF_QUALITY })
        .toBuffer();
      
      // If AVIF is significantly smaller, use it
      if (avifBuffer.length < imageBuffer.length * 0.7) {
        logger.info(`AVIF conversion successful, saved ${Math.round((1 - avifBuffer.length / imageBuffer.length) * 100)}%`);
        return {
          buffer: avifBuffer,
          width,
          height,
          mimeType: 'image/avif',
          fileSize: avifBuffer.length,
          isAnimated: false
        };
      }
      // Otherwise fall through to WebP
      logger.info("AVIF not efficient enough, trying WebP");
    } catch (avifError) {
      logger.debug('AVIF conversion skipped', avifError.message);
      // Continue to WebP
    }
    
    // Try WebP (good compression and widely supported)
    try {
      logger.info("Attempting WebP conversion");
      const webpBuffer = await imageProcessor
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      
      logger.info(`WebP conversion successful, saved ${Math.round((1 - webpBuffer.length / imageBuffer.length) * 100)}%`);
      return {
        buffer: webpBuffer,
        width,
        height,
        mimeType: 'image/webp',
        fileSize: webpBuffer.length,
        isAnimated: false
      };
    } catch (webpError) {
      logger.warn({ error: webpError }, 'WebP conversion failed, falling back to PNG');
      
      // Fallback to PNG
      const processedImageBuffer = await imageProcessor
        .png({ compressionLevel: PNG_COMPRESSION })
        .toBuffer();
      
      return {
        buffer: processedImageBuffer,
        width,
        height,
        mimeType: 'image/png',
        fileSize: processedImageBuffer.length,
        isAnimated: false
      };
    }
  } catch (error) {
    logger.error({ error }, 'Error optimizing image');
    throw new Error('Failed to process image: ' + error.message);
  }
}

/**
 * Sanitizes a filename to prevent security issues
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename) return 'image.png';
  
  // Remove path traversal characters, unusual chars, and ensure it ends with an extension
  let sanitized = filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Remove forbidden chars
    .replace(/\.\./g, '-') // Remove path traversal attempts
    .trim();
  
  // Ensure filename isn't too long
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 250) + '.' + ext;
  }
  
  // Ensure there's a file extension
  if (!sanitized.includes('.')) {
    sanitized += '.png';
  }
  
  return sanitized;
}

module.exports = {
  validateImage,
  optimizeImage,
  sanitizeFilename,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_EXTENSIONS,
  MAX_DIMENSION
};