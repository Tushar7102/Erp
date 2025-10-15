import api from '../../utils/api';

/**
 * Service class for Call Management operations
 * Integrated with backend architecture using secure authentication
 */
class CallManagementService {
  constructor() {
    this.baseUrl = '/call-logs';
    // Using the centralized api instance with authentication interceptors
  }

  /**
   * Get all call logs with optional filters
   * @param {Object} filters - Optional filters for call logs
   * @returns {Promise} Promise object with call logs data
   */
  async getCallLogs(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filters.call_status) params.append('call_status', filters.call_status);
      if (filters.caller_id) params.append('caller_id', filters.caller_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.enquiry_id) params.append('enquiry_id', filters.enquiry_id);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get call log by ID
   * @param {string} id - Call log ID
   * @returns {Promise} Promise object with call log data
   */
  async getCallLogById(id) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new call log
   * @param {Object} callData - Call log data
   * @returns {Promise} Promise object with created call log
   */
  async createCallLog(callData) {
    try {
      // Validate call data before sending
      this.validateCallData(callData);
      
      const response = await api.post(this.baseUrl, callData);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Update an existing call log
   * @param {string} id - Call log ID
   * @param {Object} callData - Updated call log data
   * @returns {Promise} Promise object with updated call log
   */
  async updateCallLog(id, callData) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, callData);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Start a new call
   * @param {Object} callData - Call data including caller_id, recipient_id, etc.
   * @returns {Promise} Promise object with started call data
   */
  async startCall(callData) {
    try {
      const response = await api.post(`${this.baseUrl}/start`, callData);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * End an active call
   * @param {string} id - Call log ID
   * @param {Object} endCallData - Data for ending call (outcome, notes, etc.)
   * @returns {Promise} Promise object with ended call data
   */
  async endCall(id, endCallData) {
    try {
      const response = await api.put(`${this.baseUrl}/end/${id}`, endCallData);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Add feedback to a call
   * @param {string} id - Call log ID
   * @param {Object} feedbackData - Feedback data (rating, feedback_text, feedback_category)
   * @returns {Promise} Promise object with updated call including feedback
   */
  async addCallFeedback(id, feedbackData) {
    try {
      // Validate feedback data
      if (!feedbackData.rating) {
        throw new Error('Rating is required for call feedback');
      }
      
      const response = await api.post(`${this.baseUrl}/${id}/feedback`, feedbackData);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get call history for a specific enquiry
   * @param {string} enquiryId - Enquiry ID
   * @returns {Promise} Promise object with enquiry call history
   */
  async getEnquiryCallHistory(enquiryId) {
    try {
      const response = await api.get(`${this.baseUrl}/enquiry/${enquiryId}`);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get call history for a specific user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise} Promise object with user call history
   */
  async getUserCallHistory(userId, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.call_status) params.append('call_status', filters.call_status);
      if (filters.call_type) params.append('call_type', filters.call_type);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await api.get(`${this.baseUrl}/user/${userId}?${params.toString()}`);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get call analytics
   * @param {Object} filters - Filters for analytics
   * @returns {Promise} Promise object with call analytics data
   */
  async getCallAnalytics(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.call_type) params.append('call_type', filters.call_type);
      
      const response = await api.get(`${this.baseUrl}/analytics?${params.toString()}`);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get missed calls
   * @param {Object} filters - Filters for missed calls
   * @returns {Promise} Promise object with missed calls data
   */
  async getMissedCalls(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.user_id) params.append('user_id', filters.user_id);
      
      const response = await api.get(`${this.baseUrl}/missed?${params.toString()}`);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get calls requiring follow-up
   * @param {Object} filters - Filters for follow-up calls
   * @returns {Promise} Promise object with follow-up calls data
   */
  async getCallsRequiringFollowUp(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.date) params.append('date', filters.date);
      if (filters.user_id) params.append('user_id', filters.user_id);
      
      const response = await api.get(`${this.baseUrl}/follow-up?${params.toString()}`);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Mark follow-up as complete
   * @param {string} id - Call log ID
   * @param {Object} completionData - Completion data
   * @returns {Promise} Promise object with updated call data
   */
  async markFollowUpComplete(id, completionData) {
    try {
      // Validate completion data
      this.validateCallData(completionData, ['completion_notes']);
      
      const response = await api.patch(`${this.baseUrl}/${id}/follow-up-complete`, completionData);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get call quality metrics
   * @param {Object} filters - Filters for quality metrics
   * @returns {Promise} Promise object with quality metrics data
   */
  async getCallQualityMetrics(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.user_id) params.append('user_id', filters.user_id);
      
      const response = await api.get(`${this.baseUrl}/quality-metrics?${params.toString()}`);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Export call logs
   * @param {Object} filters - Filters for export
   * @returns {Promise} Promise object with exported call logs
   */
  async exportCallLogs(filters = {}) {
    try {
      // Validate required fields
      if (!filters.start_date || !filters.end_date) {
        throw new Error('Start date and end date are required for export');
      }
      
      const params = new URLSearchParams();
      
      params.append('start_date', filters.start_date);
      params.append('end_date', filters.end_date);
      if (filters.format) params.append('format', filters.format);
      if (filters.user_id) params.append('user_id', filters.user_id);
      
      // Set appropriate response type based on format
      const options = {};
      if (filters.format === 'csv') {
        options.responseType = 'blob';
      }
      
      const response = await api.get(`${this.baseUrl}/export?${params.toString()}`, options);
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Validate call data before submission
   * @param {Object} callData - Call data to validate
   * @param {Array} requiredFieldsList - Optional list of required fields
   * @throws {Error} Validation error
   */
  validateCallData(callData, requiredFieldsList = null) {
    const requiredFields = requiredFieldsList || ['call_type', 'call_direction'];
    const missingFields = requiredFields.filter(field => !callData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate call type
    const validCallTypes = ['voice', 'video', 'conference'];
    if (callData.call_type && !validCallTypes.includes(callData.call_type)) {
      throw new Error(`Invalid call type. Must be one of: ${validCallTypes.join(', ')}`);
    }
    
    // Validate call direction
    const validCallDirections = ['inbound', 'outbound'];
    if (callData.call_direction && !validCallDirections.includes(callData.call_direction)) {
      throw new Error(`Invalid call direction. Must be one of: ${validCallDirections.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @private
   */
  handleError(error) {
    // Log error for debugging
    console.error('Call Management API Error:', error);
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || 'Unknown server error';
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          console.error('Authentication error. Please log in again.');
          // Could trigger auth refresh or logout here
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error('You do not have permission to perform this action.');
          break;
        case 404:
          // Not found
          console.error('The requested resource was not found.');
          break;
        case 422:
          // Validation error
          console.error('Validation error:', message);
          break;
        default:
          // Other server errors
          console.error(`Server error (${status}):`, message);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received from server. Please check your connection.');
    } else {
      // Error in setting up the request
      console.error('Error setting up request:', error.message);
    }
  }
}

// Create and export singleton instance
const callService = new CallManagementService();
export default callService;