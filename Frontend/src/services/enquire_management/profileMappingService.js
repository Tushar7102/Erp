import api from '../../utils/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Configure request headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    }
  };
};

// Get all profile mappings
export const getProfileMappings = async (page = 1, limit = 10, filters = {}) => {
  try {
    let queryString = `?page=${page}&limit=${limit}`;
    
    // Add filters to query string
    if (filters.name) queryString += `&name=${filters.name}`;
    if (filters.source_profile) queryString += `&source_profile=${filters.source_profile}`;
    if (filters.target_profile) queryString += `&target_profile=${filters.target_profile}`;
    if (filters.is_active === 'active') queryString += `&is_active=true`;
    if (filters.is_active === 'inactive') queryString += `&is_active=false`;
    
    const response = await api.get(
      `/profiles/mappings/${queryString}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get single profile mapping
export const getProfileMapping = async (id) => {
  try {
    const response = await api.get(
      `/profiles/mappings/${id}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new profile mapping
export const createProfileMapping = async (mappingData) => {
  try {
    const response = await api.post(
      '/profiles/mappings',
      mappingData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update profile mapping
export const updateProfileMapping = async (id, mappingData) => {
  try {
    const response = await api.put(
      `/profiles/mappings/${id}`,
      mappingData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete profile mapping
export const deleteProfileMapping = async (id) => {
  try {
    const response = await api.delete(
      `/profiles/mappings/${id}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get profile mappings by enquiry
export const getProfileMappingsByEnquiry = async (enquiryId) => {
  try {
    const response = await api.get(
      `/profiles/mappings/enquiry/${enquiryId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get profile mappings by profile
export const getProfileMappingsByProfile = async (profileType, profileId) => {
  try {
    const response = await api.get(
      `/profiles/mappings/profile/${profileType}/${profileId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Run a profile mapping rule
export const runProfileMappingRule = async (id) => {
  try {
    const response = await api.post(
      `/profiles/mappings/${id}/run`,
      {},
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Toggle profile mapping status (activate/deactivate)
export const toggleProfileMappingStatus = async (id, isActive) => {
  try {
    const response = await api.patch(
      `/profiles/mappings/${id}/status`,
      { is_active: isActive },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};