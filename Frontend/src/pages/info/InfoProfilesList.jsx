import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import InfoProfileCard from '../../components/info/InfoProfileCard';
import InfoFilterPanel from './components/InfoFilterPanel';
import { useTheme } from '../../context/ThemeContext';

const InfoProfilesList = () => {
  const [infoProfiles, setInfoProfiles] = useState([]);

   const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    requestType: '',
    requestChannel: '',
  });

  useEffect(() => {
    // In a real app, this would be replaced with an API call
    const fetchInfoProfiles = async () => {
      try {
        // Mock data for demonstration
        const mockData = [
          {
            info_id: 'INF001',
            customer_id: 'CUST123',
            request_type: 'Brochure',
            request_channel: 'Website',
            priority: 'High',
            assigned_user_id: 'user1',
            status: 'New',
            requested_on: '2023-06-15T10:30:00',
            fulfilled_on: null,
          },
          {
            info_id: 'INF002',
            customer_id: 'CUST456',
            request_type: 'Invoice Copy',
            request_channel: 'Email',
            priority: 'Medium',
            assigned_user_id: 'user2',
            status: 'Assigned',
            requested_on: '2023-06-14T09:15:00',
            fulfilled_on: null,
          },
          {
            info_id: 'INF003',
            customer_id: 'CUST789',
            request_type: 'Policy',
            request_channel: 'WhatsApp',
            priority: 'Low',
            assigned_user_id: 'user3',
            status: 'Fulfilled',
            requested_on: '2023-06-13T14:45:00',
            fulfilled_on: '2023-06-14T11:30:00',
          },
          {
            info_id: 'INF004',
            customer_id: 'CUST101',
            request_type: 'Catalog',
            request_channel: 'Internal',
            priority: 'High',
            assigned_user_id: 'user1',
            status: 'Closed',
            requested_on: '2023-06-12T16:20:00',
            fulfilled_on: '2023-06-13T10:15:00',
          },
        ];

        // Simulate API delay
        setTimeout(() => {
          setInfoProfiles(mockData);
          setLoading(false);
        }, 500);
      } catch (err) {
        setError('Failed to fetch info profiles');
        setLoading(false);
      }
    };

    fetchInfoProfiles();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const filteredProfiles = infoProfiles.filter((profile) => {
    return (
      (filters.status === '' || profile.status === filters.status) &&
      (filters.priority === '' || profile.priority === filters.priority) &&
      (filters.requestType === '' || profile.request_type === filters.requestType) &&
      (filters.requestChannel === '' || profile.request_channel === filters.requestChannel)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`flex justify-between items-center mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} p-5 rounded-xl shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center">
          <div className={`${isDark ? 'bg-primary-900' : 'bg-primary-100'} p-3 rounded-lg mr-4`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Information Profiles</h1>
        </div>
        <Link
          to="/info/create"
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-150 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Request
        </Link>
      </div>

      {/* Filters */}
      <InfoFilterPanel filters={filters} onFilterChange={handleFilterChange} />

      {/* Info Profiles List */}
      <div className="space-y-4">
        {filteredProfiles.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-xl shadow-lg text-center border`}>
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Results Found</h3>
            <p className="text-gray-500 dark:text-gray-400">No information profiles found matching your filters</p>
            <button 
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-150"
              onClick={() => {
                // Reset all filters
                const resetFilters = Object.keys(filters).reduce((acc, key) => {
                  acc[key] = '';
                  return acc;
                }, {});
                
                // Update filters state
                setFilters(resetFilters);
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <InfoProfileCard key={profile.info_id} infoProfile={profile} />
          ))
        )}
      </div>
    </div>
  );
};

export default InfoProfilesList;