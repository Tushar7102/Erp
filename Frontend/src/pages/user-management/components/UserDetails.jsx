import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Clock, 
  Building, 
  Users,
  MapPin,
  Activity,
  Settings,
  RefreshCw
} from 'lucide-react';
import TwoFactorAuth from './TwoFactorAuth';
import userService from '../../../services/user_management/userService';

const UserDetails = ({ user, isOpen, onClose, onEdit }) => {
  const [showTwoFactorAuth, setShowTwoFactorAuth] = useState(false);
  const [userData, setUserData] = useState(user);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch login count immediately and refresh periodically
  useEffect(() => {
    if (isOpen && user) {
      setUserData(user);
      
      // Fetch login count immediately
      const fetchLoginCount = async () => {
        if (user.user_id) {
          try {
            const count = await userService.getLoginCount(user.user_id);
            setUserData(prevData => ({
              ...prevData,
              login_count: count
            }));
          } catch (error) {
            console.error("Error fetching login count:", error);
          }
        }
      };
      
      // Fetch immediately
      fetchLoginCount();
      
      // Set up periodic refresh of login count
      const refreshInterval = setInterval(fetchLoginCount, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(refreshInterval);
    }
  }, [isOpen, user]);
  
  // Function to manually refresh login count
  const refreshLoginCount = async () => {
    if (!userData || !userData.user_id) return;
    
    setRefreshing(true);
    try {
      const count = await userService.getLoginCount(userData.user_id);
      setUserData(prevData => ({
        ...prevData,
        login_count: count
      }));
    } catch (error) {
      console.error("Error refreshing login count:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  if (!isOpen || !userData) return null;

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'Locked': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses['Inactive']}`}>
        {status}
      </span>
    );
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'Admin': return <Shield className="h-5 w-5 text-purple-600" />;
      case 'Manager': return <Users className="h-5 w-5 text-blue-600" />;
      case 'Staff': return <User className="h-5 w-5 text-gray-600" />;
      default: return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Never';
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(user)}
              className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30"
            >
              Edit User
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
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      First Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.firstName || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Last Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.lastName || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Email Address
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Phone Number
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {user.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role & Organization */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Role & Organization
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Role
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-2">{user.role}</span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Team
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.team}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Department
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.department || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Employee ID
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.employeeId || `EMP-${user.user_id?.toString().padStart(4, '0')}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Activity */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Account Activity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Account Created
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Last Login
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDateTime(user.last_login)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Login Count
                    </label>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-900 dark:text-white mr-2">
                        {userData.login_count || 0} times
                      </p>
                      <button 
                        onClick={refreshLoginCount}
                        className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 rounded-full"
                        title="Refresh login count"
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Last Updated
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.updated_at ? formatDateTime(user.updated_at) : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Status & Quick Actions */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Account Status
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Current Status
                    </label>
                    {getStatusBadge(user.status)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Account Type
                    </label>
                    <div className="flex items-center">
                      {getRoleIcon(user.role)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">{user.role}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Two-Factor Auth
                    </label>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.twoFactorEnabled 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => setShowTwoFactorAuth(true)}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Summary */}
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Permissions
                </h4>
                <div className="space-y-3">
                  {user.role === 'Admin' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">System Admin</span>
                        <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded">Full Access</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">User Management</span>
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded">Allowed</span>
                      </div>
                    </>
                  )}
                  {user.role === 'Manager' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Team Management</span>
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">Allowed</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Reports Access</span>
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded">Allowed</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Data Access</span>
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded">Read/Write</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Export Data</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      user.role === 'Staff' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}>
                      {user.role === 'Staff' ? 'Denied' : 'Allowed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Recent Activity
                </h4>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-white">Last login</p>
                    <p className="text-gray-500 dark:text-gray-400">{formatDateTime(user.last_login)}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-white">Password changed</p>
                    <p className="text-gray-500 dark:text-gray-400">{formatDate(user.passwordChanged) || 'Never'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-white">Profile updated</p>
                    <p className="text-gray-500 dark:text-gray-400">{formatDate(user.updated_at) || 'Never'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(user)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            Edit User
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication Modal */}
      {showTwoFactorAuth && (
        <TwoFactorAuth
          userId={user.user_id}
          onClose={() => setShowTwoFactorAuth(false)}
          onUpdate={(updatedData) => {
            // Handle 2FA status update
            console.log('2FA updated:', updatedData);
            setShowTwoFactorAuth(false);
          }}
        />
      )}
    </div>
  );
};

export default UserDetails;