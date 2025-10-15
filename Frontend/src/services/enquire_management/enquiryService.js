import api from '../../utils/api';

class EnquiryService {
  // Get all enquiries with filters
  async getEnquiries(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters with defaults if not provided
      queryParams.append('page', filters.page || 1);
      queryParams.append('limit', filters.limit || 100); // Get more results by default for dropdowns
      
      // Add filters to query params
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.source_type) queryParams.append('source_type', filters.source_type);
      if (filters.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.enquiry_type) queryParams.append('enquiry_profile', filters.enquiry_type);
      if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom);
      if (filters.dateTo) queryParams.append('date_to', filters.dateTo);
      if (filters.sortBy) queryParams.append('sort', filters.sortBy);
      if (filters.sortOrder) queryParams.append('order', filters.sortOrder);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.slaStatus) queryParams.append('sla_status', filters.slaStatus);
      
      const response = await api.get(`/enquiries?${queryParams.toString()}`);
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid response format: missing data');
      }
      
      // For dropdown usage (CommunicationLog.jsx), return the structured format
      if (filters.forDropdown) {
        return {
          success: true,
          data: {
            docs: response.data.data || response.data.docs || [],
            total: response.data.total || response.data.count || 0,
            page: response.data.page || filters.page || 1,
            limit: response.data.limit || filters.limit || 100
          },
          message: response.data.message || 'Enquiries fetched successfully'
        };
      }
      
      // For EnquiryList.jsx, return the original format that it expects
      return response.data;
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      // Return a structured error response instead of throwing
      if (filters.forDropdown) {
        return {
          success: false,
          data: { docs: [], total: 0, page: 1, limit: 10 },
          message: error.response?.data?.message || error.message || 'Failed to fetch enquiries'
        };
      }
      // For list view, return an empty array to prevent map errors
      return { data: [], total: 0 };
    }
  }
  
  // Get SLA metrics for enquiries
  async getSLAMetrics(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.slaStatus) queryParams.append('sla_status', filters.slaStatus);
      if (filters.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
      if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom);
      if (filters.dateTo) queryParams.append('date_to', filters.dateTo);
      
      // Add aggregation parameter for metrics
      queryParams.append('aggregate', 'sla_metrics');
      
      const response = await api.get(`/enquiries?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'SLA metrics fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching SLA metrics:', error);
      return {
        success: false,
        data: { breached: 0, at_risk: 0, on_track: 0, total: 0 },
        message: error.response?.data?.message || error.message || 'Failed to fetch SLA metrics'
      };
    }
  }
  
  // Get SLA data for enquiries - using standard enquiry endpoint with SLA filters
  async getSLAData(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters with defaults if not provided
      queryParams.append('page', filters.page || 1);
      queryParams.append('limit', filters.limit || 10);
      
      // Add filters
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.slaStatus) queryParams.append('sla_status', filters.slaStatus);
      if (filters.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
      
      // Use the standard enquiries endpoint with SLA filters
      const response = await api.get(`/enquiries?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'SLA data fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching SLA data:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Failed to fetch SLA data'
      };
    }
  }
  
  // Get SLA metrics - using standard enquiry endpoint with aggregation
  async getSLAMetrics(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.slaStatus) queryParams.append('sla_status', filters.slaStatus);
      if (filters.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
      if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom);
      if (filters.dateTo) queryParams.append('date_to', filters.dateTo);
      
      // Add aggregation parameter for metrics
      queryParams.append('aggregate', 'sla_metrics');
      
      const response = await api.get(`/enquiries?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'SLA metrics fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching SLA metrics:', error);
      return {
        success: false,
        data: { breached: 0, at_risk: 0, on_track: 0, total: 0 },
        message: error.response?.data?.message || error.message || 'Failed to fetch SLA metrics'
      };
    }
  }
  
  // Get SLA configuration - using enquiry SLA config endpoint
  async getSLAConfiguration() {
    try {
      const response = await api.get('/enquiries/sla/config');
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'SLA configuration fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching SLA configuration:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to fetch SLA configuration'
      };
    }
  }
  
  // Update SLA configuration - using enquiry SLA config endpoint
  async updateSLAConfiguration(configData) {
    try {
      const response = await api.put('/enquiries/sla/config', configData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'SLA configuration updated successfully'
      };
    } catch (error) {
      console.error('Error updating SLA configuration:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to update SLA configuration'
      };
    }
  }
  
  // Escalate SLA breach - using standard remark endpoint with escalation flag
  async escalateSLABreach(enquiryId, escalationData = {}) {
    try {
      // Add escalation flag to the remark
      const remarkData = {
        text: escalationData.message || 'SLA breach escalated',
        is_escalation: true,
        escalation_level: escalationData.level || 1,
        escalated_to: escalationData.escalatedTo
      };
      
      const response = await api.post(`/enquiries/${enquiryId}/remarks`, remarkData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'SLA breach escalated successfully'
      };
    } catch (error) {
      console.error(`Error escalating SLA breach for enquiry ${enquiryId}:`, error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to escalate SLA breach'
      };
    }
  }
  
  // Update SLA notification settings - using enquiry SLA notifications endpoint
  async updateSLANotificationSettings(settings) {
    try {
      const response = await api.put('/enquiries/sla/notifications', settings);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'SLA notification settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating SLA notification settings:', error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to update SLA notification settings'
      };
    }
  }

  // Get enquiry by ID
  async getEnquiryById(id) {
    try {
      const response = await api.get(`/enquiries/${id}`);
      
      // Return standardized response format
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Enquiry fetched successfully'
      };
    } catch (error) {
      console.error(`Error fetching enquiry ${id}:`, error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || `Failed to fetch enquiry ${id}`
      };
    }
  }

  // Update enquiry status
  async updateEnquiryStatus(id, status, reason = '', remarks = '') {
    try {
      // First get the current status of the enquiry
      const currentEnquiry = await this.getEnquiryById(id);
      const oldStatus = currentEnquiry.data?.status || 'Unknown';
      
      // Update the enquiry status
      const response = await api.put(`/enquiries/${id}/status`, { status });
      
      // Create a status log entry
      try {
        const statusLogService = await import('../enquire_management/statusLogService');
        // Get user ID from localStorage for changed_by field
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = userData._id || '64f8c973f3fa0e9afc2218f7'; // Default admin ID if not found
        
        await statusLogService.default.logStatusChange(
          id,
          oldStatus,
          oldStatus, // old_status_id (using same value as oldStatus for now)
          status,
          status, // new_status_id (using same value as status for now)
          reason,
          remarks,
          userId
        );
      } catch (logError) {
        console.error('Failed to create status log:', logError);
        // Continue with the function even if logging fails
      }
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Status updated successfully'
      };
    } catch (error) {
      console.error(`Error updating enquiry ${id} status:`, error);
      throw error;
    }
  }

  // Assign enquiry
  async assignEnquiry(id, userId, options = {}) {
    try {
      const response = await api.put(`/enquiries/${id}/assign`, { 
        assigned_to: userId,
        assignment_type: 'manual_assignment',
        assignment_method: 'manual',
        assignment_reason: options.assignment_reason || 'manual_override',
        remarks: options.remarks || 'Manual assignment by user'
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Enquiry assigned successfully'
      };
    } catch (error) {
      console.error(`Error assigning enquiry ${id}:`, error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || `Failed to assign enquiry ${id}`
      };
    }
  }

  // Bulk update status
  async bulkUpdateStatus(ids, status, reason = '', remarks = '') {
    try {
      // First get the current status of each enquiry
      const statusLogService = await import('../enquire_management/statusLogService');
      
      // Update all enquiries status
      const response = await api.put('/enquiries/bulk/status', { ids, status });
      
      // Create status logs for each enquiry
      try {
        // For each enquiry, create a status log
        for (const id of ids) {
          try {
            // Get current enquiry to find old status
            const currentEnquiry = await this.getEnquiryById(id);
            const oldStatus = currentEnquiry.data?.status || 'Unknown';
            
            // Get user ID from localStorage for changed_by field
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = userData._id || '64f8c973f3fa0e9afc2218f7'; // Default admin ID if not found
            
            // Log the status change
            await statusLogService.default.logStatusChange(
              id,
              oldStatus,
              oldStatus, // old_status_id (using same value as oldStatus for now)
              status,
              status, // new_status_id (using same value as status for now)
              reason,
              remarks,
              userId
            );
          } catch (logError) {
            console.error(`Failed to create status log for enquiry ${id}:`, logError);
            // Continue with the next enquiry even if logging fails for one
          }
        }
      } catch (logError) {
        console.error('Failed to create status logs:', logError);
        // Continue with the function even if logging fails
      }
      
      return response.data;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      throw error;
    }
  }

  // Bulk assign
  async bulkAssign(ids, userId) {
    try {
      const response = await api.put('/enquiries/bulk/assign', { ids, assigned_to: userId });
      return response.data;
    } catch (error) {
      console.error('Error bulk assigning enquiries:', error);
      throw error;
    }
  }

  // Export enquiries
  async exportEnquiries(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.source_type) queryParams.append('source_type', filters.source_type);
      if (filters.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
      if (filters.dateFrom) queryParams.append('date_from', filters.dateFrom);
      if (filters.dateTo) queryParams.append('date_to', filters.dateTo);
      
      const response = await api.get(`/enquiries/export?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error exporting enquiries:', error);
      throw error;
    }
  }

  // Add remark
  async addRemark(id, remark) {
    try {
      const response = await api.post(`/enquiries/${id}/remarks`, { remark });
      return response.data;
    } catch (error) {
      console.error(`Error adding remark to enquiry ${id}:`, error);
      throw error;
    }
  }

  // Get enquiry remarks
  async getEnquiryRemarks(id) {
    try {
      const response = await api.get(`/enquiries/${id}/remarks`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching remarks for enquiry ${id}:`, error);
      throw error;
    }
  }

  // Get enquiry filters
  async getEnquiryFilters() {
    try {
      const response = await api.get('/enquiries/filters');
      return response.data;
    } catch (error) {
      console.error('Error fetching enquiry filters:', error);
      throw error;
    }
  }

  // Create new enquiry
  async createEnquiry(enquiryData) {
    try {
      const response = await api.post('/enquiries', enquiryData);
      return response.data;
    } catch (error) {
      console.error('Error creating enquiry:', error);
      throw error;
    }
  }

  // Update enquiry
  async updateEnquiry(id, enquiryData) {
    try {
      const response = await api.put(`/enquiries/${id}`, enquiryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating enquiry ${id}:`, error);
      throw error;
    }
  }

  // Delete enquiry
  async deleteEnquiry(id) {
    try {
      const response = await api.delete(`/enquiries/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting enquiry ${id}:`, error);
      throw error;
    }
  }

  // Start call
  async startCall(enquiryId) {
    try {
      const response = await api.post('/enquiries/calls/start', { enquiry_id: enquiryId });
      return response.data;
    } catch (error) {
      console.error(`Error starting call for enquiry ${enquiryId}:`, error);
      throw error;
    }
  }

  // End call
  async endCall(callId, callData) {
    try {
      const response = await api.post('/enquiries/calls/end', { call_id: callId, ...callData });
      return response.data;
    } catch (error) {
      console.error(`Error ending call ${callId}:`, error);
      throw error;
    }
  }

  // Get enquiry calls
  async getEnquiryCalls(enquiryId) {
    try {
      const response = await api.get(`/enquiries/${enquiryId}/calls`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching calls for enquiry ${enquiryId}:`, error);
      throw error;
    }
  }
}

export default new EnquiryService();