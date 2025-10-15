import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Get all security logs
export const getSecurityLogs = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/audit-logs`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch security logs' };
  }
};

// Get security logs by entity
export const getSecurityLogsByEntity = async (entityId, params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/audit-logs/entity/${entityId}`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch security logs by entity' };
  }
};

// Get security logs by user
export const getSecurityLogsByUser = async (userId, params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/audit-logs/user/${userId}`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch security logs by user' };
  }
};

// Get security logs by action
export const getSecurityLogsByAction = async (action, params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/audit-logs/action/${action}`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch security logs by action' };
  }
};

// Get high risk security logs
export const getHighRiskSecurityLogs = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/audit-logs/high-risk`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch high risk security logs' };
  }
};

// Export security logs
export const exportSecurityLogs = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/audit-logs/export`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to export security logs' };
  }
};