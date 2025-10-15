import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Search, 
  Trash2, 
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download
} from 'lucide-react';
import TokenDetails from './components/TokenDetails';
import api from '../../utils/api';

const ApiTokens = () => {
  const [tokens, setTokens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showTokenValue, setShowTokenValue] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock data for API tokens
  const mockTokens = [
    {
      token_id: 'token_001',
      token_name: 'Mobile App Production',
      description: 'Production API access for mobile application',
     token_value: 'sk_live_51H7qABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ567',
      user_id: 'user_001',
      user_name: 'John Smith',
      created_at: '2024-01-15T10:30:00Z',
      expires_at: '2024-07-15T10:30:00Z',
      last_used: '2024-03-15T14:22:00Z',
      status: 'Active',
      scopes: ['read:users', 'write:users', 'read:orders', 'write:orders'],

      permissions: {
        can_read: true,
        can_write: true,
        can_delete: false,
        can_admin: false
      }
    },
    {
      token_id: 'token_002',
      token_name: 'Web Dashboard',
      description: 'API access for web dashboard analytics',
     token_value: 'sk_test_51H7qABC789DEF012GHI345JKL678MNO901PQR234STU567VWX890YZ123',
      user_id: 'user_002',
      user_name: 'Sarah Johnson',
      created_at: '2024-02-01T09:15:00Z',
      expires_at: '2024-08-01T09:15:00Z',
      last_used: '2024-03-15T16:45:00Z',
      status: 'Active',
      scopes: ['read:analytics', 'read:reports', 'read:users'],

      permissions: {
        can_read: true,
        can_write: false,
        can_delete: false,
        can_admin: false
      }
    },
    {
      token_id: 'token_003',
      token_name: 'Third Party Integration',
      description: 'Limited access for external partner integration',
     token_value: 'sk_live_51H7qABC456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZ890',
      user_id: 'user_003',
      user_name: 'Mike Wilson',
      created_at: '2024-01-20T14:20:00Z',
      expires_at: '2024-04-20T14:20:00Z',
      last_used: '2024-03-10T12:30:00Z',
      status: 'Expired',
      scopes: ['read:products', 'read:orders'],

      permissions: {
        can_read: true,
        can_write: false,
        can_delete: false,
        can_admin: false
      }
    },
    {
      token_id: 'token_004',
      token_name: 'Development Testing',
      description: 'Development environment testing token',
     token_value: 'sk_test_51H7qABC012DEF345GHI678JKL901MNO234PQR567STU890VWX123YZ456',
      user_id: 'user_004',
      user_name: 'Lisa Brown',
      created_at: '2024-03-01T11:00:00Z',
      expires_at: '2024-06-01T11:00:00Z',
      last_used: '2024-03-15T18:15:00Z',
      status: 'Active',
      scopes: ['read:*', 'write:*'],

      permissions: {
        can_read: true,
        can_write: true,
        can_delete: true,
        can_admin: false
      }
    },
    {
      token_id: 'token_005',
      token_name: 'Suspicious Token',
      description: 'Token showing unusual activity patterns',
     token_value: 'sk_live_51H7qABC999DEF888GHI777JKL666MNO555PQR444STU333VWX222YZ111',
      user_id: 'user_005',
      user_name: 'Unknown User',
      created_at: '2024-03-14T20:00:00Z',
      expires_at: '2024-09-14T20:00:00Z',
      last_used: '2024-03-15T19:45:00Z',
      status: 'Suspended',
      scopes: ['read:users', 'read:orders'],

      permissions: {
        can_read: true,
        can_write: false,
        can_delete: false,
        can_admin: false
      }
    }
  ];

  const statusTypes = ['Active', 'Expired', 'Suspended', 'Revoked'];

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/auth/sessions');
        const sessions = res.data?.data || res.data || [];
        const mapped = sessions.map((s) => ({
          token_id: s._id || s.session_id || `session_${Math.random().toString(36).slice(2)}`,
          token_name: `${(s.device_info?.device?.vendor || '').trim()} ${(s.device_info?.device?.model || '').trim()}`.trim() || (s.device_info?.browser?.name || 'Unknown Client'),
          description: `${s.device_info?.os?.name || 'Unknown OS'} ${s.device_info?.os?.version || ''} • ${s.device_info?.browser?.name || 'Unknown Browser'} ${s.device_info?.browser?.version || ''}`.trim(),
          token_value: s.token,
          user_id: s.user_id || 'unknown',
          user_name: s.user_id.first_name + " " + s.user_id.last_name,
          created_at: s.issued_at,
          expires_at: s.expires_at,
          last_used: null,
          status: s.is_active === false ? 'Revoked' : 'Active',
          ip_address: s.ip_address || 'unknown',
          permissions: {
            can_read: true,
            can_write: false,
            can_delete: false,
            can_admin: false
          },
          _session_db_id: s._id || null,
        }));
        setTokens(mapped);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to fetch sessions';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Filter tokens based on search and status
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.token_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || token.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // CRUD handlers
  const handleViewToken = (token) => {
    setSelectedToken(token);
    setShowTokenDetails(true);
  };

  const handleDeleteToken = async (tokenId) => {
    const token = tokens.find(t => t.token_id === tokenId);
    if (!token) return;
    const confirm = window.confirm(`Are you sure you want to revoke session/token "${token?.token_name}"? This action cannot be undone and will immediately terminate the session.`);
    if (!confirm) return;

    try {
      const idForApi = token._session_db_id || tokenId;
      await api.put(`/auth/sessions/${idForApi}/revoke`);
      setTokens(tokens.map(t => t.token_id === tokenId ? { ...t, status: 'Revoked' } : t));
      alert('Session revoked successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to revoke session';
      alert(message);
    }
  };



  const handleCopyToken = (tokenValue) => {
    navigator.clipboard.writeText(tokenValue);
    alert('Token copied to clipboard');
  };

  const toggleTokenVisibility = (tokenId) => {
    setShowTokenValue(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Expired': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'Suspended': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Revoked': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig['Expired']}`}>
        {status}
      </span>
    );
  };

  // Format last used date - simplified version
  const formatLastUsed = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Expired';
    if (diffInDays === 0) return 'Expires today';
    if (diffInDays === 1) return 'Expires tomorrow';
    if (diffInDays < 30) return `Expires in ${diffInDays} days`;
    return date.toLocaleDateString();
  };

  const maskToken = (token) => {
    if (!token) return ''; // Handle undefined or null tokens
    if (token.length <= 8) return token;
    return `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;
  };
  
  // Function to export tokens data to CSV
  const exportTokensData = () => {
    try {
      // Prepare data for export (excluding sensitive information)
      const exportData = filteredTokens.map(token => ({
        Name: token.token_name,
        Description: token.description,
        User: token.user_name,
        Status: token.status,
        Created: new Date(token.created_at).toLocaleString(),
        Expires: new Date(token.expires_at).toLocaleString(),
        'Last Used': token.last_used ? new Date(token.last_used).toLocaleString() : 'Never',
        IP: token.ip_address || 'N/A'
      }));
      
      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            // Escape commas and quotes in the data
            const cell = row[header] || '';
            const escaped = cell.toString().replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',')
        )
      ].join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `api-tokens-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export failed:', error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Access Tokens</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage API tokens for secure programmatic access to your CRM data
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={exportTokensData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={filteredTokens.length === 0 || loading}
            title={filteredTokens.length === 0 ? "No data to export" : "Export tokens to CSV"}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">Loading sessions...</div>
      )}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">{error}</div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Key className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Tokens
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {tokens.length}
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
                    {tokens.filter(t => t.status === 'Active').length}
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
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Expiring Soon
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {tokens.filter(t => {
                      const daysUntilExpiry = Math.floor((new Date(t.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                    }).length}
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
                    Suspended
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {tokens.filter(t => t.status === 'Suspended').length}
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
                  placeholder="Search tokens or users..."
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
          </div>
        </div>

        {/* Tokens Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTokens.map((token) => (
                <tr key={token.token_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <Key className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {token.token_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <span className="font-mono">
                            {showTokenValue[token.token_id] ? token.token_value : maskToken(token.token_value)}
                          </span>
                          <button
                            onClick={() => toggleTokenVisibility(token.token_id)}
                            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showTokenValue[token.token_id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={() => handleCopyToken(token.token_value)}
                            className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{token.user_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{token.ip_address || 'No requests'}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusBadge(token.status)}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last used: {formatLastUsed(token.last_used)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatExpiryDate(token.expires_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewToken(token)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Token Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                        
                        <button 
                          onClick={() => handleDeleteToken(token.token_id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Revoke Token"
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

        {filteredTokens.length === 0 && (
          <div className="text-center py-12">
            <Key className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tokens found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No API tokens available to display.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Token Details Modal */}
      <TokenDetails
        isOpen={showTokenDetails}
        onClose={() => setShowTokenDetails(false)}
        tokenId={selectedToken?.token_id}
      />
    </div>
  );
};

export default ApiTokens;