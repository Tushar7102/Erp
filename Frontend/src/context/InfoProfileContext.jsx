import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const InfoProfileContext = createContext();

// Mock data for development
const mockInfoProfiles = [
  {
    id: 'INFO-001',
    customerId: 'CUST-1234',
    requestType: 'Brochure',
    requestChannel: 'Website',
    priority: 'Medium',
    status: 'New',
    requestedOn: '2023-06-15T10:30:00',
    assignedUserId: null,
    description: 'Customer requested product brochure for new machinery line'
  },
  {
    id: 'INFO-002',
    customerId: 'CUST-5678',
    requestType: 'Policy',
    requestChannel: 'Email',
    priority: 'High',
    status: 'Assigned',
    requestedOn: '2023-06-14T09:15:00',
    assignedUserId: 'USER-001',
    description: 'Urgent request for updated policy document'
  },
  {
    id: 'INFO-003',
    customerId: 'CUST-9012',
    requestType: 'Invoice Copy',
    requestChannel: 'WhatsApp',
    priority: 'Low',
    status: 'Fulfilled',
    requestedOn: '2023-06-10T14:45:00',
    assignedUserId: 'USER-002',
    fulfilledOn: '2023-06-12T11:20:00',
    description: 'Copy of invoice #INV-2023-456 requested'
  },
  {
    id: 'INFO-004',
    customerId: 'CUST-3456',
    requestType: 'Catalog',
    requestChannel: 'Internal',
    priority: 'Medium',
    status: 'Closed',
    requestedOn: '2023-06-05T16:30:00',
    assignedUserId: 'USER-003',
    fulfilledOn: '2023-06-07T10:15:00',
    description: 'Complete product catalog for Q2 2023'
  },
  {
    id: 'INFO-005',
    customerId: 'CUST-7890',
    requestType: 'Brochure',
    requestChannel: 'Website',
    priority: 'High',
    status: 'New',
    requestedOn: '2023-06-16T08:45:00',
    assignedUserId: null,
    description: 'Marketing brochure for upcoming product launch'
  }
];

const mockActions = {
  'INFO-001': [
    { id: 'ACT-001', infoId: 'INFO-001', actionType: 'Created', description: 'Info request created', timestamp: '2023-06-15T10:30:00', userId: 'SYSTEM' }
  ],
  'INFO-002': [
    { id: 'ACT-002', infoId: 'INFO-002', actionType: 'Created', description: 'Info request created', timestamp: '2023-06-14T09:15:00', userId: 'SYSTEM' },
    { id: 'ACT-003', infoId: 'INFO-002', actionType: 'Assigned', description: 'Assigned to John Doe', timestamp: '2023-06-14T09:30:00', userId: 'USER-004' }
  ],
  'INFO-003': [
    { id: 'ACT-004', infoId: 'INFO-003', actionType: 'Created', description: 'Info request created', timestamp: '2023-06-10T14:45:00', userId: 'SYSTEM' },
    { id: 'ACT-005', infoId: 'INFO-003', actionType: 'Assigned', description: 'Assigned to Jane Smith', timestamp: '2023-06-10T15:00:00', userId: 'USER-004' },
    { id: 'ACT-006', infoId: 'INFO-003', actionType: 'Document Uploaded', description: 'Invoice copy uploaded', timestamp: '2023-06-12T11:15:00', userId: 'USER-002', attachmentId: 'ATT-001' },
    { id: 'ACT-007', infoId: 'INFO-003', actionType: 'Status Changed', description: 'Status changed to Fulfilled', timestamp: '2023-06-12T11:20:00', userId: 'USER-002' }
  ]
};

const mockResponses = {
  'INFO-002': [
    { id: 'RES-001', infoId: 'INFO-002', message: 'We are working on your request. Will share the policy document soon.', timestamp: '2023-06-14T10:00:00', userId: 'USER-001', sentVia: 'Email' }
  ],
  'INFO-003': [
    { id: 'RES-002', infoId: 'INFO-003', message: 'Please find attached the requested invoice copy.', timestamp: '2023-06-12T11:18:00', userId: 'USER-002', sentVia: 'WhatsApp', attachmentId: 'ATT-001' }
  ]
};

