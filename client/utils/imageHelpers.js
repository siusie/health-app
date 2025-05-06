// Comprehensive Image Handling Utilities

// Predefined responsive image sizes
export const IMAGE_SIZES = [40, 80, 120, 160, 240, 320, 640];

/**
 * Get full image URL with caching and sizing
 * @param {string} imageUrl - Original image URL
 * @param {string} entityType - 'user' or 'baby'
 * @param {number} size - Requested image size
 * @returns {string} Fully qualified image URL
 */
export function getFullImageUrl(imageUrl, entityType = null, size = 80) {
  // Quick return for empty URLs
  if (!imageUrl) {
    return getDefaultImagePath(entityType, size);
  }
  
  // Default image paths
  if (imageUrl.includes('BlankProfilePictures')) {
    return getDefaultImagePath(entityType, size);
  }
  
  // External URLs
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // API-served images
  if (imageUrl.startsWith('/v1/')) {
    const separator = imageUrl.includes('?') ? '&' : '?';
    const cacheBuster = Date.now().toString().slice(-6);
    return `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}${separator}size=${size}&v=${cacheBuster}`;
  }
  
  return imageUrl;
}

/**
 * Get default image path based on entity type
 * @param {string} entityType - 'user' or 'baby'
 * @param {number} size - Requested image size
 * @returns {string} Default image path
 */
export function getDefaultImagePath(entityType, size = 80) {
  const closestSize = getClosestSize(size);
  const baseImage = entityType === 'baby' ? 'BlankBabyPicture' : 'BlankProfilePicture';
  return `/BlankProfilePictures/${baseImage}-${closestSize}.webp`;
}

/**
 * Find closest predefined image size
 * @param {number} size - Requested size
 * @returns {number} Closest available size
 */
export function getClosestSize(size) {
  return IMAGE_SIZES.reduce((prev, curr) => 
    Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
  );
}

/**
 * Detect if image is an animated GIF
 * @param {string} imageUrl - Image URL
 * @returns {boolean} Is animated GIF
 */
export function isAnimatedGif(imageUrl) {
  if (!imageUrl) return false;
  
  return imageUrl.toLowerCase().endsWith('.gif') ||
    (imageUrl.toLowerCase().includes('/v1/profile-picture/') && 
     imageUrl.toLowerCase().includes('mime_type=image%2fgif'));
}

/**
 * Client-side image validation
 * @param {File} file - Image file to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateImageFile(file) {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const VALID_MIME_TYPES = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp', 
    'image/avif', 
    'image/bmp'
  ];

  if (!file) {
    return { 
      valid: false, 
      message: 'No file selected',
      errorCode: 'NO_FILE'
    };
  }

  // Size validation
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      errorCode: 'FILE_TOO_LARGE'
    };
  }

  // MIME type validation
  if (!VALID_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: 'Unsupported file type. Please use JPG, PNG, GIF, WebP, or AVIF',
      errorCode: 'INVALID_TYPE'
    };
  }

  // Image dimension validation
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_DIMENSIONS = 3000;
      if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
        resolve({
          valid: false,
          message: `Image dimensions should not exceed ${MAX_DIMENSIONS}x${MAX_DIMENSIONS} pixels`,
          errorCode: 'DIMENSIONS_TOO_LARGE',
          width: img.width,
          height: img.height
        });
      } else {
        resolve({
          valid: true,
          message: 'Image is valid',
          width: img.width,
          height: img.height
        });
      }
    };
    
    img.onerror = () => {
      resolve({
        valid: false,
        message: 'Unable to load image. Please choose a different file.',
        errorCode: 'LOAD_ERROR'
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress image before upload
 * @param {File} file - Image file
 * @param {number} maxSize - Maximum dimension
 * @param {number} quality - Compression quality
 * @returns {Promise<Blob>} Compressed image
 */
export async function compressImageBeforeUpload(file, maxSize = 1200, quality = 0.85) {
  // Skip compression for GIFs
  if (file.type === 'image/gif') return file;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        // Skip compression for small images
        if (img.width <= maxSize && img.height <= maxSize) {
          resolve(file);
          return;
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate proportional resize
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine output type
        const outputType = file.type === 'image/png' ? 'image/webp' : file.type;
        
        canvas.toBlob(
          (blob) => resolve(blob),
          outputType,
          outputType === 'image/jpeg' ? quality : undefined
        );
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
    };
    
    reader.onerror = () => reject(new Error('FileReader error'));
  });
}