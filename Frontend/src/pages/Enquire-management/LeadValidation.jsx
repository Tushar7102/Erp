import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Filter, Download, ChevronDown, ChevronUp, 
  AlertTriangle, Check, X, RefreshCw, Settings, UserCheck, UserX, Zap
} from 'lucide-react';

const LeadValidation = () => {
  // State for leads data
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [stats, setStats] = useState({
    total_leads: 0,
    pending_validation: 0,
    validated: 0,
    rejected: 0,
    high_duplicate_score: 0
  });

  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    validation_issue: '',
    duplicate_score_min: '',
    validation_score_min: '',
    date_from: '',
    date_to: ''
  });

  // State for advanced filters visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  // State for validation rules
  const [validationRules, setValidationRules] = useState({
    duplicate_threshold: 70,
    email_validation: true,
    phone_validation: true,
    company_validation: true,
    spam_detection: true,
    auto_reject_threshold: 40,
    auto_approve_threshold: 90
  });

  // State for settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // State for merge modal
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [mergedLead, setMergedLead] = useState(null);
  
  // API base URL
  const API_URL = '/api/validation';
  
  // Fetch leads from API
  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.validation_issue) params.append('validation_issues', filters.validation_issue);
      if (filters.duplicate_score_min) params.append('min_duplicate_score', filters.duplicate_score_min);
      if (filters.validation_score_min) params.append('min_validation_score', filters.validation_score_min);
      if (filters.date_from) params.append('start_date', filters.date_from);
      if (filters.date_to) params.append('end_date', filters.date_to);
      
      if (sortConfig.key) {
        params.append('sort_by', sortConfig.key);
        params.append('sort_order', sortConfig.direction);
      }
      
      const response = await axios.get(`${API_URL}?${params.toString()}`);
      
      if (response.data.success) {
        setLeads(response.data.data);
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        });
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch validation statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/statistics`);
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };
  
  // Fetch validation settings
  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      
      if (response.data.success) {
        setValidationRules({
          duplicate_threshold: response.data.data.duplicate_threshold,
          email_validation: response.data.data.email_validation,
          phone_validation: response.data.data.phone_validation,
          company_validation: response.data.data.company_validation,
          spam_detection: response.data.data.spam_detection,
          auto_reject_threshold: response.data.data.auto_reject_threshold || 40,
          auto_approve_threshold: response.data.data.auto_approve_threshold || 90
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

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

  // Filter and sort leads
  const filteredAndSortedLeads = leads
    .filter(lead => {
      const searchTerms = filters.search.toLowerCase();
      const matchesSearch = 
        searchTerms === '' || 
        lead.first_name.toLowerCase().includes(searchTerms) ||
        lead.last_name.toLowerCase().includes(searchTerms) ||
        lead.email.toLowerCase().includes(searchTerms) ||
        lead.phone.includes(searchTerms) ||
        lead.company.toLowerCase().includes(searchTerms);
      
      const matchesStatus = filters.status === '' || lead.status === filters.status;
      
      const matchesValidationIssue = filters.validation_issue === '' || 
        (lead.validation_issues && lead.validation_issues.includes(filters.validation_issue));
      
      const matchesDuplicateScore = filters.duplicate_score_min === '' || 
        lead.duplicate_score >= parseInt(filters.duplicate_score_min);
      
      const matchesValidationScore = filters.validation_score_min === '' || 
        lead.validation_score >= parseInt(filters.validation_score_min);
      
      let matchesDateRange = true;
      if (filters.date_from && filters.date_to) {
        const leadDate = new Date(lead.created_at);
        const fromDate = new Date(filters.date_from);
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999); // Set to end of day
        matchesDateRange = leadDate >= fromDate && leadDate <= toDate;
      }
      
      return matchesSearch && matchesStatus && matchesValidationIssue && 
             matchesDuplicateScore && matchesValidationScore && matchesDateRange;
    })
    .sort((a, b) => {
      const key = sortConfig.key;
      
      if (key === 'created_at') {
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
      'ID', 'First Name', 'Last Name', 'Email', 'Phone', 
      'Company', 'Source', 'Created At', 'Status',
      'Validation Issues', 'Duplicate Score', 'Validation Score'
    ];
    
    const csvData = filteredAndSortedLeads.map(lead => [
      lead.id,
      lead.first_name,
      lead.last_name,
      lead.email,
      lead.phone,
      lead.company,
      lead.source,
      new Date(lead.created_at).toLocaleString(),
      lead.status,
      lead.validation_issues.join(', '),
      lead.duplicate_score,
      lead.validation_score
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lead_validation_${new Date().toISOString().split('T')[0]}.csv`);
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
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle validation action
  const handleValidationAction = async (id, action) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, {
        status: action,
        notes: `Status changed to ${action}`
      });
      
      if (response.data.success) {
        // Update the lead in the local state
         setLeads(prev => 
           prev.map(lead => 
             lead._id === id 
               ? { ...lead, status: action } 
               : lead
           )
         );
        
        // Refresh stats
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };
  
  // Load data on component mount and when filters/pagination change
  useEffect(() => {
    fetchLeads();
    fetchStats();
    fetchSettings();
  }, [pagination.page, pagination.limit, filters, sortConfig]);

  // Handle settings change
  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValidationRules(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value)
    }));
  };

  // Save settings
  const saveSettings = () => {
    // In a real app, this would save to backend
    setShowSettingsModal(false);
    alert('Validation settings saved successfully!');
  };

  // Open merge modal
  const openMergeModal = (leadIds) => {
    const leadsToMerge = leads.filter(lead => leadIds.includes(lead.id));
    setSelectedLeads(leadsToMerge);
    
    // Create a merged lead with data from both leads
    // In a real app, this would use more sophisticated merging logic
    const primaryLead = leadsToMerge[0];
    setMergedLead({
      ...primaryLead,
      id: `MERGED-${Date.now().toString(36)}`,
      potential_duplicates: [],
      validation_issues: leadsToMerge[0].validation_issues.filter(issue => issue !== 'possible_duplicate'),
      duplicate_score: 0,
      validation_score: Math.max(...leadsToMerge.map(l => l.validation_score))
    });
    
    setShowMergeModal(true);
  };

  // Complete merge
  const completeMerge = async () => {
    try {
      const response = await axios.post(`${API_URL}/merge`, {
        primaryLeadId: mergedLead._id,
        secondaryLeadIds: selectedLeads.filter(lead => lead._id !== mergedLead._id).map(lead => lead._id),
        mergeFields: ['name', 'email', 'phone', 'company', 'source']
      });
      
      if (response.data.success) {
        // Refresh leads after merge
        fetchLeads();
        fetchStats();
      }
      
      setShowMergeModal(false);
      setSelectedLeads([]);
      setMergedLead(null);
    } catch (error) {
      console.error('Error merging leads:', error);
    }
  };

  // Run validation
  const runValidation = () => {
    alert('Running validation on all leads. This would trigger the validation process in a real application.');
    // In a real app, this would call an API to run validation
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Lead Validation & Deduplication</h1>
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads..."
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
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Validation Settings
            </button>
          </div>
          
          <div className="w-full md:w-auto">
            <button
              onClick={runValidation}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Validation
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="validated">Validated</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validation Issue</label>
              <select
                name="validation_issue"
                value={filters.validation_issue}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Issues</option>
                <option value="possible_duplicate">Possible Duplicate</option>
                <option value="invalid_email">Invalid Email</option>
                <option value="invalid_phone">Invalid Phone</option>
                <option value="spam_signals">Spam Signals</option>
                <option value="fake_company">Fake Company</option>
                <option value="incomplete_data">Incomplete Data</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Duplicate Score</label>
              <input
                type="number"
                name="duplicate_score_min"
                value={filters.duplicate_score_min}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="0-100"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Validation Score</label>
              <input
                type="number"
                name="validation_score_min"
                value={filters.validation_score_min}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="0-100"
                min="0"
                max="100"
              />
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
      
      {/* Leads Table */}
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
                  onClick={() => handleSort('first_name')}
                >
                  <div className="flex items-center">
                    Name
                    {getSortIcon('first_name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Contact
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center">
                    Company
                    {getSortIcon('company')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('source')}
                >
                  <div className="flex items-center">
                    Source
                    {getSortIcon('source')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Validation Issues
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('duplicate_score')}
                >
                  <div className="flex items-center">
                    Dup. Score
                    {getSortIcon('duplicate_score')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('validation_score')}
                >
                  <div className="flex items-center">
                    Val. Score
                    {getSortIcon('validation_score')}
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
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lead.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{lead.email}</div>
                    <div>{lead.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.source}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {lead.validation_issues.length > 0 ? (
                      <div>
                        {lead.validation_issues.map((issue, index) => (
                          <span key={index} className="inline-block bg-red-100 text-red-800 rounded px-2 py-1 text-xs mr-1 mb-1">
                            {issue.replace('_', ' ')}
                          </span>
                        ))}
                        {lead.potential_duplicates.length > 0 && (
                          <button
                            onClick={() => openMergeModal([lead.id, ...lead.potential_duplicates])}
                            className="inline-block bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs mr-1 mb-1 hover:bg-blue-200"
                          >
                            Merge duplicates
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-1" /> No issues
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            lead.duplicate_score > 70 ? 'bg-red-600' : 
                            lead.duplicate_score > 40 ? 'bg-yellow-400' : 'bg-green-500'
                          }`}
                          style={{ width: `${lead.duplicate_score}%` }}
                        ></div>
                      </div>
                      <span className="ml-2">{lead.duplicate_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            lead.validation_score < 40 ? 'bg-red-600' : 
                            lead.validation_score < 70 ? 'bg-yellow-400' : 'bg-green-500'
                          }`}
                          style={{ width: `${lead.validation_score}%` }}
                        ></div>
                      </div>
                      <span className="ml-2">{lead.validation_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(lead.status)}`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {lead.status === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleValidationAction(lead.id, 'validated')}
                          className="text-green-600 hover:text-green-900"
                          title="Validate"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleValidationAction(lead.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {lead.status !== 'pending' && (
                      <button
                        onClick={() => handleValidationAction(lead.id, 'pending')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Reset to Pending"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
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
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <p className="text-2xl font-semibold">{leads.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Validation</p>
              <p className="text-2xl font-semibold">
                {leads.filter(lead => lead.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <UserX className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Potential Duplicates</p>
              <p className="text-2xl font-semibold">
                {leads.filter(lead => lead.validation_issues.includes('possible_duplicate')).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Zap className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Validated Leads</p>
              <p className="text-2xl font-semibold">
                {leads.filter(lead => lead.status === 'validated').length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Validation Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duplicate Detection Threshold (%)
                </label>
                <input
                  type="range"
                  name="duplicate_threshold"
                  min="0"
                  max="100"
                  value={validationRules.duplicate_threshold}
                  onChange={handleSettingsChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low Sensitivity</span>
                  <span>{validationRules.duplicate_threshold}%</span>
                  <span>High Sensitivity</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="email_validation"
                  checked={validationRules.email_validation}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable Email Validation
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="phone_validation"
                  checked={validationRules.phone_validation}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable Phone Number Validation
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="company_validation"
                  checked={validationRules.company_validation}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable Company Validation
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="spam_detection"
                  checked={validationRules.spam_detection}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable Spam Detection
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-Reject Threshold (Validation Score)
                </label>
                <input
                  type="range"
                  name="auto_reject_threshold"
                  min="0"
                  max="100"
                  value={validationRules.auto_reject_threshold}
                  onChange={handleSettingsChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>{validationRules.auto_reject_threshold}%</span>
                  <span>100</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-Approve Threshold (Validation Score)
                </label>
                <input
                  type="range"
                  name="auto_approve_threshold"
                  min="0"
                  max="100"
                  value={validationRules.auto_approve_threshold}
                  onChange={handleSettingsChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>{validationRules.auto_approve_threshold}%</span>
                  <span>100</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Merge Modal */}
      {showMergeModal && mergedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Merge Duplicate Leads</h3>
              <button onClick={() => setShowMergeModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Selected Leads to Merge</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  {selectedLeads.map((lead, index) => (
                    <div key={lead.id} className="border p-3 rounded-md">
                      <div className="font-medium">{lead.first_name} {lead.last_name}</div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                      <div className="text-sm text-gray-500">{lead.company}</div>
                      <div className="text-sm text-gray-500">Source: {lead.source}</div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-medium mb-2">Merged Lead Result</h4>
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={mergedLead.first_name}
                        onChange={(e) => setMergedLead({...mergedLead, first_name: e.target.value})}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={mergedLead.last_name}
                        onChange={(e) => setMergedLead({...mergedLead, last_name: e.target.value})}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={mergedLead.email}
                        onChange={(e) => setMergedLead({...mergedLead, email: e.target.value})}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={mergedLead.phone}
                        onChange={(e) => setMergedLead({...mergedLead, phone: e.target.value})}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={mergedLead.company}
                        onChange={(e) => setMergedLead({...mergedLead, company: e.target.value})}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <input
                        type="text"
                        value={mergedLead.source}
                        onChange={(e) => setMergedLead({...mergedLead, source: e.target.value})}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Merge Warning</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Merging leads will combine the selected leads into a single record and delete the original leads.
                      This action cannot be undone. Please verify the merged data before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={completeMerge}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Complete Merge
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Lead Validation</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                The Lead Validation system automatically checks new leads for data quality issues and potential duplicates.
                Validation scores indicate the overall quality of the lead data, while duplicate scores show the likelihood
                of the lead being a duplicate of an existing record. You can adjust validation settings to control
                sensitivity and automate approval/rejection based on scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadValidation;