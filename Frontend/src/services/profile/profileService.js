import api from '../../utils/api';

// Get profiles by type (project, product, amc, complaint)
export const getProfilesByType = async (profileType) => {
  try {
    console.log(`Fetching profiles for type: ${profileType}`);
    const response = await api.get(`/profiles/${profileType}`);
    console.log(`API Response for ${profileType}:`, response);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${profileType} profiles:`, error);
    throw error;
  }
};

// Get a specific profile by type and ID
export const getProfileById = async (profileType, profileId) => {
  try {
    const response = await api.get(`/profiles/${profileType}/${profileId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${profileType} profile:`, error);
    throw error;
  }
};