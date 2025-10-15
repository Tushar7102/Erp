import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch all automation rules
export const fetchAutomationRules = async (type) => {
  try {
    const response = await axios.get(`${API_URL}/automation-rules?type=${type}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    throw error;
  }
};

// Create a new automation rule
export const createAutomationRule = async (ruleData) => {
  try {
    const response = await axios.post(`${API_URL}/automation-rules`, ruleData);
    return response.data;
  } catch (error) {
    console.error('Error creating automation rule:', error);
    throw error;
  }
};

// Update an existing automation rule
export const updateAutomationRule = async (ruleId, ruleData) => {
  try {
    const response = await axios.put(`${API_URL}/automation-rules/${ruleId}`, ruleData);
    return response.data;
  } catch (error) {
    console.error('Error updating automation rule:', error);
    throw error;
  }
};

// Delete an automation rule
export const deleteAutomationRule = async (ruleId) => {
  try {
    const response = await axios.delete(`${API_URL}/automation-rules/${ruleId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    throw error;
  }
};

// Toggle rule status (active/inactive)
export const toggleRuleStatus = async (ruleId, isActive) => {
  try {
    const response = await axios.patch(`${API_URL}/automation-rules/${ruleId}/status`, { isActive });
    return response.data;
  } catch (error) {
    console.error('Error toggling rule status:', error);
    throw error;
  }
};