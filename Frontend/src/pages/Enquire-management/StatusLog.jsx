import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp, Clock, AlertCircle, Loader } from 'lucide-react';
import statusLogService from '../../services/enquire_management/statusLogService';

const StatusLog = () => {
  // State for status logs
  const [statusLogs, setStatusLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // State for filters
  const [filters, setFilters] = useState({
    enquiry_id: '',
    customer_name: '',
    previous_status: '',
    new_status: '',
    changed_by: '',
    reason: '',
    date_from: '',
    date_to: ''
  });

  // State for advanced filters visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc'
  });

  // Fetch status logs
  useEffect(() => {
    const fetchStatusLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Prepare filter parameters
        const filterParams = {};
        
        if (filters.enquiry_id) filterParams.enquiry_id = filters.enquiry_id;
        if (filters.customer_name) filterParams.customer_name = filters.customer_name;
        if (filters.previous_status) filterParams.old_status = filters.previous_status;
        if (filters.new_status) filterParams.new_status = filters.new_status;
        if (filters.changed_by) filterParams.changed_by = filters.changed_by;
        if (filters.reason) filterParams.change_reason = filters.reason;
        if (filters.date_from) filterParams.date_from = filters.date_from;
        if (filters.date_to) filterParams.date_to = filters.date_to;
        
        // Add sorting parameters
        filterParams.sortBy = sortConfig.key;
        filterParams.sortOrder = sortConfig.direction;
        
        const response = await statusLogService.getStatusLogs(currentPage, pageSize, filterParams);
        
        setStatusLogs(response.data.docs || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalDocs || 0);
      } catch (err) {
        console.error('Error fetching status logs:', err);
        setError('Failed to load status logs. Please try again later.');
        setStatusLogs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatusLogs();
  }, [currentPage, pageSize, filters, sortConfig]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      // Use the export function from statusLogService
      const response = await statusLogService.exportStatusLogs({
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });
      
      // Create a blob from the response data
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `status_log_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting status logs:', err);
      alert('Failed to export status logs. Please try again later.');
    }
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    switch(status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Qualified':
        return 'bg-green-100 text-green-800';
      case 'On Hold':
        return 'bg-orange-100 text-orange-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      case 'Won':
        return 'bg-emerald-100 text-emerald-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Status Change Log</h1>
      
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Status</label>
              <select
                name="previous_status"
                value={filters.previous_status}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Qualified">Qualified</option>
                <option value="On Hold">On Hold</option>
                <option value="Closed">Closed</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select
                name="new_status"
                value={filters.new_status}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Qualified">Qualified</option>
                <option value="On Hold">On Hold</option>
                <option value="Closed">Closed</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Changed By</label>
              <input
                type="text"
                name="changed_by"
                value={filters.changed_by}
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
                <option value="Enquiry Created">Enquiry Created</option>
                <option value="Processing Started">Processing Started</option>
                <option value="Awaiting Information">Awaiting Information</option>
                <option value="Lead Qualification">Lead Qualification</option>
                <option value="Deal Won">Deal Won</option>
                <option value="Deal Lost">Deal Lost</option>
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
      
      {/* Status Log Table */}
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
                  onClick={() => handleSort('previous_status')}
                >
                  <div className="flex items-center">
                    Previous Status
                    {getSortIcon('previous_status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('new_status')}
                >
                  <div className="flex items-center">
                    New Status
                    {getSortIcon('new_status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('changed_by')}
                >
                  <div className="flex items-center">
                    Changed By
                    {getSortIcon('changed_by')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('changed_at')}
                >
                  <div className="flex items-center">
                    Date & Time
                    {getSortIcon('changed_at')}
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statusLogs.length > 0 ? (
                statusLogs.map((log) => (
                  <tr key={log._id || log.status_log_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.status_log_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                      <a href={`/enquiry-management/enquiry-detail/${log.enquiry_id}`}>
                        {log.enquiry_id.enquiry_id || log.enquiry_id}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.enquiry_id.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.old_status ? (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(log.old_status)}`}>
                          {log.old_status}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(log.new_status)}`}>
                        {log.new_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof log.changed_by === 'object' ? 
                        `${log.changed_by?.first_name + " " + log.changed_by?.last_name || 'System'}` 
                        : (log.changed_by || 'System')}
                    </td>
                    {console.log(log)}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp || log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.change_reason || 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No status logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Status Changes</p>
              <p className="text-2xl font-semibold">{statusLogs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">New Enquiries</p>
              <p className="text-2xl font-semibold">
                {statusLogs.filter(log => log.previous_status === null).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold">
                {statusLogs.filter(log => log.new_status === 'In Progress').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Closed</p>
              <p className="text-2xl font-semibold">
                {statusLogs.filter(log => log.new_status === 'Closed').length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Flow Visualization */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Status Flow</h2>
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">New</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">2</p>
          </div>
          
          <div className="flex-1 h-0.5 bg-gray-300"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-yellow-600 font-bold">In Progress</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">2</p>
          </div>
          
          <div className="flex-1 h-0.5 bg-gray-300"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold">Qualified</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">1</p>
          </div>
          
          <div className="flex-1 h-0.5 bg-gray-300"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-600 font-bold">Closed</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusLog;