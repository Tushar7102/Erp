import React from 'react';
import { 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  MessageSquare, 
  FileText, 
  Tag
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const InfoActionsList = ({ actions }) => {
  const { isDark } = useTheme();
  if (!actions || actions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        कोई एक्शन हिस्ट्री नहीं मिली
      </div>
    );
  }

  // Function to get icon based on action type
  const getActionIcon = (type) => {
    switch (type) {
      case 'created':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'assigned':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'status_change':
        return <Tag className="h-5 w-5 text-yellow-500" />;
      case 'response':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'priority_change':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {actions.map((action, actionIdx) => (
          <li key={action.id || actionIdx}>
            <div className="relative pb-8">
              {actionIdx !== actions.length - 1 ? (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                  aria-hidden="true"
                />
              ) : null}
              
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-8 ring-white dark:ring-gray-900">
                    {getActionIcon(action.type)}
                  </div>
                </div>
                
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {action.user_name || 'सिस्टम'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(action.timestamp)}
                    </p>
                  </div>
                  
                  <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {action.type === 'created' && (
                      <p>इन्फो प्रोफाइल बनाई गई</p>
                    )}
                    
                    {action.type === 'assigned' && (
                      <p>
                        <span className="font-medium">{action.assigned_to_name}</span> को असाइन किया गया
                        {action.notes && <span className="block mt-1 italic">"{action.notes}"</span>}
                      </p>
                    )}
                    
                    {action.type === 'status_change' && (
                      <p>
                        स्टेटस <span className="font-medium">{action.previous_status}</span> से{' '}
                        <span className="font-medium">{action.new_status}</span> में बदला गया
                        {action.notes && <span className="block mt-1 italic">"{action.notes}"</span>}
                      </p>
                    )}
                    
                    {action.type === 'priority_change' && (
                      <p>
                        प्राथमिकता <span className="font-medium">{action.previous_priority}</span> से{' '}
                        <span className="font-medium">{action.new_priority}</span> में बदली गई
                      </p>
                    )}
                    
                    {action.type === 'response' && (
                      <p>
                        <span className="font-medium">{action.medium}</span> के माध्यम से प्रतिक्रिया दी गई
                        {action.message && (
                          <span className="block mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                            {action.message}
                          </span>
                        )}
                      </p>
                    )}
                    
                    {action.type === 'completed' && (
                      <p>
                        इन्फो प्रोफाइल पूरी की गई
                        {action.notes && <span className="block mt-1 italic">"{action.notes}"</span>}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InfoActionsList;