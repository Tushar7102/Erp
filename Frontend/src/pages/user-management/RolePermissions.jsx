import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Settings,
  Eye,
  Check,
  X,
  Lock,
  FileText,
  BarChart3,
  Building2,
  Loader2
} from 'lucide-react';
import RoleForm from './components/RoleForm';
import RoleDetails from './components/RoleDetails';
import roleService from '../../services/user_management/roleService';
import { toast } from 'react-hot-toast';

const RolePermissions = () => {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showRoleDetails, setShowRoleDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load roles and permissions on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Load initial data (roles and permissions) from the backend
   */
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load roles and permissions in parallel
      const [rolesResponse, permissionsResponse] = await Promise.all([
        roleService.getRoles(),
        roleService.getAvailablePermissions()
      ]);
      
      setRoles(rolesResponse.data);
      setAvailablePermissions(permissionsResponse.data);
      
      // Extract unique modules from permissions
      const moduleMap = new Map();
      permissionsResponse.data.forEach(permission => {
        const parts = permission.split('_');
        if (parts.length >= 2) {
          const moduleKey = parts[0];
          const moduleName = moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
          
          if (!moduleMap.has(moduleKey)) {
            moduleMap.set(moduleKey, {
              key: moduleKey,
              name: getModuleDisplayName(moduleKey),
              icon: getModuleIcon(moduleKey),
              description: getModuleDescription(moduleKey)
            });
          }
        }
      });
      
      setModules(Array.from(moduleMap.values()));
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get display name for module
   */
  const getModuleDisplayName = (moduleKey) => {
    const displayNames = {
      dashboard: 'Dashboard',
      user: 'User Management',
      users: 'User Management',
      enquiry: 'Enquiry Management',
      enquiries: 'Enquiry Management',
      lead: 'Lead Management',
      leads: 'Lead Management',
      company: 'Company Management',
      companies: 'Company Management',
      report: 'Reports',
      reports: 'Reports',
      analytics: 'Analytics',
      setting: 'Settings',
      settings: 'Settings',
      profile: 'Profile Management',
      profiles: 'Profile Management',
      call: 'Call Management',
      calls: 'Call Management',
      role: 'Role Management',
      roles: 'Role Management'
    };
    return displayNames[moduleKey] || moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
  };

  /**
   * Get icon for module
   */
  const getModuleIcon = (moduleKey) => {
    const iconMap = {
      dashboard: BarChart3,
      user: Users,
      users: Users,
      enquiry: FileText,
      enquiries: FileText,
      lead: Users,
      leads: Users,
      company: Building2,
      companies: Building2,
      report: FileText,
      reports: FileText,
      analytics: BarChart3,
      setting: Settings,
      settings: Settings,
      profile: Users,
      profiles: Users,
      call: FileText,
      calls: FileText,
      role: Shield,
      roles: Shield
    };
    return iconMap[moduleKey] || Settings;
  };

  /**
   * Get description for module
   */
  const getModuleDescription = (moduleKey) => {
    const descriptions = {
      dashboard: 'Main dashboard and overview',
      user: 'Manage system users and roles',
      users: 'Manage system users and roles',
      enquiry: 'Enquiry management and tracking',
      enquiries: 'Enquiry management and tracking',
      lead: 'Lead management and tracking',
      leads: 'Lead management and tracking',
      company: 'Company and client management',
      companies: 'Company and client management',
      report: 'Generate and view reports',
      reports: 'Generate and view reports',
      analytics: 'Data analytics and insights',
      setting: 'System configuration',
      settings: 'System configuration',
      profile: 'Profile management',
      profiles: 'Profile management',
      call: 'Call logs and management',
      calls: 'Call logs and management',
      role: 'Role and permission management',
      roles: 'Role and permission management'
    };
    return descriptions[moduleKey] || `${moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1)} management`;
  };

  const filteredRoles = roles.filter(role =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionIcon = (hasPermission) => {
    return hasPermission ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-red-600" />
    );
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleViewRole = (role) => {
    setSelectedRole(role);
    setShowRoleDetails(true);
  };

  const handleManagePermissions = (role) => {
    setSelectedRole(role);
    setShowPermissionModal(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      setError(null);

      if (selectedRole) {
        // Update existing role
        const response = await roleService.updateRole(selectedRole._id, formData);
        
        // Update the role in the local state
        setRoles(roles.map(role => 
          role._id === selectedRole._id ? response.data : role
        ));
        
        alert('Role updated successfully!');
      } else {
        // Create new role
        const response = await roleService.createRole(formData);
        
        // Add the new role to the local state
        setRoles([...roles, response.data]);
        alert(response.message || 'Role created successfully!');
      }
      
      setShowRoleModal(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('Error saving role:', error);
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    const role = roles.find(r => r._id === roleId);
    const confirmMessage = role?.user_count > 0 
      ? `Are you sure you want to delete "${role.role_name}"? This role is currently assigned to ${role.user_count} user(s). This action cannot be undone.`
      : `Are you sure you want to delete "${role?.role_name}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        setActionLoading(true);
        setError(null);
        
        await roleService.deleteRole(roleId);
        
        // Remove the role from local state
        setRoles(roles.filter(role => role._id !== roleId));
        alert('Role deleted successfully!');
      } catch (error) {
        console.error('Error deleting role:', error);
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
        
        if (error.response?.status === 400 && errorMessage.includes('assigned to users')) {
          alert(`Cannot delete role: ${errorMessage}`);
        } else {
          alert(`Error deleting role: ${errorMessage}`);
        }
        setError(errorMessage);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const PermissionMatrix = ({ role, isEditable = false, onPermissionChange }) => {
    // Get available permission types for each module
    const getModulePermissions = (moduleKey) => {
      const modulePermissions = availablePermissions.filter(permission => 
        permission.startsWith(`${moduleKey}_`)
      );
      
      const permissions = {
        view: modulePermissions.some(p => p.includes('_view')),
        create: modulePermissions.some(p => p.includes('_create')),
        update: modulePermissions.some(p => p.includes('_update')),
        delete: modulePermissions.some(p => p.includes('_delete')),
        manage: modulePermissions.some(p => p.includes('_manage')),
        generate: modulePermissions.some(p => p.includes('_generate'))
      };
      
      return permissions;
    };

    // Check if role has specific permission
    const hasPermission = (moduleKey, permissionType) => {
      return role.permissions && 
             role.permissions[moduleKey] && 
             role.permissions[moduleKey][permissionType] === true;
    };

    // Handle permission toggle
    const handlePermissionToggle = (moduleKey, permissionType) => {
      if (!isEditable || !onPermissionChange) return;
      
      const currentPermissions = role.permissions || {};
      const newPermissions = { ...currentPermissions };
      
      // Initialize module if it doesn't exist
      if (!newPermissions[moduleKey]) {
        newPermissions[moduleKey] = {};
      }
      
      // Toggle the specific permission
      newPermissions[moduleKey][permissionType] = !hasPermission(moduleKey, permissionType);
      
      onPermissionChange(newPermissions);
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Module
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                View
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Create
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Update
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Delete
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Manage
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Generate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {modules.map((module) => {
              const modulePermissions = getModulePermissions(module.key);
              const Icon = module.icon;
              
              return (
                <tr key={module.key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {module.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {module.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  {['view', 'create', 'update', 'delete', 'manage', 'generate'].map(permissionType => {
                    const isAvailable = modulePermissions[permissionType];
                    const hasCurrentPermission = hasPermission(module.key, permissionType);
                    
                    if (!isAvailable) {
                      return (
                        <td key={permissionType} className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        </td>
                      );
                    }
                    
                    return (
                      <td key={permissionType} className="px-6 py-4 whitespace-nowrap text-center">
                        {isEditable ? (
                          <button
                            onClick={() => handlePermissionToggle(module.key, permissionType)}
                            className="focus:outline-none"
                          >
                            {hasCurrentPermission ? (
                              <Check className="h-4 w-4 text-green-600 hover:text-green-700" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 hover:text-red-700" />
                            )}
                          </button>
                        ) : (
                          hasCurrentPermission ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage user roles and module permissions (RBAC)
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          disabled={actionLoading}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading roles...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading roles
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!loading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Roles
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {roles.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {roles.reduce((sum, role) => sum + role.user_count, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Modules
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {modules.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <div key={role._id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-primary-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {role.role_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {role.user_count} users assigned
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewRole(role)}
                    disabled={actionLoading}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="View Role Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditRole(role)}
                    disabled={actionLoading}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit Role"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role._id)}
                    disabled={actionLoading}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Role"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {role.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Key Permissions
                </div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions && typeof role.permissions === 'object' && Object.keys(role.permissions).slice(0, 4).map((moduleKey) => {
                    const moduleName = modules.find(m => m.key === moduleKey)?.name || moduleKey;
                    const modulePermissions = role.permissions[moduleKey];
                    const activePermissions = Object.keys(modulePermissions).filter(action => modulePermissions[action]);
                    
                    if (activePermissions.length > 0) {
                      return (
                        <span key={moduleKey} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                          {moduleName} ({activePermissions.length})
                        </span>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </div>
              </div>

              <button
                onClick={() => handleManagePermissions(role)}
                disabled={actionLoading}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="h-4 w-4 mr-2" />
                Manage Permissions
              </button>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {/* Permission Modal */}
      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Permissions for {selectedRole.role_name}
                </h3>
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <PermissionMatrix role={selectedRole} />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Form Modal */}
      <RoleForm
        role={selectedRole}
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedRole(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Role Details Modal */}
      <RoleDetails
        role={selectedRole}
        isOpen={showRoleDetails}
        onClose={() => {
          setShowRoleDetails(false);
          setSelectedRole(null);
        }}
        onEdit={(role) => {
          setShowRoleDetails(false);
          setSelectedRole(role);
          setShowRoleModal(true);
        }}
      />
    </div>
  );
};

export default RolePermissions;