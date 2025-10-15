import React from 'react';

const InfoStatusBadge = ({ status }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'Fulfilled':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
};

export default InfoStatusBadge;