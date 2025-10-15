import React, { useState } from 'react';
import { 
  Search, Filter, Download, ChevronDown, ChevronUp, 
  Settings, RefreshCw, Play, Pause, Trash2, Edit, Plus, 
  Check, X, ExternalLink, Database, Lock, Shield, AlertTriangle
} from 'lucide-react';

const IntegrationConfig = () => {
  // Sample data for integrations
  const [integrations, setIntegrations] = useState([
    {
      id: 'int001',
      name: 'Salesforce CRM',
      type: 'crm',
      status: 'active',
      last_sync: '2023-07-15T14:30:00',
      sync_frequency: 'hourly',
      fields_mapped: 24,
      created_at: '2023-01-10T09:30:00',
      api_key: 'sf_api_********',
      endpoint: 'https://api.salesforce.com/v2/',
      error_count: 0
    },
    {
      id: 'int002',
      name: 'Mailchimp',
      type: 'email',
      status: 'active',
      last_sync: '2023-07-15T13:45:00',
      sync_frequency: 'daily',
      fields_mapped: 12,
      created_at: '2023-02-05T11:20:00',
      api_key: 'mc_api_********',
      endpoint: 'https://api.mailchimp.com/3.0/',
      error_count: 2
    },
    {
      id: 'int003',
      name: 'Zendesk Support',
      type: 'support',
      status: 'inactive',
      last_sync: '2023-07-10T09:15:00',
      sync_frequency: 'daily',
      fields_mapped: 18,
      created_at: '2023-03-12T14:10:00',
      api_key: 'zd_api_********',
      endpoint: 'https://api.zendesk.com/v2/',
      error_count: 5
    },
    {
      id: 'int004',
      name: 'HubSpot',
      type: 'crm',
      status: 'active',
      last_sync: '2023-07-15T10:30:00',
      sync_frequency: 'hourly',
      fields_mapped: 30,
      created_at: '2023-04-18T08:45:00',
      api_key: 'hs_api_********',
      endpoint: 'https://api.hubspot.com/v3/',
      error_count: 1
    },
    {
      id: 'int005',
      name: 'Google Analytics',
      type: 'analytics',
      status: 'active',
      last_sync: '2023-07-15T12:00:00',
      sync_frequency: 'daily',
      fields_mapped: 15,
      created_at: '2023-05-20T16:30:00',
      api_key: 'ga_api_********',
      endpoint: 'https://analytics.google.com/api/v1/',
      error_count: 0
    },
    {
      id: 'int006',
      name: 'Stripe Payments',
      type: 'payment',
      status: 'active',
      last_sync: '2023-07-15T11:45:00',
      sync_frequency: 'hourly',
      fields_mapped: 10,
      created_at: '2023-06-05T13:20:00',
      api_key: 'st_api_********',
      endpoint: 'https://api.stripe.com/v1/',
      error_count: 0
    }
  ]);

  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    sync_frequency: '',
    error_count: ''
  });

  // State for advanced filters visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  // State for integration modal
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [currentIntegration, setCurrentIntegration] = useState(null);
  const [isNewIntegration, setIsNewIntegration] = useState(false);

  // State for field mapping modal
  const [showFieldMappingModal, setShowFieldMappingModal] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(null);

  // Sample field mapping data
  const [fieldMappings, setFieldMappings] = useState({
    'int001': [
      { id: 1, crm_field: 'first_name', local_field: 'first_name', is_required: true },
      { id: 2, crm_field: 'last_name', local_field: 'last_name', is_required: true },
      { id: 3, crm_field: 'email', local_field: 'email', is_required: true },
      { id: 4, crm_field: 'phone', local_field: 'phone', is_required: false },
      { id: 5, crm_field: 'company', local_field: 'company_name', is_required: false }
    ],
    'int002': [
      { id: 1, crm_field: 'email', local_field: 'email', is_required: true },
      { id: 2, crm_field: 'first_name', local_field: 'first_name', is_required: false },
      { id: 3, crm_field: 'last_name', local_field: 'last_name', is_required: false }
    ]
  });

  // Sample local fields for mapping
  const localFields = [
    'first_name', 'last_name', 'email', 'phone', 'mobile', 'company_name', 
    'address', 'city', 'state', 'postal_code', 'country', 'lead_source',
    'lead_status', 'enquiry_date', 'product_interest', 'notes'
  ];

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort integrations
  const filteredAndSortedIntegrations = integrations
    .filter(integration => {
      const searchTerms = filters.search.toLowerCase();
      const matchesSearch = 
        searchTerms === '' || 
        integration.name.toLowerCase().includes(searchTerms) ||
        integration.type.toLowerCase().includes(searchTerms) ||
        integration.id.toLowerCase().includes(searchTerms);
      
      const matchesType = filters.type === '' || integration.type === filters.type;
      const matchesStatus = filters.status === '' || integration.status === filters.status;
      const matchesSyncFrequency = filters.sync_frequency === '' || integration.sync_frequency === filters.sync_frequency;
      
      let matchesErrorCount = true;
      if (filters.error_count !== '') {
        if (filters.error_count === '0') {
          matchesErrorCount = integration.error_count === 0;
        } else if (filters.error_count === '1-5') {
          matchesErrorCount = integration.error_count > 0 && integration.error_count <= 5;
        } else if (filters.error_count === '5+') {
          matchesErrorCount = integration.error_count > 5;
        }
      }
      
      return matchesSearch && matchesType && matchesStatus && matchesSyncFrequency && matchesErrorCount;
    })
    .sort((a, b) => {
      const key = sortConfig.key;
      
      if (key === 'last_sync' || key === 'created_at') {
        return sortConfig.direction === 'asc' 
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }
      
      if (typeof a[key] === 'number') {
        return sortConfig.direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
      }
      
      return sortConfig.direction === 'asc'
        ? String(a[key]).localeCompare(String(b[key]))
        : String(b[key]).localeCompare(String(a[key]));
    });

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'ID', 'Name', 'Type', 'Status', 'Last Sync', 
      'Sync Frequency', 'Fields Mapped', 'Created At', 'Error Count'
    ];
    
    const csvData = filteredAndSortedIntegrations.map(integration => [
      integration.id,
      integration.name,
      integration.type,
      integration.status,
      new Date(integration.last_sync).toLocaleString(),
      integration.sync_frequency,
      integration.fields_mapped,
      new Date(integration.created_at).toLocaleString(),
      integration.error_count
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `integrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Open integration modal for editing
  const openEditIntegrationModal = (integration) => {
    setCurrentIntegration({...integration});
    setIsNewIntegration(false);
    setShowIntegrationModal(true);
  };

  // Open integration modal for creating
  const openNewIntegrationModal = () => {
    setCurrentIntegration({
      id: `int${Date.now().toString().substr(-3)}`,
      name: '',
      type: 'crm',
      status: 'inactive',
      last_sync: null,
      sync_frequency: 'daily',
      fields_mapped: 0,
      created_at: new Date().toISOString(),
      api_key: '',
      endpoint: '',
      error_count: 0
    });
    setIsNewIntegration(true);
    setShowIntegrationModal(true);
  };

  // Handle integration form change
  const handleIntegrationFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentIntegration(prev => ({ ...prev, [name]: value }));
  };

  // Save integration
  const saveIntegration = () => {
    if (isNewIntegration) {
      setIntegrations(prev => [...prev, currentIntegration]);
    } else {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === currentIntegration.id ? currentIntegration : integration
        )
      );
    }
    setShowIntegrationModal(false);
    setCurrentIntegration(null);
  };

  // Delete integration
  const deleteIntegration = (id) => {
    if (window.confirm('Are you sure you want to delete this integration? This action cannot be undone.')) {
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    }
  };

  // Toggle integration status
  const toggleIntegrationStatus = (id) => {
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === id 
          ? { ...integration, status: integration.status === 'active' ? 'inactive' : 'active' } 
          : integration
      )
    );
  };

  // Run manual sync
  const runManualSync = (id) => {
    alert(`Manual sync initiated for integration ${id}. This would trigger the sync process in a real application.`);
    // In a real app, this would call an API to run the sync
  };

  // Open field mapping modal
  const openFieldMappingModal = (id) => {
    setSelectedIntegrationId(id);
    
    // Initialize field mappings if they don't exist
    if (!fieldMappings[id]) {
      setFieldMappings(prev => ({
        ...prev,
        [id]: []
      }));
    }
    
    setShowFieldMappingModal(true);
  };

  // Add new field mapping
  const addFieldMapping = () => {
    const newMapping = {
      id: Date.now(),
      crm_field: '',
      local_field: '',
      is_required: false
    };
    
    setFieldMappings(prev => ({
      ...prev,
      [selectedIntegrationId]: [...(prev[selectedIntegrationId] || []), newMapping]
    }));
  };

  // Update field mapping
  const updateFieldMapping = (id, field, value) => {
    setFieldMappings(prev => ({
      ...prev,
      [selectedIntegrationId]: prev[selectedIntegrationId].map(mapping => 
        mapping.id === id ? { ...mapping, [field]: value } : mapping
      )
    }));
  };

  // Delete field mapping
  const deleteFieldMapping = (id) => {
    setFieldMappings(prev => ({
      ...prev,
      [selectedIntegrationId]: prev[selectedIntegrationId].filter(mapping => mapping.id !== id)
    }));
  };

  // Save field mappings
  const saveFieldMappings = () => {
    // Update the fields_mapped count in the integration
    setIntegrations(prev => 
      prev.map(integration => 
        integration.id === selectedIntegrationId 
          ? { ...integration, fields_mapped: fieldMappings[selectedIntegrationId].length } 
          : integration
      )
    );
    
    setShowFieldMappingModal(false);
    setSelectedIntegrationId(null);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Integration Configuration</h1>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search integrations..."
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          <div className="w-full md:w-auto">
            <button
              onClick={openNewIntegrationModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Integration
            </button>
          </div>
          
          <div className="w-full md:w-auto ml-auto">
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </button>
          </div>
        </div>
        
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="crm">CRM</option>
                <option value="email">Email Marketing</option>
                <option value="support">Support</option>
                <option value="analytics">Analytics</option>
                <option value="payment">Payment</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sync Frequency</label>
              <select
                name="sync_frequency"
                value={filters.sync_frequency}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Frequencies</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Error Count</label>
              <select
                name="error_count"
                value={filters.error_count}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="0">No Errors</option>
                <option value="1-5">1-5 Errors</option>
                <option value="5+">5+ Errors</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Integrations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Type
                    {getSortIcon('type')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('last_sync')}
                >
                  <div className="flex items-center">
                    Last Sync
                    {getSortIcon('last_sync')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('sync_frequency')}
                >
                  <div className="flex items-center">
                    Frequency
                    {getSortIcon('sync_frequency')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('fields_mapped')}
                >
                  <div className="flex items-center">
                    Fields Mapped
                    {getSortIcon('fields_mapped')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('error_count')}
                >
                  <div className="flex items-center">
                    Errors
                    {getSortIcon('error_count')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedIntegrations.map((integration) => (
                <tr key={integration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {integration.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 capitalize">
                      {integration.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(integration.status)}`}>
                      {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {integration.sync_frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => openFieldMappingModal(integration.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {integration.fields_mapped} fields
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {integration.error_count > 0 ? (
                      <span className="text-red-600">{integration.error_count} errors</span>
                    ) : (
                      <span className="text-green-600">No errors</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => runManualSync(integration.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Run Manual Sync"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleIntegrationStatus(integration.id)}
                        className={`${integration.status === 'active' ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}`}
                        title={integration.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {integration.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEditIntegrationModal(integration)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteIntegration(integration.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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
      </div>
      
      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Database className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Integrations</p>
              <p className="text-2xl font-semibold">{integrations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Play className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Integrations</p>
              <p className="text-2xl font-semibold">
                {integrations.filter(integration => integration.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Pause className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inactive Integrations</p>
              <p className="text-2xl font-semibold">
                {integrations.filter(integration => integration.status === 'inactive').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Integrations with Errors</p>
              <p className="text-2xl font-semibold">
                {integrations.filter(integration => integration.error_count > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Integration Modal */}
      {showIntegrationModal && currentIntegration && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {isNewIntegration ? 'Create New Integration' : 'Edit Integration'}
              </h3>
              <button onClick={() => setShowIntegrationModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Integration Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={currentIntegration.name}
                  onChange={handleIntegrationFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Salesforce CRM"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Integration Type
                </label>
                <select
                  name="type"
                  value={currentIntegration.type}
                  onChange={handleIntegrationFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="crm">CRM</option>
                  <option value="email">Email Marketing</option>
                  <option value="support">Support</option>
                  <option value="analytics">Analytics</option>
                  <option value="payment">Payment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Endpoint
                </label>
                <input
                  type="text"
                  name="endpoint"
                  value={currentIntegration.endpoint}
                  onChange={handleIntegrationFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. https://api.example.com/v1/"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="api_key"
                    value={currentIntegration.api_key}
                    onChange={handleIntegrationFormChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Enter API key"
                  />
                  <Lock className="absolute right-3 top-2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sync Frequency
                </label>
                <select
                  name="sync_frequency"
                  value={currentIntegration.sync_frequency}
                  onChange={handleIntegrationFormChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active-status"
                  checked={currentIntegration.status === 'active'}
                  onChange={(e) => setCurrentIntegration(prev => ({
                    ...prev,
                    status: e.target.checked ? 'active' : 'inactive'
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active-status" className="ml-2 block text-sm text-gray-900">
                  Activate integration immediately
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowIntegrationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveIntegration}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {isNewIntegration ? 'Create Integration' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Field Mapping Modal */}
      {showFieldMappingModal && selectedIntegrationId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Field Mapping for {integrations.find(i => i.id === selectedIntegrationId)?.name}
              </h3>
              <button onClick={() => setShowFieldMappingModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <button
                onClick={addFieldMapping}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field Mapping
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      External System Field
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Local Field
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Required
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fieldMappings[selectedIntegrationId]?.map((mapping) => (
                    <tr key={mapping.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={mapping.crm_field}
                          onChange={(e) => updateFieldMapping(mapping.id, 'crm_field', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-1 text-sm"
                          placeholder="External field name"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={mapping.local_field}
                          onChange={(e) => updateFieldMapping(mapping.id, 'local_field', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-1 text-sm"
                        >
                          <option value="">Select local field</option>
                          {localFields.map(field => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={mapping.is_required}
                          onChange={(e) => updateFieldMapping(mapping.id, 'is_required', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => deleteFieldMapping(mapping.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fieldMappings[selectedIntegrationId]?.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        No field mappings defined. Click "Add Field Mapping" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowFieldMappingModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveFieldMappings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Mappings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Integrations</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                The Integration Configuration system allows you to connect your CRM with external systems like other CRMs,
                email marketing platforms, support systems, analytics tools, and payment processors. Each integration can
                be configured with its own API endpoint, authentication, and field mappings. Data synchronization can be
                scheduled at different frequencies or triggered manually.
              </p>
              <p className="mt-2">
                <a href="#" className="text-blue-600 hover:underline flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Integration Documentation
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationConfig;