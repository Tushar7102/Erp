import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import enquiryService from '../../../services/enquire_management/enquiryService';
import userService from '../../../services/user_management/userService';
import taskService from '../../../services/enquire_management/taskService';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'react-hot-toast';
import {  FaUser } from 'react-icons/fa';

const EnquiryDetail = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Status update state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Assignment state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('manual_override');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assigningUser, setAssigningUser] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState(null);
  
  useEffect(() => {
    const fetchEnquiryData = async () => {
      try {
        setLoading(true);
        const data = await enquiryService.getEnquiryById(id);
        setEnquiry(data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load enquiry details');
        setLoading(false);
        console.error('Error fetching enquiry:', err);
      }
    };
    
    fetchEnquiryData();
  }, [id]);
  
  // Fetch tasks related to this enquiry
  useEffect(() => {
    const fetchEnquiryTasks = async () => {
      if (!id) return;
      
      try {
        setTasksLoading(true);
        const response = await taskService.getEnquiryTasks(id);
        
        // Process tasks to ensure user details are properly populated
        const processedTasks = response.data?.map(task => {
          if (task.assigned_to && task.assigned_to._id) {
            // Fetch complete user details if only ID is available
            return userService.getUser(task.assigned_to._id)
              .then(userResponse => {
                return {
                  ...task,
                  assigned_to: {
                    ...task.assigned_to,
                    first_name: userResponse.data.first_name,
                    last_name: userResponse.data.last_name
                  }
                };
              })
              .catch(err => {
                console.error('Error fetching user details:', err);
                return task;
              });
          }
          return Promise.resolve(task);
        }) || [];
        
        // Wait for all user detail fetches to complete
        const tasksWithUserDetails = await Promise.all(processedTasks);
        setTasks(tasksWithUserDetails);
        setTasksLoading(false);
      } catch (err) {
        setTasksError('Failed to load tasks');
        setTasksLoading(false);
        console.error('Error fetching tasks:', err);
      }
    };
    
    if (activeTab === 'tasks') {
      fetchEnquiryTasks();
    }
  }, [id, activeTab]);
  
  // Fetch users for assignment
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userService.getUsers();
      if (response && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
      setLoadingUsers(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
      setLoadingUsers(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    
    try {
      setUpdatingStatus(true);
      const response = await enquiryService.updateEnquiryStatus(id, selectedStatus);
      
      if (response && response.data) {
        // Update the enquiry state with new status
        setEnquiry({...enquiry, status: selectedStatus});
        toast.success('Status updated successfully');
        setShowStatusModal(false);
        setSelectedStatus('');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // Handle user assignment
  const handleAssignUser = async () => {
    // Validate required fields
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }
    
    if (!assignmentReason) {
      toast.error('Please select an assignment reason');
      return;
    }
    
    try {
      setAssigningUser(true);
      
      // Include the new fields in the API call
      const response = await enquiryService.assignEnquiry(
        id, 
        selectedUserId, 
        {
          assignment_reason: assignmentReason,
          remarks: assignmentNote
        }
      );
      
      if (response.success) {
        // If the response contains the full updated enquiry, use it
        if (response.data && response.data.assigned_to) {
          setEnquiry(response.data);
        } else {
          // Otherwise, update the enquiry with the new assignee from our users list
          const assignedUser = users.find(user => user._id === selectedUserId);
          if (assignedUser) {
            setEnquiry({
              ...enquiry, 
              assigned_to: {
                _id: assignedUser._id,
                first_name: assignedUser.first_name,
                last_name: assignedUser.last_name
              }
            });
          }
        }
        
        toast.success('Enquiry assigned successfully');
        setShowAssignModal(false);
        setSelectedUserId('');
        setAssignmentNote('');
        setAssignmentReason('manual_override');
      }
    } catch (err) {
      console.error('Error assigning enquiry:', err);
      toast.error('Failed to assign user');
    } finally {
      setAssigningUser(false);
    }
  };

  // Helper function for date formatting
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`container mx-auto px-4 py-6 ${isDark ? 'text-white' : 'text-black'}`}>
      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-lg p-6 w-full max-w-md`}>
            <h3 className="text-lg font-semibold mb-4">Update Status</h3>
            <select
              className={`w-full p-2 rounded mb-4 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-black'
              }`}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Quoted">Quoted</option>
              <option value="Converted">Converted</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
              <option value="Blocked">Blocked</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Repeat">Repeat</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                className={`px-4 py-2 rounded ${
                  isDark 
                    ? 'bg-gray-600 text-white hover:bg-gray-500' 
                    : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                }`}
                onClick={() => setShowStatusModal(false)}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
              >
                {updatingStatus ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-lg p-6 w-full max-w-md`}>
            <h3 className="text-lg font-semibold mb-4">Assign Enquiry</h3>
            {loadingUsers ? (
              <div className="flex justify-center my-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assign To
                  </label>
                  <select
                    className={`w-full p-2 rounded ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assignment Reason
                  </label>
                  <select
                    className={`w-full p-2 rounded ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                    value={assignmentReason}
                    onChange={(e) => setAssignmentReason(e.target.value)}
                  >
                    <option value="initial_assignment">Initial Assignment</option>
                    <option value="workload_balancing">Workload Balancing</option>
                    <option value="skill_match">Skill Match</option>
                    <option value="escalation">Escalation</option>
                    <option value="user_request">User Request</option>
                    <option value="system_auto">System Auto</option>
                    <option value="manual_override">Manual Override</option>
                    <option value="availability_change">Availability Change</option>
                    <option value="performance_based">Performance Based</option>
                    <option value="geographic_routing">Geographic Routing</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Note
                  </label>
                  <textarea
                    className={`w-full p-2 rounded ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                    placeholder="Add a note about this assignment"
                    rows="3"
                    maxLength="1000"
                  ></textarea>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className={`px-4 py-2 rounded ${
                  isDark 
                    ? 'bg-gray-600 text-white hover:bg-gray-500' 
                    : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                }`}
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignmentNote('');
                  setAssignmentReason('manual_override');
                  setSelectedUserId('');
                }}
                disabled={assigningUser}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={handleAssignUser}
                disabled={assigningUser || loadingUsers}
              >
                {assigningUser ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="mb-4">
        <Link 
          to="/enquiry-management" 
          className={`flex items-center font-medium ${
            isDark 
              ? 'text-white' 
              : 'text-black'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Enquiries
        </Link>
      </div>
      
      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {error && (
        <div className={`${isDark ? 'bg-red-900 border-red-800 text-red-200' : 'bg-red-100 border-red-400 text-red-700'} px-4 py-3 rounded-lg mb-4 border flex items-center`}>
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          <p>{error}</p>
        </div>
      )}
      
      {/* Enquiry Details */}
      {!loading && !error && enquiry && (
        <>
          {/* Header */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md mb-6`}>
            <div className="flex flex-wrap justify-between items-center">
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Enquiry #{enquiry.enquiry_id || enquiry._id}</h1>
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    Type: {enquiry.enquiry_profile || 'N/A'}
                  </span>

                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    Source: {enquiry.source_type || 'N/A'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    enquiry.status === 'NEW' || enquiry.status === 'New' 
                      ? isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                      : enquiry.status === 'IN_PROGRESS' 
                        ? isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                        : enquiry.status === 'CLOSED' 
                          ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                          : isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    Status: {enquiry.status || 'N/A'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    enquiry.priority === 'HIGH'
                      ? isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                      : enquiry.priority === 'MEDIUM'
                        ? isDark ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                        : enquiry.priority === 'LOW'
                          ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                          : isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    Priority: {enquiry.priority || 'N/A'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    Stage: {enquiry.stage || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                {/* Assigned User Display */}
                {enquiry.assigned_to && (
                  <div className={`flex items-center px-3 py-2 ${isDark ? 'bg-indigo-900 text-white' : 'bg-indigo-100 text-indigo-800'} rounded-lg`}>
                    <FaUser className="mr-2" />
                    <div>
                      <span className="text-xs font-semibold block">Assigned To:</span>
                      <span className="font-medium">{enquiry.assigned_to.first_name} {enquiry.assigned_to.last_name}</span>
                    </div>
                  </div>
                )}
                <button 
                  className={`px-4 py-2 rounded-md flex items-center ${
                    isDark 
                      ? 'bg-indigo-700 text-white hover:bg-indigo-600' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={() => {
                    setSelectedStatus(enquiry.status || '');
                    setShowStatusModal(true);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                  Update Status
                </button>
                <button 
                  className={`px-4 py-2 rounded-md flex items-center ${
                    isDark 
                      ? 'bg-indigo-700 text-white hover:bg-indigo-600' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={() => {
                    fetchUsers();
                    setShowAssignModal(true);
                  }}
                  style={{ display: enquiry.assigned_to ? 'none' : 'inline-block' }}
                >
                  <FaUser className="mr-2" />
                  Assign
                </button>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Name</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.name || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.mobile || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.email || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pincode</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.pincode || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>State</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.state || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>District</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.district || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Branch</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.branch || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Created On</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{formatDate(enquiry.created_at)}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Updated On</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{formatDate(enquiry.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Project Information */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>PV Capacity (kW)</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.pv_capacity_kw || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Project Type</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.project_type || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.category || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Connection Type</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.connection_type || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Project Enhancement</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.project_enhancement || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Subsidy Type</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.subsidy_type || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Business Model</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.business_model || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Metering</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.metering || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Need Loan</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.need_loan ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Project Location</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.project_location || 'N/A'}</p>
              </div>
              {enquiry.profile_data && (
                <>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Roof Type</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.profile_data.roof_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Area (sqft)</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{enquiry.profile_data.area_sqft || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enquiry.aadhaar_file && (
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Aadhaar Card</p>
                  <button 
                    onClick={() => handleFileDownload(enquiry.aadhaar_file)}
                    className={`${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline font-medium`}
                  >
                    View/Download
                  </button>
                </div>
              )}
              {enquiry.electricity_bill_file && (
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Electricity Bill</p>
                  <button 
                    onClick={() => handleFileDownload(enquiry.electricity_bill_file)}
                    className={`${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline font-medium`}
                  >
                    View/Download
                  </button>
                </div>
              )}
              {enquiry.bank_statement_file && (
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Bank Statement</p>
                  <button 
                    onClick={() => handleFileDownload(enquiry.bank_statement_file)}
                    className={`${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline font-medium`}
                  >
                    View/Download
                  </button>
                </div>
              )}
              {enquiry.pan_file && (
                <div>
                  <p className="text-sm text-gray-500">PAN Card</p>
                  <button 
                    onClick={() => handleFileDownload(enquiry.pan_file)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    View/Download
                  </button>
                </div>
              )}
              {enquiry.project_proposal_file && (
                <div>
                  <p className="text-sm text-gray-500">Project Proposal</p>
                  <button 
                    onClick={() => handleFileDownload(enquiry.project_proposal_file)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    View/Download
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lead Information */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Lead Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Type of Lead</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.type_of_lead || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Status of Lead</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.status_of_lead || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Source of Lead</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.source_of_lead || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Source of Reference</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.source_of_reference || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Channel Type</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.channel_type || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Priority Score</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.priority_score || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Call Status</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.call_status || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Last Called At</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(enquiry.last_called_at)}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Next Follow Up</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(enquiry.next_follow_up)}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Assigned To</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {enquiry.assigned_to ? 
                    (typeof enquiry.assigned_to === 'object' && enquiry.assigned_to !== null ? 
                      `${enquiry.assigned_to.first_name || ''} ${enquiry.assigned_to.last_name || ''}` : 
                      enquiry.assigned_to) : 
                    'Unassigned'}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Assigned Team</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.assigned_team || 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Is Duplicate</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.is_duplicate ? 'Yes' : 'No'}</p>
              </div>
              {enquiry.duplicate_of && (
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Duplicate Of</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.duplicate_of}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quotation Information */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quotation Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Quotation Amount</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{enquiry.quotation_amount ? enquiry.quotation_amount.toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Quotation Date</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(enquiry.quotation_date)}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Quotation Status</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{enquiry.quotation_status || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md mb-6`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Remarks</h2>
            {enquiry.add_remarks && (
              <div className="mb-4">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Additional Remarks</p>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} whitespace-pre-wrap`}>{enquiry.add_remarks}</p>
              </div>
            )}
            {Array.isArray(enquiry.remarks) && enquiry.remarks.length > 0 ? (
              <div className="space-y-4">
                {enquiry.remarks.map((remark, index) => (
                  <div key={index} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-md`}>
                    <div className="flex justify-between mb-2">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{remark.text}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(remark.timestamp)}</p>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      By: {remark.user_id ? (typeof remark.user_id === 'object' ? remark.user_id.$oid : remark.user_id) : 'Unknown'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No remarks available</p>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow mb-6`}>
            <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <nav className="flex -mb-px overflow-x-auto">
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                      : isDark ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                      : isDark ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('activity')}
                >
                  Activity Timeline
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'tasks'
                      ? isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                      : isDark ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('tasks')}
                >
                  Tasks
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'communication'
                      ? isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                      : isDark ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('communication')}
                >
                  Communication Log
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'calls'
                      ? isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                      : isDark ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('calls')}
                >
                  Calls
                </button>
                <button
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'audit'
                      ? isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'
                      : isDark ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('audit')}
                >
                  Audit Log
                </button>
              </nav>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow p-6`}>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {enquiry.name || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {enquiry.email || 'N/A'}</p>
                      <p><span className="font-medium">Phone:</span> {enquiry.mobile || 'N/A'}</p>
                      <p><span className="font-medium">Location:</span> {enquiry.project_location || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <h3 className="text-lg font-semibold mb-3">Enquiry Details</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">ID:</span> {enquiry.enquiry_id || enquiry._id}</p>
                      <p><span className="font-medium">Type:</span> {enquiry.enquiry_profile || 'N/A'}</p>
                      <p><span className="font-medium">Source:</span> {enquiry.source_type || 'N/A'}</p>
                      <p><span className="font-medium">Created:</span> {formatDate(enquiry.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Activity Timeline</h3>
                {enquiry.activities && enquiry.activities.length > 0 ? (
                  <div className="space-y-4">
                    {enquiry.activities.map((activity, index) => (
                      <div key={index} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{activity.type}</p>
                            <p className="text-sm">{activity.description}</p>
                          </div>
                          <span className="text-xs">{formatDate(activity.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No activity records found.</p>
                )}
              </div>
            )}
            
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Tasks</h3>
                </div>
                {tasksLoading ? (
                  <div className="flex justify-center py-4">
                    <div className={`w-6 h-6 border-2 rounded-full border-t-transparent animate-spin ${isDark ? 'border-white' : 'border-blue-600'}`}></div>
                  </div>
                ) : tasksError ? (
                  <p className="text-red-500">{tasksError}</p>
                ) : tasks && tasks.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {tasks.filter((_, index) => index % 2 === 0).map((task, index) => (
                        <div key={task._id || `left-${index}`} className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-5 rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'} transition-all hover:shadow-md `}>
                          <div className="flex items-start justify-between">
                            <div className="flex-grow">
                              <h4 className={`text-lg font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{task.title}</h4>
                              <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{task.description}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                                  task.status === 'completed' || task.status === 'Completed'
                                    ? isDark ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800 border border-green-200'
                                    : task.status === 'in_progress' || task.status === 'In Progress' 
                                    ? isDark ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {task.status === 'completed' || task.status === 'Completed' ? 
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg> : null
                                  }
                                  {task.status}
                                </span>
                                <span className={`px-3 py-1 text-xs rounded-full flex items-center ${isDark ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                  </svg>
                                  Due: {formatDate(task.due_date)}
                                </span>
                              </div>
                              {task.assigned_to && (
                                <div className={`flex items-center mt-3 pt-2 border-t border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-2">
                                    {task.assigned_to.first_name ? task.assigned_to.first_name.charAt(0) : 
                                     task.assigned_to.email ? task.assigned_to.email.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {task.assigned_to.first_name + " " + task.assigned_to.last_name || task.assigned_to.email || 'Unknown User'}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assignee</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {tasks.filter((_, index) => index % 2 === 1).map((task, index) => (
                        <div key={task._id || `right-${index}`} className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-5 rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-100'} transition-all hover:shadow-md`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-grow">
                              <h4 className={`text-lg font-semibold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{task.title}</h4>
                              <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{task.description}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                                  task.status === 'completed' || task.status === 'Completed'
                                    ? isDark ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800 border border-green-200'
                                    : task.status === 'in_progress' || task.status === 'In Progress' 
                                    ? isDark ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {task.status === 'completed' || task.status === 'Completed' ? 
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg> : null
                                  }
                                  {task.status}
                                </span>
                                <span className={`px-3 py-1 text-xs rounded-full flex items-center ${isDark ? 'bg-blue-800 text-blue-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                  </svg>
                                  Due: {formatDate(task.due_date)}
                                </span>
                              </div>
                              {task.assigned_to && (
                                <div className={`flex items-center mt-3 pt-2 border-t border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-2">
                                    {task.assigned_to.first_name ? task.assigned_to.first_name.charAt(0) : 
                                     task.assigned_to.email ? task.assigned_to.email.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {task.assigned_to.first_name + " " + task.assigned_to.last_name || task.assigned_to.email || 'Unknown User'}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assignee</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No tasks assigned to this enquiry.</p>
                )}
              </div>
            )}
            
            {activeTab === 'communication' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Communication Log</h3>
                {enquiry.communications && enquiry.communications.length > 0 ? (
                  <div className="space-y-4">
                    {enquiry.communications.map((comm, index) => (
                      <div key={index} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{comm.type} - {comm.subject}</p>
                            <p className="text-sm mt-1">{comm.content}</p>
                            <div className="mt-2">
                              <span className="text-xs">From: {comm.from}</span>
                              <span className="text-xs ml-3">To: {comm.to}</span>
                            </div>
                          </div>
                          <span className="text-xs">{formatDate(comm.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No communication records found.</p>
                )}
              </div>
            )}
            
            {activeTab === 'calls' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Calls</h3>
                  <button className={`px-3 py-1 ${isDark ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'} text-white rounded`}>
                    Log Call
                  </button>
                </div>
                {enquiry.calls && enquiry.calls.length > 0 ? (
                  <div className="space-y-3">
                    {enquiry.calls.map((call, index) => (
                      <div key={index} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                call.direction === 'Outgoing' 
                                  ? isDark ? 'bg-blue-400' : 'bg-blue-500' 
                                  : isDark ? 'bg-green-400' : 'bg-green-500'
                              }`}></span>
                              <p className="font-medium">{call.direction} Call - {call.duration} mins</p>
                            </div>
                            <p className="text-sm mt-1">{call.notes}</p>
                            <p className="text-xs mt-2">Agent: {call.agent}</p>
                          </div>
                          <span className="text-xs">{formatDate(call.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No call records found.</p>
                )}
              </div>
            )}
            
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Audit Log</h3>
                {enquiry.audit_logs && enquiry.audit_logs.length > 0 ? (
                  <div className="space-y-3">
                    {enquiry.audit_logs.map((log, index) => (
                      <div key={index} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm mt-1">{log.details}</p>
                            <p className="text-xs mt-2">User: {log.user}</p>
                          </div>
                          <span className="text-xs">{formatDate(log.timestamp)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No audit logs found.</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Handle file download
  const handleFileDownload = (filePath) => {
    if (!filePath) return;
    console.log(`Download file: ${filePath}`);
    // You would typically make an API call to download the file
    // window.open(`/api/files/download?path=${encodeURIComponent(filePath)}`, '_blank');
  };

export default EnquiryDetail;