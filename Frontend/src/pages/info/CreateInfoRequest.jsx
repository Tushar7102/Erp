import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { ChevronLeft, FileText, Users, Tag, AlertTriangle, MessageSquare, Send } from 'lucide-react';

const CreateInfoRequest = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    requestType: '',
    requestChannel: '',
    priority: 'Medium',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would normally call an API to create the info request
    console.log('Form submitted:', formData);
    
    // Redirect to the info profiles list page after submission
    navigate('/info/profiles');
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className={`mr-4 p-2 rounded-full ${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100'} transition-colors duration-200 shadow-sm`}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Information Request</h1>
        </div>
        
        {/* Main content card */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg p-8 border`}>
          {/* Form header with icon */}
          <div className="flex items-center mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className={`p-3 rounded-lg mr-4 ${isDark ? 'bg-primary-900/30' : 'bg-primary-50'}`}>
              <FileText className={`h-6 w-6 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Information Request Details</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fill in the details to create a new information request</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Information Section */}
            <div>
              <div className="flex items-center mb-4">
                <Users className={`h-5 w-5 mr-2 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customerId" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Customer ID <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <input
                      type="text"
                      id="customerId"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      className={`block w-full pl-4 pr-10 py-2.5 rounded-lg text-sm border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500' 
                          : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      } transition-colors duration-200`}
                      placeholder="Enter customer ID"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Tag className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="customerName" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      className={`block w-full pl-4 pr-10 py-2.5 rounded-lg text-sm border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500' 
                          : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      } transition-colors duration-200`}
                      placeholder="Enter customer name"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Users className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="customerEmail" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email Address
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <input
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      className={`block w-full pl-4 pr-10 py-2.5 rounded-lg text-sm border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500' 
                          : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      } transition-colors duration-200`}
                      placeholder="customer@example.com"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="customerPhone" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone Number
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <input
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      className={`block w-full pl-4 pr-10 py-2.5 rounded-lg text-sm border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500' 
                          : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      } transition-colors duration-200`}
                      placeholder="+91 98765 43210"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Request Details Section */}
            <div>
              <div className="flex items-center mb-4">
                <Tag className={`h-5 w-5 mr-2 ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Request Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="requestType" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Request Type <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <select
                      id="requestType"
                      name="requestType"
                      value={formData.requestType}
                      onChange={handleChange}
                      className={`block w-full pl-4 pr-10 py-2.5 rounded-lg text-sm border appearance-none ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500' 
                          : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      } transition-colors duration-200`}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Brochure">Brochure</option>
                      <option value="Policy">Policy</option>
                      <option value="Invoice Copy">Invoice Copy</option>
                      <option value="Catalog">Catalog</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FileText className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="requestChannel" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Request Channel <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <select
                      id="requestChannel"
                      name="requestChannel"
                      value={formData.requestChannel}
                      onChange={handleChange}
                      className={`block w-full pl-4 pr-10 py-2.5 rounded-lg text-sm border appearance-none ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500' 
                          : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      } transition-colors duration-200`}
                      required
                    >
                      <option value="">Select Channel</option>
                      <option value="Website">Website</option>
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Internal">Internal</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="priority" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className={`block w-full pl-4 pr-10 py-2.5 rounded-lg text-sm border appearance-none ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500' 
                          : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                      } transition-colors duration-200`}
                      required
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <AlertTriangle className={`h-4 w-4 ${formData.priority === 'High' ? 'text-red-500' : formData.priority === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description <span className="text-red-500">*</span>
                </label>
                <div className={`relative rounded-lg shadow-sm ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="absolute top-3 left-3">
                    <MessageSquare className={`h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className={`block w-full rounded-lg shadow-sm sm:text-sm pl-10 py-2.5 border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500' 
                        : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    } transition-colors duration-200`}
                    placeholder="Enter detailed description of the information request..."
                    required
                  />
                </div>
                <p className={`mt-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Please provide all relevant details to help process this request efficiently.
                </p>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isDark 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors duration-200 flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Create Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInfoRequest;