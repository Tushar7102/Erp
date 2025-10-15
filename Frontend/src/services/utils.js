/**
 * Handle successful API responses
 * @param {Object} response - API response object
 * @returns {Object} Processed response data
 */
export const handleResponse = (response) => {
  if (response.data) {
    return response.data;
  }
  return response;
};

/**
 * Handle API errors consistently
 * @param {Error} error - API error
 * @returns {Error} Formatted error
 */
export const handleError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const message = data?.message || data?.error || 'An error occurred';
    
    switch (status) {
      case 400:
        return new Error(message || 'Invalid request data');
      case 401:
        return new Error('Authentication required. Please log in again.');
      case 403:
        return new Error('Access denied. You do not have permission to perform this action.');
      case 404:
        return new Error('Resource not found');
      case 409:
        return new Error(message || 'Conflict: Resource already exists');
      case 422:
        return new Error(message || 'Validation error');
      case 429:
        return new Error('Too many requests. Please try again later.');
      case 500:
        return new Error('Server error. Please try again later');
      case 502:
      case 503:
      case 504:
        return new Error('Service temporarily unavailable. Please try again later.');
      default:
        return new Error(message);
    }
  } else if (error.request) {
    // Network error
    return new Error('Network error. Please check your internet connection and try again.');
  } else {
    // Other error
    return new Error(error.message || 'An unexpected error occurred');
  }
};
