// src/utils/errorHandling.js

/**
 * Extracts a human-readable error message from an axios error
 * @param {Error} error - The error object from axios
 * @returns {string} A human-readable error message
 */
export const getErrorMessage = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (error.response.status === 401) {
      return "Your session has expired. Please log in again.";
    } else if (error.response.data && error.response.data.message) {
      return error.response.data.message;
    } else if (error.response.data && typeof error.response.data === "string") {
      return error.response.data;
    } else {
      return `Error ${error.response.status}: ${error.response.statusText}`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    return "No response received from server. Please check your network connection.";
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || "An unexpected error occurred.";
  }
};

/**
 * Checks if the error is a network error
 * @param {Error} error - The error object from axios
 * @returns {boolean} True if it's a network error
 */
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

/**
 * Sanitizes WebSocket notification messages.
 * Replaces raw 4XX/5XX HTTP error strings with a friendly UI message
 * so internal server details are never shown to teachers/students.
 *
 * @param {string} message - Raw message string received from the WebSocket
 * @param {string} [fallback="Please Upload again"] - User-friendly fallback text
 * @returns {string} Safe message to display in the UI
 */
export const sanitizeNotificationMessage = (
  message,
  fallback = "Please Upload again",
) => {
  if (!message || typeof message !== "string") return fallback;
  // Matches patterns like:
  //   "502 Server Error: Bad Gateway for url: ..."
  //   "500 Server Error: Internal Server Error for url: ..."
  //   "404 Client Error: Not Found for url: ..."
  if (
    /^[45]\d{2}\s+(Server Error|Client Error|Bad Gateway|Not Found|Internal Server Error|Bad Request|Forbidden|Unauthorized)/i.test(
      message.trim(),
    )
  ) {
    return fallback;
  }
  return message;
};
