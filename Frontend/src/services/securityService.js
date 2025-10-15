import axios from 'axios';
import { handleResponse, handleError } from './utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Security Rules API calls
export const getSecurityRules = async (queryParams = '') => {
  try {
    const response = await axios.get(`${API_URL}/security/rules${queryParams}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const getSecurityRule = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/security/rules/${id}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const createSecurityRule = async (ruleData) => {
  try {
    const response = await axios.post(`${API_URL}/security/rules`, ruleData);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const updateSecurityRule = async (id, ruleData) => {
  try {
    const response = await axios.put(`${API_URL}/security/rules/${id}`, ruleData);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const deleteSecurityRule = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/security/rules/${id}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const testSecurityRule = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/security/rules/${id}/test`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const toggleRuleStatus = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/security/rules/${id}/toggle`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// Security Alerts API calls
export const getSecurityAlerts = async (queryParams = '') => {
  try {
    const response = await axios.get(`${API_URL}/security/alerts${queryParams}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const getActiveAlerts = async () => {
  try {
    const response = await axios.get(`${API_URL}/security/alerts/active`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

export const resolveAlert = async (id, resolutionData) => {
  try {
    const response = await axios.put(`${API_URL}/security/alerts/${id}/resolve`, resolutionData);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// Security Logs API calls
export const getSecurityLogs = async (queryParams = '') => {
  try {
    const response = await axios.get(`${API_URL}/security/logs${queryParams}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// Security Stats API calls
export const getSecurityStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/security/stats`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// Helper function to format query parameters
export const formatQueryParams = ({
  page = 1,
  limit = 10,
  sort = '-createdAt',
  status,
  type,
  priority,
  search
}) => {
  let queryParams = `?page=${page}&limit=${limit}&sort=${sort}`;
  
  if (status) queryParams += `&status=${status}`;
  if (type) queryParams += `&type=${type}`;
  if (priority) queryParams += `&priority=${priority}`;
  if (search) queryParams += `&search=${search}`;
  
  return queryParams;
};