import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Crown, 
  Star, 
  Award, 
  Briefcase,
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical, 
  X, 
  Check, 
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Building,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Settings,
  History,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  FileText,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Layers,
  GitBranch,
  Network,
  Workflow
} from 'lucide-react';
import employeeRoleService from '../../services/user_management/employeeRoleService';

const EmployeeRoleAssignment = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showRoleHierarchy, setShowRoleHierarchy] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, hierarchy
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Notification system
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Data loading functions
  const loadEmployees = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        department: selectedDepartment,
        role: selectedRole,
        ...params
      };

      const response = await employeeRoleService.getEmployees(queryParams);
      
      if (response.success) {
        setEmployees(response.data);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.count,
            totalPages: response.pagination.totalPages
          }));
        }
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setError(error.message);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedDepartment, selectedRole, showNotification]);

  const loadRoles = useCallback(async () => {
    try {
      const response = await employeeRoleService.getRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setError(error.message);
    }
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      const response = await employeeRoleService.getTeams();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      setError(error.message);
    }
  }, []);

  const loadAssignmentHistory = useCallback(async () => {
    try {
      const response = await employeeRoleService.getAllAssignmentHistory({
        page: 1,
        limit: 50
      });
      if (response.success) {
        setAssignmentHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading assignment history:', error);
      setError(error.message);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadRoles(),
        loadTeams(),
        loadAssignmentHistory()
      ]);
      await loadEmployees();
    };

    initializeData();
  }, []);

  // Reload employees when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadEmployees();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedDepartment, selectedRole, pagination.page]);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || employee.department === selectedDepartment;
    const matchesRole = !selectedRole || employee.current_role === selectedRole;
    
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'department':
        aValue = getDepartmentName(a.department);
        bValue = getDepartmentName(b.department);
        break;
      case 'role':
        aValue = getRoleName(a.current_role);
        bValue = getRoleName(b.current_role);
        break;
      case 'hire_date':
        aValue = new Date(a.hire_date);
        bValue = new Date(b.hire_date);
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getDepartmentName = (deptId) => {
    if (!deptId) return 'Not Assigned';
    const dept = departments.find(d => d.id === deptId || d.name === deptId);
    return dept ? dept.name : deptId;
  };

  const getRoleName = (roleId) => {
    if (!roleId) return 'No Role';
    const role = roles.find(r => r.id === roleId || r.role_id === roleId);
    return role ? role.name || role.role_name : 'Unknown';
  };

  const getRoleColor = (roleId) => {
    if (!roleId) return 'gray';
    const role = roles.find(r => r.id === roleId || r.role_id === roleId);
    return role ? role.color : 'gray';
  };

  const getRoleIcon = (roleId) => {
    if (!roleId) return Users;
    const role = roles.find(r => r.id === roleId || r.role_id === roleId);
    if (!role) return Users;
    
    switch (role.level) {
      case 1: return Crown;
      case 2: return Shield;
      case 3: return Star;
      case 4: return Award;
      default: return Users;
    }
  };

  const handleAssignRole = async (employeeId, newRoleId, reason = '', effectiveDate = null) => {
    try {
      setLoading(true);
      setError(null);

      // Validate assignment data
      const assignmentData = {
        user_id: employeeId,
        role_id: newRoleId,
        effective_from: effectiveDate || new Date().toISOString(),
        notes: reason || 'Role Assignment'
      };

      const validation = employeeRoleService.validateRoleAssignment(assignmentData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const response = await employeeRoleService.assignRole(assignmentData);
      
      if (response.success) {
        // Refresh employees data to reflect the change
        await loadEmployees();
        await loadAssignmentHistory();
        
        setShowAssignmentModal(false);
        showNotification(response.message || 'Role assigned successfully!');
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      setError(error.message);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async (employeeIds, roleId, reason = '', effectiveDate = null) => {
    try {
      setLoading(true);
      setError(null);

      const bulkAssignmentData = {
        user_ids: employeeIds,
        role_id: roleId,
        effective_from: effectiveDate || new Date().toISOString(),
        notes: reason || 'Bulk Role Assignment'
      };

      const response = await employeeRoleService.bulkAssignRoles(bulkAssignmentData);
      
      if (response.success) {
        const { successful_count, failed_count, failed_assignments } = response.data;
        
        // Refresh data to reflect changes
        await loadEmployees();
        await loadAssignmentHistory();
        
        setSelectedEmployees([]);
        setShowBulkAssignModal(false);
        
        if (failed_count > 0) {
          const failedMessage = `${successful_count} roles assigned successfully, ${failed_count} failed. Failed assignments: ${failed_assignments.map(f => f.error).join(', ')}`;
          showNotification(failedMessage, 'warning');
        } else {
          showNotification(response.message || `Roles assigned to ${successful_count} employees successfully!`);
        }
      }
    } catch (error) {
      console.error('Error in bulk role assignment:', error);
      setError(error.message);
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getAccessLevelBadge = (level) => {
    const levelConfig = {
      'admin': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'low': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${levelConfig[level] || levelConfig['low']}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    );
  };

  const RoleHierarchyView = () => {
    const buildHierarchy = (parentRole = null, level = 0) => {
      return roles
        .filter(role => role.parent_role === parentRole)
        .map(role => (
          <div key={role.id} className={`ml-${level * 6}`}>
            <div className="flex items-center py-2 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
              <div className="flex items-center flex-1">
                {React.createElement(getRoleIcon(role.id), { 
                  className: `h-5 w-5 text-${role.color}-600 dark:text-${role.color}-400 mr-3` 
                })}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{role.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{role.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {role.employee_count} employees
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Level {role.level}
                </div>
              </div>
            </div>
            {buildHierarchy(role.id, level + 1)}
          </div>
        ));
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Role Hierarchy</h3>
        {buildHierarchy()}
      </div>
    );
  };

  const AssignmentModal = () => {
    const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState('');
    const [assignmentReason, setAssignmentReason] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Assign Role
              </h3>
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {selectedEmployee && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">{selectedEmployee.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Current: {getRoleName(selectedEmployee.current_role)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Role
              </label>
              <select
                value={selectedRoleForAssignment}
                onChange={(e) => setSelectedRoleForAssignment(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} (Level {role.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Change
              </label>
              <textarea
                value={assignmentReason}
                onChange={(e) => setAssignmentReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for role assignment..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={() => setShowAssignmentModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedEmployee && handleAssignRole(selectedEmployee.employee_id, selectedRoleForAssignment, assignmentReason)}
              disabled={!selectedRoleForAssignment || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Assign Role
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : notification.type === 'error'
            ? 'bg-red-100 border border-red-400 text-red-700'
            : 'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {notification.type === 'success' && <Check className="h-5 w-5 mr-2" />}
              {notification.type === 'error' && <AlertTriangle className="h-5 w-5 mr-2" />}
              {notification.type === 'info' && <Bell className="h-5 w-5 mr-2" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Role Assignment</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage employee roles and permissions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await Promise.all([
                  loadEmployees(),
                  loadRoles(),
                  loadTeams(),
                  loadAssignmentHistory()
                ]);
                showNotification('Data refreshed successfully', 'success');
              } catch (error) {
                console.error('Error refreshing data:', error);
                setError('Failed to refresh data. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowRoleHierarchy(!showRoleHierarchy)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
          >
            <Network className="h-4 w-4 mr-2" />
            {showRoleHierarchy ? 'Hide' : 'Show'} Hierarchy
          </button>
          <button
            onClick={() => setShowBulkAssignModal(true)}
            disabled={selectedEmployees.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Bulk Assign ({selectedEmployees.length})
          </button>
        </div>
      </div>

      {/* Role Hierarchy */}
      {showRoleHierarchy && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <RoleHierarchyView />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Employees
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="department-asc">Department (A-Z)</option>
              <option value="role-asc">Role (A-Z)</option>
              <option value="hire_date-desc">Hire Date (Newest)</option>
              <option value="hire_date-asc">Hire Date (Oldest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Employees ({sortedEmployees.length})
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <Layers className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
                <span className="text-gray-600 dark:text-gray-400">Loading employees...</span>
              </div>
            </div>
          ) : sortedEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No employees found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEmployees.map((employee) => {
                const RoleIcon = getRoleIcon(employee.current_role);
                return (
                  <div key={employee.employee_id} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.employee_id)}
                          onChange={() => handleSelectEmployee(employee.employee_id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowAssignmentModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{employee.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <RoleIcon className={`h-4 w-4 text-${getRoleColor(employee.current_role)}-600 dark:text-${getRoleColor(employee.current_role)}-400 mr-2`} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getRoleName(employee.current_role)}
                          </span>
                        </div>
                        {getAccessLevelBadge(employee.access_level)}
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {getDepartmentName(employee.department)}
                        </div>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Hired: {new Date(employee.hire_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {employee.location}
                        </div>
                      </div>

                      {employee.direct_reports.length > 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {employee.direct_reports.length} direct reports
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEmployees.map((employee) => {
                const RoleIcon = getRoleIcon(employee.current_role);
                return (
                  <div key={employee.employee_id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.employee_id)}
                          onChange={() => handleSelectEmployee(employee.employee_id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">{employee.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {getDepartmentName(employee.department)}
                            </span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center">
                            <RoleIcon className={`h-4 w-4 text-${getRoleColor(employee.current_role)}-600 dark:text-${getRoleColor(employee.current_role)}-400 mr-1`} />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {getRoleName(employee.current_role)}
                            </span>
                          </div>
                        </div>

                        <div className="text-center">
                          {getAccessLevelBadge(employee.access_level)}
                        </div>

                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowAssignmentModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sortedEmployees.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No employees found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assignment History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Role Changes</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {assignmentHistory.slice(0, 5).map((history) => (
              <div key={history.history_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <History className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {history.employee_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getRoleName(history.previous_role)} → {getRoleName(history.new_role)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {history.reason} • {formatTimestamp(history.change_date)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Changed by: {history.changed_by_name}
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {history.approval_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAssignmentModal && <AssignmentModal />}
      
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Bulk Role Assignment
                </h3>
                <button
                  onClick={() => setShowBulkAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Selected Employees ({selectedEmployees.length})
                </h4>
                <div className="space-y-1">
                  {selectedEmployees.slice(0, 3).map(empId => {
                    const emp = employees.find(e => e.employee_id === empId);
                    return emp ? (
                      <div key={empId} className="text-sm text-gray-600 dark:text-gray-400">
                        {emp.name} - {getRoleName(emp.current_role)}
                      </div>
                    ) : null;
                  })}
                  {selectedEmployees.length > 3 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      +{selectedEmployees.length - 3} more...
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} (Level {role.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Bulk Assignment
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter reason for bulk role assignment..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkAssignModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAssign(selectedEmployees, selectedRole, 'Bulk Assignment')}
                disabled={!selectedRole || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Assign to {selectedEmployees.length} Employees
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeRoleAssignment;