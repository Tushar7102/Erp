import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  MapPin, 
  Shield, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Globe,
  Battery,
  Signal
} from 'lucide-react';
import DeviceForm from './components/DeviceForm';
import DeviceDetails from './components/DeviceDetails';
import { 
  getAllDevices, 
  getUserDevices, 
  registerDevice, 
  updateDevice, 
  deleteDevice, 
  trustDevice, 
  blockDevice, 
  unblockDevice 
} from '../../services/deviceService';
import { useAuth } from "../../context/AuthContext";
import { toast } from 'react-toastify';

const DeviceRegistry = () => {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch devices from API
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      let response;
      
      // If user is admin, fetch all devices, otherwise fetch only user's devices
      if (user?.role === 'admin') {
        response = await getAllDevices();
      } else {
        response = await getUserDevices(user?.id);
      }
      
      if (response.data) {
        setDevices(response.data);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // For backward compatibility during development, using mock data as fallback
  const mockDevices = [
    {
      device_id: 'dev_001',
      device_name: 'John\'s iPhone 14',
      device_type: 'Mobile',
      user_id: 'user_001',
      user_name: 'John Smith',
      device_model: 'iPhone 14 Pro',
      os_version: 'iOS 17.2',
      app_version: '2.1.0',
      device_token: 'abc123...xyz789',
      registration_date: '2024-01-15T10:30:00Z',
      last_active: '2024-03-15T14:22:00Z',
      status: 'Active',
      is_trusted: true,
      two_factor_enabled: true,
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'New Delhi, India',
        last_updated: '2024-03-15T14:22:00Z'
      },
      device_info: {
        browser: 'Safari',
        ip_address: '192.168.1.100',
        mac_address: 'AA:BB:CC:DD:EE:FF',
        network_type: 'WiFi',
        battery_level: 85,
        signal_strength: 4
      },
      security_features: {
        biometric_enabled: true,
        screen_lock: true,
        remote_wipe_enabled: true,
        encryption_enabled: true
      }
    },
    {
      device_id: 'dev_002',
      device_name: 'Sarah\'s MacBook Pro',
      device_type: 'Desktop',
      user_id: 'user_002',
      user_name: 'Sarah Johnson',
      device_model: 'MacBook Pro 16"',
      os_version: 'macOS 14.2',
      app_version: '2.1.0',
      device_token: 'def456...uvw123',
      registration_date: '2024-01-20T09:15:00Z',
      last_active: '2024-03-15T16:45:00Z',
      status: 'Active',
      is_trusted: true,
      two_factor_enabled: true,
      location: {
        latitude: 19.0760,
        longitude: 72.8777,
        address: 'Mumbai, India',
        last_updated: '2024-03-15T16:45:00Z'
      },
      device_info: {
        browser: 'Chrome',
        ip_address: '192.168.1.101',
        mac_address: 'BB:CC:DD:EE:FF:AA',
        network_type: 'Ethernet',
        battery_level: null,
        signal_strength: null
      },
      security_features: {
        biometric_enabled: true,
        screen_lock: true,
        remote_wipe_enabled: false,
        encryption_enabled: true
      }
    },
    {
      device_id: 'dev_003',
      device_name: 'Mike\'s Android Phone',
      device_type: 'Mobile',
      user_id: 'user_003',
      user_name: 'Mike Wilson',
      device_model: 'Samsung Galaxy S23',
      os_version: 'Android 14',
      app_version: '2.0.8',
      device_token: 'ghi789...rst456',
      registration_date: '2024-02-01T11:20:00Z',
      last_active: '2024-03-14T18:30:00Z',
      status: 'Inactive',
      is_trusted: false,
      two_factor_enabled: false,
      location: {
        latitude: 12.9716,
        longitude: 77.5946,
        address: 'Bangalore, India',
        last_updated: '2024-03-14T18:30:00Z'
      },
      device_info: {
        browser: 'Chrome Mobile',
        ip_address: '192.168.1.102',
        mac_address: 'CC:DD:EE:FF:AA:BB',
        network_type: '4G',
        battery_level: 45,
        signal_strength: 3
      },
      security_features: {
        biometric_enabled: false,
        screen_lock: true,
        remote_wipe_enabled: true,
        encryption_enabled: false
      }
    },
    {
      device_id: 'dev_004',
      device_name: 'Lisa\'s iPad',
      device_type: 'Tablet',
      user_id: 'user_004',
      user_name: 'Lisa Brown',
      device_model: 'iPad Pro 12.9"',
      os_version: 'iPadOS 17.2',
      app_version: '2.1.0',
      device_token: 'jkl012...mno345',
      registration_date: '2024-02-10T13:45:00Z',
      last_active: '2024-03-15T12:15:00Z',
      status: 'Active',
      is_trusted: true,
      two_factor_enabled: true,
      location: {
        latitude: 22.5726,
        longitude: 88.3639,
        address: 'Kolkata, India',
        last_updated: '2024-03-15T12:15:00Z'
      },
      device_info: {
        browser: 'Safari',
        ip_address: '192.168.1.103',
        mac_address: 'DD:EE:FF:AA:BB:CC',
        network_type: 'WiFi',
        battery_level: 92,
        signal_strength: 5
      },
      security_features: {
        biometric_enabled: true,
        screen_lock: true,
        remote_wipe_enabled: true,
        encryption_enabled: true
      }
    },
    {
      device_id: 'dev_005',
      device_name: 'Unknown Device',
      device_type: 'Mobile',
      user_id: 'unknown',
      user_name: 'Unknown User',
      device_model: 'Unknown',
      os_version: 'Unknown',
      app_version: 'Unknown',
      device_token: 'suspicious_token',
      registration_date: '2024-03-15T20:00:00Z',
      last_active: '2024-03-15T20:05:00Z',
      status: 'Blocked',
      is_trusted: false,
      two_factor_enabled: false,
      location: {
        latitude: 0,
        longitude: 0,
        address: 'Unknown Location',
        last_updated: '2024-03-15T20:05:00Z'
      },
      device_info: {
        browser: 'Unknown',
        ip_address: '203.0.113.1',
        mac_address: 'Unknown',
        network_type: 'Unknown',
        battery_level: null,
        signal_strength: null
      },
      security_features: {
        biometric_enabled: false,
        screen_lock: false,
        remote_wipe_enabled: false,
        encryption_enabled: false
      }
    }
  ];

  const deviceTypes = ['Mobile', 'Desktop', 'Tablet'];
  const statusTypes = ['Active', 'Inactive', 'Blocked', 'Pending'];

  useEffect(() => {
    // Initial load - use fetchDevices instead of mock data
    if (devices.length === 0) {
      fetchDevices();
    }
  }, []);

  // Filter devices based on search, status, and type
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_info.ip_address.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    const matchesType = filterType === 'all' || device.device_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // CRUD handlers
  const handleViewDevice = (device) => {
    setSelectedDevice(device);
    setShowDeviceDetails(true);
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = async (deviceId) => {
    const device = devices.find(d => d.device_id === deviceId);
    if (window.confirm(`Are you sure you want to remove device "${device?.device_name}"? This will revoke access for this device.`)) {
      try {
        const response = await deleteDevice(deviceId);
        if (response.success) {
          toast.success('Device removed successfully');
          fetchDevices(); // Refresh the device list
        }
      } catch (error) {
        console.error('Error deleting device:', error);
        toast.error(error.message || 'Failed to delete device');
      }
    }
  };

  const handleBlockDevice = async (deviceId) => {
    try {
      const response = await blockDevice(deviceId);
      if (response.success) {
        toast.success('Device blocked successfully');
        fetchDevices(); // Refresh the device list
      }
    } catch (error) {
      console.error('Error blocking device:', error);
      toast.error(error.message || 'Failed to block device');
    }
  };

  const handleUnblockDevice = async (deviceId) => {
    try {
      const response = await unblockDevice(deviceId);
      if (response.success) {
        toast.success('Device unblocked successfully');
        fetchDevices(); // Refresh the device list
      }
    } catch (error) {
      console.error('Error unblocking device:', error);
      toast.error(error.message || 'Failed to unblock device');
    }
  };

  const handleTrustDevice = async (deviceId) => {
    try {
      const device = devices.find(d => d.device_id === deviceId);
      const response = device.is_trusted 
        ? await untrustDevice(deviceId)
        : await trustDevice(deviceId);
      
      if (response.success) {
        toast.success(`Device ${device.is_trusted ? 'untrusted' : 'trusted'} successfully`);
        fetchDevices(); // Refresh the device list
      }
    } catch (error) {
      console.error('Error updating device trust status:', error);
      toast.error(error.message || 'Failed to update device trust status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'Blocked': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig['Inactive']}`}>
        {status}
      </span>
    );
  };

  const getDeviceIcon = (deviceType) => {
    const icons = {
      'Mobile': Smartphone,
      'Desktop': Monitor,
      'Tablet': Tablet
    };
    const Icon = icons[deviceType] || Smartphone;
    return <Icon className="h-4 w-4" />;
  };

  const getTrustBadge = (isTrusted) => {
    return isTrusted ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
        <Shield className="h-3 w-3 mr-1" />
        Trusted
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Untrusted
      </span>
    );
  };

  const formatLastActive = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Registry</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Monitor and manage registered devices with 2FA and location tracking
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={fetchDevices}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => setShowDeviceModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Smartphone className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Devices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {devices.length}
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
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {devices.filter(d => d.status === 'Active').length}
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
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Trusted
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {devices.filter(d => d.is_trusted).length}
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
                <Lock className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    2FA Enabled
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {devices.filter(d => d.two_factor_enabled).length}
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
                    Blocked
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {devices.filter(d => d.status === 'Blocked').length}
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search devices, users, or IP addresses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-40">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                {statusTypes.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="sm:w-40">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {deviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Devices Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Security
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDevices.map((device) => (
                <tr key={device.device_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          {getDeviceIcon(device.device_type)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {device.device_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {device.device_model} • {device.os_version}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{device.user_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{device.device_info.ip_address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {device.location.address}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusBadge(device.status)}
                      {getTrustBadge(device.is_trusted)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {device.two_factor_enabled ? (
                        <Shield className="h-4 w-4 text-green-500" title="2FA Enabled" />
                      ) : (
                        <Shield className="h-4 w-4 text-gray-400" title="2FA Disabled" />
                      )}
                      {device.security_features.biometric_enabled ? (
                        <Lock className="h-4 w-4 text-blue-500" title="Biometric Enabled" />
                      ) : (
                        <Unlock className="h-4 w-4 text-gray-400" title="Biometric Disabled" />
                      )}
                      {device.device_info.network_type === 'WiFi' ? (
                        <Wifi className="h-4 w-4 text-green-500" title="WiFi Connected" />
                      ) : device.device_info.network_type === 'Ethernet' ? (
                        <Globe className="h-4 w-4 text-blue-500" title="Ethernet Connected" />
                      ) : (
                        <Signal className="h-4 w-4 text-orange-500" title="Mobile Network" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatLastActive(device.last_active)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewDevice(device)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Device Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleTrustDevice(device.device_id)}
                        className={`${device.is_trusted ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} dark:text-blue-400 dark:hover:text-blue-300`}
                        title={device.is_trusted ? 'Remove Trust' : 'Mark as Trusted'}
                      >
                        <Shield className="h-4 w-4" />
                      </button>
                      {device.status === 'Blocked' ? (
                        <button 
                          onClick={() => handleUnblockDevice(device.device_id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Unblock Device"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleBlockDevice(device.device_id)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Block Device"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteDevice(device.device_id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove Device"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredDevices.length === 0 && (
          <div className="text-center py-12">
            <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No devices found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No devices have been registered yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Device Details Modal */}
      <DeviceDetails
        device={selectedDevice}
        isOpen={showDeviceDetails}
        onClose={() => setShowDeviceDetails(false)}
        onEdit={(device) => {
          setShowDeviceDetails(false);
          handleEditDevice(device);
        }}
        onDelete={(device) => {
          setShowDeviceDetails(false);
          handleDeleteDevice(device);
        }}
      />

      {/* Device Form Modal */}
      <DeviceForm
        device={editingDevice}
        isOpen={showDeviceModal}
        onClose={() => {
          setShowDeviceModal(false);
          setEditingDevice(null);
        }}
        onSubmit={(deviceData) => {
          // Handle device form submission
          if (editingDevice) {
            // Update existing device
            setDevices(devices.map(device => 
              device.device_id === editingDevice.device_id 
                ? { ...deviceData, device_id: editingDevice.device_id }
                : device
            ));
            alert('Device updated successfully');
          } else {
            // Add new device
            const newDevice = {
              ...deviceData,
              device_id: `dev_${Date.now()}`,
              registration_date: new Date().toISOString(),
              last_active: new Date().toISOString()
            };
            setDevices([...devices, newDevice]);
            alert('Device added successfully');
          }
          setShowDeviceModal(false);
          setEditingDevice(null);
        }}
        title={editingDevice ? 'Edit Device' : 'Add New Device'}
      />
    </div>
  );
};

export default DeviceRegistry;