import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InfoActionsList from '../../components/info/InfoActionsList';
import InfoResponseForm from '../../components/info/InfoResponseForm';
import { useTheme } from '../../context/ThemeContext';
import { 
  ChevronLeft, 
  FileText, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare, 
  Paperclip, 
  Download, 
  User, 
  Globe, 
  Tag, 
  BarChart2
} from 'lucide-react';

const InfoProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [infoProfile, setInfoProfile] = useState(null);
  const [actions, setActions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { isDark } = useTheme();

  useEffect(() => {
    // In a real app, this would be replaced with API calls
    const fetchInfoProfileData = async () => {
      try {
        // Mock data for demonstration
        const mockProfile = {
          info_id: id,
          customer_id: 'CUST123',
          customer_name: 'Rahul Sharma',
          request_type: 'Brochure',
          request_channel: 'Website',
          priority: 'High',
          assigned_user_id: 'user1',
          assigned_user_name: 'Priya Patel',
          status: 'Assigned',
          requested_on: '2023-06-15T10:30:00',
          fulfilled_on: null,
          description: 'Customer has requested product brochures for our latest software solutions.',
          email: 'rahul.sharma@example.com',
          phone: '+91 98765 43210',
        };

        const mockActions = [
          {
            id: 'act1',
            action_type: 'Request Created',
            description: 'Information request created via website form',
            user_name: 'System',
            created_at: '2023-06-15T10:30:00',
          },
          {
            id: 'act2',
            action_type: 'Request Assigned',
            description: 'Assigned to Priya Patel from Marketing department',
            user_name: 'Admin',
            created_at: '2023-06-15T11:15:00',
          },
        ];

        const mockResponses = [
          {
            id: 'resp1',
            response_text: 'Thank you for your interest in our products. We will process your request shortly.',
            user_name: 'System',
            created_at: '2023-06-15T10:31:00',
            sent_via: 'email',
          },
        ];

        const mockAttachments = [];

        // Simulate API delay
        setTimeout(() => {
          setInfoProfile(mockProfile);
          setActions(mockActions);
          setResponses(mockResponses);
          setAttachments(mockAttachments);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Failed to fetch info profile data');
        setLoading(false);
      }
    };

    fetchInfoProfileData();
  }, [id]);

  const handleSubmitResponse = async (formData) => {
    // In a real app, this would send the data to an API
    try {
      // Mock response submission
      const newResponse = {
        id: `resp${responses.length + 1}`,
        response_text: formData.get('response'),
        user_name: 'Current User',
        created_at: new Date().toISOString(),
        sent_via: formData.get('sendVia'),
      };

      setResponses([...responses, newResponse]);

      // If there are files, add them to attachments
      if (formData.getAll('attachments').length > 0) {
        const newAttachments = formData.getAll('attachments').map((file, index) => ({
          id: `att${attachments.length + index + 1}`,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: 'Current User',
          created_at: new Date().toISOString(),
        }));

        setAttachments([...attachments, ...newAttachments]);
      }

      // Add a new action for the response
      const newAction = {
        id: `act${actions.length + 1}`,
        action_type: 'Response Sent',
        description: `Response sent via ${formData.get('sendVia')}`,
        user_name: 'Current User',
        created_at: new Date().toISOString(),
      };

      setActions([...actions, newAction]);

      return true;
    } catch (error) {
      console.error('Error submitting response:', error);
      return false;
    }
  };

  const handleStatusChange = (newStatus) => {
    setInfoProfile({
      ...infoProfile,
      status: newStatus,
      fulfilled_on: newStatus === 'Fulfilled' || newStatus === 'Closed' ? new Date().toISOString() : infoProfile.fulfilled_on,
    });

    // Add a new action for the status change
    const newAction = {
      id: `act${actions.length + 1}`,
      action_type: 'Status Changed',
      description: `Status changed to ${newStatus}`,
      user_name: 'Current User',
      created_at: new Date().toISOString(),
    };

    setActions([...actions, newAction]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !infoProfile) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error || 'Info profile not found'}</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/info-profiles')}
            className={`mr-4 p-2 rounded-full ${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-colors duration-200 shadow-sm`}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {infoProfile.request_type} - assign
          </h1>
          <div className="ml-auto flex space-x-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              infoProfile.status === 'New' ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800' :
              infoProfile.status === 'Assigned' ? isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-800' :
              infoProfile.status === 'Fulfilled' ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800' :
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
            }`}>
              {infoProfile.status}
            </span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              infoProfile.priority === 'High' ? isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800' :
              infoProfile.priority === 'Medium' ? isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-800' :
              isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
            }`}>
              {infoProfile.priority}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'overview'
                  ? isDark 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-blue-500 text-blue-600'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'actions'
                  ? isDark 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-blue-500 text-blue-600'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Actions
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'responses'
                  ? isDark 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-blue-500 text-blue-600'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Responses
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'attachments'
                  ? isDark 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-blue-500 text-blue-600'
                  : isDark
                    ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Attachments
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg p-6 mb-6 border`}>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Request Information */}
              <div>
                <div className="flex items-center mb-6">
                  <div className={`p-3 rounded-lg mr-4 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                    <FileText className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Request Information
                  </h2>
                </div>
                
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Request Type</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.request_type}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Request Channel</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.request_channel}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Requested On</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(infoProfile.requested_on).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {infoProfile.fulfilled_on && (
                    <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fulfilled On</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(infoProfile.fulfilled_on).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={`mt-6 p-5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Description</p>
                  <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.description}</p>
                </div>
              </div>
              
              {/* Customer Information */}
              <div>
                <div className="flex items-center mb-6">
                  <div className={`p-3 rounded-lg mr-4 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                    <Users className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Customer Information
                  </h2>
                </div>
                
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customer ID</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.customer_id}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customer Name</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.customer_name}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.email}</p>
                    </div>
                  </div>
                  
                  <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <div className="flex items-center mb-6">
                    <div className={`p-3 rounded-lg mr-4 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                      <User className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Assignment
                    </h2>
                  </div>
                  
                  <div className={`p-5 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assigned To</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {infoProfile.assigned_user_name || 'Not Assigned'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <InfoActionsList actions={actions} />
          )}

          {activeTab === 'responses' && (
            <div>
              {responses.length === 0 ? (
                <div className={`text-center py-8 rounded-xl shadow-md ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                  <div className={`p-3 rounded-full mx-auto mb-3 w-16 h-16 flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <MessageSquare className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-500'} opacity-70`} />
                  </div>
                  <p className="font-medium">No responses yet</p>
                </div>
              ) : (
                <div className={`rounded-xl shadow-lg overflow-hidden mb-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                  <div className={`px-5 py-4 border-b flex items-center ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                      <MessageSquare className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Responses</h3>
                  </div>
                  <ul className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {responses.map((response) => (
                      <li key={response.id} className={`p-5 ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                        <div className="flex space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`h-10 w-10 rounded-full ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'} flex items-center justify-center`}>
                              <span className="font-medium">{response.user_name.charAt(0)}</span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{response.user_name}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                response.sent_via === 'Internal' 
                                  ? isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                  : response.sent_via === 'Email'
                                    ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                                    : isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'
                              }`}>
                                {response.sent_via}
                              </span>
                            </div>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(response.created_at).toLocaleString()}
                            </p>
                            <div className={`mt-3 text-sm p-3 rounded-lg ${
                              isDark ? 'bg-gray-700/50 text-gray-200' : 'bg-gray-50 text-gray-700'
                            }`}>
                              <p>{response.response_text}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <InfoResponseForm infoId={infoProfile.info_id} onSubmit={handleSubmitResponse} />
            </div>
          )}

          {activeTab === 'attachments' && (
            <div>
              {attachments.length === 0 ? (
                <div className={`text-center py-8 rounded-lg ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <Paperclip className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No attachments yet</p>
                </div>
              ) : (
                <div className={`${isDark ? 'bg-gray-700/50' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
                  <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Attachments</h3>
                  </div>
                  <ul className={`divide-y ${isDark ? 'divide-gray-600' : 'divide-gray-200'}`}>
                    {attachments.map((attachment) => (
                      <li key={attachment.id} className="px-4 py-4 flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className={`p-2 rounded-md ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            <FileText className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{attachment.file_name}</p>
                          <div className={`mt-1 flex items-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>{(attachment.file_size / 1024).toFixed(2)} KB</span>
                            <span className="mx-1">•</span>
                            <span>Uploaded by: {attachment.uploaded_by}</span>
                            <span className="mx-1">•</span>
                            <span>{new Date(attachment.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${
                            isDark 
                              ? 'border-gray-600 text-blue-400 hover:bg-gray-700' 
                              : 'border-gray-300 text-blue-600 hover:bg-gray-50'
                          } transition-colors duration-200`}>
                            <Download className="h-4 w-4 mr-1.5" />
                            Download
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Update */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg p-6 border`}>
          <div className="flex items-center mb-6">
            <div className={`p-3 rounded-lg mr-4 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <BarChart2 className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Update Status
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {infoProfile.status !== 'New' && (
              <button
                onClick={() => handleStatusChange('New')}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isDark 
                    ? 'bg-blue-900/20 text-blue-300 hover:bg-blue-900/30 border border-blue-800' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                New
              </button>
            )}
            {infoProfile.status !== 'Assigned' && (
              <button
                onClick={() => handleStatusChange('Assigned')}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isDark 
                    ? 'bg-amber-900/20 text-amber-300 hover:bg-amber-900/30 border border-amber-800' 
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Assigned
              </button>
            )}
            {infoProfile.status !== 'Fulfilled' && (
              <button
                onClick={() => handleStatusChange('Fulfilled')}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isDark 
                    ? 'bg-green-900/20 text-green-300 hover:bg-green-900/30 border border-green-800' 
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                }`}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Fulfilled
              </button>
            )}
            {infoProfile.status !== 'Closed' && (
              <button
                onClick={() => handleStatusChange('Closed')}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isDark 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                Closed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoProfileDetail;