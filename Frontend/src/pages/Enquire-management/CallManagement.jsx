import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, User, MessageSquare, Check, X, PhoneCall, PhoneOff, PhoneForwarded, AlertCircle } from 'lucide-react';
import callService from '../../services/enquire_management/callManagementService';
import enquiryService from '../../services/enquire_management/enquiryService';
import userService from '../../services/user_management/userService';
import { toast } from 'react-toastify';

const CallManagement = () => {
  // State for call data
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for enquiry data
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  // State for user data
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // State for filters
  const [filters, setFilters] = useState({
    status: '',
    assigned_to: '',
    priority: '',
    date_from: '',
    date_to: ''
  });

  // State for new call form
  const [showNewCallForm, setShowNewCallForm] = useState(false);
  const [newCall, setNewCall] = useState({
    enquiry_id: '',
    customer_name: '',
    phone_number: '',
    scheduled_time: '',
    assigned_to: '',
    priority: 'Medium',
    call_notes: '',
    call_purpose: '',
    start_time: new Date().toISOString().slice(0, 16),
    call_direction: 'inbound',
    call_type: 'voice'
  });

  // Fetch enquiries for dropdown
  const fetchEnquiries = async () => {
    try {
      setLoadingEnquiries(true);
      const response = await enquiryService.getEnquiries();
      setEnquiries(response.data);
      setLoadingEnquiries(false);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      toast.error('Failed to load enquiries');
      setLoadingEnquiries(false);
    }
  };
  
  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.getUsers();
      if (response && response.data) {
        // Transform user data if needed
        const usersList = Array.isArray(response.data) 
          ? response.data 
          : (response.data.docs || []);
        
        // Map users to a consistent format with role information
        const formattedUsers = usersList.map(user => {
          // Extract role information
          let roleName = 'User';
          if (user.role_assignment && user.role_assignment.role_name) {
            roleName = user.role_assignment.role_name;
          } else if (user.role && typeof user.role === 'string') {
            roleName = user.role;
          } else if (user.role && user.role.role_name) {
            roleName = user.role.role_name;
          } else if (user.role_id && typeof user.role_id === 'object' && user.role_id.role_name) {
            roleName = user.role_id.role_name;
          }
          
          return {
            id: user._id || user.user_id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email,
            role: roleName
          };
        });
        
        setUsers(formattedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // State for call details/feedback form
  const [selectedCall, setSelectedCall] = useState(null);
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [callFeedback, setCallFeedback] = useState({
    notes: '',
    feedback: '',
    call_duration: '',
    call_outcome: 'interested'
  });

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Fetch call logs on component mount and when filters change
  useEffect(() => {
    const fetchCallLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Convert filters to API query params
        const params = {
          call_status: filters.status,
          caller_id: filters.assigned_to, // Backend will handle this as caller.user_id
          start_date: filters.date_from,
          end_date: filters.date_to
        };
        
        const response = await callService.getCallLogs(params);
        setCalls(response.data.docs || []);
      } catch (err) {
        setError('Failed to load call logs. Please try again.');
        toast.error('Error loading call logs');
        console.error('Error fetching call logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCallLogs();
    // Fetch enquiries when component mounts
    fetchEnquiries();
    // Fetch users when component mounts
    fetchUsers();
  }, [filters]);

  // Filter calls (client-side filtering for any additional filters not sent to API)
  const filteredCalls = calls.filter(call => {
    const matchesStatus = filters.status === '' || call.call_status === filters.status;
    const matchesAssigned = filters.assigned_to === '' || call.caller_id === filters.assigned_to;
    const matchesPriority = filters.priority === '' || call.priority === filters.priority;
    
    let matchesDateRange = true;
    if (filters.date_from && filters.date_to) {
      const callDate = new Date(call.scheduled_time);
      const fromDate = new Date(filters.date_from);
      const toDate = new Date(filters.date_to);
      matchesDateRange = callDate >= fromDate && callDate <= toDate;
    }
    
    return matchesStatus && matchesAssigned && matchesPriority && matchesDateRange;
  });

  // Validate call data before submission
  const validateCallData = (data) => {
    const errors = {};
    
    if (!data.customer_name) errors.customer_name = 'Customer name is required';
    if (!data.phone_number) errors.phone_number = 'Phone number is required';
    if (!data.scheduled_time) errors.scheduled_time = 'Scheduled time is required';
    if (!data.assigned_to) errors.assigned_to = 'Assigned to is required';
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Handle new call form input change
  const handleNewCallChange = (e) => {
    const { name, value } = e.target;
    setNewCall(prev => ({ ...prev, [name]: value }));
  };

  // Handle call feedback form input change
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setCallFeedback(prev => ({ ...prev, [name]: value }));
  };

  // Save new call
  const handleSaveNewCall = async () => {
    try {
      // Use the service's validation method
      try {
        callService.validateCallData(newCall);
      } catch (validationError) {
        // Show validation errors
        toast.error(validationError.message);
        return;
      }
      
      setLoading(true);
      const response = await callService.createCallLog(newCall);
      
      // Update local state with the new call from API
      setCalls(prev => [...prev, response.data]);
      toast.success('Call scheduled successfully');
      
      // Reset form
      setShowNewCallForm(false);
      setNewCall({
        enquiry_id: '',
        customer_name: '',
        phone_number: '',
        scheduled_time: '',
        assigned_to: '',
        priority: 'Medium',
        call_notes: '',
        call_purpose: '',
        start_time: new Date().toISOString().slice(0, 16),
        call_direction: 'inbound',
        call_type: 'voice'
      });
    } catch (err) {
      toast.error('Failed to schedule call. Please try again.');
      console.error('Error scheduling call:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save call feedback
  const handleSaveCallFeedback = async () => {
    try {
      setLoading(true);
      
      // Validate feedback data
      if (!callFeedback.call_duration) {
        toast.error('Call duration is required');
        return;
      }
      
      // Send feedback to API
      await callService.addCallFeedback(selectedCall.id, callFeedback);
      
      // Update local state
      setCalls(prev => prev.map(call => {
        if (call.id === selectedCall.id) {
          return {
            ...call, 
            status: 'completed',
            notes: callFeedback.notes,
            feedback: callFeedback.feedback,
            call_duration: callFeedback.call_duration,
            call_outcome: callFeedback.call_outcome
          };
        }
        return call;
      }));
      
      toast.success('Call feedback saved successfully');
      
      // Reset form
      setShowCallDetails(false);
      setSelectedCall(null);
      setCallFeedback({
        notes: '',
        feedback: '',
        call_duration: '',
        call_outcome: 'interested'
      });
    } catch (err) {
      toast.error('Failed to save call feedback. Please try again.');
      console.error('Error saving call feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open call details/feedback form
  const handleOpenCallDetails = async (call) => {
    try {
      setLoading(true);
      // Get the latest call details from API
      const callId = call._id || call.id; // Use _id if available, fallback to id
      if (!callId) {
        throw new Error('Call ID is missing');
      }
      const response = await callService.getCallLogById(callId);
      setSelectedCall(response.data);
      
      // Initialize feedback form with existing data if available
      setCallFeedback({
        notes: response.data.notes || '',
        feedback: response.data.feedback || '',
        call_duration: response.data.call_duration || '',
        call_outcome: response.data.call_outcome || 'interested'
      });
      
      setShowCallDetails(true);
    } catch (err) {
      toast.error('Failed to load call details. Please try again.');
      console.error('Error loading call details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    switch(status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get outcome badge class
  const getOutcomeBadge = (outcome) => {
    switch(outcome) {
      case 'interested':
        return 'bg-green-100 text-green-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      case 'call_back':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_reached':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate average call duration
  const calculateAverageCallDuration = (calls) => {
    if (!calls || calls.length === 0) return '00:00:00';
    
    // Convert all durations to seconds
    const totalSeconds = calls.reduce((total, call) => {
      if (!call.call_duration || typeof call.call_duration !== 'string') return total;
      
      const parts = call.call_duration.split(':');
      const hours = parseInt(parts[0] || 0);
      const minutes = parseInt(parts[1] || 0);
      const seconds = parseInt(parts[2] || 0);
      
      return total + (hours * 3600) + (minutes * 60) + seconds;
    }, 0);
    
    // Calculate average
    const avgSeconds = Math.floor(totalSeconds / calls.length);
    
    // Format back to HH:MM:SS
    const hours = Math.floor(avgSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((avgSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = Math.floor(avgSeconds % 60).toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Call Management</h1>
      
      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              name="status" 
              value={filters.status} 
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select 
              name="assigned_to" 
              value={filters.assigned_to} 
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Users</option>
              <option value="1">Amit Kumar</option>
              <option value="2">Neha Singh</option>
              <option value="3">Raj Verma</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select 
              name="priority" 
              value={filters.priority} 
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input 
              type="date" 
              name="date_from" 
              value={filters.date_from} 
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div className="w-full md:w-auto">
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
        
        <div className="flex justify-end">
          <button 
            onClick={() => setShowNewCallForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center"
          >
            <Phone className="h-4 w-4 mr-2" />
            Schedule New Call
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Call List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-500">Loading call data...</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No calls found matching your filters.</p>
          </div>
        ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scheduled Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outcome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCalls.map((call) => (
              <tr key={call._id || call.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {call.call_log_id}
                </td>
                {console.log(call)}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {call.enquiry_id && call.enquiry_id.name ? call.enquiry_id.name : call.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {call.enquiry_id && call.enquiry_id.mobile ? call.enquiry_id.mobile : call.phone_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {call.scheduled_time ? new Date(call.scheduled_time).toLocaleString() : 
                   call.call_start_time ? new Date(call.call_start_time).toLocaleString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {call.caller && call.caller.user_id ? 
                    (call.caller.user_id.first_name ? `${call.caller.user_id.first_name} ${call.caller.user_id.last_name || ''}` : call.caller.user_id.name || 'Unknown') : 
                    call.assigned_to || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${call.priority === 'High' ? 'bg-red-100 text-red-800' : 
                      call.priority === 'Medium' ? 'bg-orange-100 text-orange-800' : 
                      'bg-green-100 text-green-800'}`}>
                    {call.priority || 'Medium'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(call.call_status || call.status)}`}>
                    {(call.call_status || call.status).charAt(0).toUpperCase() + (call.call_status || call.status).slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {call.call_outcome ? (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getOutcomeBadge(call.call_outcome)}`}>
                      {call.call_outcome === 'interested' ? 'Interested' : 
                       call.call_outcome === 'not_interested' ? 'Not Interested' : 
                       call.call_outcome === 'call_back' ? 'Call Back' : 
                       call.call_outcome === 'not_reached' ? 'Not Reached' :
                       call.call_outcome === 'quotation_sent' ? 'Quotation Sent' :
                       call.call_outcome.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Not Available</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleOpenCallDetails(call)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title={(call.call_status || call.status) === 'completed' ? 'View Details' : 'Log Call'}
                    >
                      {(call.call_status || call.status) === 'completed' ? 'View Details' : 'Log Call'}
                    </button>
                    
                    {(call.call_status || call.status) !== 'completed' && (
                      <button className="text-red-600 hover:text-red-900" title="Cancel Call">
                        Cancel
                      </button>
                    )}
                    
                    {call.recording_url && (
                      <button 
                        onClick={() => window.open(call.recording_url, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Listen to Recording"
                      >
                        <PhoneCall className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      
      {/* New Call Modal */}
      {showNewCallForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Schedule New Call</h2>
              <button onClick={() => setShowNewCallForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Enquiry ID</label>
                <select 
                  name="enquiry_id" 
                  value={newCall.enquiry_id} 
                  onChange={async (e) => {
                    const enquiryId = e.target.value;
                    if (enquiryId) {
                      try {
                        // Show loading state
                        setLoadingEnquiries(true);
                        
                        // Fetch detailed enquiry information
                        const response = await enquiryService.getEnquiryById(enquiryId);
                        
                        if (response.success && response.data) {
                          const enquiryData = response.data;
                          
                          // Update the form with detailed information
                          setNewCall(prev => ({
                            ...prev,
                            enquiry_id: enquiryData._id,
                            customer_name: enquiryData.name || '',
                            phone_number: enquiryData.mobile || '',
                            // Add any other fields you want to populate from the enquiry
                          }));
                        } else {
                          toast.error('Failed to fetch enquiry details');
                          handleNewCallChange(e);
                        }
                      } catch (error) {
                        console.error('Error fetching enquiry details:', error);
                        toast.error('Error loading enquiry details');
                        handleNewCallChange(e);
                      } finally {
                        setLoadingEnquiries(false);
                      }
                    } else {
                      // If no enquiry selected (empty value), just update the form normally
                      handleNewCallChange(e);
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  disabled={loadingEnquiries}
                >
                  <option value="">Select Enquiry</option>
                  {enquiries.map(enquiry => (
                    <option key={enquiry._id} value={enquiry._id}>
                      {enquiry.enquiry_id} - {enquiry.name}
                    </option>
                  ))}
                </select>
                {loadingEnquiries && <p className="text-sm text-gray-500 mt-1">Loading enquiries...</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input 
                  type="text" 
                  name="customer_name" 
                  value={newCall.customer_name} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  placeholder="Customer Name"
                  readOnly={newCall.enquiry_id !== ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input 
                  type="text" 
                  name="phone_number" 
                  value={newCall.phone_number} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  placeholder="+91 9876543210"
                  readOnly={newCall.enquiry_id !== ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose <span className="text-red-500 font-medium">*</span></label>
                <input 
                  type="text" 
                  name="call_purpose" 
                  value={newCall.call_purpose} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  placeholder="Call purpose"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label>
                <input 
                  type="datetime-local" 
                  name="scheduled_time" 
                  value={newCall.scheduled_time} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Start Time <span className="text-red-500 font-medium">*</span></label>
                <input 
                  type="datetime-local" 
                  name="start_time" 
                  value={newCall.start_time} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <select 
                  name="assigned_to" 
                  value={newCall.assigned_to} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  disabled={loadingUsers}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                {loadingUsers && <p className="text-sm text-gray-500 mt-1">Loading users...</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Direction <span className="text-red-500 font-medium">*</span></label>
                <select 
                  name="call_direction" 
                  value={newCall.call_direction} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  required
                >
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select 
                  name="priority" 
                  value={newCall.priority} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Type <span className="text-red-500 font-medium">*</span></label>
                <select 
                  name="call_type" 
                  value={newCall.call_type} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  required
                >
                  <option value="voice">Voice</option>
                  <option value="video">Video</option>
                  <option value="conference">Conference</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea 
                  name="call_notes" 
                  value={newCall.call_notes} 
                  onChange={handleNewCallChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm"
                  rows="3"
                  placeholder="Add any pre-call notes here..."
                ></textarea>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-4 relative z-10">
              <button 
                type="button"
                onClick={() => setShowNewCallForm(false)}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveNewCall}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                disabled={loading}
              >
                {loading ? 'Scheduling...' : 'Schedule Call'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Call Details/Feedback Modal */}
      {showCallDetails && selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedCall.status === 'completed' ? 'Call Details' : 'Log Call'}
              </h2>
              <button onClick={() => setShowCallDetails(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedCall.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedCall.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Scheduled Time</p>
                  <p className="font-medium">{new Date(selectedCall.scheduled_time).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{selectedCall.assigned_to}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Duration</label>
                <input 
                  type="text" 
                  name="call_duration" 
                  value={callFeedback.call_duration} 
                  onChange={handleFeedbackChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="00:05:30"
                  disabled={selectedCall.status === 'completed'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Call Outcome</label>
                <select 
                  name="call_outcome" 
                  value={callFeedback.call_outcome} 
                  onChange={handleFeedbackChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  disabled={selectedCall.status === 'completed'}
                >
                  <option value="interested">Interested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="call_back">Call Back</option>
                  <option value="not_reached">Not Reached</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  name="notes" 
                  value={callFeedback.notes} 
                  onChange={handleFeedbackChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows="3"
                  placeholder="Add call notes here..."
                  disabled={selectedCall.status === 'completed'}
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <textarea 
                  name="feedback" 
                  value={callFeedback.feedback} 
                  onChange={handleFeedbackChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows="3"
                  placeholder="Add feedback about the call..."
                  disabled={selectedCall.status === 'completed'}
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowCallDetails(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200"
              >
                {selectedCall.status === 'completed' ? 'Close' : 'Cancel'}
              </button>
              
              {selectedCall.status !== 'completed' && (
                <button 
                  onClick={handleSaveCallFeedback}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Call Log
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Call Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Scheduled Calls</p>
              <p className="text-2xl font-semibold">{calls.filter(c => (c.call_status || c.status) === 'scheduled').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <PhoneForwarded className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Calls</p>
              <p className="text-2xl font-semibold">{calls.filter(c => (c.call_status || c.status) === 'completed').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <PhoneOff className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Missed Calls</p>
              <p className="text-2xl font-semibold">{calls.filter(c => (c.call_status || c.status) === 'missed').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Call Duration</p>
              <p className="text-2xl font-semibold">
                {loading ? '...' : calls.some(c => c.call_duration) ? 
                  calculateAverageCallDuration(calls.filter(c => c.call_duration)) : 
                  '00:00:00'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallManagement;