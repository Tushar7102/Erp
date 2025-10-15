import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Ban,
  RefreshCw,
  Users,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import SessionDetails from './components/SessionDetails';
import sessionService from '../../services/user_management/sessionService';
import { SessionValidation } from '../../utils/sessionValidation';

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('sessions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Real-time statistics state
  const [statistics, setStatistics] = useState({
    activeSessions: 0,
    successfulLogins: 0,
    failedAttempts: 0,
    securityAlerts: 0,
    lastUpdated: null
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Load initial data
  useEffect(() => {
    loadSessions();
    loadLoginAttempts();
  }, [pagination.page, pagination.limit]);

  // Load sessions from API with pagination
  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined
      };

      const response = await sessionService.getActiveSessions(params);

      setSessions(response.sessions || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || Math.ceil((response.total || 0) / pagination.limit) || 1
      }));

      // Update statistics for active sessions
      updateStatistics(response.sessions || [], loginAttempts);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions. Please try again.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load login attempts from API with pagination
  const loadLoginAttempts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined
      };

      const response = await sessionService.getLoginAttempts(params);

      // Transform the data to normalize field names
      const transformedAttempts = (response.loginAttempts || []).map(transformLoginAttemptData);
      setLoginAttempts(transformedAttempts);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || Math.ceil((response.total || 0) / pagination.limit) || 1
      }));

      // Update statistics for login attempts
      updateStatistics(sessions, transformedAttempts);
    } catch (err) {
      console.error('Failed to load login attempts:', err);
      setError('Failed to load login attempts. Please try again.');
      setLoginAttempts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtonsToShow = 5;
    
    // Always show first page
    buttons.push(
      <button
        key="first"
        onClick={() => handlePageChange(1)}
        disabled={pagination.page === 1 || loading}
        className={`px-3 py-1 rounded-md text-sm ${
          pagination.page === 1
            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        1
      </button>
    );
    
    // Calculate range of pages to show
    let startPage = Math.max(2, pagination.page - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(pagination.totalPages - 1, startPage + maxButtonsToShow - 3);
    
    // Adjust start if we're near the end
    if (endPage === pagination.totalPages - 1) {
      startPage = Math.max(2, endPage - (maxButtonsToShow - 3));
    }
    
    // Add ellipsis if needed
    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis1" className="px-2 py-1 text-gray-500">
          ...
        </span>
      );
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={pagination.page === i || loading}
          className={`px-3 py-1 rounded-md text-sm ${
            pagination.page === i
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis if needed
    if (endPage < pagination.totalPages - 1 && pagination.totalPages > 2) {
      buttons.push(
        <span key="ellipsis2" className="px-2 py-1 text-gray-500">
          ...
        </span>
      );
    }
    
    // Always show last page if there is more than one page
    if (pagination.totalPages > 1) {
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.page === pagination.totalPages || loading}
          className={`px-3 py-1 rounded-md text-sm ${
            pagination.page === pagination.totalPages
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 font-medium'
              : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {pagination.totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  // Transform login attempt data to normalize field names
  const transformLoginAttemptData = (attempt) => {
    return {
      id: attempt.attemptId || attempt.attempt_id || attempt.id,
      attemptId: attempt.attemptId || attempt.attempt_id,
      userName: attempt.userName || attempt.username,
      email: attempt.email,
      browser: attempt.browser,
      deviceType: attempt.deviceType,
      deviceInfo: attempt.deviceInfo,
      ipAddress: attempt.ipAddress || attempt.ip_address,
      location: attempt.location,
      timestamp: attempt.timestamp || attempt.attempt_time,
      status: attempt.status,
      success: attempt.success,
      reason: attempt.reason || attempt.failure_reason,
      userId: attempt.userId || attempt.user_id
    };
  };

  // Update statistics based on current data
  const updateStatistics = (sessionsData, attemptsData) => {
    const activeSessions = sessionsData.filter(s => s.isActive || s.status === 'Active' || s.is_active).length;
    const terminatedSessions = sessionsData.filter(s => s.is_terminated).length;
    const successfulLogins = attemptsData.filter(a => a.status === 'success' || a.success === true).length;
    const failedAttempts = attemptsData.filter(a => a.status === 'Failed' || a.success === false).length;
    const securityAlerts = attemptsData.filter(a =>
      a.reason === 'Suspicious location' ||
      a.failure_reason === 'Suspicious location' ||
      a.reason === 'Multiple failed attempts' ||
      a.failure_reason === 'Multiple failed attempts'
    ).length;

    setStatistics({
      activeSessions,
      terminatedSessions,
      successfulLogins,
      failedAttempts,
      securityAlerts,
      lastUpdated: new Date()
    });
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (activeTab === 'sessions') {
        loadSessions();
      } else {
        loadLoginAttempts();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, activeTab]);

  // Refresh data when search or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'sessions') {
        loadSessions();
      } else {
        loadLoginAttempts();
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus, activeTab]);

  const getDeviceIcon = (deviceType) => {
    if (!deviceType) {
      return <Globe className="h-5 w-5 text-gray-600" />;
    }

    switch (deviceType.toLowerCase()) {
      case 'desktop': return <Monitor className="h-5 w-5 text-gray-600" />;
      case 'mobile': return <Smartphone className="h-5 w-5 text-blue-600" />;
      case 'tablet': return <Tablet className="h-5 w-5 text-green-600" />;
      default: return <Globe className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Expired': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'Terminated': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Success': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Failed': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || statusClasses['Expired']}`}>
        {status}
      </span>
    );
  };

  // CRUD handlers
  const handleViewSession = async (session) => {
    try {
      setLoading(true);
      const sessionDetails = await sessionService.getSessionDetails(session.id);

      if (SessionValidation.validateSessionData(sessionDetails)) {
        setSelectedSession(sessionDetails);
        setShowSessionDetails(true);
      } else {
        throw new Error('Invalid session details received');
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
      setError('Failed to load session details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (id) => {
    const session = sessions.find(s => s.id === id || s.session_id === id);
    if (window.confirm(`Are you sure you want to terminate the session for ${session?.userName || session?.user_id?.first_name || 'this user'}?`)) {
      try {
        setLoading(true);
        const reason = prompt("Please provide a reason for terminating this session:", "Terminated by administrator");
        await sessionService.revokeSession(id, { reason });

        setSessions(sessions.map(session =>
          (session.id === id || session.session_id === id)
            ? { 
                ...session, 
                isActive: false, 
                is_active: false,
                is_terminated: true,
                terminated_at: new Date(),
                termination_reason: reason || 'Terminated by administrator',
                lastActivity: new Date() 
              }
            : session
        ));
        alert('Session terminated successfully');

        // Close details modal if the terminated session is currently being viewed
        if (selectedSession?.id === id || selectedSession?.session_id === id) {
          setShowSessionDetails(false);
          setSelectedSession(null);
        }
      } catch (err) {
        console.error('Failed to terminate session:', err);
        setError('Failed to terminate session. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRefreshSession = async (id) => {
    try {
      setLoading(true);
      const refreshedSession = await sessionService.refreshSession(id);

      if (SessionValidation.validateSessionData(refreshedSession)) {
        setSessions(sessions.map(session =>
          session.id === id ? refreshedSession : session
        ));

        // Update selected session if it's the one being refreshed
        if (selectedSession?.id === id) {
          setSelectedSession(refreshedSession);
        }

        alert('Session data refreshed successfully');
      } else {
        throw new Error('Invalid refreshed session data received');
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
      setError('Failed to refresh session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSessionDetails = () => {
    setShowSessionDetails(false);
    setSelectedSession(null);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = (session.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.ipAddress || '').includes(searchTerm) ||
      (session.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const sessionStatus = session.isActive ? 'active' : 'inactive';
    const matchesFilter = filterStatus === 'all' || sessionStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredAttempts = loginAttempts.filter(attempt => {
    const matchesSearch = (attempt.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attempt.ipAddress || '').includes(searchTerm) ||
      (attempt.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attempt.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (attempt.status || '').toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  // Handle pagination changes
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      handlePageChange(pagination.page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      handlePageChange(pagination.page - 1);
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when changing limit
      limit: newLimit
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor active sessions and security events
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={pagination.limit}
            onChange={handleLimitChange}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
          <button
            onClick={() => {
              if (activeTab === 'sessions') {
                loadSessions();
              } else {
                loadLoginAttempts();
              }
            }}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setError(null)}
                  className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-400"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {statistics.activeSessions}
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
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Successful Logins
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {statistics.successfulLogins}
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
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Failed Attempts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {statistics.failedAttempts}
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
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Security Alerts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {statistics.securityAlerts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sessions'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Active Sessions
            </button>
            <button
              onClick={() => setActiveTab('attempts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'attempts'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Login Attempts
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                {activeTab === 'sessions' ? (
                  <>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </>
                ) : (
                  <>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          {activeTab === 'sessions' ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User & Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location & IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Session Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                        <span className="text-gray-500 dark:text-gray-400">Loading sessions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No sessions found</p>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => {
                    return (
                      <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getDeviceIcon(session.deviceInfo?.device?.type || session.deviceType)}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                {session.userName}
                                {session.is_current && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {session.deviceInfo?.browser?.name ? 
                                  `${session.deviceInfo.browser.name} ${session.deviceInfo.browser.version || ''}` : 
                                  session.browser}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                {session.location}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {session.ipAddress}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                Login: {getTimeAgo(session.issuedAt)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Active: {getTimeAgo(session.lastActivity)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(session.isActive ? 'Active' : 'Inactive')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewSession(session)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View Session Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {session.isActive && !session.is_current && (
                              <button
                                onClick={() => handleTerminateSession(session.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Terminate Session"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User & Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location & IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Attempt Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                        <span className="text-gray-500 dark:text-gray-400">Loading login attempts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No login attempts found</p>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((attempt) => (
                    <tr key={attempt.attemptId || attempt.attempt_id || attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getDeviceIcon(attempt.deviceType)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {attempt.userName || attempt.username || attempt.email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {attempt.browser}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {attempt.location}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {attempt.ipAddress || attempt.ip_address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getTimeAgo(attempt.timestamp || attempt.attempt_time)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(attempt.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {attempt.reason || attempt.failure_reason || '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {(activeTab === 'sessions' ? sessions.length > 0 : loginAttempts.length > 0) && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span> of{' '}
            <span className="font-medium">{pagination.total}</span> results
          </div>
          
          <div className="flex space-x-1">
            {/* Previous Page Button */}
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className={`px-3 py-1 rounded-md text-sm ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Previous
            </button>
            
            {/* Page Number Buttons */}
            {renderPaginationButtons()}
            
            {/* Next Page Button */}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className={`px-3 py-1 rounded-md text-sm ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      <SessionDetails
        session={selectedSession}
        isOpen={showSessionDetails}
        onClose={handleCloseSessionDetails}
        onTerminate={handleTerminateSession}
        onRefresh={handleRefreshSession}
      />
    </div>
  );
};

export default SessionManagement;