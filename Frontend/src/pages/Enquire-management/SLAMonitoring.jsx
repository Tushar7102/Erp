import React, { useState, useEffect } from 'react';
import EnquiryService from '../../services/enquire_management/enquiryService';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
import Modal from './components/SLADetail';

const SLAMonitoring = () => {
  const enquiryService = EnquiryService;

  const { isDark } = useTheme();

  // State for SLA data
  const [slaData, setSlaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal state
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // State for SLA metrics
  const [slaMetrics, setSlaMetrics] = useState({
    breached: 0,
    at_risk: 0,
    on_track: 0,
    total: 0
  });

  // State for SLA configuration
  const [slaConfig, setSlaConfig] = useState(null);
  // Draft state for SLA configuration changes
  const [draftSlaConfig, setDraftSlaConfig] = useState(null);
  
  // State for users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    slaStatus: '',
    assigned: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/auth/users');
      if (response.data && response.data.success) {
        const userData = response.data.data || [];
        setUsers(userData.map(user => ({
          _id: user._id,
          name: `${user.first_name} ${user.last_name}`
        })));
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch SLA data from backend
  const fetchSLAData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch SLA data with pagination
      const dataResponse = await enquiryService.getSLAData({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      if (dataResponse.success) {
        // Process the data to calculate response_due and resolution_due dates
        const processedData = (dataResponse.data.items || dataResponse.data).map(item => {
          const createdAt = new Date(item.created_at);
          
          // Normalize priority to lowercase and handle any variations
          const priority = (item.priority || '').toLowerCase();
          let normalizedPriority = 'medium'; // Default to medium if priority is not recognized
          
          if (priority.includes('high') || priority === 'urgent' || priority === '1') {
            normalizedPriority = 'high';
          } else if (priority.includes('medium') || priority === 'normal' || priority === '2') {
            normalizedPriority = 'medium';
          } else if (priority.includes('low') || priority === '3') {
            normalizedPriority = 'low';
          }
          
          // Get SLA rules based on normalized priority
          const rule = {
            response: slaConfig?.responseTimes?.[normalizedPriority] || 0,
            resolution: slaConfig?.resolutionTimes?.[normalizedPriority] || 0
          };
          
          // Calculate due dates
          const responseDue = new Date(createdAt.getTime() + rule.response * 60 * 60 * 1000);
          const resolutionDue = new Date(createdAt.getTime() + rule.resolution * 60 * 60 * 1000);

          return {
            ...item,
            normalized_priority: normalizedPriority,
            response_due: responseDue,
            resolution_due: resolutionDue,
            response_hours: rule.response,
            resolution_hours: rule.resolution
          };
        });

        // Calculate SLA metrics from the processed data
        const now = new Date();
        const metrics = {
          breached: 0,
          at_risk: 0,
          on_track: 0,
          total: processedData.length
        };

        // Calculate SLA status for each item and update metrics
        processedData.forEach(item => {
          const dueDate = new Date(item.response_due);
          const timeDiffMs = dueDate.getTime() - now.getTime();
          const totalHours = Math.floor(timeDiffMs / (1000 * 60 * 60));
          
          // Determine SLA status based on time remaining
          let slaStatus = "on_track";
          if (totalHours < 0) slaStatus = "breached";
          else if (totalHours <= 4) slaStatus = "at_risk";
          
          // Update item's sla_status
          item.sla_status = slaStatus;
          
          // Update metrics count
          metrics[slaStatus]++;
        });

        // Update the SLA metrics state
        setSlaMetrics(metrics);
        setSlaData(processedData);
        
        // Update pagination total
        setPagination(prev => ({
          ...prev,
          total: dataResponse.total || dataResponse.data.total || processedData.length
        }));
      } else {
        setError(dataResponse.message);
        toast.error(dataResponse.message);
      }
    } catch (err) {
      setError('Failed to fetch SLA data. Please try again later.');
      toast.error('Failed to fetch SLA data. Please try again later.');
      console.error('Error fetching SLA data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch SLA configuration
  const fetchSLAConfig = async () => {
    try {
      // Check localStorage first for saved configuration
      const savedConfig = localStorage.getItem('slaConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setSlaConfig(parsedConfig);
        setDraftSlaConfig(JSON.parse(JSON.stringify(parsedConfig)));
        return;
      }

      // If no localStorage data, fetch from API
      const response = await enquiryService.getSLAConfiguration();
      if (response.success) {
        // Ensure we have proper structure for SLA configuration
        const config = {
          responseTimes: {
            high: response.data?.responseTimes?.high || 2,
            medium: response.data?.responseTimes?.medium || 4,
            low: response.data?.responseTimes?.low || 8
          },
          resolutionTimes: {
            high: response.data?.resolutionTimes?.high || 24,
            medium: response.data?.resolutionTimes?.medium || 48,
            low: response.data?.resolutionTimes?.low || 72
          },
          warningThreshold: response.data?.warningThreshold || 0.25
        };
        
        setSlaConfig(config);
        setDraftSlaConfig(JSON.parse(JSON.stringify(config))); // Create a deep copy for draft
        
        // Save to localStorage for persistence
        localStorage.setItem('slaConfig', JSON.stringify(config));
        
        console.log('SLA Configuration loaded from API:', config);
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      toast.error('Failed to fetch SLA configuration');
      console.error('Error fetching SLA configuration:', err);
      
      // Set default configuration if fetch fails
      const defaultConfig = {
        responseTimes: { high: 2, medium: 4, low: 8 },
        resolutionTimes: { high: 24, medium: 48, low: 72 },
        warningThreshold: 0.25
      };
      setSlaConfig(defaultConfig);
      setDraftSlaConfig(JSON.parse(JSON.stringify(defaultConfig)));
    }
  };

  // Handle escalation
  const handleEscalate = async (enquiryId) => {
    try {
      const response = await enquiryService.escalateSLABreach(enquiryId, {
        reason: 'SLA breach escalated from monitoring dashboard'
      });

      if (response.success) {
        toast.success(response.message);
        fetchSLAData(); // Refresh data after escalation
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      toast.error('Failed to escalate SLA breach');
      console.error('Error escalating SLA breach:', err);
    }
  };
  
  // Modal functions
  const openModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setModalIsOpen(true);
  };
  
  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedEnquiry(null);
  };

  // Load data on component mount, when filters change, and when SLA config changes
  useEffect(() => {
    if (slaConfig) {
      fetchSLAData();
    }
  }, [filters, pagination.page, pagination.limit, slaConfig]);

  // Load SLA configuration and users on component mount
  useEffect(() => {
    fetchSLAConfig();
    fetchUsers(); // Fetch users for dropdown
  }, []);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Save SLA configuration
  const handleSaveConfig = async (e) => {
    e.preventDefault();

    try {
      // Apply draft changes to actual configuration
      const response = await enquiryService.updateSLAConfiguration(draftSlaConfig);
      if (response.success) {
        toast.success(response.message);
        
        // Update the actual configuration with the draft values
        setSlaConfig(JSON.parse(JSON.stringify(draftSlaConfig)));
        
        // Store configuration in localStorage for persistence between page refreshes
        localStorage.setItem('slaConfig', JSON.stringify(draftSlaConfig));
        
        // Re-fetch SLA data with the new configuration
        await fetchSLAData();
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      toast.error('Failed to save SLA configuration');
      console.error('Error saving SLA configuration:', err);
    }
  };



  // Get SLA status badge class
  const getSLAStatusBadge = (status) => {
    switch (status) {
      case 'breached':
        return isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      case 'at_risk':
        return isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800';
      case 'on_track':
        return isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      default:
        return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  // Get SLA status text
  const getSLAStatusText = (status) => {
    switch (status) {
      case 'breached':
        return 'SLA Breached';
      case 'at_risk':
        return 'At Risk';
      case 'on_track':
        return 'On Track';
      default:
        return 'Unknown';
    }
  };

  // Format time remaining
  const formatTimeRemaining = (hours) => {
    if (hours < 0) {
      return `${Math.abs(hours)}h overdue`;
    }
    return `${hours}h remaining`;
  };



  // Handle SLA config change
  const handleConfigChange = (type, priority, value) => {
    if (!draftSlaConfig) return;

    setDraftSlaConfig(prev => {
      const updated = { ...prev };
      if (type === 'response') {
        updated.responseTimes = { ...updated.responseTimes, [priority]: parseInt(value) };
      } else {
        updated.resolutionTimes = { ...updated.resolutionTimes, [priority]: parseInt(value) };
      }
      return updated;
    });
  };

  return (
    <div className={`container mx-auto px-4 py-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>SLA Monitoring</h1>

      {/* Filters */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow mb-6`}>
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} px-3 py-2 text-sm`}
            >
              <option value="">All Status</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Priority</label>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} px-3 py-2 text-sm`}
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-1`}>SLA Status</label>
            <select
              name="slaStatus"
              value={filters.slaStatus}
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} px-3 py-2 text-sm`}
            >
              <option value="">All SLA Status</option>
              <option value="breached">Breached</option>
              <option value="at_risk">At Risk</option>
              <option value="on_track">On Track</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'} mb-1`}>Assigned To</label>
            <select
              name="assigned_to"
              value={filters.assigned_to || ""}
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} px-3 py-2 text-sm`}
              disabled={loadingUsers}
            >
              <option value="">All Users</option>
              {loadingUsers ? (
                <option value="" disabled>Loading users...</option>
              ) : (
                users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* SLA Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`${isDark ? 'bg-red-900 border-red-700' : 'bg-red-50'} border-l-4 border-red-500 p-4 rounded-md shadow`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>SLA Breached</h3>
              <div className={`mt-2 text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                <p>{slaMetrics.breached || 0} {(slaMetrics.breached || 0) === 1 ? 'enquiry has' : 'enquiries have'} breached SLA</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50'} border-l-4 border-yellow-500 p-4 rounded-md shadow`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDark ? 'text-yellow-300' : 'text-yellow-800'}`}>At Risk</h3>
              <div className={`mt-2 text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                <p>{slaMetrics.at_risk || 0} {(slaMetrics.at_risk || 0) === 1 ? 'enquiry is' : 'enquiries are'} at risk of breaching SLA</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-green-900 border-green-700' : 'bg-green-50'} border-l-4 border-green-500 p-4 rounded-md shadow`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-800'}`}>On Track</h3>
              <div className={`mt-2 text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                <p>{slaMetrics.on_track || 0} {(slaMetrics.on_track || 0) === 1 ? 'enquiry is' : 'enquiries are'} on track</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-4">
          <div className={`inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Loading SLA data...</p>
        </div>
      )}

      {error && (
        <div className={`${isDark ? 'bg-red-900 border-red-700' : 'bg-red-50'} border-l-4 border-red-500 p-4 rounded-md shadow mb-6`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>Error</h3>
              <div className={`mt-2 text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLA Table */}
      {!loading && !error && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          <div className='overflow-x-auto'>
            <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    ID
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Priority
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Response Due
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Resolution Due
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Assigned To
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Time Remaining
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    SLA Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {slaData.length > 0 ? (
                  slaData.map((item) => (
                    <tr key={item.enquiry_id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.enquiry_id}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${item.priority.toLowerCase() === 'high' 
                          ? isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800' 
                          : item.priority.toLowerCase() === 'medium' 
                            ? isDark ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-800' 
                            : isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {item.status}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {item.response_due ? new Date(item.response_due).toLocaleString() : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {item.resolution_due ? new Date(item.resolution_due).toLocaleString() : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        {item.assigned_to && typeof item.assigned_to === 'object'
                          ? `${item.assigned_to.first_name || ''} ${item.assigned_to.last_name || ''}`.trim() || item.assigned_to.username || 'Unassigned'
                          : item.assigned_to || 'Unassigned'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                        <span className={`${item.time_remaining < 0 ? 'text-red-600 font-medium' :
                          item.time_remaining < 6 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.time_remaining} hours
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSLAStatusBadge(item.sla_status)}`}>
                          {(() => {
                            // Calculate SLA status based on time remaining
                            // Calculate time remaining between response_due and current time
                            const now = new Date();
                            const dueDate = new Date(item.response_due);

                            // Calculate time difference in milliseconds
                            const timeDiffMs = dueDate.getTime() - now.getTime();

                            // Convert to hours (positive or negative)
                            const totalHours = Math.floor(timeDiffMs / (1000 * 60 * 60));

                            // Calculate days and remaining hours
                            const days = Math.floor(Math.abs(totalHours) / 24) * (totalHours < 0 ? -1 : 1);
                            const hours = Math.abs(totalHours) % 24 * (totalHours < 0 ? -1 : 1);

                            // Format the time remaining string
                            const timeRemainingStr = `${dueDate.toISOString()} - ${now.toISOString()} ≈ ${days} days ${Math.abs(hours)} hours = ${totalHours} hours`;

                            // Store the calculated time remaining
                            item.time_remaining = totalHours;
                            item.time_remaining_str = timeRemainingStr;

                            // Determine SLA status based on time remaining
                            let slaStatus = "on_track";
                            if (totalHours < 0) slaStatus = "breached";
                            else if (totalHours <= 4) slaStatus = "at_risk";

                            // Update item's sla_status
                            item.sla_status = slaStatus;

                            return getSLAStatusText(slaStatus);
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEscalate(item.enquiry_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Escalate
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
                      No SLA data found matching the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {slaData.length > 0 && (
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-4 py-3 flex items-center justify-between border-t sm:px-6`}>
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    pagination.page === 1 
                      ? `${isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-400 border-gray-300'}` 
                      : `${isDark ? 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    pagination.page * pagination.limit >= pagination.total 
                      ? `${isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-400 border-gray-300'}` 
                      : `${isDark ? 'bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Showing <span className="font-medium">{pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                        pagination.page === 1 
                          ? `${isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-white text-gray-300 border-gray-300'}` 
                          : `${isDark ? 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {[...Array(Math.min(5, Math.ceil(pagination.total / pagination.limit)))].map((_, i) => {
                      // Calculate page number to display
                      let pageNum;
                      const totalPages = Math.ceil(pagination.total / pagination.limit);
                      
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all page numbers
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        // If current page is among first 3, show pages 1-5
                        pageNum = i + 1;
                      } else if (pagination.page >= totalPages - 2) {
                        // If current page is among last 3, show last 5 pages
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Otherwise show current page and 2 pages on each side
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? `${isDark ? 'bg-gray-700 text-white border-gray-500' : 'bg-blue-50 text-blue-600 border-blue-500'}`
                              : `${isDark ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page * pagination.limit >= pagination.total}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                        pagination.page * pagination.limit >= pagination.total 
                          ? `${isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-white text-gray-300 border-gray-300'}` 
                          : `${isDark ? 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SLA Configuration Section */}
      <div className="mt-8">
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>SLA Configuration</h2>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow`}>
          {loading ? (
            <div className="text-center py-4">
              <div className={`inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-500'}`}></div>
              <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Loading SLA configuration...</p>
            </div>
          ) : slaConfig ? (
            <form onSubmit={handleSaveConfig}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Response Time SLAs</h3>
                  <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Priority</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Response Time (hours)</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                      <tr>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>High</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          <input
                            type="number"
                            className={`w-20 rounded-md px-2 py-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                            value={draftSlaConfig.responseTimes?.high}
                            onChange={(e) => handleConfigChange('response', 'high', e.target.value)}
                            min="1"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Medium</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          <input
                            type="number"
                            className={`w-20 rounded-md px-2 py-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                            value={draftSlaConfig.responseTimes?.medium}
                            onChange={(e) => handleConfigChange('response', 'medium', e.target.value)}
                            min="1"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Low</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          <input
                            type="number"
                            className={`w-20 rounded-md px-2 py-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                            value={draftSlaConfig.responseTimes?.low}
                            onChange={(e) => handleConfigChange('response', 'low', e.target.value)}
                            min="1"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className={`text-lg font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resolution Time SLAs</h3>
                  <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Priority</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Resolution Time (hours)</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                      <tr>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>High</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          <input
                            type="number"
                            className={`w-20 rounded-md px-2 py-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                            value={draftSlaConfig.resolutionTimes?.high}
                            onChange={(e) => handleConfigChange('resolution', 'high', e.target.value)}
                            min="1"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Medium</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          <input
                            type="number"
                            className={`w-20 rounded-md px-2 py-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                            value={draftSlaConfig.resolutionTimes?.medium}
                            onChange={(e) => handleConfigChange('resolution', 'medium', e.target.value)}
                            min="1"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Low</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                          <input
                            type="number"
                            className={`w-20 rounded-md px-2 py-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                            value={draftSlaConfig.resolutionTimes?.low}
                            onChange={(e) => handleConfigChange('resolution', 'low', e.target.value)}
                            min="1"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>



              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className={`bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 ${isDark ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Save SLA Configuration
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Failed to load SLA configuration</p>
              <button
                  onClick={fetchSLAConfig}
                  className={`mt-2 px-4 py-2 rounded-md text-sm text-white ${isDark ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Enquiry Details Modal */}
      <Modal
        isOpen={modalIsOpen}
        onClose={closeModal}
        title="Enquiry Details"
        contentLabel="Enquiry Details"
        className={`max-w-2xl mx-auto ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
        overlayClassName="bg-black bg-opacity-50"
      >
        {selectedEnquiry ? (
          <div>            
            <div className={`${isDark ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Enquiry ID</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedEnquiry.enquiry_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedEnquiry.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Priority</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedEnquiry.priority}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Created At</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedEnquiry.created_at ? new Date(selectedEnquiry.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Assigned To</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedEnquiry.assigned_to && typeof selectedEnquiry.assigned_to === 'object'
                      ? `${selectedEnquiry.assigned_to.first_name || ''} ${selectedEnquiry.assigned_to.last_name || ''}`.trim() || selectedEnquiry.assigned_to.username || 'Unassigned'
                      : selectedEnquiry.assigned_to || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Response Due</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedEnquiry.response_due ? new Date(selectedEnquiry.response_due).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Resolution Due</p>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedEnquiry.resolution_due ? new Date(selectedEnquiry.resolution_due).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <a href={`/enquiry/${selectedEnquiry._id}`} 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  View Full Details
                </a>
                <button
                  onClick={() => {
                    handleEscalate(selectedEnquiry.enquiry_id);
                    closeModal();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                >
                  Escalate
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SLAMonitoring;