import React from 'react';

const InfoPriorityBadge = ({ priority }) => {
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-orange-100 text-orange-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(priority)}`}>
      {priority}
    </span>
  );
};

export default InfoPriorityBadge;