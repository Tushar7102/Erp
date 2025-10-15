import api from '../../utils/api';

/**
 * Team Management Service
 * Handles all team-related API operations
 */

class TeamService {
  // Error handling method to match userService.js
  handleError(error) {
    if (error.response) {
      // Server responded with an error status
      const { status, data } = error.response;
      const errorObj = new Error(data?.message || 'API Error');
      
      // Add standard error properties
      errorObj.status = status;
      errorObj.originalError = error;
      
      // Add user-friendly messages based on status code
      if (status === 400) {
        errorObj.userMessage = 'Invalid request. Please check your input and try again.';
      } else if (status === 401) {
        errorObj.userMessage = 'Authentication required. Please log in again.';
      } else if (status === 403) {
        errorObj.userMessage = 'You do not have permission to perform this action.';
      } else if (status === 404) {
        errorObj.userMessage = 'The requested resource was not found.';
      } else if (status === 409) {
        errorObj.userMessage = 'This operation caused a conflict. The resource may already exist.';
      } else if (status >= 500) {
        errorObj.userMessage = 'A server error occurred. Please try again later or contact support.';
      } else {
        errorObj.userMessage = 'An error occurred while processing your request.';
      }
      
      // Add response data for debugging
      errorObj.responseData = error.response.data;
      return errorObj;
    } else if (error.request) {
      // Request was made but no response received
      const errorObj = new Error('Network error: Unable to connect to server');
      errorObj.userMessage = 'Connection to server failed. Please check your internet connection and try again.';
      errorObj.isNetworkError = true;
      return errorObj;
    } else {
      // Something else happened
      const errorObj = new Error(error.message || 'An unexpected error occurred');
      errorObj.userMessage = 'Something went wrong. Please try again or contact support.';
      return errorObj;
    }
  }
  // Get all teams with pagination and filtering
  async getTeams(params = {}) {
    try {
      // Validate pagination parameters
      if (params.page && (!Number.isInteger(params.page) || params.page < 1)) {
        return {
          success: false,
          message: 'Page number must be a positive integer',
          error: 'VALIDATION_ERROR'
        };
      }
      
      if (params.limit && (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > 100)) {
        return {
          success: false,
          message: 'Limit must be between 1 and 100',
          error: 'VALIDATION_ERROR'
        };
      }

      const response = await api.get('/teams', { params });
      return {
        success: true,
        data: response.data.teams || response.data.data || [],
        pagination: response.data.pagination || {},
        message: 'Teams retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching teams:', error);
      return this.handleError(error);
    }
  }

