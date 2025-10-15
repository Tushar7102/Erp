import React, { useState, useEffect } from 'react';
import { X, Smartphone, Laptop, Monitor, Tablet, Shield, Wifi, MapPin, Calendar, Clock, Activity, Settings, Edit, Trash2, Eye, EyeOff, MoreVertical, Download, Share2, AlertTriangle, CheckCircle, XCircle, Lock, Unlock, RefreshCw, Power, Signal, Battery, HardDrive, Cpu, MemoryStick, Globe, Router, TrendingUp, TrendingDown, BarChart3, PieChart, LineChart, User } from 'lucide-react';

const DeviceDetails = ({ device, isOpen, onClose, onEdit, onDelete }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [deviceStats, setDeviceStats] = useState({});
  const [securityEvents, setSecurityEvents] = useState([]);
  const [networkHistory, setNetworkHistory] = useState([]);
  const [usageMetrics, setUsageMetrics] = useState({});

  // Mock data for device details
  const mockDeviceData = {
    device_001: {
      id: 'device_001',
      device_name: 'John\'s iPhone 15 Pro',
      device_type: 'Mobile',
      model: 'iPhone 15 Pro',
      manufacturer: 'Apple',
      os: 'iOS 17.2.1',
      os_version: '17.2.1',
      user: {
        id: 'user_001',
        name: 'John Smith',
        email: 'john@company.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        department: 'Engineering'
      },
      status: 'active',
      trust_level: 'trusted',
      last_seen: '2024-01-15 10:30:00',
      registered_date: '2023-06-15',
      location: {
        country: 'United States',
        city: 'San Francisco',
        ip_address: '192.168.1.100',
        coordinates: { lat: 37.7749, lng: -122.4194 }
      },
      network: {
        connection_type: 'WiFi',
        network_name: 'Company-WiFi',
        signal_strength: 85,
        bandwidth_usage: '2.3 GB',
        vpn_status: 'connected'
      },
      security: {
        encryption_enabled: true,
        biometric_enabled: true,
        passcode_enabled: true,
        remote_wipe_enabled: true,
        jailbroken: false,
        compliance_status: 'compliant',
        last_security_scan: '2024-01-15 08:00:00',
        security_score: 92
      },
      hardware: {
        storage_total: '256 GB',
        storage_used: '128 GB',
        memory: '8 GB',
        processor: 'A17 Pro',
        battery_level: 78,
        screen_resolution: '1179x2556'
      },
      applications: [
        { name: 'Company Portal', version: '2.1.0', last_updated: '2024-01-10' },
        { name: 'Slack', version: '4.35.0', last_updated: '2024-01-12' },
        { name: 'Microsoft Teams', version: '5.8.0', last_updated: '2024-01-08' },
        { name: 'Outlook', version: '4.2.0', last_updated: '2024-01-14' }
      ],
      permissions: {
        can_edit: true,
        can_delete: true,
        can_remote_wipe: true,
        can_lock: true
      }
    }
  };

  const mockStats = {
    uptime: '99.8%',
    data_usage: '15.7 GB',
    app_usage_hours: 42,
    security_incidents: 0,
    compliance_score: 92,
    performance_score: 88,
    battery_health: 95,
    storage_efficiency: 75
  };

  const mockSecurityEvents = [
    {
      id: 'event_001',
      type: 'login_success',
      description: 'Successful biometric authentication',
      timestamp: '2024-01-15 10:30:00',
      severity: 'info',
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      id: 'event_002',
      type: 'app_install',
      description: 'New application installed: Slack',
      timestamp: '2024-01-14 16:45:00',
      severity: 'info',
      icon: Download,
      color: 'text-blue-500'
    },
    {
      id: 'event_003',
      type: 'location_change',
      description: 'Device location changed significantly',
      timestamp: '2024-01-14 09:20:00',
      severity: 'warning',
      icon: MapPin,
      color: 'text-yellow-500'
    },
    {
      id: 'event_004',
      type: 'security_scan',
      description: 'Automated security scan completed',
      timestamp: '2024-01-14 08:00:00',
      severity: 'info',
      icon: Shield,
      color: 'text-green-500'
    },
    {
      id: 'event_005',
      type: 'failed_login',
      description: 'Failed passcode attempt detected',
      timestamp: '2024-01-13 14:15:00',
      severity: 'warning',
      icon: AlertTriangle,
      color: 'text-orange-500'
    }
  ];

  const mockNetworkHistory = [
    {
      id: 'network_001',
      network_name: 'Company-WiFi',
      connection_time: '2024-01-15 08:00:00',
      duration: '2h 30m',
      data_used: '450 MB',
      security_type: 'WPA3'
    },
    {
      id: 'network_002',
      network_name: 'Home-Network',
      connection_time: '2024-01-14 18:30:00',
      duration: '12h 15m',
      data_used: '1.2 GB',
      security_type: 'WPA2'
    },
    {
      id: 'network_003',
      network_name: 'Starbucks-WiFi',
      connection_time: '2024-01-14 12:00:00',
      duration: '45m',
      data_used: '85 MB',
      security_type: 'Open'
    },
    {
      id: 'network_004',
      network_name: 'Company-Guest',
      connection_time: '2024-01-13 14:20:00',
      duration: '1h 10m',
      data_used: '200 MB',
      security_type: 'WPA2'
    }
  ];

  const mockUsageMetrics = {
    daily_usage: [
      { date: '2024-01-15', hours: 6.5, apps_used: 12 },
      { date: '2024-01-14', hours: 8.2, apps_used: 15 },
      { date: '2024-01-13', hours: 5.8, apps_used: 10 },
      { date: '2024-01-12', hours: 7.1, apps_used: 14 },
      { date: '2024-01-11', hours: 6.9, apps_used: 11 },
      { date: '2024-01-10', hours: 4.2, apps_used: 8 },
      { date: '2024-01-09', hours: 7.8, apps_used: 16 }
    ],
    top_apps: [
      { name: 'Company Portal', usage_hours: 12.5, percentage: 30 },
      { name: 'Slack', usage_hours: 8.3, percentage: 20 },
      { name: 'Microsoft Teams', usage_hours: 6.7, percentage: 16 },
      { name: 'Outlook', usage_hours: 5.2, percentage: 12 },
      { name: 'Safari', usage_hours: 4.1, percentage: 10 },
      { name: 'Others', usage_hours: 5.0, percentage: 12 }
    ]
  };

  useEffect(() => {
    if (device && isOpen) {
      // Simulate loading device data
      setDeviceStats(mockStats);
      setSecurityEvents(mockSecurityEvents);
      setNetworkHistory(mockNetworkHistory);
      setUsageMetrics(mockUsageMetrics);
    }
  }, [device, isOpen]);

  const getDeviceData = () => {
    return device || mockDeviceData.device_001;
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return Smartphone;
      case 'laptop':
        return Laptop;
      case 'desktop':
        return Monitor;
      case 'tablet':
        return Tablet;
      default:
        return Smartphone;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'quarantined':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTrustLevelColor = (trustLevel) => {
    switch (trustLevel) {
      case 'trusted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'untrusted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeviceAction = (action) => {
    console.log(`Device action: ${action}`);
    // Implement device actions like lock, wipe, etc.
  };

  if (!isOpen) return null;

  const deviceData = getDeviceData();
  const DeviceIcon = getDeviceIcon(deviceData.device_type);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <DeviceIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {deviceData.device_name}
                </h3>
                <div className="flex items-center mt-1 space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deviceData.status)}`}>
                    {deviceData.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTrustLevelColor(deviceData.trust_level)}`}>
                    {deviceData.trust_level}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {deviceData.model}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {deviceData.permissions?.can_lock && (
                <button
                  onClick={() => handleDeviceAction('lock')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Lock
                </button>
              )}
              {deviceData.permissions?.can_edit && (
                <button
                  onClick={() => onEdit && onEdit(deviceData)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: Eye },
                  { id: 'security', name: 'Security', icon: Shield },
                  { id: 'network', name: 'Network', icon: Wifi },
                  { id: 'usage', name: 'Usage', icon: BarChart3 },
                  { id: 'applications', name: 'Applications', icon: Settings }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Device Info */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Device Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner</label>
                      <div className="mt-1 flex items-center">
                        {deviceData.user?.avatar ? (
                          <img
                            className="h-6 w-6 rounded-full"
                            src={deviceData.user.avatar}
                            alt={deviceData.user.name}
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {deviceData.user?.name || 'Unknown User'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Manufacturer</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{deviceData.manufacturer}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operating System</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{deviceData.os} {deviceData.os_version}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Seen</label>
                      <div className="mt-1 flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">{formatDateTime(deviceData.last_seen)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registered</label>
                      <div className="mt-1 flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">{formatDate(deviceData.registered_date)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                      <div className="mt-1 flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">{deviceData.location.city}, {deviceData.location.country}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Activity className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              Uptime
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                              {deviceStats.uptime}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Globe className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              Data Usage
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                              {deviceStats.data_usage}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Shield className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              Security Score
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                              {deviceData.security?.security_score || 'N/A'}%
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Battery className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              Battery Level
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                              {deviceData.hardware?.battery_level || 'N/A'}%
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hardware Info */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Hardware Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Storage</label>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Used</span>
                          <span className="text-gray-900 dark:text-white">{deviceData.hardware?.storage_used || 'N/A'} / {deviceData.hardware?.storage_total || 'N/A'}</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: '50%' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Memory</label>
                      <div className="mt-1 flex items-center">
                        <MemoryStick className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">{deviceData.hardware?.memory || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Processor</label>
                      <div className="mt-1 flex items-center">
                        <Cpu className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">{deviceData.hardware?.processor || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Screen Resolution</label>
                      <span className="mt-1 text-sm text-gray-900 dark:text-white">{deviceData.hardware?.screen_resolution || 'N/A'}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Battery Health</label>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Health</span>
                          <span className="text-gray-900 dark:text-white">{deviceStats.battery_health}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${deviceStats.battery_health}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Security Status */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Encryption</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deviceData.security?.encryption_enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {deviceData.security?.encryption_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <Eye className="h-5 w-5 text-blue-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Biometric</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deviceData.security?.biometric_enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {deviceData.security?.biometric_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <Lock className="h-5 w-5 text-purple-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Passcode</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deviceData.security?.passcode_enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {deviceData.security?.passcode_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <Trash2 className="h-5 w-5 text-red-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Remote Wipe</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deviceData.security?.remote_wipe_enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {deviceData.security?.remote_wipe_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Jailbroken</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${!deviceData.security?.jailbroken ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {!deviceData.security?.jailbroken ? 'No' : 'Yes'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Compliance</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deviceData.security?.compliance_status === 'compliant' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {deviceData.security?.compliance_status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Events */}
                <div className="bg-white dark:bg-gray-700 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Recent Security Events</h4>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {securityEvents.map((event) => {
                      const Icon = event.icon;
                      return (
                        <div key={event.id} className="p-6">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <Icon className={`h-5 w-5 ${event.color}`} />
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {event.description}
                                </p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                                  {event.severity}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDateTime(event.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Network Tab */}
            {activeTab === 'network' && (
              <div className="space-y-6">
                {/* Current Network */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Network</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Network Name</label>
                      <div className="mt-1 flex items-center">
                        <Wifi className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">{deviceData.network?.network_name || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Connection Type</label>
                      <span className="mt-1 text-sm text-gray-900 dark:text-white">{deviceData.network?.connection_type || 'N/A'}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Signal Strength</label>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Strength</span>
                          <span className="text-gray-900 dark:text-white">{deviceData.network?.signal_strength || 0}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${deviceData.network?.signal_strength || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</label>
                      <span className="mt-1 text-sm text-gray-900 dark:text-white">{deviceData.location.ip_address}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bandwidth Usage</label>
                      <span className="mt-1 text-sm text-gray-900 dark:text-white">{deviceData.network?.bandwidth_usage || 'N/A'}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">VPN Status</label>
                      <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deviceData.network?.vpn_status === 'connected' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                        {deviceData.network?.vpn_status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Network History */}
                <div className="bg-white dark:bg-gray-700 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Network History</h4>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {networkHistory.map((network) => (
                      <div key={network.id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Wifi className="h-4 w-4 text-gray-400 mr-2" />
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">{network.network_name}</h5>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${network.security_type === 'WPA3' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : network.security_type === 'WPA2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                                {network.security_type}
                              </span>
                            </div>
                            <div className="flex items-center mt-2 space-x-4">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">Connected {formatDateTime(network.connection_time)}</span>
                              </div>
                              <div className="flex items-center">
                                <Activity className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">Duration: {network.duration}</span>
                              </div>
                              <div className="flex items-center">
                                <Globe className="h-3 w-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">Data: {network.data_used}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && (
              <div className="space-y-6">
                {/* Usage Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Clock className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              App Usage
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                              {deviceStats.app_usage_hours}h
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <TrendingUp className="h-6 w-6 text-green-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              Performance
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                              {deviceStats.performance_score}%
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <HardDrive className="h-6 w-6 text-purple-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              Storage Efficiency
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                              {deviceStats.storage_efficiency}%
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-6 w-6 text-orange-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                              Security Incidents
                            </dt>
                            <dd className="text-lg font-medium text-gray-900 dark:text-white">
                              {deviceStats.security_incidents}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Apps */}
                <div className="bg-white dark:bg-gray-700 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Top Applications</h4>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {usageMetrics.top_apps?.map((app, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{app.usage_hours}h ({app.percentage}%)</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${app.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Usage Chart Placeholder */}
                <div className="bg-white dark:bg-gray-700 shadow rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Daily Usage Trends</h4>
                  <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">Usage analytics chart would be displayed here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-700 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">Installed Applications</h4>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {deviceData.applications?.length > 0 ? (
                      deviceData.applications.map((app, index) => (
                        <div key={index} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                                <Settings className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                              </div>
                              <div className="ml-4">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</h5>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Version {app.version}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: {formatDate(app.last_updated)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-red-400 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No applications found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
            <div className="flex items-center space-x-2">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {deviceData.permissions?.can_remote_wipe && (
                <button
                  onClick={() => handleDeviceAction('wipe')}
                  className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remote Wipe
                </button>
              )}
              {deviceData.permissions?.can_delete && (
                <button
                  onClick={() => onDelete && onDelete(deviceData)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Device
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;