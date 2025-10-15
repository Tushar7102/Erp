import React from 'react';
import { X, Shield, Users, Settings, Check, Lock, FileText, BarChart3, Building2, Edit, Calendar, User } from 'lucide-react';

const RoleDetails = ({ role, isOpen, onClose, onEdit }) => {
  if (!isOpen || !role) return null;

  // Available modules and their permissions with icons
  const moduleIcons = {
    dashboard: BarChart3,
    users: Users,
    leads: FileText,
    companies: Building2,
    reports: FileText,
    analytics: BarChart3,
    settings: Settings
  };

  const permissionLabels = {
    read: { name: 'View', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    write: { name: 'Create/Edit', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    delete: { name: 'Delete', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    approve: { name: 'Approve', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModuleName = (moduleKey) => {
    const moduleNames = {
      dashboard: 'Dashboard',
      users: 'User Management',
      leads: 'Lead Management',
      companies: 'Company Management',
      reports: 'Reports',
      analytics: 'Analytics',
      settings: 'System Settings'
    };
    return moduleNames[moduleKey] || moduleKey;
  };

  const getActivePermissions = (modulePermissions) => {
    if (!modulePermissions) return [];
    return Object.entries(modulePermissions)
      .filter(([_, hasPermission]) => hasPermission)
      .map(([permissionKey, _]) => permissionKey);
  };

  const getTotalPermissions = () => {
    if (!role.permissions) return 0;
    return Object.values(role.permissions).reduce((total, modulePerms) => {
      return total + Object.values(modulePerms).filter(Boolean).length;
    }, 0);
  };

  const getModulesWithAccess = () => {
    if (!role.permissions) return 0;
    return Object.values(role.permissions).filter(modulePerms => 
      Object.values(modulePerms).some(Boolean)
    ).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {role.role_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Role Details & Permissions
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(role)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Role
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Role Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Role Information
              </h4>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                    {role.role_name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {role.description}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Users Assigned
                    </label>
                    <div className="flex items-center mt-1">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {role.user_count || 0}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created Date
                    </label>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(role.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permission Summary */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                Permission Summary
              </h4>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {getModulesWithAccess()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Modules Access
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {getTotalPermissions()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total Permissions
                    </div>
                  </div>
                </div>

                {/* Permission Type Breakdown */}
                <div className="mt-4 space-y-2">
                  {Object.entries(permissionLabels).map(([permKey, permInfo]) => {
                    const count = role.permissions ? Object.values(role.permissions).reduce((total, modulePerms) => {
                      return total + (modulePerms[permKey] ? 1 : 0);
                    }, 0) : 0;

                    return (
                      <div key={permKey} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {permInfo.name}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${permInfo.color}`}>
                          {count} modules
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Permissions */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Detailed Permissions
            </h4>

            {role.permissions && Object.keys(role.permissions).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(role.permissions).map(([moduleKey, modulePermissions]) => {
                  const activePermissions = getActivePermissions(modulePermissions);
                  const Icon = moduleIcons[moduleKey] || Settings;

                  if (activePermissions.length === 0) return null;

                  return (
                    <div key={moduleKey} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 text-gray-400 mr-3" />
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {getModuleName(moduleKey)}
                          </h5>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {activePermissions.length} permission{activePermissions.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {activePermissions.map(permissionKey => {
                          const permInfo = permissionLabels[permissionKey];
                          return (
                            <span
                              key={permissionKey}
                              className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${permInfo.color}`}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              {permInfo.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No permissions assigned to this role
                </p>
              </div>
            )}
          </div>

          {/* Users with this Role */}
          {role.user_count > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Users with this Role
              </h4>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>{role.user_count}</strong> user{role.user_count !== 1 ? 's are' : ' is'} currently assigned to this role
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(role)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleDetails;