import React, { useState, useEffect } from 'react';
import { X, Shield, Users, Settings, Check, Lock, FileText, BarChart3, Building2, Eye } from 'lucide-react';

const RoleForm = ({ role, isOpen, onClose, onSubmit, title }) => {
  const [formData, setFormData] = useState({
    role_name: '',
    description: '',
    permissions: {}
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available modules and their permissions
  const modules = [
    {
      key: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Access to main dashboard and overview'
    },
    {
      key: 'users',
      name: 'User Management',
      icon: Users,
      description: 'Manage system users and their accounts'
    },
    {
      key: 'leads',
      name: 'Lead Management',
      icon: FileText,
      description: 'Manage leads and prospects'
    },
    {
      key: 'companies',
      name: 'Company Management',
      icon: Building2,
      description: 'Manage company information and data'
    },
    {
      key: 'reports',
      name: 'Reports',
      icon: FileText,
      description: 'Generate and view reports'
    },
    {
      key: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      description: 'Access to analytics and insights'
    },
    {
      key: 'settings',
      name: 'System Settings',
      icon: Settings,
      description: 'Configure system settings'
    }
  ];

  const permissionTypes = [
    { key: 'read', name: 'View', description: 'Can view and read data' },
    { key: 'write', name: 'Create/Edit', description: 'Can create and modify data' },
    { key: 'delete', name: 'Delete', description: 'Can delete data' },
    { key: 'approve', name: 'Approve', description: 'Can approve actions and changes' }
  ];

  useEffect(() => {
    if (role) {
      setFormData({
        role_name: role.role_name || '',
        description: role.description || '',
        permissions: role.permissions || {}
      });
    } else {
      // Initialize with default permissions structure
      const defaultPermissions = {};
      modules.forEach(module => {
        defaultPermissions[module.key] = {
          read: false,
          write: false,
          delete: false,
          approve: false
        };
      });
      
      setFormData({
        role_name: '',
        description: '',
        permissions: defaultPermissions
      });
    }
    setErrors({});
  }, [role, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Role name validation
    if (!formData.role_name.trim()) {
      newErrors.role_name = 'Role name is required';
    } else if (formData.role_name.length < 2) {
      newErrors.role_name = 'Role name must be at least 2 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Check if at least one permission is granted
    const hasAnyPermission = Object.values(formData.permissions).some(modulePerms =>
      Object.values(modulePerms).some(perm => perm === true)
    );

    if (!hasAnyPermission) {
      newErrors.permissions = 'At least one permission must be granted';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save role. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePermissionChange = (moduleKey, permissionType, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [permissionType]: value
        }
      }
    }));

    // Clear permissions error when user makes changes
    if (errors.permissions) {
      setErrors(prev => ({
        ...prev,
        permissions: ''
      }));
    }
  };

  const handleSelectAllModule = (moduleKey, selectAll) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          read: selectAll,
          write: selectAll,
          delete: selectAll,
          approve: selectAll
        }
      }
    }));
  };

  const handleSelectAllPermission = (permissionType, selectAll) => {
    const updatedPermissions = { ...formData.permissions };
    modules.forEach(module => {
      updatedPermissions[module.key] = {
        ...updatedPermissions[module.key],
        [permissionType]: selectAll
      };
    });

    setFormData(prev => ({
      ...prev,
      permissions: updatedPermissions
    }));
  };

  const isModuleFullySelected = (moduleKey) => {
    const modulePerms = formData.permissions[moduleKey];
    return modulePerms && Object.values(modulePerms).every(perm => perm === true);
  };

  const isPermissionFullySelected = (permissionType) => {
    return modules.every(module => 
      formData.permissions[module.key] && formData.permissions[module.key][permissionType]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Shield className="h-6 w-6 mr-2" />
            {title || (role ? 'Edit Role' : 'Create New Role')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Role Information
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  name="role_name"
                  value={formData.role_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.role_name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter role name (e.g., Manager, Staff, Viewer)"
                />
                {errors.role_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.description ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Describe the role and its responsibilities..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Permissions *
              </h4>
              {errors.permissions && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.permissions}</p>
              )}
            </div>

            {/* Permissions Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Module
                      </th>
                      {permissionTypes.map(permType => (
                        <th key={permType.key} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <div className="flex flex-col items-center">
                            <span>{permType.name}</span>
                            <button
                              type="button"
                              onClick={() => handleSelectAllPermission(permType.key, !isPermissionFullySelected(permType.key))}
                              className="mt-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                            >
                              {isPermissionFullySelected(permType.key) ? 'Unselect All' : 'Select All'}
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        All
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {modules.map(module => {
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
                          {permissionTypes.map(permType => (
                            <td key={permType.key} className="px-6 py-4 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={formData.permissions[module.key]?.[permType.key] || false}
                                onChange={(e) => handlePermissionChange(module.key, permType.key, e.target.checked)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                              />
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => handleSelectAllModule(module.key, !isModuleFullySelected(module.key))}
                              className={`px-3 py-1 text-xs rounded-md ${
                                isModuleFullySelected(module.key)
                                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {isModuleFullySelected(module.key) ? 'All' : 'None'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Permission Legend */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {permissionTypes.map(permType => (
                <div key={permType.key} className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">{permType.name}:</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">{permType.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (role ? 'Update Role' : 'Create Role')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;