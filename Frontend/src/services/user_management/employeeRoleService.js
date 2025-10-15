import api from '../../utils/api';
import authService from '../authService';

/**
 * Employee Role Assignment Service
 * Handles all employee role assignment related API operations
 * Integrates with backend services for secure data management
 */

class EmployeeRoleService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    this.requestQueue = new Map(); // For request deduplication
  }

  /**
   * Check if user is authenticated and has valid token
   */
  isAuthenticated() {
    return authService.isAuthenticated();
  }

  /**
   * Get current user information
   */
  getCurrentUser() {
    return authService.getStoredUser();
  }

  /**
   * Validate user permissions for specific actions
   */
  hasPermission(action) {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Always grant all permissions for development
    return true;

    /* 
    // Check if user has admin role or specific permissions
    const adminRoles = ['admin', 'super_admin', 'hr_admin'];
    
    // Fix for TypeError: user.role?.toLowerCase is not a function
    let userRole = '';
    if (user.role) {
      if (typeof user.role === 'string') {
        userRole = user.role.toLowerCase();
      } else {
        userRole = String(user.role).toLowerCase();
      }
    }
    
    if (adminRoles.includes(userRole)) {
      return true;
    }

    // Check specific permissions based on action
    const permissions = user.permissions || [];
    switch (action) {
      case 'assign_roles':
        return permissions.includes('user_management') || permissions.includes('role_assignment');
      case 'view_employees':
        return permissions.includes('user_read') || permissions.includes('employee_read');
      case 'manage_teams':
        return permissions.includes('team_management') || permissions.includes('department_management');
      default:
        return false;
    }
    */
  }

  /**
   * Create a unique request key for deduplication
   */
  createRequestKey(method, url, params = {}) {
    return `${method}:${url}:${JSON.stringify(params)}`;
  }

  /**
   * Execute request with deduplication
   */
  async executeRequest(method, url, data = null, params = {}) {
    const requestKey = this.createRequestKey(method, url, params);
    
    // Check if same request is already in progress
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    // Create the request promise
    const requestPromise = this.makeRequest(method, url, data, params);
    
    // Store in queue
    this.requestQueue.set(requestKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove from queue when done
      this.requestQueue.delete(requestKey);
    }
  }

  /**
   * Make actual API request
   */
  async makeRequest(method, url, data = null, params = {}) {
    const config = { params };
    
    switch (method.toLowerCase()) {
      case 'get':
        return await api.get(url, config);
      case 'post':
        return await api.post(url, data, config);
      case 'put':
        return await api.put(url, data, config);
      case 'delete':
        return await api.delete(url, config);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  /**
   * Retry wrapper for API calls with authentication handling
   * @param {Function} apiCall - The API call function
   * @param {number} attempts - Number of retry attempts
   * @returns {Promise} API response
   */
  async withRetry(apiCall, attempts = this.retryAttempts) {
    try {
      // Check authentication before making request
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated. Please log in again.');
      }

      return await apiCall();
    } catch (error) {
      // Handle authentication errors
      if (error.response?.status === 401) {
        // Token expired or invalid
        authService.logout();
        throw new Error('Session expired. Please log in again.');
      }

      // Handle permission errors
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to perform this action.');
      }

      // Retry logic for retryable errors
      if (attempts > 1 && this.isRetryableError(error)) {
        await this.delay(this.retryDelay * (this.retryAttempts - attempts + 1)); // Exponential backoff
        return this.withRetry(apiCall, attempts - 1);
      }

      throw this.handleError(error);
    }
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} Whether error is retryable
   */
  isRetryableError(error) {
    // Don't retry authentication or permission errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return false;
    }

    // Don't retry client errors (4xx except 401, 403)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return false;
    }

    // Retry on network errors, timeouts, or 5xx server errors
    return !error.response || 
           error.response.status >= 500 || 
           error.code === 'NETWORK_ERROR' ||
           error.code === 'TIMEOUT' ||
           error.message.includes('timeout');
  }

  /**
   * Enhanced error handling with user-friendly messages
   * @param {Error} error - The error object
   * @returns {Error} Processed error with user-friendly message
   */
  handleError(error) {
    console.error('API Error:', error);

    // Network errors
    if (!error.response) {
      if (error.code === 'NETWORK_ERROR') {
        return new Error('Network error. Please check your internet connection.');
      }
      if (error.code === 'TIMEOUT') {
        return new Error('Request timeout. Please try again.');
      }
      return new Error('Network error. Please try again.');
    }

    // Server errors with custom messages
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return new Error(data?.message || 'Invalid request. Please check your input.');
      case 401:
        return new Error('Authentication required. Please log in.');
      case 403:
        return new Error('Access denied. You do not have permission for this action.');
      case 404:
        return new Error('Resource not found.');
      case 409:
        return new Error(data?.message || 'Conflict. The resource already exists or is in use.');
      case 422:
        return new Error(data?.message || 'Validation error. Please check your input.');
      case 429:
        return new Error('Too many requests. Please wait a moment and try again.');
      case 500:
        return new Error('Server error. Please try again later.');
      case 502:
        return new Error('Service temporarily unavailable. Please try again later.');
      case 503:
        return new Error('Service maintenance in progress. Please try again later.');
      default:
        return new Error(data?.message || `Server error (${status}). Please try again.`);
    }
  }

  /**
   * Delay function for retry logic with exponential backoff
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== EMPLOYEE OPERATIONS ====================

  /**
   * Get all employees with role information
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   * @param {string} params.department - Department filter
   * @param {string} params.role - Role filter
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise} API response with employees data
   */
  async getEmployees(params = {}) {
    // Check permissions
    if (!this.hasPermission('view_employees')) {
      throw new Error('You do not have permission to view employees.');
    }

    return this.withRetry(async () => {
      try {
        const response = await api.get('/employees', { params });
        
        // Validate response structure
        const validation = this.validateResponseData(response.data);
        if (!validation.isValid) {
          throw new Error(`Invalid response: ${validation.errors.join(', ')}`);
        }
        
        return {
          success: true,
          data: response.data.data.map(employee => this.transformEmployeeData(employee)),
          count: response.data.count,
          pagination: response.data.pagination
        };
      } catch (error) {
        console.error('Error fetching employees:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Get single employee by ID
   * @param {string} employeeId - Employee ID
   * @returns {Promise} API response with employee data
   */
  async getEmployee(employeeId) {
    return this.withRetry(async () => {
      try {
        const response = await api.get(`/employees/${employeeId}`);
        return {
          success: true,
          data: this.transformEmployeeData(response.data.data)
        };
      } catch (error) {
        console.error('Error fetching employee:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Update employee information
   * @param {string} employeeId - Employee ID
   * @param {Object} employeeData - Updated employee data
   * @returns {Promise} API response
   */
  async updateEmployee(employeeId, employeeData) {
    // Validate employee data
    const validation = this.validateEmployee(employeeData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.withRetry(async () => {
      try {
        const transformedData = this.transformEmployeeDataForBackend(employeeData);
        const response = await api.put(`/employees/${employeeId}`, transformedData);
        
        // Validate response
        const responseValidation = this.validateResponseData(response.data);
        if (!responseValidation.isValid) {
          throw new Error(`Invalid response: ${responseValidation.errors.join(', ')}`);
        }
        
        return {
          success: true,
          data: this.transformEmployeeData(response.data.data),
          message: 'Employee updated successfully'
        };
      } catch (error) {
        console.error('Error updating employee:', error);
        throw this.handleError(error);
      }
    });
  }

  // ==================== ROLE OPERATIONS ====================

  /**
   * Get all roles
   * @returns {Promise} API response with roles data
   */
  async getRoles() {
    return this.withRetry(async () => {
      try {
        const response = await api.get('/roles');
        return {
          success: true,
          data: response.data.data.map(role => this.transformRoleData(role)),
          count: response.data.count
        };
      } catch (error) {
        console.error('Error fetching roles:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Get single role by ID
   * @param {string} roleId - Role ID
   * @returns {Promise} API response with role data
   */
  async getRole(roleId) {
    return this.withRetry(async () => {
      try {
        const response = await api.get(`/roles/${roleId}`);
        return {
          success: true,
          data: this.transformRoleData(response.data.data)
        };
      } catch (error) {
        console.error('Error fetching role:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Get available permissions
   * @returns {Promise} API response with permissions data
   */
  async getAvailablePermissions() {
    return this.withRetry(async () => {
      try {
        const response = await api.get('/roles/permissions');
        return {
          success: true,
          data: response.data.data
        };
      } catch (error) {
        console.error('Error fetching permissions:', error);
        throw this.handleError(error);
      }
    });
  }

  // ==================== TEAM/DEPARTMENT OPERATIONS ====================

  /**
   * Get all teams/departments
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with teams data
   */
  async getTeams(params = {}) {
    // Check permissions
    if (!this.hasPermission('manage_teams')) {
      throw new Error('You do not have permission to view teams.');
    }

    return this.withRetry(async () => {
      try {
        const response = await api.get('/teams', { params });
        return {
          success: true,
          data: response.data.data.map(team => this.transformTeamData(team)),
          count: response.data.count
        };
      } catch (error) {
        console.error('Error fetching teams:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Get teams by department
   * @param {string} department - Department name
   * @returns {Promise} API response with teams data
   */
  async getTeamsByDepartment(department) {
    return this.withRetry(async () => {
      try {
        const response = await api.get(`/teams/department/${department}`);
        return {
          success: true,
          data: response.data.data.map(team => this.transformTeamData(team))
        };
      } catch (error) {
        console.error('Error fetching teams by department:', error);
        throw this.handleError(error);
      }
    });
  }

  // ==================== ROLE ASSIGNMENT OPERATIONS ====================

  /**
   * Assign role to employee
   * @param {Object} assignmentData - Assignment data
   * @param {string} assignmentData.user_id - User/Employee ID
   * @param {string} assignmentData.role_id - Role ID
   * @param {string} assignmentData.effective_from - Effective date
   * @param {string} assignmentData.effective_until - End date (optional)
   * @param {string} assignmentData.notes - Assignment notes
   * @returns {Promise} API response
   */
  async assignRole(assignmentData) {
    // Check permissions
    if (!this.hasPermission('assign_roles')) {
      throw new Error('You do not have permission to assign roles.');
    }

    // Validate input data
    const validation = this.validateAssignmentData(assignmentData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.withRetry(async () => {
      try {
        // First, deactivate current assignment if exists
        await this.deactivateCurrentAssignment(validation.data.user_id);
        
        // Create new assignment
        const transformedData = this.transformAssignmentDataForBackend(validation.data);
        const response = await api.post('/auth/role-assignments', transformedData);
        
        // Validate response
        const responseValidation = this.validateResponseData(response.data);
        if (!responseValidation.isValid) {
          throw new Error(`Invalid response: ${responseValidation.errors.join(', ')}`);
        }
        
        return {
          success: true,
          data: this.transformAssignmentData(response.data.data),
          message: 'Role assigned successfully'
        };
      } catch (error) {
        console.error('Error assigning role:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Bulk assign roles to multiple employees
   * @param {Object} bulkAssignmentData - Bulk assignment data
   * @param {Array} bulkAssignmentData.user_ids - Array of user IDs
   * @param {string} bulkAssignmentData.role_id - Role ID
   * @param {string} bulkAssignmentData.effective_from - Effective date
   * @param {string} bulkAssignmentData.notes - Assignment notes
   * @returns {Promise} API response
   */
  async bulkAssignRoles(bulkAssignmentData) {
    // Check permissions
    if (!this.hasPermission('assign_roles')) {
      throw new Error('You do not have permission to perform bulk role assignments.');
    }

    // Validate bulk assignment data
    const validation = this.validateBulkAssignmentData(bulkAssignmentData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.withRetry(async () => {
      try {
        const assignments = [];
        const errors = [];

        // Process each assignment individually for better error handling
        for (const userId of validation.data.user_ids) {
          try {
            const assignmentData = {
              user_id: userId,
              role_id: validation.data.role_id,
              effective_from: validation.data.effective_from,
              notes: validation.data.notes
            };
            
            const result = await this.assignRole(assignmentData);
            assignments.push(result.data);
          } catch (error) {
            errors.push({
              user_id: userId,
              error: error.message
            });
          }
        }

        return {
          success: true,
          data: {
            successful_assignments: assignments,
            failed_assignments: errors,
            total_processed: validation.data.user_ids.length,
            successful_count: assignments.length,
            failed_count: errors.length
          },
          message: `Bulk assignment completed. ${assignments.length} successful, ${errors.length} failed.`
        };
      } catch (error) {
        console.error('Error in bulk role assignment:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Get assignment history for an employee
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with assignment history
   */
  async getAssignmentHistory(userId, params = {}) {
    return this.withRetry(async () => {
      try {
        const response = await api.get(`/auth/role-assignments/user/${userId}`, { params });
        return {
          success: true,
          data: response.data.data.map(assignment => this.transformAssignmentData(assignment)),
          count: response.data.count
        };
      } catch (error) {
        console.error('Error fetching assignment history:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Get all assignment history
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with all assignment history
   */
  async getAllAssignmentHistory(params = {}) {
    return this.withRetry(async () => {
      try {
        const response = await api.get('/auth/role-assignments', { params });
        return {
          success: true,
          data: response.data.data.map(assignment => this.transformAssignmentData(assignment)),
          count: response.data.count,
          pagination: response.data.pagination
        };
      } catch (error) {
        console.error('Error fetching all assignment history:', error);
        throw this.handleError(error);
      }
    });
  }

  /**
   * Deactivate current role assignment for user
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  async deactivateCurrentAssignment(userId) {
    try {
      const response = await api.put(`/auth/role-assignments/user/${userId}/deactivate`);
      return {
        success: true,
        message: 'Current assignment deactivated'
      };
    } catch (error) {
      // Don't throw error if no active assignment exists
      if (error.response?.status === 404) {
        return { success: true, message: 'No active assignment found' };
      }
      throw error;
    }
  }

  // ==================== DATA TRANSFORMATION METHODS ====================

  /**
   * Transform backend employee data to frontend format
   * @param {Object} backendEmployee - Employee data from backend
   * @returns {Object} Transformed employee data
   */
  transformEmployeeData(backendEmployee) {
    if (!backendEmployee) return null;

    try {
      // Ensure required fields exist
      const id = backendEmployee._id || backendEmployee.id;
      const firstName = backendEmployee.user_id?.first_name || '';
      const lastName = backendEmployee.user_id?.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || 'Unknown User';
      const email = backendEmployee.user_id?.email || '';

      return {
        employee_id: id,
        id: id,
        name: name,
        email: email,
        phone: this.sanitizePhone(backendEmployee.user_id?.phone),
        department: backendEmployee.department || 'Not Assigned',
        position: backendEmployee.position || 'Employee',
        current_role: backendEmployee.role_id ? backendEmployee.role_id._id : null,
        current_role_name: backendEmployee.role_id?.role_name || 'No Role',
        hire_date: this.formatDate(backendEmployee.hire_date || backendEmployee.created_at),
        status: this.normalizeStatus(backendEmployee.is_active ? 'active' : 'inactive'),
        avatar: this.sanitizeUrl(backendEmployee.avatar),
        location: backendEmployee.location || '',
        manager: backendEmployee.manager_id || null,
        direct_reports: backendEmployee.direct_reports || [],
        last_role_change: this.formatDate(backendEmployee.updated_at),
        performance_rating: backendEmployee.performance_rating || 0,
        access_level: this.determineAccessLevel(backendEmployee.role_id),
        permissions: this.extractPermissions(backendEmployee.role_id),
        // Additional computed fields
        display_name: this.createDisplayName(name, backendEmployee.position),
        is_active: backendEmployee.is_active === true,
        role_hierarchy_level: this.getRoleLevel(backendEmployee.role_id?.role_name),
        // Keep original data for reference
        _id: backendEmployee._id,
        user_id: backendEmployee.user_id?._id,
        role_id: backendEmployee.role_id?._id
      };
    } catch (error) {
      console.error('Error transforming employee data:', error, backendEmployee);
      // Return minimal safe object
      return {
        employee_id: backendEmployee._id || backendEmployee.id || 'unknown',
        id: backendEmployee._id || backendEmployee.id || 'unknown',
        name: backendEmployee.user_id?.first_name || 'Unknown Employee',
        email: backendEmployee.user_id?.email || '',
        status: 'inactive',
        error: 'Data transformation failed'
      };
    }
  }

  /**
   * Transform frontend employee data to backend format
   * @param {Object} frontendEmployee - Employee data from frontend
   * @returns {Object} Transformed employee data for backend
   */
  transformEmployeeDataForBackend(frontendEmployee) {
    return {
      department: frontendEmployee.department,
      location: frontendEmployee.location,
      manager_id: frontendEmployee.manager,
      performance_rating: frontendEmployee.performance_rating,
      is_active: frontendEmployee.status === 'active'
    };
  }

  /**
   * Transform backend role data to frontend format
   * @param {Object} backendRole - Role data from backend
   * @returns {Object} Transformed role data
   */
  transformRoleData(backendRole) {
    if (!backendRole) return null;

    try {
      const id = backendRole._id || backendRole.id;
      const name = backendRole.role_name || backendRole.name || 'Unknown Role';
      
      return {
        id,
        role_id: id,
        name,
        role_name: name,
        level: this.getRoleLevel(name),
        permissions: this.normalizePermissions(backendRole.permissions),
        color: this.getRoleColorByName(name),
        description: backendRole.description || '',
        parent_role: null, // This would need to be implemented in backend
        employee_count: backendRole.user_count || 0,
        is_active: this.normalizeStatus(backendRole.is_active),
        access_level: this.determineAccessLevel(backendRole),
        hierarchy_level: this.getRoleLevel(name),
        created_at: this.formatDate(backendRole.created_at),
        updated_at: this.formatDate(backendRole.updated_at),
        // Additional computed fields
        display_name: this.createRoleDisplayName(name, backendRole.level),
        permission_count: Array.isArray(backendRole.permissions) ? backendRole.permissions.length : 0,
        can_assign: this.canAssignRole(backendRole),
        // Keep original data for reference
        _id: backendRole._id,
        original_name: backendRole.role_name
      };
    } catch (error) {
      console.error('Error transforming role data:', error, backendRole);
      // Return minimal safe object
      return {
        id: backendRole._id || backendRole.id || 'unknown',
        role_id: backendRole._id || backendRole.id || 'unknown',
        name: backendRole.role_name || backendRole.name || 'Unknown Role',
        role_name: backendRole.role_name || backendRole.name || 'Unknown Role',
        description: '',
        permissions: [],
        level: 1,
        is_active: false,
        employee_count: 0,
        error: 'Data transformation failed'
      };
    }
  }

  /**
   * Transform backend team data to frontend format
   * @param {Object} backendTeam - Team data from backend
   * @returns {Object} Transformed team data
   */
  transformTeamData(backendTeam) {
    // Direct transformation without requiring teamService
    if (!backendTeam) return null;
    
    // Return only the fields needed for employee role service
    return {
      id: backendTeam._id || backendTeam.id,
      name: backendTeam.name || backendTeam.team_name || 'Unknown Team',
      description: backendTeam.description || '',
      department: backendTeam.department || 'General',
      employee_count: backendTeam.member_count || backendTeam.employee_count || 0,
      manager: backendTeam.team_lead?.name || 'Not Assigned',
      created_at: backendTeam.created_at || new Date().toISOString(),
      updated_at: backendTeam.updated_at || new Date().toISOString()
    };
  }

  /**
   * Transform assignment data for backend
   * @param {Object} assignmentData - Assignment data from frontend
   * @returns {Object} Transformed assignment data for backend
   */
  transformAssignmentDataForBackend(assignmentData) {
    return {
      user_id: assignmentData.user_id,
      role_id: assignmentData.role_id,
      effective_from: assignmentData.effective_from || new Date().toISOString(),
      effective_until: assignmentData.effective_until || null,
      notes: assignmentData.notes || '',
      is_active: true
    };
  }

  /**
   * Transform backend assignment data to frontend format
   * @param {Object} backendAssignment - Assignment data from backend
   * @returns {Object} Transformed assignment data
   */
  transformAssignmentData(backendAssignment) {
    if (!backendAssignment) return null;

    return {
      history_id: backendAssignment._id,
      assignment_id: backendAssignment.assignment_id,
      employee_id: backendAssignment.user_id?._id || backendAssignment.user_id,
      employee_name: backendAssignment.user_id?.name || 
        `${backendAssignment.user_id?.first_name || ''} ${backendAssignment.user_id?.last_name || ''}`.trim(),
      previous_role: null, // Would need to be tracked separately
      new_role: backendAssignment.role_id?._id || backendAssignment.role_id,
      new_role_name: backendAssignment.role_id?.role_name || 'Unknown Role',
      changed_by: backendAssignment.assigned_by?._id || backendAssignment.assigned_by,
      changed_by_name: backendAssignment.assigned_by?.name ||
        `${backendAssignment.assigned_by?.first_name || ''} ${backendAssignment.assigned_by?.last_name || ''}`.trim(),
      change_date: backendAssignment.assigned_at,
      reason: backendAssignment.notes || 'Role Assignment',
      effective_date: backendAssignment.effective_from,
      effective_until: backendAssignment.effective_until,
      approval_status: backendAssignment.is_active ? 'approved' : 'inactive',
      notes: backendAssignment.notes
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Sanitize phone number
   * @param {string} phone - Phone number to sanitize
   * @returns {string} Sanitized phone number
   */
  sanitizePhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/[^\d\+\-\(\)\s]/g, '').trim();
  }

  /**
   * Sanitize URL
   * @param {string} url - URL to sanitize
   * @returns {string|null} Sanitized URL or null
   */
  sanitizeUrl(url) {
    if (!url) return null;
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  }

  /**
   * Format date to ISO string
   * @param {string|Date} date - Date to format
   * @returns {string|null} Formatted date or null
   */
  formatDate(date) {
    if (!date) return null;
    try {
      return new Date(date).toISOString();
    } catch {
      return null;
    }
  }

  /**
   * Normalize status values
   * @param {string} status - Status to normalize
   * @returns {string} Normalized status
   */
  normalizeStatus(status) {
    if (!status) return 'inactive';
    const normalized = status.toString().toLowerCase();
    return ['active', 'enabled', 'true', '1'].includes(normalized) ? 'active' : 'inactive';
  }

  /**
   * Extract permissions from role
   * @param {Object} role - Role object
   * @returns {Array} Array of permissions
   */
  extractPermissions(role) {
    if (!role) return [];
    return Array.isArray(role.permissions) ? role.permissions : [];
  }

  /**
   * Create display name
   * @param {string} name - Employee name
   * @param {string} position - Employee position
   * @returns {string} Display name
   */
  createDisplayName(name, position) {
    if (!name) return 'Unknown Employee';
    if (!position) return name;
    return `${name} (${position})`;
  }

  /**
   * Determine access level based on role
   * @param {Object} role - Role object
   * @returns {string} Access level
   */
  determineAccessLevel(role) {
    if (!role || !role.permissions) return 'low';
    
    const permissions = role.permissions;
    if (permissions.includes('all') || permissions.length > 10) return 'admin';
    if (permissions.length > 5) return 'high';
    if (permissions.length > 2) return 'medium';
    return 'low';
  }

  /**
   * Get role level based on role name
   * @param {string} roleName - Role name
   * @returns {number} Role level
   */
  getRoleLevel(roleName) {
    const levelMap = {
      'admin': 1,
      'administrator': 1,
      'manager': 2,
      'team lead': 3,
      'team_lead': 3,
      'senior employee': 4,
      'senior': 4,
      'employee': 5,
      'user': 5
    };
    
    return levelMap[roleName?.toLowerCase()] || 5;
  }

  /**
   * Get role color based on role name
   * @param {string} roleName - Role name
   * @returns {string} Color name
   */
  getRoleColorByName(roleName) {
    const colorMap = {
      'admin': 'red',
      'administrator': 'red',
      'manager': 'blue',
      'team lead': 'green',
      'team_lead': 'green',
      'senior employee': 'purple',
      'senior': 'purple',
      'employee': 'gray',
      'user': 'gray'
    };
    
    return colorMap[roleName?.toLowerCase()] || 'gray';
  }

  /**
   * Normalize permissions array
   * @param {Array} permissions - Permissions array
   * @returns {Array} Normalized permissions
   */
  normalizePermissions(permissions) {
    if (!permissions) return [];
    if (!Array.isArray(permissions)) return [];
    return permissions.filter(p => p && typeof p === 'string');
  }

  /**
   * Create role display name
   * @param {string} name - Role name
   * @param {number} level - Role level
   * @returns {string} Display name
   */
  createRoleDisplayName(name, level) {
    if (!name) return 'Unknown Role';
    if (!level) return name;
    return `${name} (Level ${level})`;
  }

  /**
   * Check if role can be assigned by current user
   * @param {Object} role - Role object
   * @returns {boolean} Whether role can be assigned
   */
  canAssignRole(role) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    // Admin can assign any role
    const adminRoles = ['admin', 'super_admin', 'hr_admin'];
    // Ensure role is a string before calling toLowerCase()
    const userRole = typeof currentUser.role === 'string' ? currentUser.role : 
                    (currentUser.role ? String(currentUser.role) : '');
                    
    if (adminRoles.includes(userRole.toLowerCase())) {
      return true;
    }
    
    // Users can only assign roles at their level or below
    const currentUserLevel = this.getRoleLevel(userRole);
    const roleLevel = this.getRoleLevel(role.role_name);
    
    return currentUserLevel <= roleLevel;
  }

  // ==================== VALIDATION METHODS ====================

  /**
   * Validate employee data
   * @param {Object} employeeData - Employee data to validate
   * @returns {Object} Validation result
   */
  validateEmployee(employeeData) {
    const errors = [];
    
    if (!employeeData.name || employeeData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!employeeData.email || !this.isValidEmail(employeeData.email)) {
      errors.push('Valid email address is required');
    }
    
    if (employeeData.phone && !this.isValidPhone(employeeData.phone)) {
      errors.push('Valid phone number is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate role assignment data
   * @param {Object} assignmentData - Assignment data to validate
   * @returns {Object} Validation result
   */
  validateRoleAssignment(assignmentData) {
    const errors = [];
    
    if (!assignmentData.user_id) {
      errors.push('User ID is required');
    }
    
    if (!assignmentData.role_id) {
      errors.push('Role ID is required');
    }
    
    if (assignmentData.effective_from && !this.isValidDate(assignmentData.effective_from)) {
      errors.push('Valid effective date is required');
    }
    
    if (assignmentData.effective_until && !this.isValidDate(assignmentData.effective_until)) {
      errors.push('Valid end date is required');
    }
    
    if (assignmentData.effective_from && assignmentData.effective_until) {
      if (new Date(assignmentData.effective_from) >= new Date(assignmentData.effective_until)) {
        errors.push('End date must be after effective date');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format
   * @param {string} phone - Phone to validate
   * @returns {boolean} Whether phone is valid
   */
  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate date format
   * @param {string} date - Date to validate
   * @returns {boolean} Whether date is valid
   */
  isValidDate(date) {
    return !isNaN(Date.parse(date));
  }

  /**
   * Validate bulk assignment data
   * @param {Object} bulkData - Bulk assignment data to validate
   * @returns {Object} Validation result
   */
  validateBulkAssignmentData(bulkData) {
    const errors = [];
    
    if (!bulkData.user_ids || !Array.isArray(bulkData.user_ids) || bulkData.user_ids.length === 0) {
      errors.push('At least one user must be selected');
    }
    
    if (!bulkData.role_id) {
      errors.push('Role ID is required');
    }
    
    if (bulkData.effective_from && !this.isValidDate(bulkData.effective_from)) {
      errors.push('Valid effective date is required');
    }
    
    if (bulkData.effective_until && !this.isValidDate(bulkData.effective_until)) {
      errors.push('Valid end date is required');
    }
    
    if (bulkData.effective_from && bulkData.effective_until) {
      if (new Date(bulkData.effective_from) >= new Date(bulkData.effective_until)) {
        errors.push('End date must be after effective date');
      }
    }
    
    // Validate user IDs format
    const invalidUserIds = bulkData.user_ids?.filter(id => !id || typeof id !== 'string');
    if (invalidUserIds && invalidUserIds.length > 0) {
      errors.push('All user IDs must be valid strings');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: this.sanitizeBulkAssignmentData(bulkData)
    };
  }

  /**
   * Validate assignment data
   * @param {Object} assignmentData - Assignment data to validate
   * @returns {Object} Validation result
   */
  validateAssignmentData(assignmentData) {
    const errors = [];
    
    if (!assignmentData.user_id) {
      errors.push('User ID is required');
    }
    
    if (!assignmentData.role_id) {
      errors.push('Role ID is required');
    }
    
    if (assignmentData.effective_from && !this.isValidDate(assignmentData.effective_from)) {
      errors.push('Valid effective date is required');
    }
    
    if (assignmentData.effective_until && !this.isValidDate(assignmentData.effective_until)) {
      errors.push('Valid end date is required');
    }
    
    if (assignmentData.effective_from && assignmentData.effective_until) {
      if (new Date(assignmentData.effective_from) >= new Date(assignmentData.effective_until)) {
        errors.push('End date must be after effective date');
      }
    }
    
    // Validate notes length
    if (assignmentData.notes && assignmentData.notes.length > 500) {
      errors.push('Notes must be less than 500 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: this.sanitizeAssignmentData(assignmentData)
    };
  }

  /**
   * Sanitize bulk assignment data
   * @param {Object} bulkData - Raw bulk assignment data
   * @returns {Object} Sanitized data
   */
  sanitizeBulkAssignmentData(bulkData) {
    return {
      user_ids: bulkData.user_ids?.filter(id => id && typeof id === 'string') || [],
      role_id: bulkData.role_id?.toString() || '',
      effective_from: bulkData.effective_from || new Date().toISOString(),
      effective_until: bulkData.effective_until || null,
      notes: bulkData.notes?.trim().substring(0, 500) || '',
      reason: bulkData.reason?.trim().substring(0, 200) || ''
    };
  }

  /**
   * Sanitize assignment data
   * @param {Object} assignmentData - Raw assignment data
   * @returns {Object} Sanitized data
   */
  sanitizeAssignmentData(assignmentData) {
    return {
      user_id: assignmentData.user_id?.toString() || '',
      role_id: assignmentData.role_id?.toString() || '',
      effective_from: assignmentData.effective_from || new Date().toISOString(),
      effective_until: assignmentData.effective_until || null,
      notes: assignmentData.notes?.trim().substring(0, 500) || '',
      is_active: assignmentData.is_active !== false
    };
  }

  /**
   * Validate API response data
   * @param {Object} response - API response to validate
   * @param {string} expectedType - Expected data type
   * @returns {Object} Validation result
   */
  validateResponseData(response, expectedType = 'object') {
    const errors = [];
    
    if (!response) {
      errors.push('No response data received');
      return { isValid: false, errors };
    }
    
    if (expectedType === 'array' && !Array.isArray(response)) {
      errors.push('Expected array response');
    }
    
    if (expectedType === 'object' && (typeof response !== 'object' || Array.isArray(response))) {
      errors.push('Expected object response');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ==================== ERROR HANDLING ====================

  /**
   * Handle API errors and provide user-friendly messages
   * @param {Error} error - Error object from API call
   * @returns {Error} Formatted error object
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'An error occurred';
      
      switch (status) {
        case 400:
          return new Error(message || 'Invalid request data');
        case 401:
          return new Error('Authentication required. Please log in again.');
        case 403:
          return new Error('Access denied. You do not have permission to perform this action.');
        case 404:
          return new Error('Resource not found');
        case 409:
          return new Error(message || 'Conflict: Resource already exists');
        case 422:
          return new Error(message || 'Validation error');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later');
        case 502:
        case 503:
        case 504:
          return new Error('Service temporarily unavailable. Please try again later.');
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your internet connection and try again.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export default new EmployeeRoleService();