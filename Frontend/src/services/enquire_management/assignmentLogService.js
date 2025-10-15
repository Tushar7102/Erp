import api from '../../utils/api';

/**
 * Service class for Assignment Log operations
 * Provides secure communication with the backend API
 */
class AssignmentLogService {
  constructor() {
    this.baseUrl = '/assignment-logs';
  }

  /**
   * Get all assignment logs with optional filters
   * @param {Object} filters - Optional filters for assignment logs
   * @returns {Promise} Promise object with assignment logs data
   */
  async getAssignmentLogs(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filters.enquiry_id) params.append('enquiry_id', filters.enquiry_id);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
      if (filters.assigned_by) params.append('assigned_by', filters.assigned_by);
      if (filters.assignment_type) params.append('assignment_type', filters.assignment_type);
      if (filters.date_from) params.append('start_date', filters.date_from);
      if (filters.date_to) params.append('end_date', filters.date_to);
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
   * Get assignment log by ID
   * @param {string} id - Assignment log ID
   * @returns {Promise} Promise object with assignment log data
   */
  async getAssignmentLogById(id) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a new assignment log
   * @param {Object} assignmentData - Assignment log data
   * @returns {Promise} Promise object with created assignment log
   */
  async createAssignmentLog(assignmentData) {
    try {
      const response = await api.post(this.baseUrl, assignmentData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get enquiry assignment history
   * @param {string} enquiryId - Enquiry ID
   * @param {number} limit - Optional limit for results
   * @returns {Promise} Promise object with assignment history
   */
  async getEnquiryAssignmentHistory(enquiryId, limit = 50) {
    try {
      const response = await api.get(`${this.baseUrl}/enquiry/${enquiryId}/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get user assignment statistics
   * @param {string} userId - User ID
   * @param {string} startDate - Start date for statistics
   * @param {string} endDate - End date for statistics
   * @returns {Promise} Promise object with user assignment statistics
   */
  async getUserAssignmentStats(userId, startDate, endDate) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await api.get(`${this.baseUrl}/user/${userId}/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get team workload distribution
   * @param {string} teamId - Team ID
   * @param {string} startDate - Start date for workload data
   * @param {string} endDate - End date for workload data
   * @returns {Promise} Promise object with team workload distribution
   */
  async getTeamWorkloadDistribution(teamId, startDate, endDate) {
    try {
      const params = new URLSearchParams();
      params.append('team', teamId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await api.get(`${this.baseUrl}/team/workload?${params.toString()}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Reassign an enquiry
   * @param {Object} reassignmentData - Reassignment data
   * @returns {Promise} Promise object with reassignment result
   */
  async reassignEnquiry(reassignmentData) {
    try {
      const response = await api.post(`${this.baseUrl}/reassign`, reassignmentData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get assignment analytics
   * @param {string} startDate - Start date for analytics
   * @param {string} endDate - End date for analytics
   * @returns {Promise} Promise object with assignment analytics
   */
  async getAssignmentAnalytics(startDate, endDate) {
    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      
      const response = await api.get(`${this.baseUrl}/analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Export assignment logs
   * @param {Object} filters - Filters for export
   * @returns {Promise} Promise object with exported data
   */
  async exportAssignmentLogs(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
      if (filters.assignment_type) params.append('assignment_type', filters.assignment_type);
      
      const response = await api.get(`${this.baseUrl}/export?${params.toString()}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error('Assignment Log API Error:', error);
    // Additional error handling logic can be added here
  }
}

// Create and export a singleton instance
const assignmentLogService = new AssignmentLogService();
export default assignmentLogService;