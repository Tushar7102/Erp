import React, { useState, useEffect } from 'react';
import taskService from '../../services/enquire_management/taskService';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const TaskManagement = () => {
  const navigate = useNavigate();

  // State for tasks
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isDark } = useTheme();

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    assigned_to: '',
    enquiry_id: '',
    task_type: '',
    priority: '',
    due_date_from: '',
    due_date_to: ''
  });

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    task_type: 'follow_up_call',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
    enquiry_id: '',
    estimated_hours: 1
  });

  // Users and enquiries for dropdowns
  const [users, setUsers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  // Fetch tasks from API with secure error handling
  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Verify authentication before making request
      if (!authService.isAuthenticated()) {
        toast.error("Your session has expired. Please log in again.");
        navigate('/login');
        return;
      }

      const response = await taskService.getTasks({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });

      if (response.success) {
        setTasks(response.data.docs || []);
        setPagination({
          ...pagination,
          total: response.data.totalDocs || 0,
          totalPages: response.data.totalPages || 0
        });
      } else {
        setError('Failed to fetch tasks');
        toast.error('Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      // Handle different error types
      if (err.message?.includes('session has expired')) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to access these tasks.');
        toast.error('Permission denied. Contact your administrator for access.');
      } else {
        setError('Failed to fetch tasks');
        toast.error(err.message || 'Failed to fetch tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      // Verify authentication before making request
      if (!authService.isAuthenticated()) {
        toast.error("Your session has expired. Please log in again.");
        navigate('/login');
        return;
      }

      const response = await authService.getCurrentUser();
      if (response.success) {
        const userResponse = await api.get('/auth/users');
        if (userResponse.data && userResponse.data.success) {
          const userData = userResponse.data.data || [];
          setUsers(userData.map(user => ({
            _id: user._id,
            name: `${user.first_name} ${user.last_name}`
          })));
        } else {
          toast.error('Failed to fetch users');
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    }
  };

  // Fetch enquiries for dropdown
  const fetchEnquiries = async () => {
    try {
      // Verify authentication before making request
      if (!authService.isAuthenticated()) {
        toast.error("Your session has expired. Please log in again.");
        navigate('/login');
        return;
      }

      const response = await api.get('/enquiries');
      if (response.data && response.data.success) {
        const enquiryData = response.data.data || [];
        setEnquiries(enquiryData.map(enquiry => ({
          _id: enquiry._id,
          enquiry_id: enquiry.enquiry_id,
          name: enquiry.name || enquiry.company_name || 'Unnamed Enquiry'
        })));
      } else {
        toast.error('Failed to fetch enquiries');
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      toast.error('Failed to load enquiries');
    }
  };

  // Effect to check authentication and fetch tasks on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (!isAuth) {
        toast.error("You must be logged in to access this page");
        navigate('/login');
        return;
      }

      fetchTasks();
      fetchUsers();
      fetchEnquiries();
    };

    checkAuth();
  }, [navigate]);

  // Effect to reload tasks when filters or pagination change
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [filters, pagination.page, pagination.limit, isAuthenticated]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle add task
  const handleAddTask = () => {
    // Get current user ID for assigned_by
    const currentUser = authService.getStoredUser();

    setTaskForm({
      title: '',
      description: '',
      task_type: 'follow_up_call',
      priority: 'medium',
      due_date: '',
      assigned_to: '',
      enquiry_id: '',
      estimated_hours: 1,
      assigned_by: currentUser?._id || currentUser?.id || req?.user?.id // Add assigned_by field with current user ID
    });
    setShowModal(true);
  };

  // Handle edit task
  const handleEditTask = (task) => {
    // Get current user ID for assigned_by
    const currentUser = authService.getStoredUser();

    setTaskForm({
      _id: task._id,
      title: task.title,
      description: task.description || '',
      task_type: task.task_type || 'follow_up_call',
      priority: task.priority || 'medium',
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      assigned_to: task.assigned_to?._id || '',
      enquiry_id: task.enquiry_id?._id || task.enquiry_id || '',
      estimated_hours: task.estimated_duration || 1,
      assigned_by: currentUser?._id || currentUser?.id // Add assigned_by field with current user ID
    });
    setShowModal(true);
  };

  // Handle save task with security measures
  const handleSaveTask = async () => {
    try {
      // Verify authentication before saving
      if (!authService.isAuthenticated()) {
        toast.error("Your session has expired. Please log in again.");
        navigate('/login');
        return;
      }

      // Validate required fields
      if (!taskForm.title || !taskForm.due_date) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Get current user ID directly from auth service
      const currentUser = authService.getStoredUser();

      // Create a new task data object with assigned_by explicitly set
      const taskData = {
        ...taskForm,
        assigned_by: currentUser?._id || currentUser?.id
      };

      console.log("Task data being sent:", taskData); // Debug log

      let response;
      if (taskForm._id) {
        // Update existing task
        response = await taskService.updateTask(taskForm._id, taskData);
        if (response.success) {
          toast.success('Task updated successfully');
        } else {
          toast.error('Failed to update task');
        }
      } else {
        // Create new task
        response = await taskService.createTask(taskData);
        if (response.success) {
          toast.success('Task created successfully');
        } else {
          toast.error('Failed to create task');
        }
      }

      if (response.success) {
        setShowModal(false);
        fetchTasks(); // Refresh task list
      }
    } catch (err) {
      console.error('Error saving task:', err);
      // Handle different error types
      if (err.message?.includes('session has expired')) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        toast.error('Permission denied. You do not have rights to manage tasks.');
      } else {
        toast.error(err.message || 'Failed to save task');
      }
    }
  };

  // Handle mark as done
  const handleMarkAsDone = async (taskId) => {
    try {
      const response = await taskService.updateTask(taskId, {
        status: 'completed',
        completion_notes: 'Task completed via Task Management interface'
      });

      if (response.success) {
        // Update the task status in the local state
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId
              ? { ...task, status: 'completed' }
              : task
          )
        );
        toast.success('Task marked as completed');
      } else {
        toast.error('Failed to update task status');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error(err.message || 'Failed to update task status');
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className={`container mx-auto px-4 py-6 ${isDark ? 'text-white' : 'text-black'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <button
          onClick={handleAddTask}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className={`${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} p-4 rounded-lg shadow mb-6`}>
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Assigned To</label>
            <select
              name="assigned_to"
              value={filters.assigned_to}
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Enquiry</label>
            <select
              name="enquiry_id"
              value={filters.enquiry_id}
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
            >
              <option value="">All Enquiries</option>
              {enquiries.map(enquiry => (
                <option key={enquiry._id} value={enquiry._id}>
                  {enquiry.enquiry_id} - {enquiry.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Task Type</label>
            <select
              name="task_type"
              value={filters.task_type}
              onChange={handleFilterChange}
              className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2 text-sm`}
            >
              <option value="">All Types</option>
              <option value="follow_up_call">Follow-up Call</option>
              <option value="send_quotation">Send Quotation</option>
              <option value="send_email">Send Email</option>
              <option value="send_sms">Send SMS</option>
              <option value="schedule_meeting">Schedule Meeting</option>
              <option value="site_visit">Site Visit</option>
              <option value="document_collection">Document Collection</option>
              <option value="verification">Verification</option>
              <option value="escalation">Escalation</option>
              <option value="closure">Closure</option>
              <option value="feedback_collection">Feedback Collection</option>
              <option value="payment_follow_up">Payment Follow-up</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
        {loading ? (
          <div className={`p-4 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className={`inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${isDark ? 'border-gray-300' : 'border-gray-900'}`}></div>
            <p className="mt-2">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : tasks.length === 0 ? (
          <div className={`p-4 text-center ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>No tasks found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Task ID
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Enquiry
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Title
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Due Date
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Assigned To
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDark ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                {tasks.map((task) => (
                  <tr key={task._id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {task.task_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a href={`/enquiry/${task.enquiry_id?._id || task.enquiry_id}`} className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'}`}>
                        {task.enquiry_id?.enquiry_id || task.enquiry_id}
                      </a>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      {task.title}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      {task.task_type?.replace(/_/g, ' ')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      {new Date(task.due_date).toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                      {task.assigned_to.first_name + " " + task.assigned_to.last_name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isDark ? (
                          task.status === 'pending' ? 'bg-yellow-800 text-yellow-200' :
                            task.status === 'in_progress' ? 'bg-blue-800 text-blue-200' :
                              task.status === 'completed' ? 'bg-green-800 text-green-200' :
                                task.status === 'cancelled' ? 'bg-gray-800 text-gray-200' :
                                  task.status === 'on_hold' ? 'bg-purple-800 text-purple-200' :
                                    'bg-red-800 text-red-200'
                        ) : (
                          task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                  task.status === 'on_hold' ? 'bg-purple-100 text-purple-800' :
                                    'bg-red-100 text-red-800'
                        )
                        }`}>
                        {task.status?.charAt(0).toUpperCase() + task.status?.slice(1).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditTask(task)}
                        className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'} mr-3`}
                      >
                        Edit
                      </button>
                      {task.status !== 'completed' && task.status !== 'cancelled' && (
                        <button
                          onClick={() => handleMarkAsDone(task._id)}
                          className={`${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-900'}`}
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && tasks.length > 0 && (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} px-4 py-3 flex items-center justify-between border-t sm:px-6`}>
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${isDark
                    ? `border-gray-600 ${pagination.page === 1 ? 'text-gray-500 bg-gray-800' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`
                    : `border-gray-300 ${pagination.page === 1 ? 'text-gray-400 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'}`
                  } ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${isDark
                    ? `border-gray-600 ${pagination.page === pagination.totalPages ? 'text-gray-500 bg-gray-800' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`
                    : `border-gray-300 ${pagination.page === pagination.totalPages ? 'text-gray-400 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'}`
                  } ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span> of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${isDark
                        ? `border-gray-600 bg-gray-700 ${pagination.page === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-600'}`
                        : `border-gray-300 bg-white ${pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`
                      }`}
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {[...Array(pagination.totalPages).keys()].slice(
                    Math.max(0, pagination.page - 3),
                    Math.min(pagination.totalPages, pagination.page + 2)
                  ).map(page => (
                    <button
                      key={page + 1}
                      onClick={() => handlePageChange(page + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border ${isDark
                          ? pagination.page === page + 1
                            ? 'bg-blue-900 border-blue-700 text-blue-200'
                            : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : pagination.page === page + 1
                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        } text-sm font-medium`}
                    >
                      {page + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${isDark
                        ? `border-gray-600 bg-gray-700 ${pagination.page === pagination.totalPages ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-600'}`
                        : `border-gray-300 bg-white ${pagination.page === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`
                      }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className={`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{taskForm._id ? 'Edit Task' : 'Add Task'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-2">
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
                <input
                  type="text"
                  name="title"
                  value={taskForm.title}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  placeholder="Task title"
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={taskForm.due_date}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Assigned To</label>
                <select
                  name="assigned_to"
                  value={taskForm.assigned_to}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Enquiry ID</label>
                <select
                  name="enquiry_id"
                  value={taskForm.enquiry_id}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="">Select Enquiry</option>
                  {enquiries.map(enquiry => (
                    <option key={enquiry._id} value={enquiry._id}>
                      {enquiry.enquiry_id} - {enquiry.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Remarks</label>
                <textarea
                  name="remarks"
                  value={taskForm.remarks}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  rows="3"
                  placeholder="Additional notes"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-md text-sm mr-2 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTask}
                className={`px-4 py-2 rounded-md text-sm hover:bg-blue-700 ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                  }`}
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;