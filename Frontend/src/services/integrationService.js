import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fetch all external integrations
export const fetchIntegrations = async () => {
  try {
    const response = await axios.get(`${API_URL}/integrations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching integrations:', error);
    throw error;
  }
};

// Update integration settings
export const updateIntegration = async (integrationType, settings) => {
  try {
    const response = await axios.put(`${API_URL}/integrations/${integrationType}`, settings);
    return response.data;
  } catch (error) {
    console.error('Error updating integration:', error);
    throw error;
  }
};

// Toggle integration status
export const toggleIntegrationStatus = async (integrationType, isActive) => {
  try {
    const response = await axios.patch(`${API_URL}/integrations/${integrationType}/status`, { isActive });
    return response.data;
  } catch (error) {
    console.error('Error toggling integration status:', error);
    throw error;
  }
};

// Fetch recent imports from integration
export const fetchRecentImports = async (integrationType, limit = 5) => {
  try {
    const response = await axios.get(`${API_URL}/integrations/${integrationType}/imports?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent imports:', error);
    throw error;
  }
};