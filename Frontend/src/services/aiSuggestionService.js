import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get AI suggestions for a specific lead
export const getAISuggestions = async (leadId) => {
  try {
    const response = await axios.get(`${API_URL}/ai-suggestions/${leadId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    throw error;
  }
};

// Send message to AI and get response
export const sendMessageToAI = async (leadId, message) => {
  try {
    const response = await axios.post(`${API_URL}/ai-suggestions/${leadId}/chat`, { message });
    return response.data;
  } catch (error) {
    console.error('Error sending message to AI:', error);
    throw error;
  }
};

// Apply AI suggestion to lead
export const applySuggestion = async (leadId, suggestionId) => {
  try {
    const response = await axios.post(`${API_URL}/ai-suggestions/${leadId}/apply`, { suggestionId });
    return response.data;
  } catch (error) {
    console.error('Error applying AI suggestion:', error);
    throw error;
  }
};