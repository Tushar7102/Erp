import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Tablet, Shield, MapPin, Wifi, Battery, Signal, Save, AlertTriangle, Globe, Lock, Unlock } from 'lucide-react';

const DeviceForm = ({ device, isOpen, onClose, onSubmit, title }) => {
  const [formData, setFormData] = useState({
    device_name: '',
    device_type: 'Mobile',
    user_id: '',
    device_model: '',
    os_version: '',
    app_version: '',
    status: 'Active',
    is_trusted: false,
    two_factor_enabled: false,
    location_address: '',
    ip_address: '',
    mac_address: '',
    network_type: 'WiFi',
    browser: '',
    battery_level: '',
    signal_strength: '',
    biometric_enabled: false,
    screen_lock: false,
    remote_wipe_enabled: false,
    encryption_enabled: false,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Mock data for users
  const users = [
    { id: 'user_001', name: 'John Smith', email: 'john@company.com' },
    { id: 'user_002', name: 'Sarah Johnson', email: 'sarah@company.com' },
    { id: 'user_003', name: 'Mike Wilson', email: 'mike@company.com' },
    { id: 'user_004', name: 'Lisa Brown', email: 'lisa@company.com' },
    { id: 'user_005', name: 'David Lee', email: 'david@company.com' }
  ];

  const deviceTypes = ['Mobile', 'Desktop', 'Tablet', 'Laptop'];
  const networkTypes = ['WiFi', '4G', '5G', 'Ethernet', 'VPN'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Mobile App'];

  // Device model options based on device type
  const deviceModels = {
    Mobile: [
      'iPhone 15 Pro Max',
      'iPhone 15 Pro',
      'iPhone 15',
      'iPhone 14 Pro Max',
      'iPhone 14 Pro',
      'iPhone 14',
      'iPhone 13 Pro Max',
      'iPhone 13 Pro',
      'iPhone 13',
      'Samsung Galaxy S24 Ultra',
      'Samsung Galaxy S24+',
      'Samsung Galaxy S24',
      'Samsung Galaxy S23 Ultra',
      'Samsung Galaxy S23+',
      'Samsung Galaxy S23',
      'Google Pixel 8 Pro',
      'Google Pixel 8',
      'Google Pixel 7 Pro',
      'Google Pixel 7',
      'OnePlus 12',
      'OnePlus 11',
      'Xiaomi 14 Ultra',
      'Xiaomi 14',
      'Other'
    ],
    Desktop: [
      'iMac 24-inch (M3)',
      'iMac 24-inch (M1)',
      'Mac Studio (M2 Ultra)',
      'Mac Studio (M2 Max)',
      'Mac Pro (M2 Ultra)',
      'Dell OptiPlex 7000',
      'Dell OptiPlex 5000',
      'HP EliteDesk 800',
      'HP EliteDesk 600',
      'Lenovo ThinkCentre M90a',
      'Lenovo ThinkCentre M70q',
      'ASUS ExpertCenter D7',
      'ASUS ExpertCenter D5',
      'Custom Built PC',
      'Other'
    ],
    Tablet: [
      'iPad Pro 12.9-inch (6th gen)',
      'iPad Pro 11-inch (4th gen)',
      'iPad Air (5th gen)',
      'iPad (10th gen)',
      'iPad mini (6th gen)',
      'Samsung Galaxy Tab S9 Ultra',
      'Samsung Galaxy Tab S9+',
      'Samsung Galaxy Tab S9',
      'Samsung Galaxy Tab A9+',
      'Microsoft Surface Pro 9',
      'Microsoft Surface Go 3',
      'Lenovo Tab P12 Pro',
      'Lenovo Tab M10',
      'Other'
    ],
    Laptop: [
      'MacBook Pro 16-inch (M3 Max)',
      'MacBook Pro 14-inch (M3 Pro)',
      'MacBook Air 15-inch (M2)',
      'MacBook Air 13-inch (M2)',
      'Dell XPS 13',
      'Dell XPS 15',
      'Dell Latitude 7000',
      'HP EliteBook 840',
      'HP EliteBook 850',
      'HP Spectre x360',
      'Lenovo ThinkPad X1 Carbon',
      'Lenovo ThinkPad T14',
      'Lenovo ThinkPad P1',
      'ASUS ZenBook Pro',
      'ASUS ROG Zephyrus',
      'Microsoft Surface Laptop 5',
      'Microsoft Surface Book 3',
      'Other'
    ]
  };

  useEffect(() => {
    if (device) {
      const deviceModel = device.device_model || '';
      const deviceType = device.device_type || 'Mobile';
      const isCustom = deviceModel && !deviceModels[deviceType]?.includes(deviceModel);
      
      setFormData({
        device_name: device.device_name || '',
        device_type: deviceType,
        user_id: device.user_id || '',
        device_model: deviceModel,
        os_version: device.os_version || '',
        app_version: device.app_version || '',
        status: device.status || 'Active',
        is_trusted: device.is_trusted || false,
        two_factor_enabled: device.two_factor_enabled || false,
        location_address: device.location?.address || '',
        ip_address: device.device_info?.ip_address || '',
        mac_address: device.device_info?.mac_address || '',
        network_type: device.device_info?.network_type || 'WiFi',
        browser: device.device_info?.browser || '',
        battery_level: device.device_info?.battery_level || '',
        signal_strength: device.device_info?.signal_strength || '',
        biometric_enabled: device.security_features?.biometric_enabled || false,
        screen_lock: device.security_features?.screen_lock || false,
        remote_wipe_enabled: device.security_features?.remote_wipe_enabled || false,
        encryption_enabled: device.security_features?.encryption_enabled || false,
        notes: device.notes || ''
      });
      setIsCustomModel(isCustom);
    } else {
      setFormData({
        device_name: '',
        device_type: 'Mobile',
        user_id: '',
        device_model: '',
        os_version: '',
        app_version: '',
        status: 'Active',
        is_trusted: false,
        two_factor_enabled: false,
        location_address: '',
        ip_address: '',
        mac_address: '',
        network_type: 'WiFi',
        browser: '',
        battery_level: '',
        signal_strength: '',
        biometric_enabled: false,
        screen_lock: false,
        remote_wipe_enabled: false,
        encryption_enabled: false,
        notes: ''
      });
      setIsCustomModel(false);
    }
    setErrors({});
  }, [device, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.device_name.trim()) {
      newErrors.device_name = 'Device name is required';
    }

    if (!formData.user_id) {
      newErrors.user_id = 'User assignment is required';
    }

    if (!formData.device_model.trim()) {
      newErrors.device_model = 'Device model is required';
    }

    if (!formData.os_version.trim()) {
      newErrors.os_version = 'OS version is required';
    }

    if (formData.ip_address && !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(formData.ip_address)) {
      newErrors.ip_address = 'Please enter a valid IP address';
    }

    if (formData.mac_address && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(formData.mac_address)) {
      newErrors.mac_address = 'Please enter a valid MAC address (e.g., AA:BB:CC:DD:EE:FF)';
    }

    if (formData.battery_level && (isNaN(formData.battery_level) || formData.battery_level < 0 || formData.battery_level > 100)) {
      newErrors.battery_level = 'Battery level must be between 0 and 100';
    }

    if (formData.signal_strength && (isNaN(formData.signal_strength) || formData.signal_strength < 0 || formData.signal_strength > 5)) {
      newErrors.signal_strength = 'Signal strength must be between 0 and 5';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Reset device model when device type changes
    if (name === 'device_type') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        device_model: '' // Reset device model when type changes
      }));
      setIsCustomModel(false); // Reset custom model state
    } else if (name === 'device_model') {
      // Handle device model selection
      if (value === 'Other') {
        setIsCustomModel(true);
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }));
      } else {
        setIsCustomModel(false);
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Transform form data to match expected structure
      const deviceData = {
        ...formData,
        location: {
          address: formData.location_address
        },
        device_info: {
          ip_address: formData.ip_address,
          mac_address: formData.mac_address,
          network_type: formData.network_type,
          browser: formData.browser,
          battery_level: formData.battery_level ? parseInt(formData.battery_level) : null,
          signal_strength: formData.signal_strength ? parseInt(formData.signal_strength) : null
        },
        security_features: {
          biometric_enabled: formData.biometric_enabled,
          screen_lock: formData.screen_lock,
          remote_wipe_enabled: formData.remote_wipe_enabled,
          encryption_enabled: formData.encryption_enabled
        }
      };

      await onSubmit(deviceData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save device. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'Mobile': return Smartphone;
      case 'Desktop': return Monitor;
      case 'Tablet': return Tablet;
      case 'Laptop': return Monitor;
      default: return Smartphone;
    }
  };

  if (!isOpen) return null;

  const DeviceIcon = getDeviceIcon(formData.device_type);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <DeviceIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {title || (device ? 'Edit Device' : 'Register New Device')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {device ? 'Update device information and security settings' : 'Add a new device to the registry'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <div className="text-sm text-red-700 dark:text-red-400">
                    {errors.submit}
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Device Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Device Name *
                  </label>
                  <div className="mt-1 relative">
                    <DeviceIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="device_name"
                      value={formData.device_name}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.device_name 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Enter device name"
                    />
                  </div>
                  {errors.device_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.device_name}</p>
                  )}
                </div>

                {/* Device Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Device Type
                  </label>
                  <select
                    name="device_type"
                    value={formData.device_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {deviceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* User Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned User *
                  </label>
                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.user_id 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  >
                    <option value="">Select User</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {errors.user_id && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.user_id}</p>
                  )}
                </div>

                {/* Device Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Device Model *
                  </label>
                  {!isCustomModel ? (
                    <select
                      name="device_model"
                      value={formData.device_model}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.device_model 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    >
                      <option value="">Select Device Model</option>
                      {deviceModels[formData.device_type]?.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="device_model"
                        value={formData.device_model}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.device_model 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                        placeholder="Enter custom device model"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomModel(false);
                          setFormData(prev => ({ ...prev, device_model: '' }));
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        ← Back to predefined models
                      </button>
                    </div>
                  )}
                  {errors.device_model && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.device_model}</p>
                  )}
                </div>

                {/* OS Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    OS Version *
                  </label>
                  <input
                    type="text"
                    name="os_version"
                    value={formData.os_version}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.os_version 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="e.g., iOS 17.2, macOS 14.2"
                  />
                  {errors.os_version && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.os_version}</p>
                  )}
                </div>

                {/* App Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    App Version
                  </label>
                  <input
                    type="text"
                    name="app_version"
                    value={formData.app_version}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 2.1.0"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <div className="mt-1 relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="location_address"
                      value={formData.location_address}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Device location or address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Network Information */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Network Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* IP Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    IP Address
                  </label>
                  <div className="mt-1 relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="ip_address"
                      value={formData.ip_address}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.ip_address 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="192.168.1.100"
                    />
                  </div>
                  {errors.ip_address && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ip_address}</p>
                  )}
                </div>

                {/* MAC Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    name="mac_address"
                    value={formData.mac_address}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.mac_address 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="AA:BB:CC:DD:EE:FF"
                  />
                  {errors.mac_address && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.mac_address}</p>
                  )}
                </div>

                {/* Network Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Network Type
                  </label>
                  <div className="mt-1 relative">
                    <Wifi className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <select
                      name="network_type"
                      value={formData.network_type}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {networkTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Browser */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Browser/App
                  </label>
                  <select
                    name="browser"
                    value={formData.browser}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Browser</option>
                    {browsers.map(browser => (
                      <option key={browser} value={browser}>{browser}</option>
                    ))}
                  </select>
                </div>

                {/* Battery Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Battery Level (%)
                  </label>
                  <div className="mt-1 relative">
                    <Battery className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      name="battery_level"
                      value={formData.battery_level}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.battery_level 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="85"
                    />
                  </div>
                  {errors.battery_level && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.battery_level}</p>
                  )}
                </div>

                {/* Signal Strength */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Signal Strength (0-5)
                  </label>
                  <div className="mt-1 relative">
                    <Signal className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      name="signal_strength"
                      value={formData.signal_strength}
                      onChange={handleInputChange}
                      min="0"
                      max="5"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.signal_strength 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="4"
                    />
                  </div>
                  {errors.signal_strength && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.signal_strength}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Trust Settings */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_trusted"
                      checked={formData.is_trusted}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Trusted Device
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="two_factor_enabled"
                      checked={formData.two_factor_enabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Two-Factor Authentication Enabled
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="biometric_enabled"
                      checked={formData.biometric_enabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Biometric Authentication
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="screen_lock"
                      checked={formData.screen_lock}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Screen Lock Enabled
                    </label>
                  </div>
                </div>

                {/* Advanced Security */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="remote_wipe_enabled"
                      checked={formData.remote_wipe_enabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Remote Wipe Enabled
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="encryption_enabled"
                      checked={formData.encryption_enabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                      Device Encryption Enabled
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Additional notes about this device"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {device ? 'Update Device' : 'Register Device'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeviceForm;