import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || '';
      
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show specific message for session termination
      if (errorMessage.includes('session has been terminated')) {
        // Store the message to show on login page
        localStorage.setItem('sessionMessage', 'Your session has been terminated by an administrator. Please login again.');
      } else if (errorMessage.includes('session has expired')) {
        localStorage.setItem('sessionMessage', 'Your session has expired. Please login again.');
      } else if (errorMessage.includes('Session not found')) {
        localStorage.setItem('sessionMessage', 'Your session is invalid. Please login again.');
      }
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/forgot-password') && 
          !window.location.pathname.includes('/reset-password')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;