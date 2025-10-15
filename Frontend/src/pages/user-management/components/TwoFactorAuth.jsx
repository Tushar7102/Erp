import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Monitor,
  Key, 
  QrCode, 
  Copy, 
  Check, 
  X, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  Wifi,
  WifiOff,
  Globe,
  MapPin,
  Calendar,
  Activity,
  Bell,
  BellOff
} from 'lucide-react';

const TwoFactorAuth = ({ userId, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('setup');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupMethod, setSetupMethod] = useState('app');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [authHistory, setAuthHistory] = useState([]);
  const [settings, setSettings] = useState({
    requireForLogin: true,
    requireForSensitiveActions: true,
    rememberDevice: true,
    deviceTrustDuration: 30, // days
    backupCodesEnabled: true,
    smsEnabled: true,
    emailEnabled: false,
    appEnabled: true
  });

  // Mock data
  const mockTrustedDevices = [
    {
      device_id: 'device_001',
      device_name: 'iPhone 15 Pro',
      device_type: 'Mobile',
      os: 'iOS 17.0',
      browser: 'Safari',
      ip_address: '192.168.1.100',
      location: 'New York, USA',
      added_date: '2024-03-01T10:30:00Z',
      last_used: '2024-03-15T14:22:00Z',
      is_current: true,
      trusted_until: '2024-04-01T10:30:00Z'
    },
    {
      device_id: 'device_002',
      device_name: 'MacBook Pro',
      device_type: 'Desktop',
      os: 'macOS Sonoma',
      browser: 'Chrome 120.0',
      ip_address: '192.168.1.101',
      location: 'New York, USA',
      added_date: '2024-02-15T09:15:00Z',
      last_used: '2024-03-14T16:45:00Z',
      is_current: false,
      trusted_until: '2024-03-15T09:15:00Z'
    },
    {
      device_id: 'device_003',
      device_name: 'Work Laptop',
      device_type: 'Desktop',
      os: 'Windows 11',
      browser: 'Edge 120.0',
      ip_address: '203.0.113.45',
      location: 'San Francisco, USA',
      added_date: '2024-01-20T14:20:00Z',
      last_used: '2024-03-10T12:30:00Z',
      is_current: false,
      trusted_until: '2024-02-20T14:20:00Z'
    }
  ];

  const mockAuthHistory = [
    {
      auth_id: 'auth_001',
      timestamp: '2024-03-15T14:22:00Z',
      method: 'app',
      status: 'success',
      device: 'iPhone 15 Pro',
      ip_address: '192.168.1.100',
      location: 'New York, USA',
      action: 'Login'
    },
    {
      auth_id: 'auth_002',
      timestamp: '2024-03-15T10:15:00Z',
      method: 'sms',
      status: 'success',
      device: 'MacBook Pro',
      ip_address: '192.168.1.101',
      location: 'New York, USA',
      action: 'Sensitive Action'
    },
    {
      auth_id: 'auth_003',
      timestamp: '2024-03-14T16:45:00Z',
      method: 'app',
      status: 'failed',
      device: 'Work Laptop',
      ip_address: '203.0.113.45',
      location: 'San Francisco, USA',
      action: 'Login'
    },
    {
      auth_id: 'auth_004',
      timestamp: '2024-03-14T09:30:00Z',
      method: 'backup_code',
      status: 'success',
      device: 'iPhone 15 Pro',
      ip_address: '192.168.1.100',
      location: 'New York, USA',
      action: 'Account Recovery'
    }
  ];

  useEffect(() => {
    // Simulate loading user's 2FA status
    setTwoFactorEnabled(true);
    setPhoneNumber('+1 (555) 123-4567');
    setEmail('user@example.com');
    setTrustedDevices(mockTrustedDevices);
    setAuthHistory(mockAuthHistory);
    
    // Generate mock QR code and backup codes
   // setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    setBackupCodes([
      'ABC123DEF456',
      'GHI789JKL012',
      'MNO345PQR678',
      'STU901VWX234',
      'YZ567ABC890',
      'DEF123GHI456',
      'JKL789MNO012',
      'PQR345STU678'
    ]);
  }, []);

  const handleEnable2FA = async () => {
    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      setTwoFactorEnabled(true);
      setIsVerifying(false);
      setActiveTab('status');
      if (onUpdate) onUpdate();
      alert('2FA enabled successfully!');
    }, 2000);
  };

  const handleDisable2FA = async () => {
    if (window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      setIsVerifying(true);
      setTimeout(() => {
        setTwoFactorEnabled(false);
        setIsVerifying(false);
        setActiveTab('setup');
        if (onUpdate) onUpdate();
        alert('2FA disabled successfully!');
      }, 1500);
    }
  };

  const handleVerifyCode = () => {
    if (verificationCode.length === 6) {
      handleEnable2FA();
    } else {
      alert('Please enter a valid 6-digit code');
    }
  };

  const handleRemoveTrustedDevice = (deviceId) => {
    if (window.confirm('Remove this trusted device? You will need to verify 2FA on this device next time.')) {
      setTrustedDevices(trustedDevices.filter(device => device.device_id !== deviceId));
      alert('Trusted device removed successfully');
    }
  };

  const handleCopyBackupCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Backup code copied to clipboard');
  };

  const handleDownloadBackupCodes = () => {
    const content = `2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe and secure!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      'success': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig['pending']}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMethodIcon = (method) => {
    const iconMap = {
      'app': Smartphone,
      'sms': MessageSquare,
      'email': Mail,
      'backup_code': Key
    };
    
    const IconComponent = iconMap[method] || Shield;
    return <IconComponent className="h-4 w-4" />;
  };

  const tabs = [
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'status', label: 'Status', icon: Shield },
    { id: 'devices', label: 'Trusted Devices', icon: Smartphone },
    { id: 'history', label: 'Auth History', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Secure your account with an additional layer of protection
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
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Setup Tab */}
          {activeTab === 'setup' && (
            <div className="space-y-6">
              {!twoFactorEnabled ? (
                <>
                  <div className="text-center">
                    <Shield className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                      Enable Two-Factor Authentication
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Choose your preferred method to secure your account
                    </p>
                  </div>

                  {/* Method Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setSetupMethod('app')}
                      className={`p-4 border-2 rounded-lg text-left ${
                        setupMethod === 'app'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <Smartphone className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Authenticator App</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Use Google Authenticator, Authy, or similar apps
                      </p>
                    </button>

                    <button
                      onClick={() => setSetupMethod('sms')}
                      className={`p-4 border-2 rounded-lg text-left ${
                        setupMethod === 'sms'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <MessageSquare className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">SMS</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive codes via text message
                      </p>
                    </button>

                    <button
                      onClick={() => setSetupMethod('email')}
                      className={`p-4 border-2 rounded-lg text-left ${
                        setupMethod === 'email'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Email</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive codes via email
                      </p>
                    </button>
                  </div>

                  {/* Setup Instructions */}
                  {setupMethod === 'app' && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        Setup Authenticator App
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                            <li>Open the app and tap "Add Account" or "+"</li>
                            <li>Scan the QR code or enter the setup key manually</li>
                            <li>Enter the 6-digit code from your app below</li>
                          </ol>
                        </div>
                        <div className="text-center">
                          <div className="bg-white p-4 rounded-lg inline-block">
                            <QrCode className="h-32 w-32 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Setup Key: ABCD EFGH IJKL MNOP
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {setupMethod === 'sms' && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        Setup SMS Authentication
                      </h4>
                      <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {setupMethod === 'email' && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        Setup Email Authentication
                      </h4>
                      <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Verification */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                      Verify Setup
                    </h4>
                    <div className="max-w-md">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter 6-digit verification code
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleVerifyCode}
                          disabled={verificationCode.length !== 6 || isVerifying}
                          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isVerifying ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    2FA is Already Enabled
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Your account is protected with two-factor authentication
                  </p>
                  <button
                    onClick={() => setActiveTab('status')}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    View Status
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
                  <div>
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
                      Two-Factor Authentication Enabled
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Your account is protected with 2FA
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Active Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Smartphone className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">Authenticator App</span>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">SMS ({phoneNumber})</span>
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400">Active</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Backup Codes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 dark:text-white">Available Codes</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{backupCodes.length}</span>
                    </div>
                    <button
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      {showBackupCodes ? 'Hide' : 'Show'} Backup Codes
                    </button>
                  </div>
                </div>
              </div>

              {showBackupCodes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Backup Codes</h4>
                    <button
                      onClick={handleDownloadBackupCodes}
                      className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">{code}</span>
                          <button
                            onClick={() => handleCopyBackupCode(code)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    Keep these codes safe! Each code can only be used once.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleDisable2FA}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Disable 2FA
                </button>
              </div>
            </div>
          )}

          {/* Trusted Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Trusted Devices</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {trustedDevices.length} devices
                </span>
              </div>

              <div className="space-y-4">
                {trustedDevices.map((device) => (
                  <div key={device.device_id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                            {device.device_type === 'Mobile' ? (
                              <Smartphone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            ) : (
                              <Monitor className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {device.device_name}
                            </h4>
                            {device.is_current && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {device.os} • {device.browser}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {device.ip_address} • {device.location}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          Last used: {formatTimestamp(device.last_used)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Trusted until: {new Date(device.trusted_until).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => handleRemoveTrustedDevice(device.device_id)}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {trustedDevices.length === 0 && (
                <div className="text-center py-8">
                  <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No trusted devices</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Devices will appear here when you choose to trust them during login
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Auth History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Authentication History</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last 30 days
                </span>
              </div>

              <div className="space-y-4">
                {authHistory.map((auth) => (
                  <div key={auth.auth_id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            auth.status === 'success' 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}>
                            {getMethodIcon(auth.method)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {auth.action}
                            </span>
                            <span className="ml-2">{getStatusBadge(auth.status)}</span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {auth.method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {auth.device}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Globe className="h-3 w-3 mr-1" />
                            {auth.ip_address} • {auth.location}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatTimestamp(auth.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {authHistory.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No authentication history</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Authentication attempts will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">2FA Settings</h3>

              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Security Requirements</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          Require 2FA for login
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Always require 2FA when signing in
                        </p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, requireForLogin: !settings.requireForLogin})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.requireForLogin ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.requireForLogin ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          Require 2FA for sensitive actions
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Require 2FA for password changes, role modifications, etc.
                        </p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, requireForSensitiveActions: !settings.requireForSensitiveActions})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.requireForSensitiveActions ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.requireForSensitiveActions ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Device Trust</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          Remember trusted devices
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Allow users to trust devices for a limited time
                        </p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, rememberDevice: !settings.rememberDevice})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.rememberDevice ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.rememberDevice ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {settings.rememberDevice && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Device trust duration (days)
                        </label>
                        <select
                          value={settings.deviceTrustDuration}
                          onChange={(e) => setSettings({...settings, deviceTrustDuration: parseInt(e.target.value)})}
                          className="w-32 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value={7}>7 days</option>
                          <option value={14}>14 days</option>
                          <option value={30}>30 days</option>
                          <option value={60}>60 days</option>
                          <option value={90}>90 days</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Authentication Methods</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Smartphone className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Authenticator App
                        </span>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, appEnabled: !settings.appEnabled})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.appEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.appEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          SMS
                        </span>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, smsEnabled: !settings.smsEnabled})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.smsEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.smsEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Email
                        </span>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, emailEnabled: !settings.emailEnabled})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.emailEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Key className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Backup Codes
                        </span>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, backupCodesEnabled: !settings.backupCodesEnabled})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.backupCodesEnabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.backupCodesEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;