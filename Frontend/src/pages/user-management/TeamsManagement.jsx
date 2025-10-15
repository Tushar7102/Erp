import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  UserPlus,
  UserMinus,
  Building2,
  MapPin,
  Calendar,
  Activity,
  MoreVertical,
  Download,
  Upload,
  Loader2,
  AlertCircle
} from 'lucide-react';
import TeamForm from './components/TeamForm';
import TeamDetails from './components/TeamDetails';
import teamService from '../../services/user_management/teamService';
import userService from '../../services/user_management/userService';

const TeamsManagement = () => {
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Get departments from team service
  const departments = teamService.getDepartments();

  // Prepare data options for dynamic form
  const formDataOptions = {
    departments: departments.map(dept => ({ value: dept, label: dept })),
    teamLeads: [], // Will be populated from API or user service
    territories: [
      { value: 'North India', label: 'North India' },
      { value: 'South India', label: 'South India' },
      { value: 'East India', label: 'East India' },
      { value: 'West India', label: 'West India' },
      { value: 'Central India', label: 'Central India' },
      { value: 'Pan India', label: 'Pan India' },
      { value: 'International', label: 'International' },
      { value: 'Remote', label: 'Remote' },
      { value: 'Global', label: 'Global' }
    ],
    statuses: [
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
      { value: 'Suspended', label: 'Suspended' }
    ]
  };

  // Fetch teams from API
  const fetchTeams = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...params
      };

      // Add search and filter parameters
      if (searchTerm) {
        queryParams.search = searchTerm;
      }
      if (filterDepartment && filterDepartment !== 'all') {
        queryParams.department = filterDepartment;
      }

      const response = await teamService.getTeams(queryParams);
      
      if (response.success) {
        // Transform backend data to frontend format
        const transformedTeams = response.data.map(team => 
          teamService.transformTeamData(team)
        );
        
        // Fetch team lead details for each team
        const teamsWithLeadDetails = await Promise.all(
          transformedTeams.map(async (team) => {
            // Check if team has a team_lead field (string ID) or team_lead_id
            const leadId = team.team_lead || team.team_lead_id;
            
            if (leadId) {
              try {
                const userResponse = await userService.getUser(leadId);
                
                if (userResponse.success) {
                  return {
                    ...team,
                    team_lead: {
                      _id: leadId,
                      name: `${userResponse.data.first_name || ''} ${userResponse.data.last_name || ''}`.trim() || userResponse.data.email,
                      email: userResponse.data.email
                    }
                  };
                }
              } catch (error) {
                console.error(`Error fetching team lead details for team ${team.team_id}:`, error);
              }
            }
            return team;
          })
        );
        
        setTeams(teamsWithLeadDetails);
        
        // Update pagination if available
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            pages: response.pagination.pages
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError(error.message);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [pagination.page, pagination.limit]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.page === 1) {
        fetchTeams();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterDepartment]);

  // Filter teams based on search and department
  const filteredTeams = teams.filter(team => {
    const matchesSearch = (team.team_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (team.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (team.team_lead && typeof team.team_lead === 'string' 
                           ? team.team_lead.toLowerCase().includes(searchTerm.toLowerCase())
                           : (team.team_lead?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || false);
    const matchesDepartment = filterDepartment === 'all' || team.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // CRUD handlers
  const handleCreateTeam = () => {
    setEditingTeam(null);
    setShowTeamModal(true);
  };

  // Handle CSV export
  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Team Name', 'Department', 'Team Lead', 'Territory', 'Members', 'Status', 'Created Date'];
    
    const csvRows = [
      headers.join(','), // Header row
      ...teams.map(team => [
        `"${team.team_name || ''}"`,
        `"${team.department || ''}"`,
        `"${team.team_lead || ''}"`,
        `"${team.territory || ''}"`,
        team.member_count || 0,
        `"${team.status || 'Inactive'}"`,
        `"${new Date().toLocaleDateString() || ''}"`,
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up download attributes
    link.setAttribute('href', url);
    link.setAttribute('download', `teams-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    // Append to document, trigger download, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditTeam = (team) => {
    // Make sure status is properly set based on the team's active state
    const teamWithFixedStatus = {
      ...team,
      status: team.status || (team.is_active === false ? 'Inactive' : 'Active')
    };
    setEditingTeam(teamWithFixedStatus);
    setShowTeamModal(true);
  };

  const handleViewTeam = async (team) => {
    try {
      setActionLoading(true);
      setError(null); // Clear any previous errors
      
      // Fetch detailed team data
      const response = await teamService.getTeam(team.team_id);
      if (response.success) {
        const detailedTeam = teamService.transformTeamData(response.data);
        
        // Fetch team members with complete user details
        const membersResponse = await teamService.getTeamMembers(team.team_id, { includeDetails: true });
        if (membersResponse.success) {
          // Process member data to include role information from teamusermaps
          const enhancedMembers = membersResponse.data.map(member => {
            return {
              ...member,
              // Ensure role information is included from teamusermaps
              role: member.role || 'Member',
              // Format name for display
              display_name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
              // Add joined date if available
              joined_date: member.joined_date || new Date().toISOString()
            };
          });
          
          detailedTeam.members = enhancedMembers;
          
          // Calculate additional team statistics
          detailedTeam.active_members_count = enhancedMembers.filter(m => m.status === 'Active').length;
          detailedTeam.member_count = enhancedMembers.length;
          
          // Update team stats in UI
          setTeams(prevTeams => 
            prevTeams.map(t => 
              t.team_id === team.team_id 
                ? {...t, member_count: enhancedMembers.length} 
                : t
            )
          );
          
          // Get team activity metrics if available
          try {
            const activityResponse = await teamService.getTeamActivity(team.team_id);
            if (activityResponse.success) {
              detailedTeam.activity = activityResponse.data;
            }
          } catch (activityError) {
            console.warn('Failed to fetch team activity:', activityError.message);
            detailedTeam.activity = { lastActive: new Date().toISOString() };
          }
        } else {
          // If members fetch fails, still show team details but with empty members
          detailedTeam.members = [];
          detailedTeam.member_count = 0;
          detailedTeam.active_members_count = 0;
          console.warn('Failed to fetch team members:', membersResponse.message);
        }

        console.log(`Viewing team with complete details:`, detailedTeam);
        
        setSelectedTeam(detailedTeam);
        setShowTeamDetails(true);
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      setError(`Unexpected error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async (teamIdOrTeam) => {
    // Check if the parameter is a team object or just an ID
    const teamId = typeof teamIdOrTeam === 'object' ? teamIdOrTeam.team_id : teamIdOrTeam;
    const teamName = typeof teamIdOrTeam === 'object' ? teamIdOrTeam.team_name : 
                    teams.find(t => t.team_id === teamId)?.team_name || 'this team';
    
    if (window.confirm(`Are you sure you want to delete team "${teamName}"? This action cannot be undone.`)) {
      try {
        setActionLoading(true);
        setError(null); // Clear any previous errors
        
        const response = await teamService.deleteTeam(teamId);
        if (response.success) {
          alert(response.message);
          // Remove the team from local state to update UI immediately
          setTeams(prevTeams => prevTeams.filter(t => t.team_id !== teamId));
          // Don't refresh teams list as it might bring back the "deleted" team
          // await fetchTeams();
        } else {
          setError(response.message);
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        setError(`Unexpected error: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleFormSubmit = async (teamData) => {
    try {
      setActionLoading(true);
      setError(null); // Clear any previous errors
      
      let response;
      if (editingTeam) {
        // Update existing team
        const backendData = teamService.transformTeamDataForBackend(teamData);
        // Make sure we have a valid team_id
        const teamId = editingTeam._id || editingTeam.team_id;
        console.log("Updating team with ID:", teamId);
        if (!teamId) {
          throw new Error("Missing team ID for update operation");
        }
        response = await teamService.updateTeam(teamId, backendData);
      } else {
        // Create new team
        const backendData = teamService.transformTeamDataForBackend(teamData);
        response = await teamService.createTeam(backendData);
      }
      
      if (response.success) {
        alert(response.message);
        await fetchTeams(); // Refresh the list
        setShowTeamModal(false);
        setEditingTeam(null);
      } else {
        // Handle validation errors
        if (response.error === 'VALIDATION_ERROR' && response.details) {
          const errorMessage = response.details.join('\n');
          alert(`Validation Error:\n${errorMessage}`);
        } else {
          setError(response.message);
        }
      }
    } catch (error) {
      console.error('Error saving team:', error);
      setError(`Unexpected error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      'Suspended': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status] || statusConfig['Inactive']}`}>
        {status}
      </span>
    );
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      'Sales': Users,
      'Marketing': Activity,
      'Customer Support': Users,
      'IT': Building2,
      'HR': Users,
      'Finance': Building2
    };
    const Icon = icons[department] || Building2;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teams Management</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage teams, departments, and team assignments
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button 
            onClick={handleCreateTeam}
            disabled={loading || actionLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            <button 
              className="ml-auto text-red-400 hover:text-red-600"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Teams
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {teams.length}
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
                <Activity className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Teams
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {teams.filter(t => t.status === 'Active').length}
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
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Departments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {new Set(teams.map(t => t.department)).size}
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
                <UserPlus className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Members
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {teams.reduce((sum, team) => sum + team.member_count, 0)}
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
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="loading-container flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading teams...</span>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="empty-state text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No teams found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || filterDepartment !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first team.'}
            </p>
            {!searchTerm && filterDepartment === 'all' && (
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={handleCreateTeam}
                disabled={actionLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Team
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Team Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Territory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTeams.map((team) => (
                  <tr key={team.team_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                            {getDepartmentIcon(team.department)}
                          </div>
                        </div>
                        {console.log(team)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {team.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {team.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getDepartmentIcon(team.department)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {team.department}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {typeof team.team_lead === 'object' ? team.team_lead.name : team.team_lead}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {team.member_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {team.territory}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(team.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewTeam(team)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View Team Details"
                          disabled={actionLoading}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditTeam(team)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Edit Team"
                          disabled={actionLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTeam(team.team_id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete Team"
                          disabled={actionLoading}
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
        )}

        {!loading && filteredTeams.length > 0 && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    ‹
                  </button>
                  {[...Array(Math.min(pagination.pages, 5))].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setPagination(prev => ({ ...prev, page }))}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pagination.page === page
                            ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                            : 'text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-none focus:ring-2 focus:ring-primary-500'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    ›
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals will be added here */}
      {/* Team Form Modal */}
      <TeamForm
        team={editingTeam}
        isOpen={showTeamModal}
        onClose={() => {
          setShowTeamModal(false);
          setEditingTeam(null);
        }}
        onSubmit={(teamData) => {
          handleFormSubmit(teamData);
        }}
        title={editingTeam ? 'Edit Team' : 'Create New Team'}
        dataOptions={formDataOptions}
      />

      {/* Team Details Modal */}
      <TeamDetails
        team={selectedTeam}
        isOpen={showTeamDetails}
        onClose={() => setShowTeamDetails(false)}
        onEdit={(team) => {
          setShowTeamDetails(false);
          setEditingTeam(team);
          setShowTeamModal(true);
        }}
        onDelete={(team) => {
          setShowTeamDetails(false);
          handleDeleteTeam(team);
        }}
      />
    </div>
  );
};

export default TeamsManagement;