import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Clock, 
  Bell, 
  BellOff, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings, 
  Play, 
  Pause, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Save,
  X,
  Check,
  Info,
  Zap,
  Target,
  Activity,
  BarChart3,
  TrendingUp,
  Calendar,
  MapPin,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  User,
  Users,
  UserX,
  Key,
  Mail,
  MessageSquare,
  Phone,
  Database,
  Server,
  Cloud,
  HardDrive,
  Network,
  Router,
  Cpu,
  Timer,
  Hourglass,
  Calendar as CalendarIcon,
  FileText,
  Download,
  Upload,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Link,
  Unlink,
  Power,
  PowerOff
} from 'lucide-react';
import SecurityRuleForm from './components/SecurityRuleForm';
import {
  getSecurityRules,
  getSecurityAlerts,
  getSecurityLogs,
  getSecurityStats,
  formatQueryParams,
  createSecurityRule,
  updateSecurityRule,
  deleteSecurityRule,
  testSecurityRule,
  toggleRuleStatus,
  resolveAlert
} from '../../services/securityService';

const AutomatedSecurityRules = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [securityRules, setSecurityRules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({});
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [ruleStats, setRuleStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch security rules
  const fetchSecurityRules = async () => {
    try {
      setLoading(true);
      const queryParams = formatQueryParams({
        page: currentPage,
        limit: itemsPerPage,
        sort: `${sortOrder === 'asc' ? '' : '-'}${sortBy}`,
        status: filterStatus,
        search: searchTerm
      });
      
      const response = await getSecurityRules(queryParams);
      if (response.success) {
        setSecurityRules(response.data.data);
        setTotalPages(Math.ceil(response.data.total / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching security rules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await getSecurityAlerts('?status=active&sort=-createdAt&limit=5');
      if (response.success) {
        setAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const response = await getSecurityLogs('?sort=-createdAt&limit=10');
      if (response.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await getSecurityStats();
      if (response.success) {
        setRuleStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Handle rule creation
  const handleCreateRule = async (ruleData) => {
    try {
      setLoading(true);
      const response = await createSecurityRule(ruleData);
      if (response.success) {
        fetchSecurityRules();
        setShowRuleModal(false);
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle rule update
  const handleUpdateRule = async (id, ruleData) => {
    try {
      setLoading(true);
      const response = await updateSecurityRule(id, ruleData);
      if (response.success) {
        fetchSecurityRules();
        setShowRuleModal(false);
        setSelectedRule(null);
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle rule deletion
  const handleDeleteRule = async (id) => {
    try {
      setLoading(true);
      const response = await deleteSecurityRule(id);
      if (response.success) {
        fetchSecurityRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle rule testing
  const handleTestRule = async (id) => {
    try {
      setLoading(true);
      const response = await testSecurityRule(id);
      if (response.success) {
        // Refresh alerts after test
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error testing rule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle rule status toggle
  const handleToggleStatus = async (id) => {
    try {
      setLoading(true);
      const response = await toggleRuleStatus(id);
      if (response.success) {
        fetchSecurityRules();
      }
    } catch (error) {
      console.error('Error toggling rule status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle alert resolution
  const handleResolveAlert = async (id, resolutionData) => {
    try {
      setLoading(true);
      const response = await resolveAlert(id, resolutionData);
      if (response.success) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effect hooks for data fetching
  useEffect(() => {
    fetchSecurityRules();
  }, [currentPage, itemsPerPage, sortBy, sortOrder, filterStatus, searchTerm]);

  useEffect(() => {
    fetchAlerts();
    fetchLogs();
    fetchStats();
  }, []);

  // Removed mock data
  const mockSecurityRules = [
    {
      rule_id: 'rule_001',
      name: 'Auto-Lock Inactive Sessions',
      description: 'Automatically lock user sessions after period of inactivity',
      type: 'session_management',
      status: 'active',
      priority: 'high',
      conditions: {
        inactivity_timeout: 30, // minutes
        warning_time: 5, // minutes before lock
        apply_to_roles: ['all'],
        exclude_roles: ['admin'],
        apply_to_devices: ['all']
      },
      actions: {
        lock_session: true,
        send_notification: true,
        log_event: true,
        require_reauth: true
      },
      schedule: {
        enabled: true,
        business_hours_only: false,
        timezone: 'UTC'
      },
      created_date: '2024-01-15T10:30:00Z',
      last_modified: '2024-03-10T14:20:00Z',
      created_by: 'admin',
      triggers_count: 1247,
      success_rate: 98.5
    },
    {
      rule_id: 'rule_002',
      name: 'Failed Login Attempts Monitor',
      description: 'Monitor and respond to multiple failed login attempts',
      type: 'authentication',
      status: 'active',
      priority: 'critical',
      conditions: {
        max_attempts: 5,
        time_window: 15, // minutes
        apply_to_roles: ['all'],
        exclude_ips: ['192.168.1.0/24'],
        track_by: 'ip_and_user'
      },
      actions: {
        lock_account: true,
        block_ip: true,
        send_alert: true,
        notify_admin: true,
        log_event: true
      },
      schedule: {
        enabled: true,
        business_hours_only: false,
        timezone: 'UTC'
      },
      created_date: '2024-01-10T09:15:00Z',
      last_modified: '2024-03-05T11:30:00Z',
      created_by: 'admin',
      triggers_count: 89,
      success_rate: 100
    },
    {
      rule_id: 'rule_003',
      name: 'Suspicious Location Access',
      description: 'Detect and respond to access from unusual locations',
      type: 'location_monitoring',
      status: 'active',
      priority: 'medium',
      conditions: {
        distance_threshold: 500, // km from usual locations
        time_threshold: 2, // hours for impossible travel
        apply_to_roles: ['manager', 'admin'],
        whitelist_countries: ['US', 'CA', 'UK']
      },
      actions: {
        require_2fa: true,
        send_notification: true,
        log_event: true,
        request_verification: true
      },
      schedule: {
        enabled: true,
        business_hours_only: false,
        timezone: 'UTC'
      },
      created_date: '2024-02-01T16:45:00Z',
      last_modified: '2024-03-08T10:15:00Z',
      created_by: 'security_admin',
      triggers_count: 23,
      success_rate: 95.7
    },
    {
      rule_id: 'rule_004',
      name: 'Off-Hours Access Monitor',
      description: 'Monitor and control access during non-business hours',
      type: 'time_based',
      status: 'active',
      priority: 'medium',
      conditions: {
        business_hours: {
          start: '09:00',
          end: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        apply_to_roles: ['employee'],
        exclude_roles: ['admin', 'security'],
        timezone: 'America/New_York'
      },
      actions: {
        require_approval: true,
        send_notification: true,
        log_event: true,
        limit_access: true
      },
      schedule: {
        enabled: true,
        business_hours_only: false,
        timezone: 'America/New_York'
      },
      created_date: '2024-02-10T12:00:00Z',
      last_modified: '2024-03-12T15:30:00Z',
      created_by: 'hr_admin',
      triggers_count: 156,
      success_rate: 92.3
    },
    {
      rule_id: 'rule_005',
      name: 'Device Compliance Check',
      description: 'Ensure devices meet security compliance requirements',
      type: 'device_compliance',
      status: 'paused',
      priority: 'high',
      conditions: {
        required_os_version: {
          windows: '10.0.19041',
          macos: '12.0',
          ios: '15.0',
          android: '11.0'
        },
        require_encryption: true,
        require_antivirus: true,
        max_device_age: 1095, // days (3 years)
        apply_to_roles: ['all']
      },
      actions: {
        block_access: true,
        send_notification: true,
        require_update: true,
        log_event: true
      },
      schedule: {
        enabled: false,
        business_hours_only: true,
        timezone: 'UTC'
      },
      created_date: '2024-01-20T14:30:00Z',
      last_modified: '2024-03-01T09:45:00Z',
      created_by: 'it_admin',
      triggers_count: 45,
      success_rate: 88.9
    }
  ];

  const mockAlerts = [
    {
      alert_id: 'alert_001',
      rule_id: 'rule_002',
      rule_name: 'Failed Login Attempts Monitor',
      severity: 'critical',
      status: 'active',
      title: 'Multiple Failed Login Attempts Detected',
      description: 'User john.doe@company.com has 5 failed login attempts from IP 203.0.113.45',
      triggered_at: '2024-03-15T14:22:00Z',
      user_affected: 'john.doe@company.com',
      ip_address: '203.0.113.45',
      location: 'Unknown Location',
      device: 'Chrome Browser',
      actions_taken: ['account_locked', 'ip_blocked', 'admin_notified'],
      resolved: false,
      resolved_at: null,
      resolved_by: null
    },
    {
      alert_id: 'alert_002',
      rule_id: 'rule_003',
      rule_name: 'Suspicious Location Access',
      severity: 'medium',
      status: 'investigating',
      title: 'Access from Unusual Location',
      description: 'User sarah.johnson@company.com accessed from Moscow, Russia',
      triggered_at: '2024-03-15T10:15:00Z',
      user_affected: 'sarah.johnson@company.com',
      ip_address: '185.220.101.45',
      location: 'Moscow, Russia',
      device: 'iPhone 15 Pro',
      actions_taken: ['2fa_required', 'notification_sent'],
      resolved: false,
      resolved_at: null,
      resolved_by: null
    },
    {
      alert_id: 'alert_003',
      rule_id: 'rule_001',
      rule_name: 'Auto-Lock Inactive Sessions',
      severity: 'low',
      status: 'resolved',
      title: 'Session Auto-Locked Due to Inactivity',
      description: 'User mike.chen@company.com session was automatically locked after 30 minutes of inactivity',
      triggered_at: '2024-03-15T09:30:00Z',
      user_affected: 'mike.chen@company.com',
      ip_address: '192.168.1.100',
      location: 'San Francisco, CA',
      device: 'MacBook Pro',
      actions_taken: ['session_locked', 'notification_sent'],
      resolved: true,
      resolved_at: '2024-03-15T09:35:00Z',
      resolved_by: 'auto_system'
    }
  ];

  const mockGlobalSettings = {
    security_level: 'high',
    default_session_timeout: 60, // minutes
    max_concurrent_sessions: 3,
    require_2fa_for_admin: true,
    enable_geo_blocking: true,
    enable_device_tracking: true,
    log_retention_days: 90,
    alert_notification_methods: ['email', 'sms', 'in_app'],
    auto_response_enabled: true,
    business_hours: {
      start: '09:00',
      end: '18:00',
      timezone: 'America/New_York',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    ip_whitelist: ['192.168.1.0/24', '10.0.0.0/8'],
    blocked_countries: ['CN', 'RU', 'KP'],
    password_policy: {
      min_length: 12,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: true,
      max_age_days: 90,
      prevent_reuse: 5
    }
  };

  const mockRuleStats = {
    total_rules: 5,
    active_rules: 4,
    paused_rules: 1,
    total_triggers_today: 45,
    total_triggers_week: 312,
    total_triggers_month: 1560,
    avg_response_time: 2.3, // seconds
    success_rate: 96.2,
    false_positive_rate: 3.8
  };

  useEffect(() => {
    setSecurityRules(mockSecurityRules);
    setAlerts(mockAlerts);
    setGlobalSettings(mockGlobalSettings);
    setRuleStats(mockRuleStats);
  }, []);

  const filteredRules = securityRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || rule.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const sortedRules = [...filteredRules].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'priority':
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'triggers':
        aValue = a.triggers_count;
        bValue = b.triggers_count;
        break;
      case 'success_rate':
        aValue = a.success_rate;
        bValue = b.success_rate;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleToggleRule = async (ruleId) => {
    try {
      await handleToggleStatus(ruleId);
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'critical': 'red',
      'high': 'orange',
      'medium': 'yellow',
      'low': 'green'
    };
    return colors[priority] || 'gray';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'critical': 'red',
      'high': 'orange',
      'medium': 'yellow',
      'low': 'green'
    };
    return colors[severity] || 'gray';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'paused': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'resolved': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'investigating': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig['inactive']}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };



  const tabs = [
    { id: 'rules', label: 'Security Rules', icon: Shield },
    { id: 'alerts', label: 'Active Alerts', icon: Bell },
    { id: 'logs', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Global Settings', icon: Settings }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automated Security Rules</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage automated security policies and responses</p>
        </div>
        <button
          onClick={() => setShowRuleModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Rules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ruleStats.active_rules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Triggers Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ruleStats.total_triggers_today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ruleStats.success_rate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ruleStats.avg_response_time}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {tab.label}
                {tab.id === 'alerts' && alerts.filter(a => !a.resolved).length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {alerts.filter(a => !a.resolved).length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Security Rules Tab */}
        {activeTab === 'rules' && (
          <>
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Rules
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or description..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="inactive">Inactive</option>
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
                    <option value="priority-desc">Priority (High-Low)</option>
                    <option value="triggers-desc">Triggers (Most)</option>
                    <option value="success_rate-desc">Success Rate (High)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('');
                      setSortBy('name');
                      setSortOrder('asc');
                    }}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Rules List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Security Rules ({sortedRules.length})
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {sortedRules.map((rule) => (
                    <div key={rule.rule_id} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 bg-${getPriorityColor(rule.priority)}-100 dark:bg-${getPriorityColor(rule.priority)}-900/20 rounded-lg`}>
                            <Shield className={`h-5 w-5 text-${getPriorityColor(rule.priority)}-600 dark:text-${getPriorityColor(rule.priority)}-400`} />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-900 dark:text-white">{rule.name}</h3>
                              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${getPriorityColor(rule.priority)}-100 text-${getPriorityColor(rule.priority)}-800 dark:bg-${getPriorityColor(rule.priority)}-900/20 dark:text-${getPriorityColor(rule.priority)}-400`}>
                                {rule.priority}
                              </span>
                              {getStatusBadge(rule.status)}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{rule.description}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-400 space-x-4">
                              <span>Type: {rule.type.replace('_', ' ')}</span>
                              <span>Triggers: {rule.triggers_count}</span>
                              <span>Success: {rule.success_rate}%</span>
                              <span>Modified: {formatTimestamp(rule.last_modified)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleRule(rule.rule_id)}
                            className={`p-2 rounded-md ${
                              rule.status === 'active' 
                                ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20' 
                                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            title={rule.status === 'active' ? 'Pause Rule' : 'Activate Rule'}
                          >
                            {rule.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRule(rule);
                              setShowRuleModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="Edit Rule"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.rule_id)}
                            className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20"
                            title="Delete Rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {sortedRules.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No security rules found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Create your first security rule to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Security Alerts ({alerts.filter(a => !a.resolved).length} active)
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.alert_id} className={`p-6 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/10' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' :
                    alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' :
                    'border-green-500 bg-green-50 dark:bg-green-900/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`p-2 bg-${getSeverityColor(alert.severity)}-100 dark:bg-${getSeverityColor(alert.severity)}-900/20 rounded-lg`}>
                          <AlertTriangle className={`h-5 w-5 text-${getSeverityColor(alert.severity)}-600 dark:text-${getSeverityColor(alert.severity)}-400`} />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-900 dark:text-white">{alert.title}</h3>
                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${getSeverityColor(alert.severity)}-100 text-${getSeverityColor(alert.severity)}-800 dark:bg-${getSeverityColor(alert.severity)}-900/20 dark:text-${getSeverityColor(alert.severity)}-400`}>
                              {alert.severity}
                            </span>
                            {getStatusBadge(alert.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{alert.description}</p>
                          <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400 space-x-4">
                            <span>Rule: {alert.rule_name}</span>
                            <span>User: {alert.user_affected}</span>
                            <span>IP: {alert.ip_address}</span>
                            <span>Location: {alert.location}</span>
                            <span>Time: {formatTimestamp(alert.triggered_at)}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Actions taken: </span>
                            {alert.actions_taken.map((action, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 mr-1">
                                {action.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {!alert.resolved && (
                        <button
                          onClick={() => handleResolveAlert(alert.alert_id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {alerts.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No alerts</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    All security alerts will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Activity Logs</h2>
            </div>
            <div className="p-6">
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Activity logs coming soon</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Detailed security activity logs will be available here
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Global Security Settings</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Session Management</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={globalSettings.default_session_timeout}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Concurrent Sessions
                      </label>
                      <input
                        type="number"
                        value={globalSettings.max_concurrent_sessions}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Security Features</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Require 2FA for Admin
                      </label>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Geo-blocking
                      </label>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Device Tracking
                      </label>
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRuleModal && (
        <SecurityRuleForm
          rule={selectedRule}
          isOpen={showRuleModal}
          onClose={() => {
            setShowRuleModal(false);
            setSelectedRule(null);
          }}
          onSubmit={(ruleData) => {
            if (selectedRule) {
              // Update existing rule
              setSecurityRules(rules => 
                rules.map(rule => 
                  rule.rule_id === selectedRule.rule_id 
                    ? { ...rule, ...ruleData, last_modified: new Date().toISOString() }
                    : rule
                )
              );
            } else {
              // Create new rule
              const newRule = {
                ...ruleData,
                rule_id: `rule_${Date.now()}`,
                created_date: new Date().toISOString(),
                last_modified: new Date().toISOString(),
                created_by: 'current_user',
                triggers_count: 0,
                success_rate: 0
              };
              setSecurityRules(rules => [...rules, newRule]);
            }
            
            setShowRuleModal(false);
            setSelectedRule(null);
          }}
          title={selectedRule ? 'Edit Security Rule' : 'Create Security Rule'}
        />
      )}
    </div>
  );
};

export default AutomatedSecurityRules;