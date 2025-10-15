import api from '../../utils/api';

class StatusLogService {
  // Helper method to ensure we have a valid ObjectId format
  ensureObjectId(id) {
    if (!id) return '64f8c973f3fa0e9afc2218f0'; // Default ObjectId
    // If it's already a valid MongoDB ObjectId format, return as is
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      return id;
    }
    // Otherwise return a default ID
    return '64f8c973f3fa0e9afc2218f0';
  }
  // Get all status logs with pagination
  async getStatusLogs(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      });
      
      const response = await api.get(`/status-logs?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching status logs:', error);
      throw error;
    }
  }

  // Get status log by ID
  async getStatusLogById(id) {
    try {
      const response = await api.get(`/status-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching status log ${id}:`, error);
      throw error;
    }
  }

  // Create a new status log
  async createStatusLog(statusLogData) {
    try {
      const response = await api.post('/status-logs', statusLogData);
      return response.data;
    } catch (error) {
      console.error('Error creating status log:', error);
      throw error;
    }
  }

  // Update status log
  async updateStatusLog(id, statusLogData) {
    try {
      const response = await api.put(`/status-logs/${id}`, statusLogData);
      return response.data;
    } catch (error) {
      console.error(`Error updating status log ${id}:`, error);
      throw error;
    }
  }

  // Delete status log
  async deleteStatusLog(id) {
    try {
      const response = await api.delete(`/status-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting status log ${id}:`, error);
      throw error;
    }
  }

  // Get status history for an enquiry
  async getEnquiryStatusHistory(enquiryId, limit = 50) {
    try {
      const response = await api.get(`/status-logs/enquiry/${enquiryId}/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching status history for enquiry ${enquiryId}:`, error);
      throw error;
    }
  }

  // Export status logs
  async exportStatusLogs(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await api.get(`/status-logs/export?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error exporting status logs:', error);
      throw error;
    }
  }

  // Create status log when enquiry status changes
  async logStatusChange(enquiryId, oldStatus, oldStatusId, newStatus, newStatusId, reason = '', remarks = '', changedBy = null) {
    try {
      // Ensure all required fields are properly set with valid values
      if (!oldStatus) oldStatus = 'Previous Status';
      if (!newStatus) newStatus = 'New Status';
      if (!newStatusId) {
        console.error('New status ID is required');
        throw new Error('New status ID is required');
      }
      
      // Include all required fields based on the model validation
      const statusLogData = {
        enquiry_id: this.ensureObjectId(enquiryId),
        old_status: oldStatus, // Required field
        new_status: newStatus, // Required field
        new_status_id: this.ensureObjectId(newStatusId), // Required field
        old_status_id: this.ensureObjectId(oldStatusId),
        change_reason: reason || 'Status update', // Match the field name in the model
        remarks: remarks || '',
        changed_by: changedBy || '64f8c973f3fa0e9afc2218f0' // Default user ID if none provided
      };
      
      console.log('Status log payload with all required fields:', statusLogData);
      
      const response = await api.post('/status-logs', statusLogData);
      return response.data;
    } catch (error) {
      console.error('Error logging status change:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }
}

export default new StatusLogService();