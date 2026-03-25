/**
 * Utility functions for handling images in the application
 * Handles conversions between URLs, base64, and proper image display formats
 */

/**
 * Convert a URL to base64 string
 * @param {string} imageUrl - The image URL to convert
 * @returns {Promise<string>} - Base64 string with data URL prefix
 */
export async function urlToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result); // base64 string with data URL prefix
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
}

/**
 * Get the appropriate image src for display
 * Checks if the image is an HTTP URL or base64, and formats accordingly
 * @param {string} imageData - The image data (URL or base64)
 * @param {string} defaultMimeType - Default MIME type if base64 doesn't have prefix (default: image/png)
 * @returns {string} - Properly formatted image src
 */
export function getImageSrc(imageData, defaultMimeType = 'image/png') {
  if (!imageData) return '';

  // If it's already a data URL (starts with data:image), return as is
  if (imageData.startsWith('data:image')) {
    return imageData;
  }

  // If it's an HTTP/HTTPS URL, return as is
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return imageData;
  }

  // If it's a blob URL, return as is
  if (imageData.startsWith('blob:')) {
    return imageData;
  }

  // Otherwise, assume it's base64 without the data URL prefix
  return `data:${defaultMimeType};base64,${imageData}`;
}

/**
 * Check if an image is a URL (HTTP/HTTPS)
 * @param {string} imageData - The image data to check
 * @returns {boolean} - True if it's a URL
 */
export function isImageUrl(imageData) {
  if (!imageData) return false;
  return imageData.startsWith('http://') || imageData.startsWith('https://');
}

/**
 * Extract base64 data from a data URL
 * @param {string} dataUrl - Data URL string
 * @returns {string} - Base64 string without prefix
 */
export function extractBase64FromDataUrl(dataUrl) {
  if (!dataUrl) return '';

  const dataStart = dataUrl.indexOf(',');
  if (dataStart !== -1) {
    return dataUrl.slice(dataStart + 1);
  }

  return dataUrl;
}

/**
 * Convert image to base64 for API submission
 * If it's a URL, fetches and converts. If already base64, returns as is.
 * @param {string} imageData - The image data (URL or base64)
 * @returns {Promise<string>} - Base64 string with data URL prefix
 */
export async function prepareImageForApi(imageData) {
  if (!imageData) return '';

  // If it's already a data URL, return as is
  if (imageData.startsWith('data:image')) {
    return imageData;
  }

  // If it's a URL, convert to base64
  if (isImageUrl(imageData)) {
    return await urlToBase64(imageData);
  }

  // If it's base64 without prefix, add the prefix
  if (!imageData.startsWith('data:') && !imageData.startsWith('http')) {
    return `data:image/png;base64,${imageData}`;
  }

  return imageData;
}
