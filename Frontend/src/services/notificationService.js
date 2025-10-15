import axios from 'axios';

// For Vite, use import.meta.env instead of process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Configure axios with auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    }
  };
};

// Get all notifications with optional filters
export const getNotifications = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/notifications`, { 
      params,
      ...getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get unread notifications count
export const getUnreadCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications/unread/count`, getAuthHeaders());
    return response.data.count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Mark a notification as read
export const markAsRead = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await axios.patch(`${API_URL}/notifications/read/all`, {}, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/notifications/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  try {
    const response = await axios.delete(`${API_URL}/notifications/all`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

// Get notification analytics
export const getNotificationAnalytics = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/notifications/analytics`, { 
      params,
      ...getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    throw error;
  }
};