import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch deduplication settings
export const fetchDeduplicationSettings = async () => {
  try {
    const response = await axios.get(`${API_URL}/deduplication/settings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching deduplication settings:', error);
    throw error;
  }
};

// Update deduplication settings
export const updateDeduplicationSettings = async (settings) => {
  try {
    const response = await axios.put(`${API_URL}/deduplication/settings`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating deduplication settings:', error);
    throw error;
  }
};

// Fetch matching rules
export const fetchMatchingRules = async () => {
  try {
    const response = await axios.get(`${API_URL}/deduplication/matching-rules`);
    return response.data;
  } catch (error) {
    console.error('Error fetching matching rules:', error);
    throw error;
  }
};

// Create matching rule
export const createMatchingRule = async (rule) => {
  try {
    const response = await axios.post(`${API_URL}/deduplication/matching-rules`, rule);
    return response.data;
  } catch (error) {
    console.error('Error creating matching rule:', error);
    throw error;
  }
};

// Update matching rule
export const updateMatchingRule = async (ruleId, rule) => {
  try {
    const response = await axios.put(`${API_URL}/deduplication/matching-rules/${ruleId}`, rule);
    return response.data;
  } catch (error) {
    console.error('Error updating matching rule:', error);
    throw error;
  }
};

// Delete matching rule
export const deleteMatchingRule = async (ruleId) => {
  try {
    const response = await axios.delete(`${API_URL}/deduplication/matching-rules/${ruleId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting matching rule:', error);
    throw error;
  }
};