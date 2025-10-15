import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, Users, Briefcase, FileText, AlertTriangle, Calendar, MessageSquare, CheckCircle, X } from 'lucide-react';

const AssignInfoRequest = () => {
  const { id } = useParams();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [infoProfile, setInfoProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    assignedUserId: '',
    department: '',
    note: '',
  });
  
  const [departments] = useState([
    { id: 1, name: 'Sales Department' },
    { id: 2, name: 'Accounts Department' },
    { id: 3, name: 'Human Resources' },
    { id: 4, name: 'Customer Service' },
  ]);
  
  const [users] = useState([
    { id: 1, name: 'Rahul Sharma', department: 1 },
    { id: 2, name: 'Priya Verma', department: 1 },
    { id: 3, name: 'Amit Patel', department: 2 },
    { id: 4, name: 'Neha Gupta', department: 2 },
    { id: 5, name: 'Vikas Singh', department: 3 },
    { id: 6, name: 'Anuradha Joshi', department: 4 },
  ]);
  
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    // Simulate API call to fetch info profile
    setTimeout(() => {
      setInfoProfile({
        id,
        customerId: 'CUST-1234',
        requestType: 'Brochure',
        priority: 'Medium',
        status: 'New',
        requestedOn: '2023-06-15',
      });
      setLoading(false);
    }, 500);
  }, [id]);

  useEffect(() => {
    if (formData.department) {
      const deptId = parseInt(formData.department);
      setFilteredUsers(users.filter(user => user.department === deptId));
    } else {
      setFilteredUsers([]);
    }
  }, [formData.department, users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally call an API to assign the info request
    console.log('Assignment data:', { infoProfileId: id, ...formData });
    
    // Redirect to the info profile detail page after submission
    navigate(`/info/${id}`);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return isDark ? 'text-red-400' : 'text-red-600';
      case 'Medium': return isDark ? 'text-amber-400' : 'text-amber-600';
      case 'Low': return isDark ? 'text-green-400' : 'text-green-600';
      default: return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!infoProfile) {
    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg rounded-xl p-6 border`}>
        <div className="text-center">
          <div className={`mx-auto w-16 h-16 flex items-center justify-center rounded-full mb-4 ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
            <AlertTriangle className={`h-8 w-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Info Profile Not Found
          </h2>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No info profile found with ID {id}
          </p>
          <button
            onClick={() => navigate('/info')}
            className={`mt-4 px-4 py-2 ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg shadow-md transition-colors`}
          >
            Back to Info Profile List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/info/${id}`)}
          className={`flex items-center ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} transition-colors`}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Info Profile
        </button>
      </div>
        
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg rounded-xl overflow-hidden border`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <FileText className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Assign Brochure Request
                </h1>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  {infoProfile.id} - Assign this request to the appropriate department and team member
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                infoProfile.status === 'New' 
                  ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                  : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
              }`}>
                {infoProfile.status}
              </div>
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                infoProfile.priority === 'High' 
                  ? isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                  : infoProfile.priority === 'Medium'
                    ? isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-800'
                    : isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
              }`}>
                {infoProfile.priority}
              </div>
            </div>
          </div>
        </div>
          
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} p-6 rounded-xl`}>
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <Briefcase className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Request Information
              </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600/50' : 'bg-gray-200'}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Request ID</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.id}</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600/50' : 'bg-gray-200'}`}>
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customer ID</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.customerId}</p>
                </div>
              </div>
              
              <div className={`flex items-start ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-gray-600/50' : 'bg-gray-200'}`}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Requested On</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{infoProfile.requestedOn}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} p-6 rounded-xl`}>
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <Users className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Assignment Details
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="department" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Department <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3 rounded-lg text-sm border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-700'
                    } transition-colors`}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Briefcase className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="assignedUserId" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assign To <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <select
                    id="assignedUserId"
                    name="assignedUserId"
                    value={formData.assignedUserId}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3 rounded-lg text-sm border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-700'
                    } transition-colors`}
                    required
                    disabled={!formData.department}
                  >
                    <option value="">Select Team Member</option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Users className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                </div>
                {!formData.department && (
                  <p className={`mt-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Please select a department first
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="note" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Assignment Note
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={4}
                  value={formData.note}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-700 border-gray-300'
                  } border`}
                  placeholder="Add any special instructions or notes for the assignee..."
                />
                <p className={`mt-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Optional: Include any additional context that might help the assignee
                </p>
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => navigate(`/info/${id}`)}
                  className={`px-4 py-2 rounded-lg border ${
                    isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  } transition-colors flex items-center`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-lg shadow-md transition-colors flex items-center ${
                    isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignInfoRequest;