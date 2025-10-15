import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import enquiryService from '../../services/enquire_management/enquiryService';
import { useTheme } from '../../context/ThemeContext';
import EnquiryForm from './components/EnquiryForm';

// Function to export data to CSV
const exportToCSV = (data, filename) => {
  // Create column headers
  const headers = Object.keys(data[0]).join(',');
  
  // Create rows
  const rows = data.map(item => 
    Object.values(item).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',')
  ).join('\n');
  
  // Combine headers and rows
  const csv = `${headers}\n${rows}`;
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Status Update Modal Component
const StatusUpdateModal = ({ isOpen, onClose, onSubmit, statusOptions, currentStatus = '' }) => {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const { isDark } = useTheme();

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(status, reason, remarks);
    setReason('');
    setRemarks('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-lg w-full max-w-md`}>
        <h2 className="text-xl font-bold mb-4">Update Status</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
              required
            >
              <option value="">Select Status</option>
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Reason for Change</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
              required
            >
              <option value="">Select Reason</option>
              <option value="Customer Request">Customer Request</option>
              <option value="Process Flow">Process Flow</option>
              <option value="Data Correction">Data Correction</option>
              <option value="Follow-up Result">Follow-up Result</option>
              <option value="Management Decision">Management Decision</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea 
              value={remarks} 
              onChange={(e) => setRemarks(e.target.value)}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
              rows="3"
              placeholder="Additional details about this status change"
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className={`px-4 py-2 rounded ${isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EnquiryList = () => {
  // State for enquiries data
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { isDark } = useTheme();
  
  // Handle create enquiry
  const handleCreateEnquiry = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleEnquiryCreated = async () => {
    // Refresh the enquiry list
    try {
      setLoading(true);
      const response = await enquiryService.getEnquiries({
        ...filters,
        search: searchTerm
      });
      setEnquiries(response.data || []);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to refresh enquiries:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    source_type: '',
    assigned_to: '',
    priority: '',
    enquiry_profile: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: ''
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Selected enquiries for bulk actions
  const [selectedEnquiries, setSelectedEnquiries] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Advanced filter visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    sources: [],
    users: []
  });

  // Fetch enquiries based on filters
  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        setLoading(true);
        // Add search term to filters
        const searchFilters = { ...filters };
        if (searchTerm) {
          searchFilters.search = searchTerm;
        }
        
        const response = await enquiryService.getEnquiries(searchFilters);
        setEnquiries(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch enquiries:', err);
        setError('Failed to load enquiries. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, [filters, searchTerm]);
  
  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await enquiryService.getEnquiryFilters();
        setFilterOptions(response.data || {
          statuses: [],
          sources: [],
          users: []
        });
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    
    fetchFilterOptions();
  }, []);

  // Handle selection of all enquiries
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEnquiries(enquiries.map(enquiry => enquiry._id));
    } else {
      setSelectedEnquiries([]);
    }
  };
  
  // Handle selection of a single enquiry
  const handleSelectEnquiry = (e, id) => {
    if (e.target.checked) {
      setSelectedEnquiries([...selectedEnquiries, id]);
    } else {
      setSelectedEnquiries(selectedEnquiries.filter(item => item !== id));
    }
  };
  
  // Handle deletion of an enquiry
  const handleDeleteEnquiry = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        await enquiryService.deleteEnquiry(id);
        setEnquiries(enquiries.filter(e => e._id !== id));
      } catch (err) {
        console.error('Error deleting enquiry:', err);
        alert('Failed to delete enquiry');
      }
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: '',
      source_type: '',
      assigned_to: '',
      priority: '',
      enquiry_profile: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      search: ''
    });
    setSearchTerm('');
  };

  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };
  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedEnquiries.length === 0) {
      alert('Please select at least one enquiry');
      return;
    }
    
    try {
      switch (action) {
        case 'export':
          const response = await enquiryService.exportEnquiries(filters);
          exportToCSV(response.data, `enquiries_export_${new Date().toISOString().slice(0,10)}.csv`);
          break;
          
        case 'status':
          const statusOptions = filterOptions.statuses || ['NEW', 'IN_PROGRESS', 'QUALIFIED', 'CONVERTED', 'LOST'];
          const newStatus = prompt(`Enter new status (${statusOptions.join(', ')})`);
          
          if (newStatus && statusOptions.includes(newStatus)) {
            await enquiryService.bulkUpdateStatus(selectedEnquiries, newStatus);
            alert(`Status updated to ${newStatus} for ${selectedEnquiries.length} enquiries`);
            
            // Refresh enquiries
            const updatedResponse = await enquiryService.getEnquiries({
              ...filters,
              search: searchTerm
            });
            setEnquiries(updatedResponse.data || []);
            setSelectedEnquiries([]);
          } else if (newStatus) {
            alert(`Invalid status. Please use one of: ${statusOptions.join(', ')}`);
          }
          break;
          
        case 'assign':
          // Show user selection dialog with available users
          const userOptions = filterOptions.users || [];
          const userList = userOptions.map(user => `${user._id}: ${user.first_name} ${user.last_name}`).join('\n');
          const userId = prompt(`Enter user ID to assign to:\n${userList}`);
          
          if (userId) {
            await enquiryService.bulkAssign(selectedEnquiries, userId);
            alert(`Assigned ${selectedEnquiries.length} enquiries to user ${userId}`);
            
            // Refresh enquiries
            const updatedResponse = await enquiryService.getEnquiries({
              ...filters,
              search: searchTerm
            });
            setEnquiries(updatedResponse.data || []);
            setSelectedEnquiries([]);
          }
          break;
          
        default:
          break;
      }
    } catch (err) {
      console.error(`Error performing bulk action ${action}:`, err);
      alert(`Failed to perform ${action} operation. Please try again.`);
    }
  };

  return (
    <div className={` ${isDark ? 'text-white' : 'text-black'} container mx-auto px-4 py-6 ${isDark ? 'text-white' : 'text-black'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Enquiry Management</h1>
        <button
          onClick={handleCreateEnquiry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          Create Enquiry
        </button>
      </div>
      
      {/* Filters and Search */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow mb-6`}>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Status</label>
            <select 
              name="status" 
              value={filters.status} 
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
            >
              <option value="">All Status</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Source</label>
            <select 
              name="source_type" 
              value={filters.source_type} 
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
            >
              <option value="">All Sources</option>
              {filterOptions.sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Assigned To</label>
            <select 
              name="assigned_to" 
              value={filters.assigned_to} 
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
            >
              <option value="">All Users</option>
              {filterOptions.users?.map(user => (
                <option key={user._id} value={user._id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Priority</label>
            <select 
              name="priority" 
              value={filters.priority} 
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full md:w-1/3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Search</label>
            <input 
              type="text" 
              placeholder="Search by ID, name, phone..." 
              value={searchTerm}
              onChange={handleSearch}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkAction('assign')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Assign
            </button>
            <button 
              onClick={() => handleBulkAction('status')}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
            >
              Update Status
            </button>
            <button 
              onClick={() => handleBulkAction('export')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
            >
              Export
            </button>
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`border ${isDark ? 'border-gray-600 bg-gray-700 text-white hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'} px-4 py-2 rounded-md text-sm flex items-center`}
            >
              {showAdvancedFilters ? 'Hide Advanced' : 'Advanced Filters'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className={`mt-4 p-4 border ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-md`}>
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'} mb-3`}>Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Enquiry Type</label>
                <select 
                  name="enquiry_profile" 
                  value={filters.enquiry_profile} 
                  onChange={handleFilterChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
                >
                  <option value="">All Types</option>
                  <option value="Project">Project</option>
                  <option value="Product">Product</option>
                  <option value="AMC/Service">AMC/Service</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Job">Job</option>
                  <option value="Info Request">Info Request</option>
                  <option value="Installation">Installation</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Date From</label>
                <input 
                  type="date" 
                  name="dateFrom" 
                  value={filters.dateFrom} 
                  onChange={handleFilterChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Date To</label>
                <input 
                  type="date" 
                  name="dateTo" 
                  value={filters.dateTo} 
                  onChange={handleFilterChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Sort By</label>
                <select 
                  name="sortBy" 
                  value={filters.sortBy} 
                  onChange={handleFilterChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
                >
                  <option value="created_at">Date Created</option>
                  <option value="customer_name">Customer Name</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="next_task_due">Next Task Due</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Sort Order</label>
                <select 
                  name="sortOrder" 
                  value={filters.sortOrder} 
                  onChange={handleFilterChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button 
                  onClick={() => {
                    // Reset all filters
                    setFilters({
                      status: '',
                      source: '',
                      assigned: '',
                      dateRange: '',
                      priority: '',
                      enquiryType: '',
                      dateFrom: '',
                      dateTo: '',
                      sortBy: 'created_at',
                      sortOrder: 'desc'
                    });
                    setSearchTerm('');
                  }}
                  className={`${isDark ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'} border px-4 py-2 rounded-md text-sm`}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* No enquiries message */}
      {enquiries.length === 0 && !loading && (
        <div className={`text-center py-10 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
          <p className="text-lg">No enquiries found matching your filters.</p>
          <button 
            onClick={resetFilters}
            className={`mt-2 px-4 py-2 rounded-md ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
          >
            Reset Filters
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-10">
          <div className={`inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDark ? 'border-gray-300' : 'border-gray-900'}`}></div>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Loading enquiries...</p>
        </div>
      )}
      
      {/* Enquiries Table */}
      {!loading && enquiries.length > 0 && (
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  <input 
                    type="checkbox" 
                    className="rounded text-blue-600" 
                    onChange={handleSelectAll}
                    checked={selectedEnquiries.length === enquiries.length && enquiries.length > 0}
                  />
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  ID
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Customer
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Contact
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Type
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Priority
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Assigned To
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Created
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Next Task
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider whitespace-nowrap`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
              {enquiries.map((enquiry) => (
                <tr key={enquiry._id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      className="rounded text-blue-600" 
                      checked={selectedEnquiries.includes(enquiry._id)}
                      onChange={(e) => handleSelectEnquiry(e, enquiry._id)}
                    />
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {enquiry.enquiry_id || enquiry._id.substring(0, 8)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {enquiry.name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {enquiry.mobile}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {enquiry.enquiry_profile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${enquiry.status === 'NEW' ? 'bg-blue-100 text-blue-800' : 
                        enquiry.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                        enquiry.status === 'QUALIFIED' ? 'bg-green-100 text-green-800' : 
                        enquiry.status === 'CONVERTED' ? 'bg-purple-100 text-purple-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${enquiry.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 
                        enquiry.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {enquiry.priority}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {enquiry.assigned_to ? 
                      (typeof enquiry.assigned_to === 'object' && enquiry.assigned_to !== null ? 
                        (filterOptions.users?.find(u => u._id === enquiry.assigned_to._id) ? 
                          `${filterOptions.users.find(u => u._id === enquiry.assigned_to._id).first_name} ${filterOptions.users.find(u => u._id === enquiry.assigned_to._id).last_name}` : 
                          `${enquiry.assigned_to.first_name || ''} ${enquiry.assigned_to.last_name || ''}`) :
                        (filterOptions.users?.find(u => u._id === enquiry.assigned_to) ? 
                          `${filterOptions.users.find(u => u._id === enquiry.assigned_to).first_name} ${filterOptions.users.find(u => u._id === enquiry.assigned_to).last_name}` : 
                          enquiry.assigned_to)) : 
                      'Unassigned'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {new Date(enquiry.created_at).toLocaleDateString()}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {enquiry.next_task_due ? new Date(enquiry.next_task_due).toLocaleDateString() : 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link to={`/enquiry/${enquiry._id}`} className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'}`}>
                        View
                      </Link>
                      <button 
                        onClick={() => handleDeleteEnquiry(enquiry._id)} 
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className={`px-4 py-3 flex items-center justify-between border-t ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} sm:px-6`}>
          <div className="flex-1 flex justify-between sm:hidden">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${isDark ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} disabled:opacity-50`}
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${isDark ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'} disabled:opacity-50`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Showing <span className="font-medium">{enquiries.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
                <span className="font-medium">{enquiries.length > 0 ? Math.min(currentPage * pageSize, totalCount || enquiries.length) : 0}</span> of{' '}
                <span className="font-medium">{totalCount || enquiries.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'}`}>
                  Previous
                </button>
                <button className={`relative inline-flex items-center px-4 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                  1
                </button>
                <button className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'}`}>
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      )}
      
      {/* Create Enquiry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6`}>
            <button
              onClick={handleCloseCreateModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Create New Enquiry</h2>
            <EnquiryForm onSubmitSuccess={handleEnquiryCreated} onCancel={handleCloseCreateModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryList;