import React, { useState, useEffect } from 'react';
import communicationLogService from '../../services/enquire_management/communicationLogService';
import { toast } from 'react-toastify';

const CommunicationLog = () => {
  // State for communication logs
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enquiryOptions, setEnquiryOptions] = useState([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    communication_type: '',
    enquiry_id: '',
    direction: '',
    start_date: '',
    end_date: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [commForm, setCommForm] = useState({
    communication_type: 'email',
    enquiry_id: '',
    direction: 'outbound',
    subject: '',
    content: '',
    contact_details: {
      name: '',
      email: '',
      phone: ''
    }
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch communication logs on component mount and when filters change
  useEffect(() => {
    fetchCommunicationLogs();
  }, [filters, pagination.page, pagination.limit]);
  
  // Fetch enquiry options on component mount
  useEffect(() => {
    fetchEnquiryOptions();
  }, []);

  // Fetch communication logs from API
  const fetchCommunicationLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare API query parameters
      const queryParams = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      
      const response = await communicationLogService.getAllLogs(queryParams);
      
      if (response.success) {
        // Sort communications by created_at date to ensure proper threading
        const sortedCommunications = (response.data.docs || []).sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        setCommunications(sortedCommunications);
        setPagination(prev => ({
          ...prev,
          total: response.data.totalDocs || 0
        }));
      } else {
        setError('Failed to fetch communication logs');
        toast.error('Failed to fetch communication logs');
      }
    } catch (err) {
      console.error('Error fetching communication logs:', err);
      setError('An error occurred while fetching data');
      toast.error('Failed to load communication logs: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch enquiry options for dropdown
  const fetchEnquiryOptions = async () => {
    try {
      setIsLoadingEnquiries(true);
      // Import the enquiry service
      const enquiryService = (await import('../../services/enquire_management/enquiryService')).default;
      
      // Fetch all enquiries with minimal data for dropdown
      const response = await enquiryService.getEnquiries({
        // Add pagination to get more results
        page: 1,
        limit: 500, // Fetch a larger number to ensure we get all enquiries
        sortBy: 'created_at',
        sortOrder: 'desc',
        forDropdown: true // Flag to indicate this is for dropdown usage
      });
      
      if (response.success) {
        if (Array.isArray(response.data.docs) && response.data.docs.length > 0) {
          setEnquiryOptions(response.data.docs);
          toast.success(`Loaded ${response.data.docs.length} enquiries successfully`);
        } else {
          console.warn('No enquiry options returned from API');
          setEnquiryOptions([]);
          toast.warning('No enquiries found. Please create enquiries first.');
        }
      } else {
        console.error('Failed to fetch enquiry options:', response.message);
        setEnquiryOptions([]);
        toast.error(`Failed to load enquiries: ${response.message}`);
      }
    } catch (err) {
      console.error('Error fetching enquiry options:', err);
      setEnquiryOptions([]);
      toast.error(`Error loading enquiries: ${err.message}`);
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Fetch detailed enquiry data by ID
  const fetchEnquiryDetails = async (enquiryId) => {
    try {
      // Import the enquiry service
      const enquiryService = (await import('../../services/enquire_management/enquiryService')).default;
      
      // Fetch the specific enquiry by ID
      const response = await enquiryService.getEnquiryById(enquiryId);
      
      if (response.success && response.data) {
        console.log('Fetched enquiry details:', response.data);
        return response.data;
      } else {
        console.error('Failed to fetch enquiry details:', response.message);
        toast.error(`Failed to load enquiry details: ${response.message}`);
        return null;
      }
    } catch (err) {
      console.error('Error fetching enquiry details:', err);
      toast.error(`Error loading enquiry details: ${err.message}`);
      return null;
    }
  };

  // Handle form change
  const handleFormChange = async (e) => {
    const { name, value } = e.target;
    
    // Special handling for enquiry_id to auto-populate contact details
    if (name === 'enquiry_id' && value) {
      // First update the enquiry_id in the form
      setCommForm(prev => ({ ...prev, [name]: value }));
      
      // Clear error for this field
      if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
      }
      
      // Fetch the enquiry details to get contact information
      const enquiryDetails = await fetchEnquiryDetails(value);
      
      if (enquiryDetails) {
        // Extract contact details from the enquiry
        const contactName = enquiryDetails.name || '';
        const contactEmail = enquiryDetails.email || '';
        const contactPhone = enquiryDetails.mobile || '';
        
        // Update the form with the contact details
        setCommForm(prev => ({
          ...prev,
          contact_details: {
            ...prev.contact_details,
            name: contactName,
            email: contactEmail,
            phone: contactPhone
          }
        }));
        
        toast.info('Contact details auto-populated from enquiry');
      }
    } else {
      // Handle nested form fields
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setCommForm(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else {
        setCommForm(prev => ({ ...prev, [name]: value }));
      }
      
      // Clear error for this field when user types
      if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  // Handle add communication
  const handleAddCommunication = async () => {
    // Reset form state
    setCommForm({
      communication_type: 'email',
      enquiry_id: '',
      direction: 'outbound',
      subject: '',
      content: '',
      message_content: '', // Added to match backend API
      contact_details: {
        name: '',
        email: '',
        phone: ''
      },
      sender: {
        user_id: null,
        external_contact: null
      },
      recipient: {
        user_id: null,
        external_contact: null
      }
    });
    setFormErrors({});
    
    // First show the modal, then fetch enquiry options
    setShowModal(true);
    
    // Always fetch fresh enquiry options when opening the modal
    // Use setTimeout to ensure modal is rendered before fetching
    setTimeout(async () => {
      try {
        // Import the enquiry service directly to ensure it's loaded
        const enquiryService = (await import('../../services/enquire_management/enquiryService')).default;
        
        setIsLoadingEnquiries(true);
        // Fetch all enquiries with minimal data for dropdown
        const response = await enquiryService.getEnquiries({
          page: 1,
          limit: 500, // Fetch a larger number to ensure we get all enquiries
          sortBy: 'created_at',
          sortOrder: 'desc',
          forDropdown: true // Flag to indicate this is for dropdown usage
        });
        
        if (response.success) {
          if (Array.isArray(response.data.docs) && response.data.docs.length > 0) {
            setEnquiryOptions(response.data.docs);
          } else {
            console.warn('No enquiry options returned from API for modal');
            setEnquiryOptions([]);
            toast.warning('No enquiries found. Please create enquiries first.');
          }
        } else {
          console.error('Failed to fetch enquiry options for modal:', response.message);
          setEnquiryOptions([]);
          toast.error(`Failed to load enquiries: ${response.message}`);
        }
      } catch (error) {
        console.error('Failed to load enquiry options for modal:', error);
        toast.error('Could not load enquiry options. Please try again.');
        setEnquiryOptions([]);
      } finally {
        setIsLoadingEnquiries(false);
      }
    }, 100); // Small delay to ensure modal is rendered
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!commForm.enquiry_id) errors.enquiry_id = 'Enquiry ID is required';
    if (!commForm.message_content) errors.message_content = 'Message content is required';
    
    if (commForm.communication_type === 'email') {
      if (!commForm.subject) errors.subject = 'Subject is required for emails';
      if (!commForm.contact_details.email) errors['contact_details.email'] = 'Email is required';
    }
    
    if (commForm.communication_type === 'sms' || commForm.communication_type === 'whatsapp') {
      if (!commForm.contact_details.phone) errors['contact_details.phone'] = 'Phone number is required';
    }
    
    return errors;
  };

  // Handle save communication
  const handleSaveCommunication = async () => {
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare data for API
      const formData = {
        ...commForm,
        // Ensure message_content is set (API expects this field)
        message_content: commForm.message_content || commForm.content,
        // Set up sender and recipient based on direction
        sender: commForm.direction === 'outbound' 
          ? { user_id: localStorage.getItem('userId') || null } 
          : { external_contact: { 
              name: commForm.contact_details.name,
              email: commForm.contact_details.email,
              phone: commForm.contact_details.phone
            } 
          },
        recipient: commForm.direction === 'inbound'
          ? { user_id: localStorage.getItem('userId') || null }
          : { external_contact: { 
              name: commForm.contact_details.name,
              email: commForm.contact_details.email,
              phone: commForm.contact_details.phone
            } 
          }
      };
      
      // Additional validation based on communication type
      let validationError = null;
      
      // Check if recipient and external_contact exist before validation
      const hasExternalContact = formData.recipient && formData.recipient.external_contact;
      
      if (formData.communication_type === 'email' && !formData.subject) {
        validationError = 'Subject is required for email communications';
      } else if (formData.communication_type === 'email' && 
                (!hasExternalContact || !formData.recipient.external_contact.email)) {
        validationError = 'Recipient email is required for email communications';
      } else if ((formData.communication_type === 'sms' || formData.communication_type === 'whatsapp') && 
                (!hasExternalContact || !formData.recipient.external_contact.phone)) {
        validationError = `Recipient phone number is required for ${formData.communication_type} communications`;
      }
      
      if (validationError) {
        toast.error(validationError);
        setFormErrors(prev => ({
          ...prev,
          ...(formData.communication_type === 'email' && !formData.subject ? { subject: validationError } : {}),
          ...(formData.communication_type === 'email' && (!hasExternalContact || !formData.recipient.external_contact.email) ? 
              { 'contact_details.email': validationError } : {}),
          ...((formData.communication_type === 'sms' || formData.communication_type === 'whatsapp') && 
              (!hasExternalContact || !formData.recipient.external_contact.phone) ? { 'contact_details.phone': validationError } : {})
        }));
        setIsSubmitting(false);
        return;
      }
      
      // Show sending status
      const toastId = toast.info(`Sending ${formData.communication_type}...`, { autoClose: false });
      
      const response = await communicationLogService.createLog(formData);
      
      // Close the sending toast
      toast.dismiss(toastId);
      
      if (response.success) {
        toast.success(`${formData.communication_type.charAt(0).toUpperCase() + formData.communication_type.slice(1)} sent successfully`);
        setShowModal(false);
        // Refresh the list
        fetchCommunicationLogs();
      } else {
        toast.error('Failed to send communication: ' + (response.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error creating communication log:', err);
      toast.error('Failed to save: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter communications based on filters
  const filteredCommunications = communications.filter(comm => {
    return (
      (filters.communication_type === '' || comm.communication_type === filters.communication_type) &&
      (filters.enquiry_id === '' || comm.enquiry_id === filters.enquiry_id)
    );
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Communication Log</h1>
        <button 
          onClick={handleAddCommunication}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          Add Communication
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Communication Type</label>
            <select 
              name="communication_type" 
              value={filters.communication_type} 
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="voice_call">Voice Call</option>
              <option value="video_call">Video Call</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry</label>
            <select 
              name="enquiry_id" 
              value={filters.enquiry_id} 
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All Enquiries</option>
              {enquiryOptions.map(enquiry => (
                <option key={enquiry._id} value={enquiry._id}>{enquiry.enquiry_id}</option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
            <select 
              name="direction" 
              value={filters.direction} 
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Communications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-hidden">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Loading communications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button 
                onClick={fetchCommunicationLogs}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {communications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No communications found
                </div>
              ) : (
                // Group communications by enquiry_id and thread_id to show replies together
                Object.values(communications.reduce((groups, comm) => {
                  // Use enquiry_id as the primary grouping key
                  const enquiryId = typeof comm.enquiry_id === 'object' ? comm.enquiry_id._id : comm.enquiry_id;
                  
                  // Create a thread ID based on subject (for emails) or first message in a sequence
                  let threadKey = enquiryId;
                  if (comm.subject) {
                    // Remove Re:, Fwd: etc. to group related emails
                    const baseSubject = comm.subject.replace(/^(Re|Fwd|FW|RE|FWD):\s*/i, '').trim();
                    threadKey = `${enquiryId}-${baseSubject}`;
                  }
                  
                  if (!groups[threadKey]) {
                    groups[threadKey] = {
                      threadKey,
                      enquiryId,
                      enquiryName: typeof comm.enquiry_id === 'object' ? comm.enquiry_id.enquiry_id : comm.enquiry_id,
                      communications: []
                    };
                  }
                  
                  groups[threadKey].communications.push(comm);
                  return groups;
                }, {})).map(group => (
                  <div key={group.threadKey} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-3 border-b border-gray-200">
                      <h3 className="font-medium">
                        <a href={`/enquiry/${group.enquiryId}`} className="text-indigo-600 hover:text-indigo-900">
                          {group.enquiryName}
                        </a>
                        {group.communications[0].subject && (
                          <span className="ml-2 text-gray-600">
                            - {group.communications[0].subject.replace(/^(Re|Fwd|FW|RE|FWD):\s*/i, '').trim()}
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                      {group.communications.map((comm) => (
                        <div key={comm._id} className={`p-4 ${comm.direction === 'inbound' ? 'bg-gray-50' : 'bg-white'}`}>
                          <div className="flex flex-wrap justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                comm.communication_type === 'email' ? 'bg-blue-100 text-blue-800' : 
                                comm.communication_type === 'whatsapp' ? 'bg-green-100 text-green-800' : 
                                comm.communication_type === 'sms' ? 'bg-purple-100 text-purple-800' :
                                comm.communication_type === 'voice_call' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {comm.communication_type.charAt(0).toUpperCase() + comm.communication_type.slice(1)}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                comm.direction === 'inbound' ? 'bg-indigo-100 text-indigo-800' : 
                                'bg-pink-100 text-pink-800'
                              }`}>
                                {comm.direction.charAt(0).toUpperCase() + comm.direction.slice(1)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(comm.created_at).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            {comm.sender && (
                              <p className="text-sm">
                                <span className="font-medium">From:</span> {
                                  comm.sender.user_id ? 
                                    (typeof comm.sender.user_id === 'object' ? comm.sender.user_id.name : comm.sender.user_id) : 
                                    (comm.sender.external_contact ? comm.sender.external_contact.name : 'Unknown')
                                }
                              </p>
                            )}
                            {comm.recipient && (
                              <p className="text-sm">
                                <span className="font-medium">To:</span> {
                                  comm.recipient.user_id ? 
                                    (typeof comm.recipient.user_id === 'object' ? comm.recipient.user_id.name : comm.recipient.user_id) : 
                                    (comm.recipient.external_contact ? comm.recipient.external_contact.name : 'Unknown')
                                }
                              </p>
                            )}
                            {comm.subject && (
                              <p className="text-sm">
                                <span className="font-medium">Subject:</span> {comm.subject}
                              </p>
                            )}
                            <p className="text-sm">
                              <span className="font-medium">Status:</span> {' '}
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                comm.delivery_status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                comm.delivery_status === 'sent' ? 'bg-blue-100 text-blue-800' : 
                                comm.delivery_status === 'failed' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {comm.delivery_status.charAt(0).toUpperCase() + comm.delivery_status.slice(1)}
                              </span>
                            </p>
                          </div>
                          
                          <div className="bg-white p-3 rounded border border-gray-200 text-gray-700">
                            <p className="whitespace-pre-wrap">{comm.message_content}</p>
                          </div>
                          
                          <div className="mt-2 flex justify-end">
                            <button 
                              onClick={() => communicationLogService.markAsRead(comm._id)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm mr-3"
                            >
                              Mark as Read
                            </button>
                            <button 
                              className="text-indigo-600 hover:text-indigo-900 text-sm mr-3"
                              onClick={() => {
                                // Pre-fill the reply form
                                const replyDirection = comm.direction === 'inbound' ? 'outbound' : 'inbound';
                                const replySubject = comm.subject ? `Re: ${comm.subject}` : '';
                                
                                setCommForm({
                                  communication_type: comm.communication_type,
                                  enquiry_id: typeof comm.enquiry_id === 'object' ? comm.enquiry_id._id : comm.enquiry_id,
                                  direction: replyDirection,
                                  subject: replySubject,
                                  content: '',
                                  message_content: '',
                                  contact_details: {
                                    name: comm.direction === 'inbound' 
                                      ? (comm.sender?.external_contact?.name || '') 
                                      : (comm.recipient?.external_contact?.name || ''),
                                    email: comm.direction === 'inbound' 
                                      ? (comm.sender?.external_contact?.email || '') 
                                      : (comm.recipient?.external_contact?.email || ''),
                                    phone: comm.direction === 'inbound' 
                                      ? (comm.sender?.external_contact?.phone || '') 
                                      : (comm.recipient?.external_contact?.phone || '')
                                  },
                                  sender: {
                                    user_id: null,
                                    external_contact: null
                                  },
                                  recipient: {
                                    user_id: null,
                                    external_contact: null
                                  }
                                });
                                
                                setShowModal(true);
                              }}
                            >
                              Reply
                            </button>
                            <button 
                              className="text-gray-600 hover:text-gray-900 text-sm"
                            >
                              Forward
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Pagination */}
          {!loading && !error && communications.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page === 1 ? 'text-gray-400 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    pagination.page * pagination.limit >= pagination.total ? 'text-gray-400 bg-gray-100' : 'text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button 
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    {/* Page numbers would go here in a more complete implementation */}
                    <button 
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page * pagination.limit >= pagination.total}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        pagination.page * pagination.limit >= pagination.total ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
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
      </div>
      
      {/* Add Communication Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Communication</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Communication Type</label>
                <select 
                  name="communication_type"
                  value={commForm.communication_type}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border ${formErrors.communication_type ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="voice_call">Voice Call</option>
                  <option value="video_call">Video Call</option>
                </select>
                {formErrors.communication_type && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.communication_type}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                <select 
                  name="direction"
                  value={commForm.direction}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border ${formErrors.direction ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
                >
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
                {formErrors.direction && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.direction}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enquiry ID</label>
                <select 
                  name="enquiry_id"
                  value={commForm.enquiry_id}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border ${formErrors.enquiry_id ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
                  disabled={isLoadingEnquiries}
                >
                  <option value="">
                    {isLoadingEnquiries 
                      ? "Loading enquiries..." 
                      : enquiryOptions.length === 0 
                        ? "No enquiries available" 
                        : "Select Enquiry"}
                  </option>
                  {enquiryOptions && enquiryOptions.length > 0 && (
                    enquiryOptions.map(enquiry => (
                      <option key={enquiry._id} value={enquiry._id}>
                        {enquiry.enquiry_id || `Enquiry #${enquiry._id.substring(0, 8)}`}
                      </option>
                    ))
                  )}
                </select>
                {formErrors.enquiry_id && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.enquiry_id}</p>
                )}
                {enquiryOptions.length === 0 && !isLoadingEnquiries && (
                  <button 
                    type="button" 
                    onClick={fetchEnquiryOptions} 
                    className="mt-1 text-xs text-blue-500 hover:text-blue-700"
                  >
                    Refresh enquiry list
                  </button>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input 
                  type="text" 
                  name="contact_details.name"
                  value={commForm.contact_details.name}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border ${formErrors['contact_details.name'] ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
                  placeholder="Contact name"
                />
                {formErrors['contact_details.name'] && (
                  <p className="mt-1 text-xs text-red-500">{formErrors['contact_details.name']}</p>
                )}
              </div>
              
              {(commForm.communication_type === 'email') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    name="contact_details.email"
                    value={commForm.contact_details.email}
                    onChange={handleFormChange}
                    className={`w-full rounded-md border ${formErrors['contact_details.email'] ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
                    placeholder="Email address"
                  />
                  {formErrors['contact_details.email'] && (
                    <p className="mt-1 text-xs text-red-500">{formErrors['contact_details.email']}</p>
                  )}
                </div>
              )}
              
              {(commForm.communication_type === 'sms' || commForm.communication_type === 'whatsapp' || commForm.communication_type === 'voice_call') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    name="contact_details.phone"
                    value={commForm.contact_details.phone}
                    onChange={handleFormChange}
                    className={`w-full rounded-md border ${formErrors['contact_details.phone'] ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
                    placeholder="Phone number"
                  />
                  {formErrors['contact_details.phone'] && (
                    <p className="mt-1 text-xs text-red-500">{formErrors['contact_details.phone']}</p>
                  )}
                </div>
              )}
              
              {commForm.communication_type === 'email' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input 
                    type="text" 
                    name="subject"
                    value={commForm.subject}
                    onChange={handleFormChange}
                    className={`w-full rounded-md border ${formErrors.subject ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
                    placeholder="Email subject"
                  />
                  {formErrors.subject && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.subject}</p>
                  )}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  name="message_content"
                  value={commForm.message_content}
                  onChange={handleFormChange}
                  className={`w-full rounded-md border ${formErrors.message_content ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
                  rows="5"
                  placeholder="Message content"
                ></textarea>
                {formErrors.message_content && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.message_content}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => setShowModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm mr-2"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCommunication}
                className={`${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md text-sm flex items-center`}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Saving...' : 'Save Communication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationLog;