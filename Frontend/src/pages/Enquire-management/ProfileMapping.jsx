import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, ChevronDown, ChevronUp, 
  Plus, Edit, Trash, ArrowRight, Check, X, Settings, Loader
} from 'lucide-react';
import { 
  getProfileMappings, 
  createProfileMapping, 
  updateProfileMapping, 
  deleteProfileMapping, 
  runProfileMappingRule,
  toggleProfileMappingStatus
} from '../../services/enquire_management/profileMappingService';
import { getProfilesByType } from '../../services/profile/profileService';
import enquiryService from '../../services/enquire_management/enquiryService';

const ProfileMapping = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mappingRules, setMappingRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRule, setCurrentRule] = useState({
    name: '',
    source_profile: '',
    target_profile: '',
    conditions: [],
    field_mappings: [],
    is_active: true,
    profile_id: null,
    enquiry_id: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  
  // State for enquiries
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  
  // State for profiles
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  
  // State for filters
  const [filters, setFilters] = useState({
    name: '',
    source_profile: '',
    target_profile: '',
    is_active: null, // Using null instead of empty string for boolean field
    enquiry_id: ''
  });

  // State for advanced filters visibility
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'created_at',
    direction: 'desc'
  });

  // Fetch profile mappings from API
  const fetchProfileMappings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProfileMappings(
        pagination.page, 
        pagination.limit, 
        filters
      );
      
      // Transform backend data to match frontend structure
      const transformedData = response.data.map(mapping => ({
        id: mapping._id,
        mapping_id: mapping.mapping_id,
        name: mapping.name || `Mapping ${mapping.mapping_id}`,
        source_profile: mapping.profile_type,
        target_profile: mapping.profile_type_ref,
        conditions: mapping.conditions || [],
        field_mappings: mapping.field_mappings || [],
        is_active: mapping.is_active || true,
        created_by: mapping.created_by ? mapping.created_by.name : 'System',
        created_at: mapping.created_at,
        last_run: mapping.last_run,
        conversion_count: mapping.conversion_count || 0,
        enquiry_id: mapping.enquiry_id,
        profile_id: mapping.profile_id
      }));
      
      setMappingRules(transformedData);
      setPagination({
        ...pagination,
        total: response.total
      });
    } catch (err) {
      console.error('Error fetching profile mappings:', err);
      setError('Failed to load profile mappings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Profile types from backend
  const profileTypes = ['project', 'product', 'amc', 'complaint', 'info', 'job', 'site_visit'];
  
  // Field definitions for each profile type - these would ideally come from an API
  const profileFields = {
    'project': ['name', 'description', 'status', 'start_date', 'end_date', 'budget', 'location', 'client_name', 'project_manager'],
    'product': ['name', 'description', 'category', 'price', 'sku', 'stock', 'features', 'specifications'],
    'amc': ['name', 'description', 'start_date', 'end_date', 'renewal_date', 'client_name', 'contract_value', 'service_level'],
    'complaint': ['subject', 'description', 'priority', 'status', 'reported_date', 'resolution_date', 'customer_name', 'assigned_to'],
    'info': ['title', 'content', 'category', 'tags', 'publish_date', 'author', 'status'],
    'job': ['title', 'description', 'location', 'department', 'salary_range', 'experience_required', 'skills_required', 'posting_date'],
    'site_visit': ['location', 'scheduled_date', 'purpose', 'contact_person', 'status', 'notes', 'assigned_to']
  };
  
  // Fetch enquiries for dropdown
  const fetchEnquiries = async () => {
    try {
      setLoadingEnquiries(true);
      const response = await enquiryService.getEnquiries({
        page: 1,
        limit: 100
      });
      if (response.success && response.data) {
        setEnquiries(response.data);
      } else {
        console.error('Failed to fetch enquiries');
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };
  
  // Fetch profiles by type
 

  // Load profile mappings when component mounts or filters change
  useEffect(() => {
    fetchProfileMappings();
  }, [pagination.page, pagination.limit, filters]);

  // Load enquiries when component mounts
  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Function to generate dummy profiles based on profile type
  
  // Function to generate dummy profiles based on profile type
  const getDummyProfiles = (type) => {
    const generateObjectId = () => {
      const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
      const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
      const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
      const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
      return timestamp + machineId + processId + counter;
    };

    const dummyData = {
      project: [
        { _id: generateObjectId(), name: 'Dummy Project 1', project_id: 'PRJ001' },
        { _id: generateObjectId(), name: 'Dummy Project 2', project_id: 'PRJ002' },
        { _id: generateObjectId(), name: 'Dummy Project 3', project_id: 'PRJ003' }
      ],
      product: [
        { _id: generateObjectId(), name: 'Dummy Product 1', product_id: 'PRD001' },
        { _id: generateObjectId(), name: 'Dummy Product 2', product_id: 'PRD002' },
        { _id: generateObjectId(), name: 'Dummy Product 3', product_id: 'PRD003' }
      ],
      amc: [
        { _id: generateObjectId(), name: 'Dummy AMC 1', amc_id: 'AMC001' },
        { _id: generateObjectId(), name: 'Dummy AMC 2', amc_id: 'AMC002' },
        { _id: generateObjectId(), name: 'Dummy AMC 3', amc_id: 'AMC003' }
      ],
      complaint: [
        { _id: generateObjectId(), name: 'Dummy Complaint 1', complaint_id: 'CMP001' },
        { _id: generateObjectId(), name: 'Dummy Complaint 2', complaint_id: 'CMP002' },
        { _id: generateObjectId(), name: 'Dummy Complaint 3', complaint_id: 'CMP003' }
      ],
      info: [
        { _id: generateObjectId(), name: 'Dummy Info 1', info_id: 'INF001' },
        { _id: generateObjectId(), name: 'Dummy Info 2', info_id: 'INF002' },
        { _id: generateObjectId(), name: 'Dummy Info 3', info_id: 'INF003' }
      ],
      job: [
        { _id: generateObjectId(), name: 'Dummy Job 1', job_id: 'JOB001' },
        { _id: generateObjectId(), name: 'Dummy Job 2', job_id: 'JOB002' },
        { _id: generateObjectId(), name: 'Dummy Job 3', job_id: 'JOB003' }
      ],
      site_visit: [
        { _id: generateObjectId(), name: 'Dummy Site Visit 1', site_visit_id: 'SV001' },
        { _id: generateObjectId(), name: 'Dummy Site Visit 2', site_visit_id: 'SV002' },
        { _id: generateObjectId(), name: 'Dummy Site Visit 3', site_visit_id: 'SV003' }
      ]
    };
    return dummyData[type] || [];
  };
  
  // Fetch profiles by type
  const fetchProfilesByType = async (type) => {
    try {
      setLoadingProfiles(true);
      const response = await getProfilesByType(type);
      if (response?.data?.length > 0) {
        setProfiles(response.data);
      } else {
        // Use dummy data if API returns empty
        const dummyProfiles = getDummyProfiles(type);
        setProfiles(dummyProfiles);
      }
    } catch (error) {
      console.error(`Error fetching ${type} profiles:`, error);
      // Use dummy data on error
      const dummyProfiles = getDummyProfiles(type);
      setProfiles(dummyProfiles);
    } finally {
      setLoadingProfiles(false);
    }
  };
  
  // Handle profile type change
  const handleProfileTypeChange = (type, isSource = true) => {
    if (isSource) {
      setCurrentRule(prev => ({ ...prev, source_profile: type }));
      fetchProfilesByType(type);
    } else {
      setCurrentRule(prev => ({ ...prev, target_profile: type }));
      fetchProfilesByType(type);
    }
  };
  
  // Handle profile ID change
  const handleProfileIdChange = (id) => {
    setCurrentRule(prev => ({ ...prev, profile_id: id }));
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
  
  // Filter and sort rules
  const filteredAndSortedRules = mappingRules
    .filter(rule => {
      const matchesName = filters.name === '' || rule.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesSourceProfile = filters.source_profile === '' || rule.source_profile === filters.source_profile;
      const matchesTargetProfile = filters.target_profile === '' || rule.target_profile === filters.target_profile;
      const matchesActive = filters.is_active === null || 
        (filters.is_active === 'active' && rule.is_active) || 
        (filters.is_active === 'inactive' && !rule.is_active);
      
      return matchesName && matchesSourceProfile && matchesTargetProfile && matchesActive;
    })
    .sort((a, b) => {
      const key = sortConfig.key;
      
      if (key === 'created_at' || key === 'last_run') {
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
      'ID', 'Name', 'Source Profile', 'Target Profile', 
      'Conditions', 'Field Mappings', 'Status',
      'Created By', 'Created At', 'Last Run', 'Conversion Count'
    ];
    
    const csvData = filteredAndSortedRules.map(rule => {
      // Format field mappings to be more readable in Excel
      let formattedFieldMappings = '';
      if (rule.field_mappings && rule.field_mappings.length > 0) {
        formattedFieldMappings = rule.field_mappings.map(mapping => 
          `${mapping.source_field} -> ${mapping.target_field}${mapping.transformation ? ` (${mapping.transformation})` : ''}`
        ).join('; ');
      }
      
      // Format conditions to be more readable
      let formattedConditions = '';
      if (rule.conditions && rule.conditions.length > 0) {
        formattedConditions = rule.conditions.map(condition => 
          `${condition.field} ${condition.operator} ${condition.value}`
        ).join('; ');
      }
      
      return [
        rule.id,
        rule.name,
        rule.source_profile,
        rule.target_profile,
        formattedConditions,
        formattedFieldMappings,
        rule.is_active ? 'Active' : 'Inactive',
        typeof rule.created_by === 'object' ? (rule.created_by?.name || 'System') : (rule.created_by || 'System'),
        new Date(rule.created_at).toLocaleString(),
        rule.last_run ? new Date(rule.last_run).toLocaleString() : 'Never',
        rule.conversion_count
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `profile_mapping_rules_${new Date().toISOString().split('T')[0]}.csv`);
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
  
  // Open edit modal
  const openEditModal = (rule) => {
    setCurrentRule({...rule});
    setIsEditing(true);
    setShowModal(true);
  };
  
  // Open create modal
  const openCreateModal = () => {
    setCurrentRule({
      id: `PM${String(mappingRules.length + 1).padStart(3, '0')}`,
      name: '',
      source_profile: '',
      target_profile: '',
      conditions: [],
      field_mappings: [],
      is_active: true,
      created_by: 'Current User', // Would be replaced with actual logged-in user
      created_at: new Date().toISOString(),
      last_run: null,
      conversion_count: 0,
      profile_id: null,
      enquiry_id: ''
    });
    setIsEditing(false);
    setShowModal(true);
  };
  
  // Add condition to current rule
  const addCondition = () => {
    setCurrentRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
    }));
  };
  
  // Remove condition from current rule
  const removeCondition = (index) => {
    setCurrentRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };
  
  // Update condition
  const updateCondition = (index, field, value) => {
    setCurrentRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };
  
  // Add field mapping to current rule
  const addFieldMapping = () => {
    setCurrentRule(prev => ({
      ...prev,
      field_mappings: [...prev.field_mappings, { source_field: '', target_field: '', transformation: null }]
    }));
  };
  
  // Remove field mapping from current rule
  const removeFieldMapping = (index) => {
    setCurrentRule(prev => ({
      ...prev,
      field_mappings: prev.field_mappings.filter((_, i) => i !== index)
    }));
  };
  
  // Update field mapping
  const updateFieldMapping = (index, field, value) => {
    setCurrentRule(prev => ({
      ...prev,
      field_mappings: prev.field_mappings.map((mapping, i) => 
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  };
  
  // Save rule
  const saveRule = async () => {
    try {
      setLoading(true);
      
      // Validate profile_id is not empty
      if (!currentRule.profile_id) {
        alert('Please select a valid Profile ID');
        setLoading(false);
        return;
      }
      
      // Transform frontend data to match backend structure
      const mappingData = {
        name: currentRule.name,
        profile_type: currentRule.source_profile,
        profile_id: currentRule.profile_id,
        enquiry_id: currentRule.enquiry_id,
        conditions: currentRule.conditions,
        field_mappings: currentRule.field_mappings,
        is_active: currentRule.is_active
      };
      
      let response;
      if (isEditing) {
        response = await updateProfileMapping(currentRule.id, mappingData);
        setMappingRules(prev => 
          prev.map(rule => rule.id === currentRule.id ? {
            ...rule,
            ...response.data
          } : rule)
        );
      } else {
        response = await createProfileMapping(mappingData);
        setMappingRules(prev => [...prev, {
          id: response.data._id,
          mapping_id: response.data.mapping_id,
          name: response.data.name || `Mapping ${response.data.mapping_id}`,
          source_profile: response.data.profile_type,
          target_profile: response.data.profile_type_ref,
          conditions: response.data.conditions || [],
          field_mappings: response.data.field_mappings || [],
          is_active: response.data.is_active || true,
          created_by: response.data.created_by ? response.data.created_by.name : 'System',
          created_at: response.data.created_at,
          last_run: response.data.last_run,
          conversion_count: response.data.conversion_count || 0,
          enquiry_id: response.data.enquiry_id,
          profile_id: response.data.profile_id
        }]);
      }
      
      setShowModal(false);
    } catch (err) {
      console.error('Error saving profile mapping:', err);
      alert('Failed to save profile mapping. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete rule
  const deleteRule = async (id) => {
    if (window.confirm('Are you sure you want to delete this mapping rule?')) {
      try {
        setLoading(true);
        await deleteProfileMapping(id);
        setMappingRules(prev => prev.filter(rule => rule.id !== id));
      } catch (err) {
        console.error('Error deleting profile mapping:', err);
        alert('Failed to delete profile mapping. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Toggle rule active status
  const toggleRuleStatus = async (id) => {
    try {
      const rule = mappingRules.find(r => r.id === id);
      if (!rule) return;
      
      setLoading(true);
      await toggleProfileMappingStatus(id, !rule.is_active);
      
      setMappingRules(prev => 
        prev.map(rule => 
          rule.id === id ? { ...rule, is_active: !rule.is_active } : rule
        )
      );
    } catch (err) {
      console.error('Error toggling profile mapping status:', err);
      alert('Failed to update profile mapping status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Run rule manually
  const runRule = async (id) => {
    try {
      const rule = mappingRules.find(r => r.id === id);
      if (!rule) {
        alert('Rule not found');
        return;
      }
  
      // Check if profile_id is a dummy ID
      if (rule.profile_id && rule.profile_id.toString().startsWith('dummy_')) {
        alert('Cannot run mapping rule with dummy profile. Please select a real profile.');
        return;
      }
  
      setLoading(true);
      const response = await runProfileMappingRule(id);
      
      // Create a detailed message showing what was converted
      let conversionDetails = '';
      if (rule.field_mappings && rule.field_mappings.length > 0) {
        conversionDetails = '\n\nConverted Fields:\n';
        rule.field_mappings.forEach((mapping, index) => {
          conversionDetails += `${index + 1}. ${mapping.source_field} → ${mapping.target_field}`;
          if (mapping.transformation) {
            conversionDetails += ` (with ${mapping.transformation})`;
          }
          conversionDetails += '\n';
        });
      }
      
      // Show source and target profile types
      const conversionSummary = `\nConverted from: ${rule.source_profile} to ${rule.target_profile}`;
      
      alert(`Rule executed successfully. ${response.data.message || 'Profile mapping completed.'}${conversionSummary}${conversionDetails}`);
      
      // Refresh the list to get updated conversion count
      fetchProfileMappings();
    } catch (err) {
      console.error('Error running profile mapping rule:', err);
      alert('Failed to run profile mapping rule. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Profile Mapping</h1>
      
      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center my-4">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">Loading...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full md:w-1/3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by rule name"
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
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
              onClick={openCreateModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Rule
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Profile</label>
              <select
                name="source_profile"
                value={filters.source_profile}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Source Profiles</option>
                {profileTypes.map(type => (
                  <option key={`source-${type}`} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Profile</label>
              <select
                name="target_profile"
                value={filters.target_profile}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Target Profiles</option>
                {profileTypes.map(type => (
                  <option key={`target-${type}`} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="is_active"
                value={filters.is_active}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Mapping Rules Table */}
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
                    Rule Name
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('source_profile')}
                >
                  <div className="flex items-center">
                    Source Profile
                    {getSortIcon('source_profile')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('target_profile')}
                >
                  <div className="flex items-center">
                    Target Profile
                    {getSortIcon('target_profile')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Conditions
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('is_active')}
                >
                  <div className="flex items-center">
                    Status
                    {getSortIcon('is_active')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('conversion_count')}
                >
                  <div className="flex items-center">
                    Conversions
                    {getSortIcon('conversion_count')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('last_run')}
                >
                  <div className="flex items-center">
                    Last Run
                    {getSortIcon('last_run')}
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
              {filteredAndSortedRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rule.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.source_profile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.target_profile}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {rule.conditions.length > 0 ? (
                      <div className="max-w-xs truncate">
                        {rule.conditions.map((condition, index) => (
                          <span key={index} className="inline-block bg-gray-100 rounded px-2 py-1 text-xs mr-1 mb-1">
                            {condition.field} {condition.operator} {condition.value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No conditions</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.conversion_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.last_run ? new Date(rule.last_run).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => runRule(rule.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Run Rule"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleRuleStatus(rule.id)}
                        className={`${rule.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={rule.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {rule.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(rule)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash className="h-4 w-4" />
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
              <Settings className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Rules</p>
              <p className="text-2xl font-semibold">{mappingRules.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Check className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Rules</p>
              <p className="text-2xl font-semibold">
                {mappingRules.filter(rule => rule.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <ArrowRight className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Conversions</p>
              <p className="text-2xl font-semibold">
                {mappingRules.reduce((sum, rule) => sum + rule.conversion_count, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Edit className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Profile Types</p>
              <p className="text-2xl font-semibold">
                {profileTypes.length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit/Create Modal */}
      {showModal && currentRule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{isEditing ? 'Edit Mapping Rule' : 'Create New Mapping Rule'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={currentRule.name}
                  onChange={(e) => setCurrentRule({...currentRule, name: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Enter rule name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={currentRule.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setCurrentRule({...currentRule, is_active: e.target.value === 'active'})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry <span className="text-red-500">*</span></label>
                <select
                  value={currentRule.enquiry_id || ""}
                  onChange={(e) => setCurrentRule({...currentRule, enquiry_id: e.target.value})}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Enquiry</option>
                  {enquiries.map(enquiry => (
                    <option key={enquiry._id} value={enquiry._id}>
                      {enquiry.name || enquiry.company_name || `Enquiry ${enquiry.enquiry_id}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Profile</label>
                <select
                  value={currentRule.source_profile}
                  onChange={(e) => {
                    const selectedProfileType = e.target.value;
                    setCurrentRule({
                      ...currentRule, 
                      source_profile: selectedProfileType,
                      profile_id: '', // Reset profile_id when source changes
                      field_mappings: [] // Reset field mappings when source changes
                    });
                    
                    // Fetch profiles for the selected type
                    if (selectedProfileType) {
                      fetchProfilesByType(selectedProfileType);
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Source Profile</option>
                  {profileTypes.map(type => (
                    <option key={`modal-source-${type}`} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              {currentRule.source_profile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile ID <span className="text-red-500">*</span></label>
                  <select
                    value={currentRule.profile_id || ""}
                    onChange={(e) => setCurrentRule({...currentRule, profile_id: e.target.value || null})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select Profile</option>
                  {loadingProfiles ? (
                    <option value="" disabled>Loading profiles...</option>
                  ) : profiles.length > 0 ? (
                    profiles.map(profile => (
                      <option key={profile._id} value={profile._id}>
                        {profile.name || profile.title || profile.subject || `${currentRule.source_profile} ${profile._id}`}
                        {profile[`${currentRule.source_profile}_id`] ? ` (${profile[`${currentRule.source_profile}_id`]})` : ''}
                      </option>
                    ))
                  ) : (
                    getDummyProfiles(currentRule.source_profile).map(profile => (
                      <option key={profile._id} value={profile._id}>
                        {profile.name} ({profile[`${currentRule.source_profile}_id`]})
                      </option>
                    ))
                  )}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Profile</label>
                <select
                  value={currentRule.target_profile}
                  onChange={(e) => {
                    setCurrentRule({
                      ...currentRule, 
                      target_profile: e.target.value,
                      field_mappings: [] // Reset field mappings when target changes
                    });
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select Target Profile</option>
                  {profileTypes.map(type => (
                    <option key={`modal-target-${type}`} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Conditions Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium">Conditions</h4>
                <button
                  onClick={addCondition}
                  className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Condition
                </button>
              </div>
              
              {currentRule.conditions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No conditions added. This rule will apply to all records.</p>
              ) : (
                <div className="space-y-2">
                  {currentRule.conditions.map((condition, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Select Field</option>
                        {currentRule.source_profile && profileFields[currentRule.source_profile]?.map(field => (
                          <option key={`cond-field-${field}`} value={field}>{field}</option>
                        ))}
                      </select>
                      
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="equals">equals</option>
                        <option value="not_equals">not equals</option>
                        <option value="greater_than">greater than</option>
                        <option value="less_than">less than</option>
                        <option value="contains">contains</option>
                        <option value="starts_with">starts with</option>
                        <option value="ends_with">ends with</option>
                        <option value="older_than">older than</option>
                        <option value="newer_than">newer than</option>
                      </select>
                      
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Value"
                      />
                      
                      <button
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Field Mappings Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-medium">Field Mappings</h4>
                <button
                  onClick={addFieldMapping}
                  className="flex items-center px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                  disabled={!currentRule.source_profile || !currentRule.target_profile}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Field Mapping
                </button>
              </div>
              
              {!currentRule.source_profile || !currentRule.target_profile ? (
                <p className="text-sm text-gray-500 italic">Please select source and target profiles first.</p>
              ) : currentRule.field_mappings.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No field mappings added. Add mappings to define how fields are converted.</p>
              ) : (
                <div className="space-y-2">
                  {currentRule.field_mappings.map((mapping, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <select
                        value={mapping.source_field}
                        onChange={(e) => updateFieldMapping(index, 'source_field', e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Source Field</option>
                        {currentRule.source_profile && profileFields[currentRule.source_profile]?.map(field => (
                          <option key={`src-field-${field}`} value={field}>{field}</option>
                        ))}
                      </select>
                      
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      
                      <select
                        value={mapping.target_field}
                        onChange={(e) => updateFieldMapping(index, 'target_field', e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Target Field</option>
                        {currentRule.target_profile && profileFields[currentRule.target_profile]?.map(field => (
                          <option key={`tgt-field-${field}`} value={field}>{field}</option>
                        ))}
                      </select>
                      
                      <select
                        value={mapping.transformation || ''}
                        onChange={(e) => updateFieldMapping(index, 'transformation', e.target.value || null)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">No Transformation</option>
                        <option value="uppercase">Convert to Uppercase</option>
                        <option value="lowercase">Convert to Lowercase</option>
                        <option value="capitalize">Capitalize</option>
                        <option value="trim">Trim Whitespace</option>
                        <option value="multiply_by_1.5">Multiply by 1.5</option>
                        <option value="divide_by_2">Divide by 2</option>
                        <option value="format_date">Format Date</option>
                        <option value="extract_domain">Extract Email Domain</option>
                      </select>
                      
                      <button
                        onClick={() => removeFieldMapping(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveRule}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!currentRule.name || !currentRule.source_profile || !currentRule.target_profile}
              >
                {isEditing ? 'Update Rule' : 'Create Rule'}
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
            <h3 className="text-sm font-medium text-blue-800">About Profile Mapping</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Profile mapping allows you to define rules for converting contacts from one profile type to another.
                For example, converting qualified leads to customers based on specific criteria.
                Each rule consists of conditions that determine when the conversion should happen and field mappings
                that define how data should be transferred between profile types.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileMapping;