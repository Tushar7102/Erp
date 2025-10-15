import React from 'react';
import { differenceInHours, parseISO } from 'date-fns';

const InfoSLAIndicator = ({ requestedOn, priority, status }) => {
  // Calculate SLA based on priority
  const getSLAHours = (priority) => {
    switch (priority) {
      case 'High':
        return 4;
      case 'Medium':
        return 24;
      case 'Low':
        return 48;
      default:
        return 24;
    }
  };

  // Calculate hours elapsed since request
  const calculateHoursElapsed = () => {
    const requestDate = parseISO(requestedOn);
    return differenceInHours(new Date(), requestDate);
  };

  // Get SLA status
  const getSLAStatus = () => {
    if (['Fulfilled', 'Closed'].includes(status)) {
      return 'completed';
    }
    
    const slaHours = getSLAHours(priority);
    const hoursElapsed = calculateHoursElapsed();
    
    if (hoursElapsed >= slaHours) {
      return 'breached';
    } else if (hoursElapsed >= slaHours * 0.75) {
      return 'at-risk';
    } else {
      return 'on-track';
    }
  };

  // Get SLA percentage
  const getSLAPercentage = () => {
    if (['Fulfilled', 'Closed'].includes(status)) {
      return 100;
    }
    
    const slaHours = getSLAHours(priority);
    const hoursElapsed = calculateHoursElapsed();
    const percentage = Math.min(Math.round((hoursElapsed / slaHours) * 100), 100);
    
    return percentage;
  };

  const slaStatus = getSLAStatus();
  const slaPercentage = getSLAPercentage();

  // Get color based on SLA status
  const getColorClass = () => {
    switch (slaStatus) {
      case 'completed':
        return 'bg-green-500';
      case 'on-track':
        return 'bg-green-500';
      case 'at-risk':
        return 'bg-yellow-500';
      case 'breached':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get text based on SLA status
  const getSLAText = () => {
    switch (slaStatus) {
      case 'completed':
        return 'Completed';
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'At Risk';
      case 'breached':
        return 'Deadline Passed';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SLA Status</h3>
      
      <div className="flex items-center mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className={`h-2.5 rounded-full ${getColorClass()}`} 
            style={{ width: `${slaPercentage}%` }}
          ></div>
        </div>
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {slaPercentage}%
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${getColorClass()}`}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getSLAText()}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Priority: {priority} ({getSLAHours(priority)} hours)
        </div>
      </div>
    </div>
  );
};

export default InfoSLAIndicator;