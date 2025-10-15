import DOMPurify from 'dompurify';
import api from '../../utils/api';

// Helper function to sanitize input data
const sanitizeData = (data) => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data);
  }
  
  if (typeof data === 'object') {
    const sanitized = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};

// Using the pre-configured api instance from utils/api.js

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data } = error.response;
    
    switch (status) {
      case 422:
        // Validation error
        console.error('Validation error:', data.errors || data.message || 'Invalid data');
        return { error: data.errors || data.message || 'Invalid data' };
      default:
        console.error('API error:', data.message || 'Something went wrong');
    }
    
    return { error: data.message || 'An error occurred' };
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Network error:', error.request);
    return { error: 'Network error. Please check your connection.' };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Request error:', error.message);
    return { error: error.message };
  }
};

const communicationLogService = {
  // Get all communication logs with optional filters
  getAllLogs: async (filters = {}) => {
    try {
      const sanitizedFilters = sanitizeData(filters);
      const response = await api.get('/communication-logs', {
        params: sanitizedFilters
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Get communication logs for a specific enquiry
  getEnquiryLogs: async (enquiryId, filters = {}) => {
    try {
      // Validate enquiry ID
      if (!enquiryId) throw new Error('Enquiry ID is required');
      
      const sanitizedFilters = sanitizeData(filters);
      const response = await api.get(`/communication-logs/enquiry/${enquiryId}`, {
        params: sanitizedFilters
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Get a single communication log by ID
  getLogById: async (id) => {
    try {
      // Validate ID
      if (!id) throw new Error('Communication log ID is required');
      
      const response = await api.get(`/communication-logs/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Create a new communication log
  createLog: async (logData) => {
    try {
      // Validate required fields
      if (!logData.communication_type) throw new Error('Communication type is required');
      if (!logData.enquiry_id) throw new Error('Enquiry ID is required');
      if (!logData.message_content) throw new Error('Message content is required');
      
      // Validate communication type specific fields
      if (logData.communication_type === 'email' && !logData.subject) {
        throw new Error('Subject is required for email communications');
      }
      
      if (logData.communication_type === 'email' && !logData.contact_details?.email && !logData.recipient?.external_contact?.email) {
        throw new Error('Recipient email is required for email communications');
      }
      
      if ((logData.communication_type === 'sms' || logData.communication_type === 'whatsapp') && 
          !logData.contact_details?.phone && !logData.recipient?.external_contact?.phone) {
        throw new Error(`Recipient phone number is required for ${logData.communication_type} communications`);
      }
      
      const sanitizedData = sanitizeData(logData);
      const response = await api.post('/communication-logs', sanitizedData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Update an existing communication log
  updateLog: async (id, logData) => {
    try {
      // Validate ID
      if (!id) throw new Error('Communication log ID is required');
      
      const sanitizedData = sanitizeData(logData);
      const response = await api.put(`/communication-logs/${id}`, sanitizedData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Delete a communication log
  deleteLog: async (id) => {
    try {
      // Validate ID
      if (!id) throw new Error('Communication log ID is required');
      
      const response = await api.delete(`/communication-logs/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Mark a communication as read
  markAsRead: async (id) => {
    try {
      // Validate ID
      if (!id) throw new Error('Communication log ID is required');
      
      const response = await api.put(`/communication-logs/${id}/read`, {});
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  // Get communication analytics
  getAnalytics: async (filters = {}) => {
    try {
      const sanitizedFilters = sanitizeData(filters);
      const response = await api.get('/communication-logs/analytics', {
        params: sanitizedFilters
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

export default communicationLogService;