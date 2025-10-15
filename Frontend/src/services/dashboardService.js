import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch KPI summary data
export const fetchKPISummary = async (dateRange, teamId) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/kpi-summary`, {
      params: { startDate: dateRange[0], endDate: dateRange[1], teamId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching KPI summary:', error);
    throw error;
  }
};

// Fetch agent performance data
export const fetchAgentPerformance = async (dateRange, teamId) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/agent-performance`, {
      params: { startDate: dateRange[0], endDate: dateRange[1], teamId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    throw error;
  }
};

// Fetch lead source performance data
export const fetchLeadSourcePerformance = async (dateRange, teamId) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/lead-source-performance`, {
      params: { startDate: dateRange[0], endDate: dateRange[1], teamId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching lead source performance:', error);
    throw error;
  }
};

// Fetch trend analysis data
export const fetchTrendAnalysis = async (dateRange, teamId) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/trend-analysis`, {
      params: { startDate: dateRange[0], endDate: dateRange[1], teamId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trend analysis:', error);
    throw error;
  }
};

// Fetch SLA compliance data
export const fetchSLACompliance = async (dateRange, teamId) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/sla-compliance`, {
      params: { startDate: dateRange[0], endDate: dateRange[1], teamId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching SLA compliance:', error);
    throw error;
  }
};