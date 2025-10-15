import React, { useState, useEffect, useContext, useCallback } from 'react';
import { UserPlus, Search, Calendar, Filter, Download, ChevronDown, ChevronUp, AlertCircle, Loader, Shield, Lock } from 'lucide-react';
import assignmentLogService from '../../services/enquire_management/assignmentLogService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import DOMPurify from 'dompurify';

const AssignmentLog = () => {
  // Authentication context for secure access
  const { user, isAuthenticated } = useAuth();
  
  // State for assignment logs data
  const [assignmentLogs, setAssignmentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds refresh
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // State for filters
  const [filters, setFilters] = useState({
    enquiry_id: '',
    customer_name: '',
    previous_assignee: '',
    new_assignee: '',
    assigned_by: '',
    reason: '',
    date_from: '',
    date_to: ''
  });

  // State for advanced filters visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'assigned_at',
    direction: 'desc'
  });

  // Handle filter change with validation
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // Input validation based on field type
    if (name === 'enquiry_id') {
      // Validate enquiry ID format (alphanumeric with optional hyphens)
      if (value && !/^[a-zA-Z0-9-]*$/.test(value)) {
        toast.error('Invalid enquiry ID format');
        return;
      }
    } else if (name === 'customer_name') {
      // Validate customer name (letters, spaces, and common name characters)
      if (value && !/^[a-zA-Z0-9\s.',-]*$/.test(value)) {
        toast.error('Invalid customer name format');
        return;
      }
    } else if (name === 'previous_assignee' || name === 'new_assignee') {
      // Validate assignee name (letters, spaces, and common name characters)
      if (value && !/^[a-zA-Z0-9\s.',-]*$/.test(value)) {
        toast.error('Invalid assignee name format');
        return;
      }
    } else if (name === 'date_from' || name === 'date_to') {
      // Validate date format
      if (value) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          toast.error('Invalid date format');
          return;
        }
        
        // Prevent future dates
        if (dateValue > new Date()) {
          toast.error('Date cannot be in the future');
          return;
        }
      }
    }
    
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Fetch assignment logs from backend
  // Auto-refresh timer
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      // Only refresh if not currently loading and on the first page
      if (!loading && pagination.page === 1) {
        fetchAssignmentLogs();
      }
    }, refreshInterval);
    
    return () => clearInterval(refreshTimer);
  }, [refreshInterval, loading, pagination.page]);

  // Extract fetchAssignmentLogs as a reusable function
  const fetchAssignmentLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      setLastRefreshed(new Date());
      
      // Validate date range if both are provided
      if (filters.date_from && filters.date_to) {
        const startDate = new Date(filters.date_from);
        const endDate = new Date(filters.date_to);
        
        if (startDate > endDate) {
          setError('Start date cannot be after end date');
          setLoading(false);
          toast.error('Invalid date range');
          return;
        }
        
        // Limit date range to prevent excessive queries
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
          setError('Date range cannot exceed 90 days');
          setLoading(false);
          toast.error('Date range too large');
          return;
        }
      }
      
      // Prepare filters for API call
      const apiFilters = {
        page: pagination.page,
        limit: pagination.limit,
        enquiry_id: filters.enquiry_id,
        date_from: filters.date_from,
        date_to: filters.date_to
      };
      
      // Add additional filters if they exist
      if (filters.assigned_by) apiFilters.assigned_by = filters.assigned_by;
      if (filters.reason) apiFilters.assignment_type = filters.reason;
      
      // Set request timeout
      const timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError('Request timed out. Please try again.');
          toast.error('Request timed out');
        }
      }, 30000); // 30 second timeout
      
      const response = await assignmentLogService.getAssignmentLogs(apiFilters);
      
      // Clear timeout as request completed
      clearTimeout(timeoutId);
      
      if (response.success) {
        // Transform the data to match the expected structure for the table
        const transformedLogs = (response.data.docs || []).map(log => {
          // Handle different possible data structures
          return {
            id: log._id,
            enquiry_id: typeof log.enquiry_id === 'object' ? log.enquiry_id._id : log.enquiry_id,
            customer_name: typeof log.enquiry_id === 'object' ? log.enquiry_id.name : 'Unknown',
            previous_assignee: typeof log.previous_assigned_to === 'object' ? log.previous_assigned_to.name : log.previous_assigned_to || '',
            new_assignee: typeof log.assigned_to === 'object' ? log.assigned_to.name : log.assigned_to || '',
            assigned_by: typeof log.assigned_by === 'object' ? log.assigned_by.name : log.assigned_by || '',
            assigned_at: log.created_at || log.timestamp,
            reason: log.assignment_reason || log.reason || 'Manual Assignment',
            notes: log.remarks || ''
          };
        });
        
        setAssignmentLogs(transformedLogs);
        setPagination({
          ...pagination,
          total: response.data.totalDocs || 0,
          totalPages: response.data.totalPages || 0
        });
      } else {
        setError('Failed to fetch assignment logs');
        toast.error(response.message || 'Failed to fetch assignment logs');
      }
    } catch (err) {
      console.error('Error fetching assignment logs:', err);
      
      // Handle different error types
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        
        if (status === 401 || status === 403) {
          setError('You do not have permission to access this data');
          toast.error('Authentication or authorization error');
        } else if (status === 404) {
          setError('No assignment logs found');
          setAssignmentLogs([]);
        } else if (status === 500) {
          setError('Server error. Please try again later');
          toast.error('Server error occurred');
        } else {
          setError(`Error: ${err.response.data?.message || 'Unknown error'}`);
          toast.error('Failed to load data');
        }
      } else if (err.request) {
        // Request made but no response received (network error)
        setError('Network error. Please check your connection');
        toast.error('Network connection issue');
      } else {
        // Other errors
        setError('Error fetching assignment logs: ' + (err.message || 'Unknown error'));
        toast.error('Failed to load assignment logs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    
    fetchAssignmentLogs();
  }, [isAuthenticated, pagination.page, pagination.limit, filters.enquiry_id, filters.date_from, filters.date_to]);
  
  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };
  
  // Apply client-side filtering for additional filters not sent to API
  const filteredLogs = assignmentLogs.filter(log => {
    // Sanitize inputs for security
    const sanitizedCustomerName = DOMPurify.sanitize(filters.customer_name);
    const sanitizedPreviousAssignee = DOMPurify.sanitize(filters.previous_assignee);
    const sanitizedNewAssignee = DOMPurify.sanitize(filters.new_assignee);
    
    const matchesCustomerName = !sanitizedCustomerName || 
      (log.customer_name && log.customer_name.toLowerCase().includes(sanitizedCustomerName.toLowerCase()));
    
    const matchesPreviousAssignee = !sanitizedPreviousAssignee || 
      (log.previous_assignee && log.previous_assignee.toLowerCase().includes(sanitizedPreviousAssignee.toLowerCase()));
    
    const matchesNewAssignee = !sanitizedNewAssignee || 
      (log.new_assignee && log.new_assignee.toLowerCase().includes(sanitizedNewAssignee.toLowerCase()));
    
    return matchesCustomerName && matchesPreviousAssignee && matchesNewAssignee;
  });
  
  // Debounced search to prevent excessive API calls
  const debouncedSearch = useCallback(
    debounce((filters) => {
      setPagination(prev => ({...prev, page: 1})); // Reset to first page on new search
    }, 500),
    []
  );
  
  // Sort logs client-side
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const key = sortConfig.key;
    
    if (!a[key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (!b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
    
    if (key === 'timestamp' || key === 'created_at') {
      return sortConfig.direction === 'asc' 
        ? new Date(a[key]) - new Date(b[key])
        : new Date(b[key]) - new Date(a[key]);
    }
    
    // Handle nested properties
    if (key.includes('.')) {
      const parts = key.split('.');
      let aValue = a;
      let bValue = b;
      
      for (const part of parts) {
        aValue = aValue?.[part];
        bValue = bValue?.[part];
      }
      
      if (!aValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (!bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    }
    
    return sortConfig.direction === 'asc'
      ? String(a[key]).localeCompare(String(b[key]))
      : String(b[key]).localeCompare(String(a[key]));
  });

  // Export to CSV using backend service
  const exportToCSV = async () => {
    try {
      setLoading(true);
      
      // Prepare export filters
      const exportFilters = {
        start_date: filters.date_from,
        end_date: filters.date_to,
        assigned_to: filters.new_assignee,
        assignment_type: filters.reason
      };
      
      // Call backend export service
      const response = await assignmentLogService.exportAssignmentLogs(exportFilters);
      
      if (response.success && response.data) {
        // Format data for CSV
        const headers = [
          'ID', 'Enquiry ID', 'Customer Name', 'Previous Assignee', 
          'New Assignee', 'Assigned By', 'Timestamp', 'Reason', 'Notes'
        ];
        
        const csvData = response.data.map(log => [
          log.assignment_log_id,
          log.enquiry_id?.enquiry_id || log.enquiry_id,
          log.enquiry_id?.name || 'N/A',
          log.old_assignee?.user_id?.name || log.old_assignee?.team_id?.name || 'None',
          log.new_assignee?.user_id?.name || log.new_assignee?.team_id?.name || 'None',
          log.assigned_by?.name || 'System',
          new Date(log.timestamp).toLocaleString(),
          log.assignment_reason,
          log.remarks || ''
        ]);
        
        const csvContent = [
          headers.join(','),
          ...csvData.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `assignment_log_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Export completed successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Assignment Log
          {user?.permissions?.includes('view_sensitive_data') && (
            <span className="ml-2 text-green-600 inline-flex items-center" title="Secure Connection">
              <Lock className="h-4 w-4 mr-1" />
              <span className="text-sm font-normal">Secure</span>
            </span>
          )}
        </h1>
        <div className="flex space-x-2">
          <button 
            onClick={exportToCSV}
            disabled={loading || !user?.permissions?.includes('export_assignment_logs')}
            className={`${user?.permissions?.includes('export_assignment_logs') 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded flex items-center`}
            title={!user?.permissions?.includes('export_assignment_logs') ? 'You do not have permission to export' : ''}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Enquiry ID or Customer Name"
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.customer_name}
                onChange={(e) => setFilters(prev => ({ ...prev, customer_name: e.target.value }))}
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
        </div>
        
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry ID</label>
              <input
                type="text"
                name="enquiry_id"
                value={filters.enquiry_id}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="ENQ001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Assignee</label>
              <input
                type="text"
                name="previous_assignee"
                value={filters.previous_assignee}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Assignee name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Assignee</label>
              <input
                type="text"
                name="new_assignee"
                value={filters.new_assignee}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Assignee name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned By</label>
              <input
                type="text"
                name="assigned_by"
                value={filters.assigned_by}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="User name or System"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select
                name="reason"
                value={filters.reason}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Reasons</option>
                <option value="Initial Assignment">Initial Assignment</option>
                <option value="Workload Balancing">Workload Balancing</option>
                <option value="Expertise Required">Expertise Required</option>
                <option value="Auto Assignment">Auto Assignment</option>
                <option value="Reassignment">Reassignment</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                name="date_to"
                value={filters.date_to}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Assignment Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('enquiry_id')}
                >
                  <div className="flex items-center">
                    Enquiry ID
                    {getSortIcon('enquiry_id')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('customer_name')}
                >
                  <div className="flex items-center">
                    Customer
                    {getSortIcon('customer_name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('previous_assignee')}
                >
                  <div className="flex items-center">
                    Previous Assignee
                    {getSortIcon('previous_assignee')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('new_assignee')}
                >
                  <div className="flex items-center">
                    New Assignee
                    {getSortIcon('new_assignee')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('assigned_by')}
                >
                  <div className="flex items-center">
                    Assigned By
                    {getSortIcon('assigned_by')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('assigned_at')}
                >
                  <div className="flex items-center">
                    Date & Time
                    {getSortIcon('assigned_at')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('reason')}
                >
                  <div className="flex items-center">
                    Reason
                    {getSortIcon('reason')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                    <a href={`/enquiry-management/enquiry-detail/${log.enquiry_id}`} target="_blank" rel="noopener noreferrer">
                      {log.enquiry_id}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.previous_assignee || <span className="text-gray-400 italic">None</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.new_assignee}
                  </td>
                  {console.log(log)}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.assigned_by}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.assigned_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.reason === 'Initial Assignment' ? 'bg-green-100 text-green-800' : 
                        log.reason === 'Workload Balancing' ? 'bg-blue-100 text-blue-800' : 
                        log.reason === 'Expertise Required' ? 'bg-purple-100 text-purple-800' : 
                        log.reason === 'Auto Assignment' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {log.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <UserPlus className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Assignments</p>
              <p className="text-2xl font-semibold">{assignmentLogs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Initial Assignments</p>
              <p className="text-2xl font-semibold">
                {assignmentLogs.filter(log => log.reason === 'Initial Assignment').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <UserPlus className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Reassignments</p>
              <p className="text-2xl font-semibold">
                {assignmentLogs.filter(log => log.previous_assignee !== null).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentLog;