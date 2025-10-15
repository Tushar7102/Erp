import React, { useState } from 'react';
import { 
  Search, Filter, Download, ChevronDown, ChevronUp, 
  Settings, RefreshCw, Zap, AlertTriangle, BarChart2, 
  Star, StarHalf, Clock, Users, Briefcase, Award
} from 'lucide-react';

const LeadScoring = () => {
  // Sample data for scored leads
  const [leads, setLeads] = useState([
    {
      id: 'LD001',
      first_name: 'Rahul',
      last_name: 'Sharma',
      email: 'rahul.sharma@example.com',
      phone: '9876543210',
      company: 'Tech Solutions Ltd',
      source: 'Website Form',
      created_at: '2023-07-10T09:30:00',
      score: 85,
      factors: {
        engagement: 90,
        fit: 80,
        interest: 85,
        budget: 70,
        timeline: 90
      },
      priority: 'high',
      last_activity: '2023-07-14T15:30:00',
      assigned_to: 'Amit Kumar'
    },
    {
      id: 'LD002',
      first_name: 'Priya',
      last_name: 'Patel',
      email: 'priya.patel@example.com',
      phone: '8765432109',
      company: 'Global Innovations',
      source: 'LinkedIn',
      created_at: '2023-07-11T10:15:00',
      score: 65,
      factors: {
        engagement: 60,
        fit: 70,
        interest: 65,
        budget: 60,
        timeline: 70
      },
      priority: 'medium',
      last_activity: '2023-07-13T11:45:00',
      assigned_to: 'Neha Singh'
    },
    {
      id: 'LD003',
      first_name: 'Amit',
      last_name: 'Kumar',
      email: 'amit.kumar123@gmail.com',
      phone: '7654321098',
      company: 'Digital Dynamics',
      source: 'Trade Show',
      created_at: '2023-07-12T14:15:00',
      score: 35,
      factors: {
        engagement: 30,
        fit: 40,
        interest: 35,
        budget: 30,
        timeline: 40
      },
      priority: 'low',
      last_activity: '2023-07-12T16:20:00',
      assigned_to: 'Vikram Malhotra'
    },
    {
      id: 'LD004',
      first_name: 'Neha',
      last_name: 'Singh',
      email: 'neha.singh@example.com',
      phone: '6543210987',
      company: 'Creative Solutions',
      source: 'Referral',
      created_at: '2023-07-12T11:45:00',
      score: 90,
      factors: {
        engagement: 95,
        fit: 85,
        interest: 90,
        budget: 85,
        timeline: 95
      },
      priority: 'high',
      last_activity: '2023-07-15T09:30:00',
      assigned_to: 'Rahul Sharma'
    },
    {
      id: 'LD005',
      first_name: 'Vikram',
      last_name: 'Malhotra',
      email: 'vikram.malhotra@example.com',
      phone: '5432109876',
      company: 'Stellar Enterprises',
      source: 'Google Ads',
      created_at: '2023-07-13T16:45:00',
      score: 75,
      factors: {
        engagement: 70,
        fit: 80,
        interest: 75,
        budget: 80,
        timeline: 70
      },
      priority: 'medium',
      last_activity: '2023-07-14T10:15:00',
      assigned_to: 'Priya Patel'
    },
    {
      id: 'LD006',
      first_name: 'Anjali',
      last_name: 'Gupta',
      email: 'anjali.gupta@example.com',
      phone: '4321098765',
      company: 'Innovative Tech',
      source: 'Email Campaign',
      created_at: '2023-07-14T13:20:00',
      score: 55,
      factors: {
        engagement: 50,
        fit: 60,
        interest: 55,
        budget: 60,
        timeline: 50
      },
      priority: 'medium',
      last_activity: '2023-07-14T15:45:00',
      assigned_to: 'Amit Kumar'
    }
  ]);

  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    score_min: '',
    score_max: '',
    source: '',
    assigned_to: '',
    date_from: '',
    date_to: ''
  });

  // State for advanced filters visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'score',
    direction: 'desc'
  });

  // State for scoring model settings
  const [scoringModel, setScoringModel] = useState({
    engagement_weight: 25,
    fit_weight: 20,
    interest_weight: 20,
    budget_weight: 15,
    timeline_weight: 20,
    auto_assign: true,
    high_priority_threshold: 80,
    medium_priority_threshold: 50
  });

  // State for settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // State for lead detail modal
  const [showLeadDetailModal, setShowLeadDetailModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

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
        lead.company.toLowerCase().includes(searchTerms) ||
        lead.id.toLowerCase().includes(searchTerms);
      
      const matchesPriority = filters.priority === '' || lead.priority === filters.priority;
      
      const matchesScoreMin = filters.score_min === '' || lead.score >= parseInt(filters.score_min);
      const matchesScoreMax = filters.score_max === '' || lead.score <= parseInt(filters.score_max);
      
      const matchesSource = filters.source === '' || lead.source === filters.source;
      const matchesAssignedTo = filters.assigned_to === '' || lead.assigned_to === filters.assigned_to;
      
      let matchesDateRange = true;
      if (filters.date_from && filters.date_to) {
        const leadDate = new Date(lead.created_at);
        const fromDate = new Date(filters.date_from);
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999); // Set to end of day
        matchesDateRange = leadDate >= fromDate && leadDate <= toDate;
      }
      
      return matchesSearch && matchesPriority && matchesScoreMin && 
             matchesScoreMax && matchesSource && matchesAssignedTo && matchesDateRange;
    })
    .sort((a, b) => {
      const key = sortConfig.key;
      
      if (key === 'created_at' || key === 'last_activity') {
        return sortConfig.direction === 'asc' 
          ? new Date(a[key]) - new Date(b[key])
          : new Date(b[key]) - new Date(a[key]);
      }
      
      if (key === 'score') {
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
      'Company', 'Source', 'Created At', 'Score', 'Priority',
      'Last Activity', 'Assigned To'
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
      lead.score,
      lead.priority,
      new Date(lead.last_activity).toLocaleString(),
      lead.assigned_to
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lead_scores_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Get priority badge class
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get score color class
  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Handle settings change
  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setScoringModel(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value)
    }));
  };

  // Save settings
  const saveSettings = () => {
    // In a real app, this would save to backend
    setShowSettingsModal(false);
    alert('Scoring model settings saved successfully!');
  };

  // Open lead detail modal
  const openLeadDetailModal = (lead) => {
    setSelectedLead(lead);
    setShowLeadDetailModal(true);
  };

  // Run scoring model
  const runScoringModel = () => {
    alert('Running scoring model on all leads. This would trigger the AI scoring process in a real application.');
    // In a real app, this would call an API to run the scoring model
  };

  // Get unique sources for filter dropdown
  const uniqueSources = [...new Set(leads.map(lead => lead.source))];

  // Get unique assigned_to values for filter dropdown
  const uniqueAssignedTo = [...new Set(leads.map(lead => lead.assigned_to))];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Lead Scoring & Prioritization</h1>
      
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
              Scoring Settings
            </button>
          </div>
          
          <div className="w-full md:w-auto">
            <button
              onClick={runScoringModel}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Scoring Model
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
              <input
                type="number"
                name="score_min"
                value={filters.score_min}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="0-100"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
              <input
                type="number"
                name="score_max"
                value={filters.score_max}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="0-100"
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                name="source"
                value={filters.source}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Sources</option>
                {uniqueSources.map((source, index) => (
                  <option key={index} value={source}>{source}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                name="assigned_to"
                value={filters.assigned_to}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Assignees</option>
                {uniqueAssignedTo.map((assignee, index) => (
                  <option key={index} value={assignee}>{assignee}</option>
                ))}
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center">
                    Score
                    {getSortIcon('score')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center">
                    Priority
                    {getSortIcon('priority')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('last_activity')}
                >
                  <div className="flex items-center">
                    Last Activity
                    {getSortIcon('last_activity')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('assigned_to')}
                >
                  <div className="flex items-center">
                    Assigned To
                    {getSortIcon('assigned_to')}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            lead.score >= 80 ? 'bg-green-500' : 
                            lead.score >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${lead.score}%` }}
                        ></div>
                      </div>
                      <span className={`ml-2 font-medium ${getScoreColorClass(lead.score)}`}>
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(lead.priority)}`}>
                      {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.last_activity).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.assigned_to}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openLeadDetailModal(lead)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
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
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <p className="text-2xl font-semibold">{leads.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <Star className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-semibold">
                {leads.filter(lead => lead.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <StarHalf className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Medium Priority</p>
              <p className="text-2xl font-semibold">
                {leads.filter(lead => lead.priority === 'medium').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Award className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Lead Score</p>
              <p className="text-2xl font-semibold">
                {Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)}
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
              <h3 className="text-lg font-medium">Scoring Model Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium mb-2">Scoring Factor Weights (Total: 100%)</h4>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Engagement Weight ({scoringModel.engagement_weight}%)
                  </label>
                  <input
                    type="range"
                    name="engagement_weight"
                    min="0"
                    max="50"
                    value={scoringModel.engagement_weight}
                    onChange={handleSettingsChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Website visits, email opens, content downloads, etc.
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fit Weight ({scoringModel.fit_weight}%)
                  </label>
                  <input
                    type="range"
                    name="fit_weight"
                    min="0"
                    max="50"
                    value={scoringModel.fit_weight}
                    onChange={handleSettingsChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Company size, industry, role match, etc.
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Weight ({scoringModel.interest_weight}%)
                  </label>
                  <input
                    type="range"
                    name="interest_weight"
                    min="0"
                    max="50"
                    value={scoringModel.interest_weight}
                    onChange={handleSettingsChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Product page views, pricing page visits, etc.
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Weight ({scoringModel.budget_weight}%)
                  </label>
                  <input
                    type="range"
                    name="budget_weight"
                    min="0"
                    max="50"
                    value={scoringModel.budget_weight}
                    onChange={handleSettingsChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Budget information, company revenue, etc.
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeline Weight ({scoringModel.timeline_weight}%)
                  </label>
                  <input
                    type="range"
                    name="timeline_weight"
                    min="0"
                    max="50"
                    value={scoringModel.timeline_weight}
                    onChange={handleSettingsChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Urgency signals, timeline information, etc.
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 mt-2">
                  Total: {scoringModel.engagement_weight + scoringModel.fit_weight + 
                          scoringModel.interest_weight + scoringModel.budget_weight + 
                          scoringModel.timeline_weight}%
                  {(scoringModel.engagement_weight + scoringModel.fit_weight + 
                    scoringModel.interest_weight + scoringModel.budget_weight + 
                    scoringModel.timeline_weight) !== 100 && (
                    <span className="text-red-500 ml-2">
                      (Should equal 100%)
                    </span>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-md font-medium mb-2">Priority Thresholds</h4>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    High Priority Threshold ({scoringModel.high_priority_threshold}+)
                  </label>
                  <input
                    type="range"
                    name="high_priority_threshold"
                    min="50"
                    max="95"
                    value={scoringModel.high_priority_threshold}
                    onChange={handleSettingsChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medium Priority Threshold ({scoringModel.medium_priority_threshold}-{scoringModel.high_priority_threshold - 1})
                  </label>
                  <input
                    type="range"
                    name="medium_priority_threshold"
                    min="20"
                    max="70"
                    value={scoringModel.medium_priority_threshold}
                    onChange={handleSettingsChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  Low Priority: Below {scoringModel.medium_priority_threshold}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto-assign"
                    name="auto_assign"
                    checked={scoringModel.auto_assign}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto-assign" className="ml-2 block text-sm text-gray-900">
                    Auto-assign high priority leads to sales representatives
                  </label>
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
      
      {/* Lead Detail Modal */}
      {showLeadDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Lead Score Details: {selectedLead.first_name} {selectedLead.last_name}
              </h3>
              <button onClick={() => setShowLeadDetailModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium mb-2">Lead Information</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">ID</p>
                      <p className="text-sm">{selectedLead.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-sm">{selectedLead.first_name} {selectedLead.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm">{selectedLead.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm">{selectedLead.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <p className="text-sm">{selectedLead.company}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Source</p>
                      <p className="text-sm">{selectedLead.source}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created At</p>
                      <p className="text-sm">{new Date(selectedLead.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Activity</p>
                      <p className="text-sm">{new Date(selectedLead.last_activity).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assigned To</p>
                      <p className="text-sm">{selectedLead.assigned_to}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Priority</p>
                      <p className="text-sm capitalize">{selectedLead.priority}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2">Score Breakdown</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className={`text-sm font-medium ${getScoreColorClass(selectedLead.score)}`}>
                        {selectedLead.score}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          selectedLead.score >= 80 ? 'bg-green-500' : 
                          selectedLead.score >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedLead.score}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Engagement</span>
                        <span className="text-sm">{selectedLead.factors.engagement}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${selectedLead.factors.engagement}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Fit</span>
                        <span className="text-sm">{selectedLead.factors.fit}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-purple-500"
                          style={{ width: `${selectedLead.factors.fit}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Interest</span>
                        <span className="text-sm">{selectedLead.factors.interest}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-indigo-500"
                          style={{ width: `${selectedLead.factors.interest}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Budget</span>
                        <span className="text-sm">{selectedLead.factors.budget}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${selectedLead.factors.budget}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Timeline</span>
                        <span className="text-sm">{selectedLead.factors.timeline}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-orange-500"
                          style={{ width: `${selectedLead.factors.timeline}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">AI Recommendations</h4>
                  <div className="bg-blue-50 p-4 rounded-md text-sm">
                    {selectedLead.priority === 'high' ? (
                      <p>
                        This lead shows strong buying signals and should be contacted immediately.
                        Recommend scheduling a demo and discussing specific needs related to their industry.
                      </p>
                    ) : selectedLead.priority === 'medium' ? (
                      <p>
                        This lead shows moderate interest. Recommend nurturing with targeted content
                        about {selectedLead.company}'s industry and following up in 3-5 days.
                      </p>
                    ) : (
                      <p>
                        This lead is still in early research phase. Recommend adding to nurture campaign
                        and monitoring engagement before direct sales contact.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowLeadDetailModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <BarChart2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">About Lead Scoring</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                The Lead Scoring system uses AI to analyze multiple factors and assign a score to each lead,
                helping your team prioritize their efforts. Scores are calculated based on engagement metrics,
                demographic fit, expressed interest, budget signals, and timeline indicators. The system
                automatically categorizes leads into high, medium, and low priority based on their scores.
              </p>
              <p className="mt-2">
                You can adjust the scoring model weights and priority thresholds in the settings to match
                your business needs. The system will recalculate scores when you run the scoring model.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadScoring;