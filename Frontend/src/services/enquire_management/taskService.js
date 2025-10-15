import api from '../../utils/api';
import { AES, enc } from 'crypto-js';

/**
 * Task Management Service
 * Handles all task-related API operations with secure authentication
 */
class TaskService {
  constructor() {
    // Encryption key for sensitive data
    this.encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secure-key-12345';
  }

  /**
   * Encrypt sensitive data before sending to server
   * @param {Object} data - Data to encrypt
   * @returns {Object} - Data with sensitive fields encrypted
   */
  encryptSensitiveData(data) {
    // Clone the data to avoid modifying the original
    const secureData = { ...data };
    
    // Encrypt sensitive fields if they exist
    if (secureData.description) {
      secureData.description = AES.encrypt(secureData.description, this.encryptionKey).toString();
    }
    
    return secureData;
  }

  /**
   * Get all tasks with optional filtering
   * @param {Object} params - Query parameters for filtering tasks
   * @returns {Promise} - Promise with task data
   */
  async getTasks(params = {}) {
    try {
      const response = await api.get('/tasks', { params });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching tasks');
    }
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task data to create
   * @returns {Promise} - Promise with created task
   */
  async createTask(taskData) {
    try {
      // Ensure assigned_by is set if not already present
      if (!taskData.assigned_by) {
        const authUser = JSON.parse(localStorage.getItem('user'));
        if (authUser && (authUser._id || authUser.id)) {
          taskData.assigned_by = authUser._id || authUser.id;
        }
      }
      
      // Encrypt sensitive data before sending
      const secureTaskData = this.encryptSensitiveData(taskData);
      const response = await api.post('/tasks', secureTaskData);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error creating task');
    }
  }

  /**
   * Update an existing task
   * @param {string} taskId - ID of task to update
   * @param {Object} taskData - Updated task data
   * @returns {Promise} - Promise with updated task
   */
  async updateTask(taskId, taskData) {
    try {
      // Encrypt sensitive data before sending
      const secureTaskData = this.encryptSensitiveData(taskData);
      const response = await api.put(`/tasks/${taskId}`, secureTaskData);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error updating task');
    }
  }

  /**
   * Delete a task
   * @param {string} taskId - ID of task to delete
   * @returns {Promise} - Promise with deletion result
   */
  async deleteTask(taskId) {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error deleting task');
    }
  }

  /**
   * Get tasks related to a specific enquiry
   * @param {string} enquiryId - ID of the enquiry
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Promise with enquiry tasks
   */
  async getEnquiryTasks(enquiryId, params = {}) {
    try {
      const response = await api.get(`/tasks/enquiry/${enquiryId}`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching enquiry tasks');
    }
  }

  /**
   * Get tasks assigned to a specific user
   * @param {string} userId - ID of the user
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Promise with user tasks
   */
  async getUserTasks(userId, params = {}) {
    try {
      const response = await api.get(`/tasks/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching user tasks');
    }
  }

  /**
   * Get overdue tasks
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Promise with overdue tasks
   */
  async getOverdueTasks(params = {}) {
    try {
      const response = await api.get('/tasks/overdue', { params });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching overdue tasks');
    }
  }

  /**
   * Add a comment to a task
   * @param {string} taskId - ID of the task
   * @param {Object} commentData - Comment data
   * @returns {Promise} - Promise with comment result
   */
  async addTaskComment(taskId, commentData) {
    try {
      // Encrypt comment content for security
      const secureCommentData = {
        ...commentData,
        content: commentData.content ? 
          AES.encrypt(commentData.content, this.encryptionKey).toString() : 
          commentData.content
      };
      
      const response = await api.post(`/tasks/${taskId}/comments`, secureCommentData);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error adding task comment');
    }
  }

  /**
   * Get comments for a task
   * @param {string} taskId - ID of the task
   * @returns {Promise} - Promise with task comments
   */
  async getTaskComments(taskId) {
    try {
      const response = await api.get(`/tasks/${taskId}/comments`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching task comments');
    }
  }

  /**
   * Assign a task to a user
   * @param {string} taskId - ID of the task
   * @param {string} userId - ID of the user
   * @returns {Promise} - Promise with assignment result
   */
  async assignTask(taskId, userId) {
    try {
      const response = await api.put(`/tasks/${taskId}/assign`, { userId });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error assigning task');
    }
  }

  /**
   * Get task analytics data
   * @param {Object} params - Query parameters for analytics
   * @returns {Promise} - Promise with analytics data
   */
  async getTaskAnalytics(params = {}) {
    try {
      const response = await api.get('/tasks/analytics', { params });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Error fetching task analytics');
    }
  }

  /**
   * Centralized error handler with security logging
   * @param {Error} error - The error object
   * @param {string} defaultMessage - Default error message
   * @throws {Error} - Rethrows with appropriate message
   */
  handleError(error, defaultMessage = 'An error occurred') {
    // Log security-related errors
    if (error.response?.status === 401) {
      console.error('Authentication error in task service:', error.response?.data?.message || 'Unauthorized');
      // Clear credentials on authentication failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?session=expired';
      throw new Error('Your session has expired. Please log in again.');
    }

    if (error.response?.status === 403) {
      console.error('Permission denied in task service:', error.response?.data?.message || 'Forbidden');
      throw new Error('You do not have permission to perform this action.');
    }

    // Handle validation errors
    if (error.response?.status === 400) {
      console.error('Validation error in task service:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Invalid input data');
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error in task service:', error);
      throw new Error('Server error. Please try again later.');
    }

    // Handle network errors
    if (error.request && !error.response) {
      console.error('Network error in task service:', error);
      throw new Error('Network error. Please check your connection.');
    }

    // Default error handling
    console.error(`${defaultMessage}:`, error);
    throw new Error(error.response?.data?.message || defaultMessage);
  }
}

export default new TaskService();