const mockAttachments = {
  'INFO-003': [
    { id: 'ATT-001', infoId: 'INFO-003', fileName: 'Invoice-2023-456.pdf', fileType: 'application/pdf', fileSize: 1024576, fileUrl: '#', uploadedAt: '2023-06-12T11:15:00', uploadedBy: 'USER-002' }
  ]
};

// Provider component
export const InfoProfileProvider = ({ children }) => {
  const [infoProfiles, setInfoProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load mock data on initial render
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInfoProfiles(mockInfoProfiles);
      setLoading(false);
    }, 500);
  }, []);

  // Get a single info profile by ID
  const getInfoProfileById = (id) => {
    return infoProfiles.find(profile => profile.id === id) || null;
  };

  // Get actions for an info profile
  const getInfoProfileActions = (infoId) => {
    return mockActions[infoId] || [];
  };

  // Get responses for an info profile
  const getInfoProfileResponses = (infoId) => {
    return mockResponses[infoId] || [];
  };

  // Get attachments for an info profile
  const getInfoProfileAttachments = (infoId) => {
    return mockAttachments[infoId] || [];
  };

  // Create a new info profile
  const createInfoProfile = (profileData) => {
    const newProfile = {
      id: `INFO-${String(infoProfiles.length + 1).padStart(3, '0')}`,
      ...profileData,
      status: 'New',
      requestedOn: new Date().toISOString(),
    };
    
    setInfoProfiles([...infoProfiles, newProfile]);
    return newProfile;
  };

  // Update info profile status
  const updateInfoProfileStatus = (id, status) => {
    setInfoProfiles(prevProfiles => 
      prevProfiles.map(profile => 
        profile.id === id ? { ...profile, status } : profile
      )
    );
  };

  // Assign info profile to user
  const assignInfoProfile = (id, userId, department) => {
    setInfoProfiles(prevProfiles => 
      prevProfiles.map(profile => 
        profile.id === id ? { ...profile, assignedUserId: userId, status: 'Assigned' } : profile
      )
    );
  };

  // Add response to info profile
  const addInfoProfileResponse = (infoId, responseData) => {
    const newResponse = {
      id: `RES-${Date.now()}`,
      infoId,
      timestamp: new Date().toISOString(),
      ...responseData
    };
    
    if (!mockResponses[infoId]) {
      mockResponses[infoId] = [];
    }
    
    mockResponses[infoId].push(newResponse);
    return newResponse;
  };

  // Filter info profiles
  const filterInfoProfiles = (filters) => {
    return infoProfiles.filter(profile => {
      let match = true;
      
      if (filters.status && profile.status !== filters.status) {
        match = false;
      }
      
      if (filters.priority && profile.priority !== filters.priority) {
        match = false;
      }
      
      if (filters.requestType && profile.requestType !== filters.requestType) {
        match = false;
      }
      
      if (filters.requestChannel && profile.requestChannel !== filters.requestChannel) {
        match = false;
      }
      
      return match;
    });
  };

  const value = {
    infoProfiles,
    loading,
    error,
    getInfoProfileById,
    getInfoProfileActions,
    getInfoProfileResponses,
    getInfoProfileAttachments,
    createInfoProfile,
    updateInfoProfileStatus,
    assignInfoProfile,
    addInfoProfileResponse,
    filterInfoProfiles
  };

  return (
    <InfoProfileContext.Provider value={value}>
      {children}
    </InfoProfileContext.Provider>
  );
};

// Custom hook to use the context
export const useInfoProfile = () => {
  const context = useContext(InfoProfileContext);
  if (!context) {
    throw new Error('useInfoProfile must be used within an InfoProfileProvider');
  }
  return context;
};

export default InfoProfileContext;