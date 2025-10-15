import api from '../../utils/api';

const BASE_URL = '/api/info-profiles';

// Get all info profiles with optional filtering
export const getInfoProfiles = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params if they exist
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`${BASE_URL}${queryString}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get a single info profile by ID
export const getInfoProfileById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new info profile
export const createInfoProfile = async (profileData) => {
  try {
    const response = await api.post(BASE_URL, profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update an existing info profile
export const updateInfoProfile = async (id, profileData) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}`, profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete an info profile
export const deleteInfoProfile = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update info profile status
export const updateInfoProfileStatus = async (id, status) => {
  try {
    const response = await api.patch(`${BASE_URL}/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get actions for an info profile
export const getInfoProfileActions = async (infoProfileId) => {
  try {
    const response = await api.get(`${BASE_URL}/${infoProfileId}/actions`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get responses for an info profile
export const getInfoProfileResponses = async (infoProfileId) => {
  try {
    const response = await api.get(`${BASE_URL}/${infoProfileId}/responses`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add a response to an info profile
export const addInfoProfileResponse = async (infoProfileId, responseData) => {
  try {
    const response = await api.post(`${BASE_URL}/${infoProfileId}/responses`, responseData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get attachments for an info profile
export const getInfoProfileAttachments = async (infoProfileId) => {
  try {
    const response = await api.get(`${BASE_URL}/${infoProfileId}/attachments`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Upload attachment to an info profile
export const uploadInfoProfileAttachment = async (infoProfileId, formData) => {
  try {
    const response = await api.post(`${BASE_URL}/${infoProfileId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getInfoProfiles,
  getInfoProfileById,
  createInfoProfile,
  updateInfoProfile,
  deleteInfoProfile,
  updateInfoProfileStatus,
  getInfoProfileActions,
  getInfoProfileResponses,
  addInfoProfileResponse,
  getInfoProfileAttachments,
  uploadInfoProfileAttachment,
};