import api from '../../utils/api';

// Define the endpoint path
const ENDPOINT = '/audit-logs';

// Get all audit logs with filtering and pagination
const getAuditLogs = async (filters = {}) => {
  try {
    const { 
      entity_type, 
      entity_id, 
      action, 
      action_category,
      user_id,
      start_date,
      end_date,
      page = 1, 
      limit = 10 
    } = filters;

    let queryParams = new URLSearchParams();
    
    if (entity_type) queryParams.append('entity_type', entity_type);
    if (entity_id) queryParams.append('entity_id', entity_id);
    if (action) queryParams.append('action', action);
    if (action_category) queryParams.append('action_category', action_category);
    if (user_id) queryParams.append('user_id', user_id);
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);

    const response = await api.get(`${ENDPOINT}?${queryParams.toString()}`);

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get audit log by ID
const getAuditLogById = async (id) => {
  try {
    const response = await api.get(`${ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user activity
const getUserActivity = async (userId, filters = {}) => {
  try {
    const { start_date, end_date, limit } = filters;
    
    let queryParams = new URLSearchParams();
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (limit) queryParams.append('limit', limit);

    const response = await api.get(`${ENDPOINT}/user/${userId}/activity?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get entity history
const getEntityHistory = async (entityType, entityId, limit = 50) => {
  try {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit);

    const response = await api.get(`${ENDPOINT}/entity/${entityType}/${entityId}/history?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get system activity summary (Admin only)
const getSystemActivitySummary = async (filters = {}) => {
  try {
    const { start_date, end_date } = filters;
    
    let queryParams = new URLSearchParams();
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);

    const response = await api.get(`${ENDPOINT}/system/activity-summary?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get model-specific audit logs
const getModelActivityLogs = async (modelName, filters = {}) => {
  try {
    const { start_date, end_date, page = 1, limit = 20 } = filters;
    
    let queryParams = new URLSearchParams();
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);

    const response = await api.get(`${ENDPOINT}/models/${modelName}?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get audit analytics (Admin only)
const getAuditAnalytics = async (filters = {}) => {
  try {
    const { start_date, end_date, entity_type, action_category } = filters;
    
    let queryParams = new URLSearchParams();
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (entity_type) queryParams.append('entity_type', entity_type);
    if (action_category) queryParams.append('action_category', action_category);

    const response = await api.get(`${ENDPOINT}/analytics?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get most active users (Admin only)
const getMostActiveUsers = async (filters = {}) => {
  try {
    const { start_date, end_date, limit } = filters;
    
    let queryParams = new URLSearchParams();
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (limit) queryParams.append('limit', limit);

    const response = await api.get(`${ENDPOINT}/analytics/active-users?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export audit logs (Admin only)
const exportAuditLogs = async (filters = {}) => {
  try {
    const { start_date, end_date, format = 'json', entity_type } = filters;
    
    let queryParams = new URLSearchParams();
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    if (format) queryParams.append('format', format);
    if (entity_type) queryParams.append('entity_type', entity_type);

    const response = await api.get(`${ENDPOINT}/export?${queryParams.toString()}`, {
      responseType: format === 'csv' ? 'blob' : 'json',
      headers: {
        'Accept': format === 'csv' ? 'text/csv' : 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      throw new Error('You do not have permission to export audit logs. Please contact an administrator.');
    }
    throw error;
  }
};

const auditLogService = {
  getAuditLogs,
  getAuditLogById,
  getUserActivity,
  getEntityHistory,
  getSystemActivitySummary,
  getModelActivityLogs,
  getAuditAnalytics,
  getMostActiveUsers,
  exportAuditLogs
};

export default auditLogService;