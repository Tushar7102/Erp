import React from 'react';
import { Filter, Check, ChevronDown } from 'react-feather';
import { useTheme } from '../../../context/ThemeContext';

const InfoFilterPanel = ({ filters, onFilterChange }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-5 rounded-xl shadow-lg mb-6 border`}>
      <div className="flex items-center mb-4">
        <Filter className={`h-5 w-5 ${isDark ? 'text-primary-400' : 'text-primary-600'} mr-2`} />
        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Filters</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="relative">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <div className="relative">
            <select
              id="status"
              name="status"
              className={`block w-full rounded-lg ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-700'} py-2.5 px-4 shadow-sm focus:border-primary-500 focus:ring-primary-500 appearance-none`}
              value={filters.status}
              onChange={onFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Priority
          </label>
          <div className="relative">
            <select
              id="priority"
              name="priority"
              className={`block w-full rounded-lg ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-700'} py-2.5 px-4 shadow-sm focus:border-primary-500 focus:ring-primary-500 appearance-none`}
              value={filters.priority}
              onChange={onFilterChange}
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} pointer-events-none`} />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Request Type
          </label>
          <div className="relative">
            <select
              id="requestType"
              name="requestType"
              className={`block w-full rounded-lg ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-700'} py-2.5 px-4 shadow-sm focus:border-primary-500 focus:ring-primary-500 appearance-none`}
              value={filters.requestType}
              onChange={onFilterChange}
            >
              <option value="">All Types</option>
              <option value="Brochure">Brochure</option>
              <option value="Policy">Policy</option>
              <option value="Invoice Copy">Invoice Copy</option>
              <option value="Catalog">Catalog</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} pointer-events-none`} />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="requestChannel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Channel
          </label>
          <div className="relative">
            <select
              id="requestChannel"
              name="requestChannel"
              className={`block w-full rounded-lg ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-50 text-gray-700'} py-2.5 px-4 shadow-sm focus:border-primary-500 focus:ring-primary-500 appearance-none`}
              value={filters.requestChannel}
              onChange={onFilterChange}
            >
              <option value="">All Channels</option>
              <option value="Website">Website</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Internal">Internal</option>
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} pointer-events-none`} />
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button 
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150 flex items-center"
          onClick={() => {
            // Reset all filters
            const resetFilters = Object.keys(filters).reduce((acc, key) => {
              acc[key] = '';
              return acc;
            }, {});
            
            // Call onFilterChange for each filter
            Object.keys(resetFilters).forEach(key => {
              const event = {
                target: {
                  name: key,
                  value: ''
                }
              };
              onFilterChange(event);
            });
          }}
        >
          <Check className="h-4 w-4 mr-2" />
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default InfoFilterPanel;