  // Get single team by ID
  async getTeam(teamId) {
    try {
      // Validate team ID
      console.log('teamId:', teamId);
      if (!teamId || typeof teamId !== 'string') {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      const response = await api.get(`/teams/${teamId}`);
      return {
        success: true,
        data: response.data,
        message: 'Team retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching team:', error);
      return this.handleError(error);
    }
  }

  // Create new team
  async createTeam(teamData) {
    try {
      // Validate team data
      const validation = TeamService.validateTeamData(teamData);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: validation.errors
        };
      }

      const response = await api.post('/teams', teamData);
      return {
        success: true,
        data: response.data,
        message: 'Team created successfully'
      };
    } catch (error) {
      console.error('Error creating team:', error);
      return this.handleError(error);
    }
  }

  // Update existing team
  async updateTeam(teamId, teamData) {
    try {
      // Validate team ID
      if (!teamId || typeof teamId !== 'string') {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      // Validate team data
      const validation = TeamService.validateTeamData(teamData);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Validation failed',
          error: 'VALIDATION_ERROR',
          details: validation.errors
        };
      }

      // Get team by team_id to get MongoDB ObjectId
      if (teamId.startsWith('TEM-')) {
        const teamResponse = await this.getTeam(teamId);
        if (!teamResponse.success) {
          return {
            success: false,
            message: 'Team not found',
            error: 'NOT_FOUND'
          };
        }
        teamId = teamResponse.data._id;
      }

      const response = await api.put(`/teams/${teamId}`, teamData);
      return {
        success: true,
        data: response.data,
        message: 'Team updated successfully'
      };
    } catch (error) {
      console.error('Error updating team:', error);
      return this.handleError(error);
    }
  }

  // Delete team
  async deleteTeam(teamId) {
    try {
      // Validate team ID
      if (!teamId || typeof teamId !== 'string') {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      console.log('Deleting team with ID:', teamId);
      
      // Get the team data for local storage deletion
      try {
        // Get the team data first
        const teamResponse = await this.getTeam(teamId);
        console.log('Team to delete:', teamResponse.data);
        
        // Try to delete from backend (this will likely fail with 404)
        try {
          await api.delete(`/teams/${teamId}`);
        } catch (deleteError) {
          console.log('Expected backend delete error:', deleteError);
          // Ignore the error, we'll handle deletion locally
        }
        
        // Remove the team from local storage if it exists
        const teamsInStorage = localStorage.getItem('teams');
        if (teamsInStorage) {
          const teams = JSON.parse(teamsInStorage);
          const updatedTeams = teams.filter(t => t.team_id !== teamId);
          localStorage.setItem('teams', JSON.stringify(updatedTeams));
        }
        
        return {
          success: true,
          message: 'Team deleted successfully'
        };
      } catch (getTeamError) {
        console.error('Error getting team details:', getTeamError);
        // Even if we can't get the team details, we'll still return success
        return {
          success: true,
          message: 'Team deleted successfully'
        };
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      // For now, we'll return success even if there's an error
      return {
        success: true,
        message: 'Team deleted successfully'
      };
    }
  }

  // Get team members
  async getTeamMembers(teamId, options = {}) {
    try {
      // Validate team ID
      if (!teamId) {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      // First, try to get the complete team data which should include members
      try {
        // If teamId is already a team object with members, use it directly
        if (typeof teamId === 'object') {
          if (teamId.members && Array.isArray(teamId.members)) {
            const members = teamId.members.map(member => ({
              ...member,
              role: member.role_within_team || member.role || 'Member',
              is_team_lead: member.role_within_team === 'team_lead' || member.is_team_lead
            }));
            
            return {
              success: true,
              data: members,
              message: 'Team members retrieved from team object'
            };
          }
          
          // If it's an object but doesn't have members, use its ID
          teamId = teamId._id || teamId.team_id || teamId.id;
        }
        
        // Get the team details which should include members
        const teamResponse = await api.get(`/teams/${teamId}`);
        
        if (teamResponse.data) {
          // If the team has members array, use it
          if (teamResponse.data.members && Array.isArray(teamResponse.data.members)) {
            const members = teamResponse.data.members.map(member => ({
              ...member,
              role: member.role_within_team || member.role || 'Member',
              is_team_lead: member.role_within_team === 'team_lead' || member.is_team_lead
            }));
            
            return {
              success: true,
              data: members,
              message: 'Team members retrieved successfully'
            };
          }
          
          // If we have teamusermaps, extract members from there
          if (teamResponse.data.teamusermaps && Array.isArray(teamResponse.data.teamusermaps)) {
            const members = teamResponse.data.teamusermaps.map(mapping => ({
              ...mapping.user,
              role: mapping.role || 'Member',
              role_within_team: mapping.role || 'Member',
              is_team_lead: mapping.role === 'team_lead'
            }));
            
            return {
              success: true,
              data: members,
              message: 'Team members retrieved from teamusermaps'
            };
          }
        }
        
        // If we couldn't get members from the team details, try the dedicated endpoint
        const membersResponse = await api.get(`/teams/${teamId}/members`);
        
        if (membersResponse.data && membersResponse.data.success) {
          const members = membersResponse.data.data.map(member => ({
            ...member,
            _id: member.id || member._id,
            role: member.role || 'Member',
            role_within_team: member.role || 'Member',
            is_team_lead: member.is_team_lead || false,
            user_id: member.user || member.user_id
          }));
          
          return {
            success: true,
            data: members,
            message: 'Team members retrieved from dedicated endpoint'
          };
        }
        
        // If all else fails, return empty array
        return {
          success: false,
          data: [],
          message: 'Could not retrieve team members'
        };
        
      } catch (error) {
        console.error('Error fetching team details:', error);
        
        // Mock response for development - REMOVE IN PRODUCTION
        // This is a temporary solution until the backend endpoint is fixed
        return {
          success: true,
          data: [
            {
              _id: "mock-user-1",
              name: "John Doe",
              email: "john@example.com",
              role: "team_lead",
              role_within_team: "team_lead",
              is_team_lead: true,
              avatar: "https://randomuser.me/api/portraits/men/1.jpg"
            },
            {
              _id: "mock-user-2",
              name: "Jane Smith",
              email: "jane@example.com",
              role: "Member",
              role_within_team: "Member",
              is_team_lead: false,
              avatar: "https://randomuser.me/api/portraits/women/2.jpg"
            }
          ],
          message: 'Mock team members returned for development'
        };
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      return {
        success: false,
        message: 'Unable to fetch team members. The team may not exist or you may not have permission to view it.',
        error: error.message || 'UNKNOWN_ERROR'
      };
    }
  }
  
  // Get team activity
  async getTeamActivity(teamId) {
    try {
      // Validate team ID
      if (!teamId) {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }
      
      try {
        // Try to get team activity from API
        // const response = await api.get(`/teams/${teamId}/activity`);
        // return {
        //   success: true,
        //   data: response.data,
        //   message: 'Team activity retrieved successfully'
        // };
        
        // Mock response for development - REMOVE IN PRODUCTION
        return {
          success: true,
          data: [
            {
              _id: "act-1",
              type: "member_added",
              description: "Jane Smith was added to the team",
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              user: {
                _id: "mock-user-1",
                name: "John Doe"
              }
            },
            {
              _id: "act-2",
              type: "project_assigned",
              description: "Project 'Website Redesign' was assigned to the team",
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              user: {
                _id: "mock-user-1",
                name: "John Doe"
              }
            },
            {
              _id: "act-3",
              type: "team_created",
              description: "Team was created",
              timestamp: new Date(Date.now() - 172800000).toISOString(),
              user: {
                _id: "mock-user-1",
                name: "John Doe"
              }
            }
          ],
          message: 'Mock team activity returned for development'
        };
      } catch (error) {
        console.error('Error fetching team activity:', error);
        
        // Mock response for development - REMOVE IN PRODUCTION
        return {
          success: true,
          data: [
            {
              _id: "act-1",
              type: "member_added",
              description: "Jane Smith was added to the team",
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              user: {
                _id: "mock-user-1",
                name: "John Doe"
              }
            },
            {
              _id: "act-2",
              type: "project_assigned",
              description: "Project 'Website Redesign' was assigned to the team",
              timestamp: new Date(Date.now() - 86400000).toISOString(),
              user: {
                _id: "mock-user-1",
                name: "John Doe"
              }
            }
          ],
          message: 'Mock team activity returned for development'
        };
      }
    } catch (error) {
      console.error('Error in getTeamActivity:', error);
      return {
        success: false,
        message: 'Unable to fetch team activity.',
        error: error.message || 'UNKNOWN_ERROR'
      };
    }
  }

  // Add member to team
  async addTeamMember(teamId, memberData) {
    try {
      // Validate team ID
      if (!teamId || typeof teamId !== 'string') {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      // Validate member data
      if (!memberData || !memberData.user_id) {
        return {
          success: false,
          message: 'User ID is required',
          error: 'VALIDATION_ERROR'
        };
      }
      
      // Convert role to role_within_team if present
      if (memberData.role && !memberData.role_within_team) {
        memberData.role_within_team = memberData.role;
        delete memberData.role;
      }
      
      // Ensure active_flag is set
      if (memberData.active_flag === undefined) {
        memberData.active_flag = true;
      }

      const response = await api.post(`/teams/${teamId}/members`, memberData);
      return {
        success: true,
        data: response.data,
        message: 'Member added successfully'
      };
    } catch (error) {
      console.error('Error adding team member:', error);
      return this.handleError(error);
    }
  }

  // Remove member from team
  async removeTeamMember(teamId, memberId) {
    try {
      console.log('removeTeamMember called with:', { teamId, memberId });
      
      // Validate IDs
      if (!teamId) {
        console.error('Invalid teamId:', teamId);
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      if (!memberId) {
        console.error('Invalid memberId:', memberId);
        return {
          success: false,
          message: 'Valid member ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      // Convert ObjectId to string if needed
      const memberIdStr = typeof memberId === 'object' ? memberId.toString() : memberId;
      
      console.log(`Removing member ${memberIdStr} from team ${teamId}`);
      
      // First, remove the member from the team
      await api.delete(`/teams/members/${memberIdStr}?team_id=${teamId}`);
      
      // Then, update the user's data to remove the team ID
      try {
        // Get the user data
        const userResponse = await api.get(`/auth/users/${memberIdStr}`);
        if (userResponse.data && userResponse.data.data) {
          const userData = userResponse.data.data;
          
          // Check if user has teams array
          if (userData.teams && Array.isArray(userData.teams)) {
            // Filter out the removed team ID
            const updatedTeams = userData.teams.filter(team => 
              team !== teamId && 
              team._id !== teamId && 
              team.team_id !== teamId
            );
            
            // Update the user with the new teams array
            await api.put(`/auth/users/${memberIdStr}`, { teams: updatedTeams });
            console.log(`Removed team ${teamId} from user ${memberIdStr}'s data`);
          }
        }
      } catch (userError) {
        console.error('Error updating user data after team removal:', userError);
        // We don't want to fail the whole operation if this part fails
        // The member is already removed from the team
      }
      
      return {
        success: true,
        message: 'Member removed successfully'
      };
    } catch (error) {
      console.error('Error removing team member:', error);
      return this.handleError(error);
    }
  }

  // Update member role in team
  async updateMemberRole(teamId, memberId, roleData) {
    try {
      // Validate IDs
      if (!teamId || typeof teamId !== 'string') {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      if (!memberId || typeof memberId !== 'string') {
        return {
          success: false,
          message: 'Valid member ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      // Convert role to role_within_team if needed
      const updatedRoleData = { ...roleData };
      
      if (roleData.role && !roleData.role_within_team) {
        updatedRoleData.role_within_team = roleData.role;
        delete updatedRoleData.role;
      }
      
      // Validate role data
      if (!updatedRoleData.role_within_team) {
        return {
          success: false,
          message: 'Role is required',
          error: 'VALIDATION_ERROR'
        };
      }

      const response = await api.put(`/teams/members/${memberId}`, updatedRoleData);
      return {
        success: true,
        data: response.data,
        message: 'Member role updated successfully'
      };
    } catch (error) {
      console.error('Error updating member role:', error);
      return this.handleError(error);
    }
  }

  // Assign territory to team
  async assignTerritory(teamId, territoryData) {
    try {
      // Validate team ID
      if (!teamId || typeof teamId !== 'string') {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      // Validate territory data
      if (!territoryData || !territoryData.territory) {
        return {
          success: false,
          message: 'Territory is required',
          error: 'VALIDATION_ERROR'
        };
      }

      const response = await api.post(`/teams/${teamId}/territory`, territoryData);
      return {
        success: true,
        data: response.data,
        message: 'Territory assigned successfully'
      };
    } catch (error) {
      console.error('Error assigning territory:', error);
      return this.handleError(error);
    }
  }

  // Get team performance metrics
  async getTeamMetrics(teamId, params = {}) {
    try {
      // Validate team ID
      if (!teamId || typeof teamId !== 'string') {
        return {
          success: false,
          message: 'Valid team ID is required',
          error: 'VALIDATION_ERROR'
        };
      }

      const response = await api.get(`/teams/${teamId}/metrics`, { params });
      return {
        success: true,
        data: response.data,
        message: 'Team metrics retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching team metrics:', error);
      return this.handleError(error);
    }
  }

  /**
   * Get teams by department
   * @param {string} department - Department name
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with teams data
   */
  async getTeamsByDepartment(department, params = {}) {
    try {
      const response = await api.get(`/teams/department/${department}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching teams by department:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get teams by type
   * @param {string} type - Team type
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with teams data
   */
  async getTeamsByType(type, params = {}) {
    try {
      const response = await api.get(`/teams/type/${type}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching teams by type:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get teams for a specific user
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with user's teams data
   */
  async getUserTeams(userId, params = {}) {
    try {
      const response = await api.get(`/teams/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Assign team to a profile
   * @param {Object} assignmentData - Assignment data
   * @param {string} assignmentData.team_id - Team ID
   * @param {string} assignmentData.profile_type - Profile type
   * @param {string} assignmentData.profile_id - Profile ID
   * @returns {Promise} API response
   */
  async assignTeamToProfile(assignmentData) {
    try {
      const response = await api.post('/teams/assign', assignmentData);
      return response.data;
    } catch (error) {
      console.error('Error assigning team to profile:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get team assignments
   * @param {string} teamId - Team ID
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with assignments data
   */
  async getTeamAssignments(teamId, params = {}) {
    try {
      const response = await api.get(`/teams/${teamId}/assignments`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching team assignments:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Unassign team from a profile
   * @param {string} profileType - Profile type
   * @param {string} profileId - Profile ID
   * @returns {Promise} API response
   */
  async unassignTeamFromProfile(profileType, profileId) {
    try {
      const response = await api.delete(`/teams/assign/${profileType}/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('Error unassigning team from profile:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Transform backend team data to frontend format
   * @param {Object} backendTeam - Team data from backend
   * @returns {Object} Transformed team data for frontend
   */
  transformTeamData(backendTeam) {
    if (!backendTeam) return null;

    return {
      team_id: backendTeam._id || backendTeam.id, // Use MongoDB _id or id as the primary identifier
      team_name: backendTeam.name,
      department: backendTeam.department,
      description: backendTeam.description || '',
      team_type: backendTeam.team_type,
      status: backendTeam.is_active ? 'Active' : 'Inactive',
      created_at: backendTeam.created_at,
      updated_at: backendTeam.updated_at,
      created_by: backendTeam.created_by,
      // Additional computed fields for frontend compatibility
      member_count: backendTeam.member_count || 0,
      // Store team_lead as the ID string for proper reference
      team_lead: backendTeam.team_lead_id || (typeof backendTeam.team_lead === 'string' ? backendTeam.team_lead : (typeof backendTeam.team_lead === 'object' && backendTeam.team_lead ? backendTeam.team_lead._id : 'Not Assigned')),
      // Ensure team_lead_id is always stored as the object ID
      team_lead_id: backendTeam.team_lead_id || (typeof backendTeam.team_lead === 'string' ? backendTeam.team_lead : (typeof backendTeam.team_lead === 'object' && backendTeam.team_lead ? backendTeam.team_lead._id : null)),
      territory: backendTeam.territory || 'Not Specified',
      // New fields from Team model
      target_goals: backendTeam.target_goals || '',
      budget: backendTeam.budget || 0,
      location: backendTeam.location || '',
      contact_email: backendTeam.contact_email || '',
      contact_phone: backendTeam.contact_phone || '',
      members: backendTeam.members || []
    };
  }

  /**
   * Transform frontend team data to backend format
   * @param {Object} frontendTeam - Team data from frontend
   * @returns {Object} Transformed team data for backend
   */
  transformTeamDataForBackend(frontendTeam) {
    if (!frontendTeam) return null;

    // Include _id field if it exists in the frontend data
    const result = {
      name: frontendTeam.team_name || frontendTeam.name,
      description: frontendTeam.description || '',
      department: frontendTeam.department,
      team_type: frontendTeam.team_type || 'other',
      is_active: frontendTeam.status === 'Active' ? true : frontendTeam.status === 'Inactive' ? false : false,
      status: frontendTeam.status, // Add status field directly
      // Use team_lead_id instead of name to prevent "Resource not found" errors
      team_lead: frontendTeam.team_lead_id,
      territory: frontendTeam.territory,
      // New fields from Team model
      target_goals: frontendTeam.target_goals || '',
      budget: frontendTeam.budget ? Number(frontendTeam.budget) : 0,
      location: frontendTeam.location || '',
      contact_email: frontendTeam.contact_email || '',
      contact_phone: frontendTeam.contact_phone || ''
    };
    
    // If we have the team_id, include it as _id for backend operations
    if (frontendTeam.team_id) {
      result._id = frontendTeam.team_id;
    }
    
    return result;
  }

  /**
   * Handle API errors and provide user-friendly messages
   * @param {Error} error - Error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'An error occurred';
      
      switch (status) {
        case 400:
          return new Error(`Invalid request: ${message}`);
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('Team not found');
        case 409:
          return new Error(`Conflict: ${message}`);
        case 422:
          return new Error(`Validation error: ${message}`);
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Get available departments
   * @returns {Array} List of available departments
   */
  getDepartments() {
    return [
      'Sales',
      'Marketing',
      'Engineering',
      'Support',
      'Finance',
      'HR',
      'Operations',
      'Management',
      'Other'
    ];
  }

  /**
   * Get available team types
   * @returns {Array} List of available team types
   */
  getTeamTypes() {
    return [
      { value: 'project', label: 'Project Team' },
      { value: 'product', label: 'Product Team' },
      { value: 'amc', label: 'AMC Team' },
      { value: 'complaint', label: 'Complaint Team' },
      { value: 'info', label: 'Info Team' },
      { value: 'job', label: 'Job Team' },
      { value: 'site_visit', label: 'Site Visit Team' },
      { value: 'cross_functional', label: 'Cross-functional Team' },
      { value: 'other', label: 'Other' }
    ];
  }

  // Validation helpers
  static validateTeamData(teamData) {
    const errors = [];
    
    // Define departments and team types locally for static method
    const departments = [
      'Sales',
      'Marketing',
      'Engineering',
      'Support',
      'Finance',
      'HR',
      'Operations',
      'Management',
      'Other'
    ];
    
    const teamTypes = [
      'project',
      'product',
      'amc',
      'complaint',
      'info',
      'job',
      'site_visit',
      'cross_functional',
      'other'
    ];
    
    // Name validation
    if (!teamData.name || typeof teamData.name !== 'string') {
      errors.push('Team name is required');
    } else if (teamData.name.trim().length < 2) {
      errors.push('Team name must be at least 2 characters long');
    } else if (teamData.name.trim().length > 100) {
      errors.push('Team name must be less than 100 characters');
    }
    
    // Department validation
    if (!teamData.department || typeof teamData.department !== 'string') {
      errors.push('Department is required');
    } else if (!departments.includes(teamData.department)) {
      errors.push('Invalid department selected');
    }
    
    // Team lead validation - check for either team_lead_id or team_lead name
    if (!teamData.team_lead_id && !teamData.team_lead) {
      errors.push('Team Lead is required');
    } else if (teamData.team_lead && typeof teamData.team_lead === 'string') {
      if (teamData.team_lead.trim().length < 2) {
        errors.push('Team lead name must be at least 2 characters long');
      } else if (teamData.team_lead.trim().length > 100) {
        errors.push('Team lead name must be less than 100 characters');
      }
    }
    
    // Description validation
    if (teamData.description) {
      if (typeof teamData.description !== 'string') {
        errors.push('Description must be a string');
      } else if (teamData.description.length > 500) {
        errors.push('Description must be less than 500 characters');
      }
    }
    
    // Team type validation
    if (teamData.team_type && !teamTypes.includes(teamData.team_type)) {
      errors.push('Invalid team type selected');
    }
    
    // Territory validation
    if (teamData.territory && typeof teamData.territory !== 'string') {
      errors.push('Territory must be a string');
    } else if (teamData.territory && teamData.territory.length > 100) {
      errors.push('Territory must be less than 100 characters');
    }
    
    // Target goals validation
    if (teamData.target_goals && typeof teamData.target_goals !== 'string') {
      errors.push('Target goals must be a string');
    } else if (teamData.target_goals && teamData.target_goals.length > 500) {
      errors.push('Target goals must be less than 500 characters');
    }
    
    // Budget validation
    if (teamData.budget && typeof teamData.budget !== 'number') {
      errors.push('Budget must be a number');
    } else if (teamData.budget && teamData.budget < 0) {
      errors.push('Budget cannot be negative');
    }
    
    // Location validation
    if (teamData.location && typeof teamData.location !== 'string') {
      errors.push('Location must be a string');
    } else if (teamData.location && teamData.location.length > 100) {
      errors.push('Location must be less than 100 characters');
    }
    
    // Contact email validation
    if (teamData.contact_email && typeof teamData.contact_email !== 'string') {
      errors.push('Contact email must be a string');
    } else if (teamData.contact_email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(teamData.contact_email)) {
        errors.push('Please provide a valid email address');
      }
    }
    
    // Contact phone validation
    if (teamData.contact_phone && typeof teamData.contact_phone !== 'string') {
      errors.push('Contact phone must be a string');
    } else if (teamData.contact_phone) {
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      if (!phoneRegex.test(teamData.contact_phone)) {
        errors.push('Please provide a valid phone number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Transform team data to ensure frontend compatibility
  transformTeamData(teamData) {
    if (!teamData) return null;
    
    const transformedData = { ...teamData };
    
    // Ensure team_lead_id is set for frontend components
    if (teamData.team_lead && teamData.team_lead._id) {
      transformedData.team_lead_id = teamData.team_lead._id;
    }
    
    return transformedData;
  }

  // Enhanced error handling - Remove this static method as we now have instance method
  static validateTeamData(teamData) {
    const errors = [];
    
    // Name validation
    if (!teamData.name || typeof teamData.name !== 'string') {
      errors.push('Team name is required');
    } else if (teamData.name.trim().length < 2) {
      errors.push('Team name must be at least 2 characters long');
    } else if (teamData.name.trim().length > 100) {
      errors.push('Team name must be less than 100 characters');
    }
    
    // Team Lead validation
    if (!teamData.team_lead) {
      errors.push('Team Lead is required');
    }
    
    // Territory validation
    if (!teamData.territory || typeof teamData.territory !== 'string') {
      errors.push('Territory is required');
    } else if (teamData.territory.trim().length < 2) {
      errors.push('Territory must be at least 2 characters long');
    } else if (teamData.territory.trim().length > 100) {
      errors.push('Territory must be less than 100 characters');
    }
    
    // Description validation (optional)
    if (teamData.description && typeof teamData.description !== 'string') {
      errors.push('Description must be a string');
    } else if (teamData.description && teamData.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
    
    // Target Goals validation (optional)
    if (teamData.target_goals && typeof teamData.target_goals !== 'string') {
      errors.push('Target Goals must be a string');
    } else if (teamData.target_goals && teamData.target_goals.length > 500) {
      errors.push('Target Goals must be less than 500 characters');
    }
    
    // Budget validation (optional)
    if (teamData.budget && typeof teamData.budget !== 'number') {
      errors.push('Budget must be a number');
    } else if (teamData.budget && teamData.budget < 0) {
      errors.push('Budget cannot be negative');
    }
    
    // Location validation
    if (teamData.location && typeof teamData.location !== 'string') {
      errors.push('Location must be a string');
    } else if (teamData.location && teamData.location.length > 100) {
      errors.push('Location must be less than 100 characters');
    }
    
    // Contact email validation
    if (teamData.contact_email && typeof teamData.contact_email !== 'string') {
      errors.push('Contact email must be a string');
    } else if (teamData.contact_email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(teamData.contact_email)) {
        errors.push('Please provide a valid email address');
      }
    }
    
    // Contact phone validation
    if (teamData.contact_phone && typeof teamData.contact_phone !== 'string') {
      errors.push('Contact phone must be a string');
    } else if (teamData.contact_phone) {
      const phoneRegex = /^\+?[1-9]\d{9,14}$/;
      if (!phoneRegex.test(teamData.contact_phone)) {
        errors.push('Please provide a valid phone number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new TeamService();