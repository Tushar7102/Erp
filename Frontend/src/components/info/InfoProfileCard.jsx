import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, AlertCircle, Tag, Calendar } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const InfoProfileCard = ({ infoProfile }) => {
  const { isDark } = useTheme();
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'assigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                <Link to={`/info/${infoProfile.info_id}`} className={`hover:text-primary-600 ${isDark ? 'hover:text-primary-400' : ''} transition-colors duration-200`}>
                  {infoProfile.request_type || 'Request'}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                {infoProfile.customer_name || 'Customer Name'}
              </p>
            </div>
          
          <div className="flex space-x-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(infoProfile.priority)}`}>
              {infoProfile.priority || 'Priority'}
            </span>
            
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(infoProfile.status)}`}>
              {infoProfile.status || 'Status'}
            </span>
          </div>
        </div>
        
        <div className="mt-5 grid grid-cols-2 gap-5">
          <div className={`flex items-center text-sm ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-50'} p-2 rounded-md`}>
            <User className={`h-4 w-4 mr-2 ${isDark ? 'text-primary-400' : 'text-primary-500'}`} />
            <span>{infoProfile.assigned_user_name || 'Not Assigned'}</span>
          </div>
          
          <div className={`flex items-center text-sm ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-50'} p-2 rounded-md`}>
            <Tag className={`h-4 w-4 mr-2 ${isDark ? 'text-primary-400' : 'text-primary-500'}`} />
            <span>{infoProfile.request_channel || 'Channel'}</span>
          </div>
          
          <div className={`flex items-center text-sm ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-50'} p-2 rounded-md`}>
            <Calendar className={`h-4 w-4 mr-2 ${isDark ? 'text-primary-400' : 'text-primary-500'}`} />
            <span>{formatDate(infoProfile.created_at) || 'Date'}</span>
          </div>
          
          <div className={`flex items-center text-sm ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-50'} p-2 rounded-md`}>
            <Clock className={`h-4 w-4 mr-2 ${isDark ? 'text-primary-400' : 'text-primary-500'}`} />
            <span>{infoProfile.sla_remaining || 'SLA'}</span>
          </div>
        </div>
      </div>
      
      <div className={`border-t ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'} px-5 py-4 flex justify-between items-center rounded-b-lg`}>
        <div className="flex space-x-2">
          <span className={`text-xs ${isDark ? 'text-gray-300 bg-gray-600' : 'text-gray-600 bg-white'} flex items-center px-2 py-1 rounded-md`}>
            <AlertCircle className={`h-3.5 w-3.5 mr-1.5 ${isDark ? 'text-primary-400' : 'text-primary-500'}`} />
            {infoProfile.responses_count || '0'} Responses
          </span>
        </div>
        
        <Link
          to={`/info/${infoProfile.info_id}`}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${isDark ? 'bg-primary-700 hover:bg-primary-600' : 'bg-primary-600 hover:bg-primary-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200`}
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default InfoProfileCard;