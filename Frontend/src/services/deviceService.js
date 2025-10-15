import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/devices`;

// Get all devices (admin only)
export const getAllDevices = async () => {
  try {
    const response = await axios.get(API, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch devices' };
  }
};

// Get user devices
export const getUserDevices = async (userId) => {
  try {
    const response = await axios.get(`${API}/user/${userId || ''}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch user devices' };
  }
};

// Get device by ID
export const getDeviceById = async (id) => {
  try {
    const response = await axios.get(`${API}/${id}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch device' };
  }
};

// Register a device
export const registerDevice = async (deviceData) => {
  try {
    const response = await axios.post(API, deviceData, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to register device' };
  }
};

// Update device
export const updateDevice = async (id, deviceData) => {
  try {
    const response = await axios.put(`${API}/${id}`, deviceData, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update device' };
  }
};

// Delete device
export const deleteDevice = async (id) => {
  try {
    const response = await axios.delete(`${API}/${id}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete device' };
  }
};

// Trust device
export const trustDevice = async (id) => {
  try {
    const response = await axios.put(`${API}/${id}/trust`, {}, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to trust device' };
  }
};

// Block device
export const blockDevice = async (id, reason) => {
  try {
    const response = await axios.put(`${API}/${id}/block`, { reason }, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to block device' };
  }
};

// Unblock device (admin only)
export const unblockDevice = async (id) => {
  try {
    const response = await axios.put(`${API}/${id}/unblock`, {}, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to unblock device' };
  }
};

// Get current device
export const getCurrentDevice = async (deviceFingerprint) => {
  try {
    const response = await axios.get(`${API}/current`, {
      withCredentials: true,
      data: { device_fingerprint: deviceFingerprint }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to get current device' };
  }
};