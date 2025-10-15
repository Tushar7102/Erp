import api from '../../utils/api';

/**
 * Role Management Service
 * Handles all role-related API operations
 */

class RoleService {
  /**
   * Get all roles
   * @returns {Promise} API response with roles data
   */
  async getRoles() {
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
  }

  /**
   * Get a single role by ID
   * @param {string} roleId - Role ID
   * @returns {Promise} API response with role data
   */
  async getRole(roleId) {
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
  }

  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @param {string} roleData.role_name - Role name
   * @param {string} roleData.description - Role description
   * @param {Array} roleData.permissions - Array of permission strings
   * @returns {Promise} API response with created role data
   */
  async createRole(roleData) {
    try {
      const transformedData = this.transformRoleDataForBackend(roleData);
      const response = await api.post('/roles', transformedData);
      return {
        success: true,
        data: this.transformRoleData(response.data.data),
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating role:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing role
   * @param {string} roleId - Role ID
   * @param {Object} roleData - Updated role data
   * @returns {Promise} API response with updated role data
   */
  async updateRole(roleId, roleData) {
    try {
      const transformedData = this.transformRoleDataForBackend(roleData);
      const response = await api.put(`/roles/${roleId}`, transformedData);
      return {
        success: true,
        data: this.transformRoleData(response.data.data)
      };
    } catch (error) {
      console.error('Error updating role:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a role
   * @param {string} roleId - Role ID
   * @returns {Promise} API response
   */
  async deleteRole(roleId) {
    try {
      const response = await api.delete(`/roles/${roleId}`);
      return {
        success: true,
        message: 'Role deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting role:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get all available permissions from backend
   * @returns {Promise} API response with available permissions
   */
  async getAvailablePermissions() {
    try {
      const response = await api.get('/roles/permissions');
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      };
    } catch (error) {
      console.error('Error fetching available permissions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update role permissions
   * @param {string} roleId - Role ID
   * @param {Object} permissions - Permissions object with module-based structure
   * @returns {Promise} API response with updated role data
   */
  async updateRolePermissions(roleId, permissions) {
    try {
      // Convert permissions object to array format expected by backend
      const permissionsArray = this.transformPermissionsToArray(permissions);
      
      const response = await api.put(`/roles/${roleId}`, {
        permissions: permissionsArray
      });
      
      return {
        success: true,
        data: this.transformRoleData(response.data.data),
        message: response.data.message || 'Permissions updated successfully'
      };
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Transform backend role data to frontend format
   * @param {Object} backendRole - Role data from backend
   * @returns {Object} Transformed role data for frontend
   */
  transformRoleData(backendRole) {
    if (!backendRole) return null;

    return {
      _id: backendRole._id,
      role_id: backendRole.role_id,
      role_name: backendRole.role_name,
      description: backendRole.description,
      permissions: this.transformPermissionsToObject(backendRole.permissions || []),
      created_at: backendRole.created_at,
      updated_at: backendRole.updated_at,
      user_count: backendRole.user_count || 0
    };
  }

  /**
   * Transform frontend role data to backend format
   * @param {Object} frontendRole - Role data from frontend
   * @returns {Object} Transformed role data for backend
   */
  transformRoleDataForBackend(frontendRole) {
    if (!frontendRole) return null;

    return {
      role_name: frontendRole.role_name,
      description: frontendRole.description,
      permissions: this.transformPermissionsToArray(frontendRole.permissions || {})
    };
  }

  /**
   * Transform permissions array to object format for frontend
   * @param {Array} permissionsArray - Array of permission strings
   * @returns {Object} Permissions object organized by category
   */
  transformPermissionsToObject(permissionsArray) {
    const permissionsObj = {
      dashboard: { read: false, write: false, delete: false, approve: false },
      users: { read: false, write: false, delete: false, approve: false },
      leads: { read: false, write: false, delete: false, approve: false },
      companies: { read: false, write: false, delete: false, approve: false },
      reports: { read: false, write: false, delete: false, approve: false },
      analytics: { read: false, write: false, delete: false, approve: false },
      settings: { read: false, write: false, delete: false, approve: false }
    };

    // Map backend permissions to frontend structure
    const permissionMapping = {
      'user_view': ['users', 'read'],
      'user_create': ['users', 'write'],
      'user_update': ['users', 'write'],
      'user_delete': ['users', 'delete'],
      'enquiry_view': ['leads', 'read'],
      'enquiry_create': ['leads', 'write'],
      'enquiry_update': ['leads', 'write'],
      'enquiry_delete': ['leads', 'delete'],
      'call_view': ['leads', 'read'],
      'call_create': ['leads', 'write'],
      'call_update': ['leads', 'write'],
      'call_delete': ['leads', 'delete'],
      'role_view': ['settings', 'read'],
      'role_create': ['settings', 'write'],
      'role_update': ['settings', 'write'],
      'role_delete': ['settings', 'delete'],
      'report_view': ['reports', 'read'],
      'report_generate': ['reports', 'write'],
      'settings_view': ['settings', 'read'],
      'settings_update': ['settings', 'write']
    };

    permissionsArray.forEach(permission => {
      const mapping = permissionMapping[permission];
      if (mapping) {
        const [category, action] = mapping;
        if (permissionsObj[category]) {
          permissionsObj[category][action] = true;
        }
      }
    });

    return permissionsObj;
  }

  /**
   * Transform permissions object to array format for backend
   * @param {Object} permissionsObj - Permissions object from frontend
   * @returns {Array} Array of permission strings for backend
   */
  transformPermissionsToArray(permissionsObj) {
    const permissionsArray = [];

    // Map frontend permissions to backend format
    const reverseMapping = {
      'users.read': 'user_view',
      'users.write': ['user_create', 'user_update'],
      'users.delete': 'user_delete',
      'leads.read': ['enquiry_view', 'call_view'],
      'leads.write': ['enquiry_create', 'enquiry_update', 'call_create', 'call_update'],
      'leads.delete': ['enquiry_delete', 'call_delete'],
      'reports.read': 'report_view',
      'reports.write': 'report_generate',
      'settings.read': ['role_view', 'settings_view'],
      'settings.write': ['role_create', 'role_update', 'settings_update'],
      'settings.delete': 'role_delete'
    };

    Object.entries(permissionsObj).forEach(([category, actions]) => {
      Object.entries(actions).forEach(([action, enabled]) => {
        if (enabled) {
          const key = `${category}.${action}`;
          const backendPermissions = reverseMapping[key];
          
          if (backendPermissions) {
            if (Array.isArray(backendPermissions)) {
              permissionsArray.push(...backendPermissions);
            } else {
              permissionsArray.push(backendPermissions);
            }
          }
        }
      });
    });

    // Remove duplicates
    return [...new Set(permissionsArray)];
  }

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
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('Role not found');
        case 409:
          return new Error(message || 'Role already exists');
        case 500:
          return new Error('Server error. Please try again later');
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new RoleService();