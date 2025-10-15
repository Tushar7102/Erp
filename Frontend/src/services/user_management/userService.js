import api from '../../utils/api';

/**
 * User Management Service
 * Handles all user-related API operations
 */

class UserService {
  /**
   * Get all users with optional filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term for name/email
   * @param {string} params.role_name - Filter by role name
   * @param {boolean} params.is_active - Filter by active status
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise} API response with users data
   */
  async getUsers(params = {}) {
    try {
      const response = await api.get('/auth/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get a single user by ID
   * @param {string} userId - User ID
   * @returns {Promise} API response with user data
   */
  async getUser(userId) {
    try {
      const response = await api.get(`/auth/users/${userId}`);     
      const loginCount = await this.getLoginCount(userId);
      
      if (response.data && response.data.data) {
        response.data.data.login_count = loginCount;
      } else if (response.data) {
        response.data.login_count = loginCount;
      }
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.first_name - First name
   * @param {string} userData.last_name - Last name
   * @param {string} userData.email - Email address
   * @param {string} userData.phone - Phone number
   * @param {string} userData.role_name - Role name
   * @param {string} userData.password - Password (optional)
   * @returns {Promise} API response with created user data
   */
  async createUser(userData) {
    try {
      const response = await api.post('/auth/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing user
   * @param {string} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} API response with updated user data
   */
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/auth/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Activate a user
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  async activateUser(userId) {
    try {
      const response = await api.put(`/auth/users/${userId}/activate`);
      return response.data;
    } catch (error) {
      console.error('Error activating user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Deactivate a user
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  async deactivateUser(userId) {
    try {
      const response = await api.put(`/auth/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user login history
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with login history
   */
  async getUserLoginHistory(userId, params = {}) {
    try {
      const response = await api.get(`/auth/users/${userId}/login-history`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user login history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get active sessions
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with active sessions
   */
  async getActiveSessions(params = {}) {
    try {
      const response = await api.get('/auth/sessions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Revoke a session
   * @param {string} sessionId - Session ID
   * @returns {Promise} API response
   */
  async revokeSession(sessionId) {
    try {
      const response = await api.put(`/auth/sessions/${sessionId}/revoke`);
      return response.data;
    } catch (error) {
      console.error('Error revoking session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get available roles
   * @returns {Promise} API response with roles data
   */
  async getRoles() {
    try {
      const response = await api.get('/api/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get login attempts for a specific user
   * @param {string} userId - User ID to fetch login attempts for
   * @param {Object} params - Additional query parameters
   * @returns {Promise} API response with login attempt data
   */
  async getLoginAttempts(userId, params = {}) {
    try {
      const queryParams = { 
        ...params,
        userId,
        status: 'success'
      };
      
      const response = await api.get('/auth/login-attempts', { params: queryParams });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  /**
   * Get login count for a specific user
   * @param {string} userId - User ID to fetch login count for
   * @returns {Promise<number>} Number of successful login attempts
   */
  async getLoginCount(userId) {
    if (!userId) {
      return 0;
    }
    
    try {
      const loginData = await this.getLoginAttempts(userId, { limit: 100 });
      
      if (loginData && typeof loginData.total === 'number') {
        return loginData.total;
      } else if (loginData && loginData.data && Array.isArray(loginData.data)) {
        return loginData.data.length;
      } else if (Array.isArray(loginData)) {
        return loginData.length;
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Transform backend user data to frontend format
   * @param {Object} backendUser - User data from backend
   * @returns {Object} Transformed user data
   */
  transformUserData(backendUser) {
    // Extract role information from populated role_id field
    const roleData = backendUser.role_id || {};
    const roleName = roleData.role_name || 'Unknown';

    // Extract team information from populated team_id field
    const teamData = backendUser.team_id || {};
    const teamName = teamData.name || (typeof backendUser.team_id === 'string' ? 'Team ' + backendUser.team_id : 'Not assigned');
    
    return {
      user_id: backendUser._id,
      username: backendUser.username || `${backendUser.first_name}${backendUser.last_name}`.toLowerCase(),
      email: backendUser.email,
      phone: backendUser.phone,
      status: backendUser.is_active ? 'Active' : 'Inactive',
      role: roleName, // Keep for backward compatibility
      role_assignment: {
        role_name: roleName,
        description: roleData.description || '',
        permissions: roleData.permissions || {},
        _id: roleData._id || null
      },
      created_at: backendUser.created_at ? new Date(backendUser.created_at).toISOString().split('T')[0] : null,
      last_login: backendUser.last_login ? new Date(backendUser.last_login).toLocaleString() : 'Never',
      updated_at: backendUser.updated_at ? new Date(backendUser.updated_at).toISOString() : null,
      firstName: backendUser.first_name,
      lastName: backendUser.last_name,
      department: backendUser.department || 'Not specified',
      team: teamName,
      team_id: backendUser.team_id?._id || backendUser.team_id || null,
      twoFactorEnabled: backendUser.two_factor_enabled || false,
      loginCount: backendUser.login_count || 0,
      // Additional fields for compatibility
      _id: backendUser._id,
      role_id: backendUser.role_id,
      is_active: backendUser.is_active,
      first_name: backendUser.first_name,
      last_name: backendUser.last_name
    };
  }

  /**
   * Transform frontend user data to backend format
   * @param {Object} frontendUser - User data from frontend
   * @returns {Object} Transformed user data for backend
   */
  transformUserDataForBackend(frontendUser) {
    // Extract role name from frontendUser data with improved handling
    let roleName = null;
    
    // Check all possible role formats in priority order
    if (frontendUser.role_assignment && frontendUser.role_assignment.role_name) {
      roleName = frontendUser.role_assignment.role_name;
    } else if (frontendUser.role && typeof frontendUser.role === 'object' && frontendUser.role.role_name) {
      roleName = frontendUser.role.role_name;
    } else if (frontendUser.role && typeof frontendUser.role === 'string') {
      roleName = frontendUser.role;
    } else if (frontendUser.role_id && typeof frontendUser.role_id === 'object' && frontendUser.role_id.role_name) {
      roleName = frontendUser.role_id.role_name;
    }
    
    // Handle team_id from either team_id or team property
    const teamId = frontendUser.team_id || frontendUser.team || null;
    
    return {
      username: frontendUser.username,
      first_name: frontendUser.firstName || frontendUser.first_name,
      last_name: frontendUser.lastName || frontendUser.last_name,
      email: frontendUser.email,
      phone: frontendUser.phone,
      role_name: roleName,
      password: frontendUser.password,
      department: frontendUser.department,
      team_id: teamId
    };
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - API error
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      const status = error.response.status;
      const errorObj = new Error(`${message} (Status: ${status})`);
      
      // Add additional context for specific error codes
      if (status === 400) {
        errorObj.userMessage = 'Invalid request data. Please check your input and try again.';
      } else if (status === 401) {
        errorObj.userMessage = 'Authentication required. Please log in again.';
      } else if (status === 403) {
        errorObj.userMessage = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        errorObj.userMessage = 'The requested resource was not found.';
      } else if (status === 409) {
        errorObj.userMessage = 'This operation caused a conflict. The resource may already exist.';
      } else if (status >= 500) {
        errorObj.userMessage = 'A server error occurred. Please try again later or contact support.';
      } else {
        errorObj.userMessage = 'An error occurred while processing your request.';
      }
      
      // Add response data for debugging
      errorObj.responseData = error.response.data;
      return errorObj;
    } else if (error.request) {
      // Request was made but no response received
      const errorObj = new Error('Network error: Unable to connect to server');
      errorObj.userMessage = 'Connection to server failed. Please check your internet connection and try again.';
      errorObj.isNetworkError = true;
      return errorObj;
    } else {
      // Something else happened
      const errorObj = new Error(error.message || 'An unexpected error occurred');
      errorObj.userMessage = 'Something went wrong. Please try again or contact support.';
      return errorObj;
    }
  }
}

// Export singleton instance
export default new UserService();
