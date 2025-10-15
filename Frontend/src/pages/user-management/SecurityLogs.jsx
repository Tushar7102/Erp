import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Clock,
  User,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  Settings,
  Database,
  FileText,
  Activity,
  MapPin,
  Smartphone,
  Monitor,
  Wifi,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  AlertCircle,
  Info,
  Zap,
  Target,
  Flag,
  Bell,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import { getSecurityLogs, getHighRiskSecurityLogs, exportSecurityLogs } from '../../services/securityLogService';
import { toast } from 'react-hot-toast';

const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterTimeRange, setFilterTimeRange] = useState('24h');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch security logs from backend
  useEffect(() => {
    const fetchSecurityLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare params based on filters
        const params = {};
        if (filterType !== 'all') params.event_type = filterType;
        if (filterSeverity !== 'all') params.severity = filterSeverity;
        
        // Set time range
        if (filterTimeRange === '24h') {
          params.from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        } else if (filterTimeRange === '7d') {
          params.from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (filterTimeRange === '30d') {
          params.from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
        
        // Fetch logs from API
        const response = await getSecurityLogs(params);
        
        if (response.success && response.data) {
          setLogs(response.data);
        } else {
          // Fallback to mock data if API doesn't return expected format
          console.warn('API returned unexpected format, using mock data');
          setLogs(mockLogs);
        }
      } catch (err) {
        console.error('Error fetching security logs:', err);
        setError('Failed to fetch security logs. Using mock data instead.');
        toast.error('Failed to fetch security logs. Using mock data instead.');
        // Fallback to mock data on error
        setLogs(mockLogs);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityLogs();
    
    // Set up polling if real-time is enabled
    let interval;
    if (realTimeEnabled) {
      interval = setInterval(() => {
        fetchSecurityLogs();
      }, 30000); // Poll every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filterType, filterSeverity, filterTimeRange, realTimeEnabled]);

  // Fallback mock data for security logs (will be used if API fails)
  const mockLogs = [
    {
      log_id: 'log_001',
      timestamp: '2024-03-15T19:45:32Z',
      event_type: 'login_attempt',
      severity: 'high',
      status: 'failed',
      user_id: 'user_unknown',
      username: 'admin',
      ip_address: '203.0.113.1',
      location: 'Unknown Location',
      device_info: {
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        device_type: 'Desktop',
        os: 'Windows 10',
        browser: 'Chrome 120.0'
      },
      details: {
        reason: 'Invalid credentials - multiple failed attempts',
        attempts_count: 5,
        locked_account: true,
        source_country: 'Unknown',
        risk_score: 95
      },
      action_taken: 'Account temporarily locked',
      alert_sent: true,
      investigation_status: 'pending'
    },
    {
      log_id: 'log_002',
      timestamp: '2024-03-15T19:30:15Z',
      event_type: 'login_success',
      severity: 'medium',
      status: 'success',
      user_id: 'user_001',
      username: 'john.smith',
      ip_address: '192.168.1.100',
      location: 'New York, USA',
      device_info: {
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        device_type: 'Desktop',
        os: 'macOS Sonoma',
        browser: 'Safari 17.0'
      },
      details: {
        reason: 'Login from new location',
        previous_login: '2024-03-14T09:15:00Z',
        location_change: true,
        two_factor_used: true,
        risk_score: 35
      },
      action_taken: 'Email notification sent',
      alert_sent: true,
      investigation_status: 'resolved'
    },
    {
      log_id: 'log_003',
      timestamp: '2024-03-15T18:22:45Z',
      event_type: 'permission_change',
      severity: 'high',
      status: 'success',
      user_id: 'user_002',
      username: 'sarah.johnson',
      ip_address: '192.168.1.101',
      location: 'San Francisco, USA',
      device_info: {
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        device_type: 'Desktop',
        os: 'Windows 11',
        browser: 'Edge 120.0'
      },
      details: {
        reason: 'Admin role assigned to user',
        changed_by: 'system_admin',
        previous_role: 'Manager',
        new_role: 'Admin',
        approval_required: true,
        approved_by: 'super_admin',
        risk_score: 75
      },
      action_taken: 'Role change logged and approved',
      alert_sent: true,
      investigation_status: 'approved'
    },
    {
      log_id: 'log_004',
      timestamp: '2024-03-15T17:15:20Z',
      event_type: 'data_access',
      severity: 'medium',
      status: 'success',
      user_id: 'user_003',
      username: 'mike.wilson',
      ip_address: '203.0.113.45',
      location: 'London, UK',
      device_info: {
        user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        device_type: 'Desktop',
        os: 'Ubuntu 22.04',
        browser: 'Firefox 121.0'
      },
      details: {
        reason: 'Bulk customer data export',
        records_accessed: 15000,
        data_type: 'customer_records',
        export_format: 'CSV',
        business_justification: 'Monthly reporting',
        risk_score: 45
      },
      action_taken: 'Export logged and monitored',
      alert_sent: false,
      investigation_status: 'approved'
    },
    {
      log_id: 'log_005',
      timestamp: '2024-03-15T16:45:10Z',
      event_type: 'api_abuse',
      severity: 'critical',
      status: 'blocked',
      user_id: 'api_user_001',
      username: 'api_integration',
      ip_address: '198.51.100.10',
      location: 'Frankfurt, Germany',
      device_info: {
        user_agent: 'API Client v2.1.0',
        device_type: 'Server',
        os: 'Linux',
        browser: 'API Client'
      },
      details: {
        reason: 'Rate limit exceeded - suspicious activity',
        requests_per_minute: 5000,
        normal_rate: 100,
        spike_duration: '15 minutes',
        endpoints_targeted: ['/api/users', '/api/orders', '/api/customers'],
        risk_score: 98
      },
      action_taken: 'API access temporarily suspended',
      alert_sent: true,
      investigation_status: 'investigating'
    },
    {
      log_id: 'log_006',
      timestamp: '2024-03-15T15:30:55Z',
      event_type: 'session_timeout',
      severity: 'low',
      status: 'success',
      user_id: 'user_004',
      username: 'lisa.brown',
      ip_address: '192.168.1.102',
      location: 'Chicago, USA',
      device_info: {
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        device_type: 'Mobile',
        os: 'iOS 17.0',
        browser: 'Safari Mobile'
      },
      details: {
        reason: 'Automatic session timeout after inactivity',
        session_duration: '4 hours 23 minutes',
        inactivity_period: '30 minutes',
        auto_logout: true,
        risk_score: 5
      },
      action_taken: 'Session terminated automatically',
      alert_sent: false,
      investigation_status: 'resolved'
    },
    {
      log_id: 'log_007',
      timestamp: '2024-03-15T14:20:30Z',
      event_type: 'password_change',
      severity: 'medium',
      status: 'success',
      user_id: 'user_005',
      username: 'david.clark',
      ip_address: '192.168.1.103',
      location: 'Boston, USA',
      device_info: {
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        device_type: 'Desktop',
        os: 'macOS Ventura',
        browser: 'Chrome 120.0'
      },
      details: {
        reason: 'User-initiated password change',
        password_strength: 'Strong',
        previous_change: '2024-01-15T10:30:00Z',
        forced_change: false,
        two_factor_verified: true,
        risk_score: 20
      },
      action_taken: 'Password updated successfully',
      alert_sent: true,
      investigation_status: 'resolved'
    },
    {
      log_id: 'log_008',
      timestamp: '2024-03-15T13:45:18Z',
      event_type: 'suspicious_activity',
      severity: 'critical',
      status: 'detected',
      user_id: 'user_unknown',
      username: 'unknown',
      ip_address: '185.220.101.5',
      location: 'Tor Exit Node',
      device_info: {
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        device_type: 'Desktop',
        os: 'Windows 10',
        browser: 'Firefox (Tor)'
      },
      details: {
        reason: 'Access attempt via Tor network',
        tor_detected: true,
        vpn_detected: false,
        proxy_detected: true,
        geolocation_mismatch: true,
        risk_score: 99
      },
      action_taken: 'Access blocked - Tor network detected',
      alert_sent: true,
      investigation_status: 'blocked'
    }
  ];

  const eventTypes = [
    'login_attempt', 'login_success', 'logout', 'permission_change', 
    'data_access', 'api_abuse', 'session_timeout', 'password_change', 
    'suspicious_activity', 'account_locked', 'two_factor_setup'
  ];

  const severityLevels = ['low', 'medium', 'high', 'critical'];
  const timeRanges = ['1h', '24h', '7d', '30d', 'custom'];

  // This useEffect is now replaced by the one that fetches from API

  // Handle export logs
  const handleExportLogs = async () => {
    try {
      setLoading(true);
      // Prepare params based on filters
      const params = {};
      if (filterType !== 'all') params.event_type = filterType;
      if (filterSeverity !== 'all') params.severity = filterSeverity;
      
      // Set time range
      if (filterTimeRange === '24h') {
        params.from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      } else if (filterTimeRange === '7d') {
        params.from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (filterTimeRange === '30d') {
        params.from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      // Try to export from API
      const response = await exportSecurityLogs(params);
      
      if (response.success && response.data) {
        // If API returns CSV data directly
        const csvContent = "data:text/csv;charset=utf-8," + response.data;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `security_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Logs exported successfully');
      } else {
        // Fallback to client-side export if API doesn't return expected format
        fallbackExport();
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
      toast.error('Failed to export from API, using client-side export');
      // Fallback to client-side export
      fallbackExport();
    } finally {
      setLoading(false);
    }
  };
  
  // Fallback export function that uses client-side data
  const fallbackExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,Event Type,Severity,Status,Username,IP Address,Location,Details,Action Taken\n" +
      filteredLogs.map(log => 
        `${log.timestamp},${log.event_type},${log.severity},${log.status},${log.username},${log.ip_address},${log.location},"${log.details?.reason || ''}","${log.action_taken}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs based on search, type, severity, and time range
  const filteredLogs = Array.isArray(logs) ? logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
                         log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ip_address?.includes(searchTerm) ||
                         log.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.event_type === filterType;
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    
    // Time range filtering
    const logTime = new Date(log.timestamp);
    const now = new Date();
    let matchesTimeRange = true;
    
    if (filterTimeRange === '1h') {
      matchesTimeRange = (now - logTime) <= (60 * 60 * 1000);
    } else if (filterTimeRange === '24h') {
      matchesTimeRange = (now - logTime) <= (24 * 60 * 60 * 1000);
    } else if (filterTimeRange === '7d') {
      matchesTimeRange = (now - logTime) <= (7 * 24 * 60 * 60 * 1000);
    } else if (filterTimeRange === '30d') {
      matchesTimeRange = (now - logTime) <= (30 * 24 * 60 * 60 * 1000);
    }
    
    return matchesSearch && matchesType && matchesSeverity && matchesTimeRange;
  }) : [];

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  // This function is already defined above - removing duplicate declaration
  // const handleExportLogs = async () => { ... };
  
  // This function is already defined above - removing duplicate declaration
  // const fallbackExport = () => { ... };


  const getSeverityBadge = (severity) => {
    const severityConfig = {
      'low': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityConfig[severity] || severityConfig['medium']}`}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'success': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'blocked': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'detected': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'pending': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig['pending']}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getEventIcon = (eventType) => {
    const iconMap = {
      'login_attempt': LogIn,
      'login_success': CheckCircle,
      'logout': LogOut,
      'permission_change': Settings,
      'data_access': Database,
      'api_abuse': AlertTriangle,
      'session_timeout': Clock,
      'password_change': Lock,
      'suspicious_activity': AlertCircle,
      'account_locked': XCircle,
      'two_factor_setup': Shield
    };
    
    const IconComponent = iconMap[eventType] || Activity;
    return <IconComponent className="h-4 w-4" />;
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

  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Calculate statistics
  const stats = {
    total: filteredLogs.length,
    critical: filteredLogs.filter(log => log.severity === 'critical').length,
    high: filteredLogs.filter(log => log.severity === 'high').length,
    failed: filteredLogs.filter(log => log.status === 'failed' || log.status === 'blocked').length,
    alerts: filteredLogs.filter(log => log.alert_sent).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Logs & Audit Trail</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Monitor and analyze security events, user activities, and system access patterns
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium ${
              realTimeEnabled 
                ? 'border-green-300 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-400 dark:bg-green-900/20' 
                : 'border-gray-300 text-gray-700 bg-white dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800'
            } hover:bg-gray-50 dark:hover:bg-gray-700`}
          >
            <Activity className="h-4 w-4 mr-2" />
            {realTimeEnabled ? 'Real-time ON' : 'Real-time OFF'}
          </button>
          <button 
            onClick={handleExportLogs}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Events
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.total}
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
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Critical
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.critical}
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
                <Flag className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    High Priority
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.high}
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
                    Failed/Blocked
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.failed}
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
                <Bell className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Alerts Sent
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {stats.alerts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs by username, IP, location, or event details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="lg:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Event Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:w-40">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                {severityLevels.map(severity => (
                  <option key={severity} value={severity}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:w-32">
              <select
                value={filterTimeRange}
                onChange={(e) => setFilterTimeRange(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {timeRanges.map(range => (
                  <option key={range} value={range}>
                    {range === 'custom' ? 'Custom' : range.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.log_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          log.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          log.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                          log.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                          'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        }`}>
                          {getEventIcon(log.event_type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getSeverityBadge(log.severity)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{log.username}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      {log.ip_address}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {log.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {log.details.reason}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {log.action_taken}
                    </div>
                    {log.alert_sent && (
                      <div className="flex items-center mt-1">
                        <Bell className="h-3 w-3 text-blue-500 mr-1" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">Alert sent</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getRiskScoreColor(log.details.risk_score)}`}>
                      {log.details.risk_score}/100
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${
                          log.details.risk_score >= 80 ? 'bg-red-500' :
                          log.details.risk_score >= 60 ? 'bg-orange-500' :
                          log.details.risk_score >= 40 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${log.details.risk_score}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(log.status)}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {log.investigation_status}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleViewLog(log)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="View Log Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No security logs found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all' || filterSeverity !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Security logs will appear here as events occur.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {showLogDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Security Log Details
                </h3>
                <button
                  onClick={() => setShowLogDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Event Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Event Type:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedLog.event_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Severity:</span>
                      <span className="text-sm">{getSeverityBadge(selectedLog.severity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                      <span className="text-sm">{getStatusBadge(selectedLog.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Timestamp:</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedLog.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Risk Score:</span>
                      <span className={`text-sm font-medium ${getRiskScoreColor(selectedLog.details.risk_score)}`}>
                        {selectedLog.details.risk_score}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* User & Location */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">User & Location</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Username:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedLog.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">User ID:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedLog.user_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">IP Address:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedLog.ip_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Location:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedLog.location}</span>
                    </div>
                  </div>
                </div>

                {/* Device Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Device Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Device Type:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedLog.device_info.device_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Operating System:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedLog.device_info.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Browser:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedLog.device_info.browser}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">User Agent:</span>
                      <span className="text-sm text-gray-900 dark:text-white break-all">
                        {selectedLog.device_info.user_agent.substring(0, 50)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Event Details</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Reason:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedLog.details.reason}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Action Taken:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedLog.action_taken}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Alert Sent:</span>
                      <span className={`text-sm ${selectedLog.alert_sent ? 'text-green-600' : 'text-gray-600'}`}>
                        {selectedLog.alert_sent ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Investigation Status:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{selectedLog.investigation_status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowLogDetails(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
                  Export Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityLogs;