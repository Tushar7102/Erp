import React from 'react';
import { format } from 'date-fns';

const InfoResponsesList = ({ responses }) => {
  if (!responses || responses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No responses found
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Responses</h3>
        <div className="space-y-4">
          {responses.map((response) => (
            <div 
              key={response.id} 
              className="border-l-4 border-blue-500 pl-4 py-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Sent:</span> {format(new Date(response.timestamp), 'dd/MM/yyyy HH:mm')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">By:</span> {response.userId}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Via:</span> {response.sentVia}
                  </p>
                </div>
                {response.attachmentId && (
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                      Attachment
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-gray-800 dark:text-gray-200">{response.message}</p>
              </div>
              {response.attachmentId && (
                <div className="mt-2">
                  <a 
                    href="#" 
                    className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"></path>
                    </svg>
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoResponsesList;