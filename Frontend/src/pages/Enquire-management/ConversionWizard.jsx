import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ConversionWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // Start at step 0 for enquiry selection
  const [isLoading, setIsLoading] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(id || '');
  
  // Selected enquiry data
  const [enquiry, setEnquiry] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    profile_type: '',
    project_name: '',
    product_category: '',
    amc_type: '',
    complaint_type: '',
    info_category: '',
    job_position: '',
    site_visit_date: '',
    site_visit_location: '',
    remarks: ''
  });
  
  // Fetch enquiries on component mount
  useEffect(() => {
    const fetchEnquiries = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be an API call
        // For now, we'll use sample data
        const sampleEnquiries = [
          {
            enquiry_id: 'ENQ0001',
            customer_name: 'Rahul Sharma',
            contact_number: '9876543210',
            email: 'rahul.sharma@example.com',
            date: '2023-06-15',
            status: 'New'
          },
          {
            enquiry_id: 'ENQ0002',
            customer_name: 'Priya Patel',
            contact_number: '8765432109',
            email: 'priya.patel@example.com',
            date: '2023-06-14',
            status: 'New'
          },
          {
            enquiry_id: 'ENQ0003',
            customer_name: 'Amit Kumar',
            contact_number: '7654321098',
            email: 'amit.kumar@example.com',
            date: '2023-06-13',
            status: 'New'
          }
        ];
        
        setEnquiries(sampleEnquiries);
        
        // If ID is provided in URL, select that enquiry
        if (id) {
          const selectedEnquiry = sampleEnquiries.find(e => e.enquiry_id === id);
          if (selectedEnquiry) {
            setEnquiry(selectedEnquiry);
            setSelectedEnquiryId(id);
            setCurrentStep(1); // Skip to step 1 if enquiry is already selected
          }
        }
      } catch (error) {
        console.error('Error fetching enquiries:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEnquiries();
  }, [id]);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on change
    validateField(name, value);
  };
  
  // Handle field blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };
  
  // Validate a single field
  const validateField = (name, value) => {
    let fieldErrors = {};
    
    switch (name) {
      case 'profile_type':
        if (!value) fieldErrors[name] = 'प्रोफाइल टाइप चुनना जरूरी है';
        break;
      case 'project_name':
        if (formData.profile_type === 'Project' && !value) 
          fieldErrors[name] = 'प्रोजेक्ट का नाम जरूरी है';
        break;
      case 'product_category':
        if (formData.profile_type === 'Product' && !value) 
          fieldErrors[name] = 'प्रोडक्ट कैटेगरी चुनना जरूरी है';
        break;
      case 'amc_type':
        if (formData.profile_type === 'AMC' && !value) 
          fieldErrors[name] = 'AMC टाइप चुनना जरूरी है';
        break;
      case 'complaint_type':
        if (formData.profile_type === 'Complaint' && !value) 
          fieldErrors[name] = 'कंप्लेंट टाइप चुनना जरूरी है';
        break;
      case 'info_category':
        if (formData.profile_type === 'Info' && !value) 
          fieldErrors[name] = 'इन्फो कैटेगरी चुनना जरूरी है';
        break;
      case 'job_position':
        if (formData.profile_type === 'Job' && !value) 
          fieldErrors[name] = 'जॉब पोजिशन जरूरी है';
        break;
      case 'site_visit_date':
        if (formData.profile_type === 'Site Visit' && !value) 
          fieldErrors[name] = 'साइट विजिट की तारीख जरूरी है';
        break;
      case 'site_visit_location':
        if (formData.profile_type === 'Site Visit' && !value) 
          fieldErrors[name] = 'साइट विजिट का स्थान जरूरी है';
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, ...fieldErrors }));
    return Object.keys(fieldErrors).length === 0;
  };
  
  // Validate current step
  const validateStep = () => {
    let isValid = true;
    let newErrors = {};
    
    switch (currentStep) {
      case 0: // Enquiry selection step
        if (!selectedEnquiryId) {
          newErrors.enquiry = 'कृपया एक इन्क्वायरी चुनें';
          isValid = false;
        }
        break;
      case 1: // Profile type selection
        if (!formData.profile_type) {
          newErrors.profile_type = 'प्रोफाइल टाइप चुनना जरूरी है';
          isValid = false;
        }
        break;
      case 2: // Profile details
        // Validate based on profile type
        switch (formData.profile_type) {
          case 'Project':
            if (!formData.project_name) {
              newErrors.project_name = 'प्रोजेक्ट का नाम जरूरी है';
              isValid = false;
            }
            break;
          case 'Product':
            if (!formData.product_category) {
              newErrors.product_category = 'प्रोडक्ट कैटेगरी चुनना जरूरी है';
              isValid = false;
            }
            break;
          case 'AMC':
            if (!formData.amc_type) {
              newErrors.amc_type = 'AMC टाइप चुनना जरूरी है';
              isValid = false;
            }
            break;
          case 'Complaint':
            if (!formData.complaint_type) {
              newErrors.complaint_type = 'कंप्लेंट टाइप चुनना जरूरी है';
              isValid = false;
            }
            break;
          case 'Info':
            if (!formData.info_category) {
              newErrors.info_category = 'इन्फो कैटेगरी चुनना जरूरी है';
              isValid = false;
            }
            break;
          case 'Job':
            if (!formData.job_position) {
              newErrors.job_position = 'जॉब पोजिशन जरूरी है';
              isValid = false;
            }
            break;
          case 'Site Visit':
            if (!formData.site_visit_date) {
              newErrors.site_visit_date = 'साइट विजिट की तारीख जरूरी है';
              isValid = false;
            }
            if (!formData.site_visit_location) {
              newErrors.site_visit_location = 'साइट विजिट का स्थान जरूरी है';
              isValid = false;
            }
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle enquiry selection
  const handleEnquirySelect = (selectedEnquiry) => {
    setSelectedEnquiryId(selectedEnquiry.enquiry_id);
    setEnquiry(selectedEnquiry);
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (validateStep()) {
      // Prepare submission data
      const submissionData = {
        enquiry_id: selectedEnquiryId,
        ...formData
      };
      
      console.log('Conversion data submitted:', submissionData);
      // Implementation would go here
      
      // Redirect to enquiry detail page
      navigate(`/enquiry-management/detail`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">
        {currentStep === 0 ? 'Select Enquiry to Convert' : `Convert Enquiry: ${enquiry?.enquiry_id || ''}`}
      </h1>
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'
          }`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
          }`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'
          }`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            4
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-center w-10">
            <span className="text-xs font-medium">Select Enquiry</span>
          </div>
          <div className="text-center w-10">
            <span className="text-xs font-medium">Select Type</span>
          </div>
          <div className="text-center w-10">
            <span className="text-xs font-medium">Details</span>
          </div>
          <div className="text-center w-10">
            <span className="text-xs font-medium">Confirm</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Step 0: Select Enquiry */}
        {currentStep === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Step 1: Select an Enquiry</h2>
            <p className="mb-4 text-gray-600">
              Choose the enquiry you want to convert into a profile.
            </p>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {errors.enquiry && (
                  <div className="mb-4 text-red-500 text-sm">{errors.enquiry}</div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b text-left">Select</th>
                        <th className="py-2 px-4 border-b text-left">ID</th>
                        <th className="py-2 px-4 border-b text-left">Customer Name</th>
                        <th className="py-2 px-4 border-b text-left">Contact</th>
                        <th className="py-2 px-4 border-b text-left">Email</th>
                        <th className="py-2 px-4 border-b text-left">Date</th>
                        <th className="py-2 px-4 border-b text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiries.map((enquiry) => (
                        <tr 
                          key={enquiry.enquiry_id}
                          className={`cursor-pointer hover:bg-blue-50 ${
                            selectedEnquiryId === enquiry.enquiry_id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleEnquirySelect(enquiry)}
                        >
                          <td className="py-2 px-4 border-b">
                            <div className={`w-5 h-5 rounded-full border ${
                              selectedEnquiryId === enquiry.enquiry_id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                              {selectedEnquiryId === enquiry.enquiry_id && (
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-4 border-b">{enquiry.enquiry_id}</td>
                          <td className="py-2 px-4 border-b">{enquiry.customer_name}</td>
                          <td className="py-2 px-4 border-b">{enquiry.contact_number}</td>
                          <td className="py-2 px-4 border-b">{enquiry.email}</td>
                          <td className="py-2 px-4 border-b">{enquiry.date}</td>
                          <td className="py-2 px-4 border-b">
                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              {enquiry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button 
                    onClick={handleNextStep}
                    disabled={!selectedEnquiryId}
                    className={`px-4 py-2 rounded-md text-sm ${
                      selectedEnquiryId 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Next Step
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Step 1: Select Profile Type */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Step 2: Select Profile Type</h2>
            <p className="mb-4 text-gray-600">
              Choose the type of profile you want to convert this enquiry into.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div 
                className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${
                  formData.profile_type === 'Project' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, profile_type: 'Project' }))}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.profile_type === 'Project' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {formData.profile_type === 'Project' && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 font-medium">Project</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">For construction, development, or implementation projects</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${
                  formData.profile_type === 'Product' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, profile_type: 'Product' }))}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.profile_type === 'Product' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {formData.profile_type === 'Product' && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 font-medium">Product</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">For product sales and purchases</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${
                  formData.profile_type === 'AMC' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, profile_type: 'AMC' }))}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.profile_type === 'AMC' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {formData.profile_type === 'AMC' && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 font-medium">AMC</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Annual Maintenance Contract</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${
                  formData.profile_type === 'Complaint' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, profile_type: 'Complaint' }))}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.profile_type === 'Complaint' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {formData.profile_type === 'Complaint' && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 font-medium">Complaint</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">For customer complaints and issues</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${
                  formData.profile_type === 'Info' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, profile_type: 'Info' }))}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.profile_type === 'Info' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {formData.profile_type === 'Info' && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 font-medium">Info</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">General information requests</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${
                  formData.profile_type === 'Job' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, profile_type: 'Job' }))}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.profile_type === 'Job' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {formData.profile_type === 'Job' && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 font-medium">Job</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Job applications and career inquiries</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${
                  formData.profile_type === 'Site Visit' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, profile_type: 'Site Visit' }))}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    formData.profile_type === 'Site Visit' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {formData.profile_type === 'Site Visit' && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-2 font-medium">Site Visit</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">For scheduling site visits and inspections</p>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePrevStep}
                className="px-4 py-2 rounded-md text-sm border border-gray-300 hover:bg-gray-100"
              >
                Previous Step
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!formData.profile_type}
                className={`px-4 py-2 rounded-md text-sm ${
                  formData.profile_type 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next Step
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Fill Profile Details */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Step 3: Fill Profile Details</h2>
            <p className="mb-4 text-gray-600">
              Please provide the necessary details for the {formData.profile_type} profile.
            </p>
            
            <div className="space-y-4">
              {/* Dynamic form fields based on profile type */}
              {formData.profile_type === 'Project' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                    <input 
                      type="text" 
                      name="project_name"
                      value={formData.project_name || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.project_name && touched.project_name ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                      placeholder="Enter project name"
                    />
                    {errors.project_name && touched.project_name && (
                      <p className="mt-1 text-sm text-red-500">{errors.project_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                    <select 
                      name="project_type"
                      value={formData.project_type || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.project_type && touched.project_type ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    >
                      <option value="">Select Project Type</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Infrastructure">Infrastructure</option>
                    </select>
                    {errors.project_type && touched.project_type && (
                      <p className="mt-1 text-sm text-red-500">{errors.project_type}</p>
                    )}
                  </div>
                </>
              )}
              
              {formData.profile_type === 'Product' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Category</label>
                    <select 
                      name="product_category"
                      value={formData.product_category || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.product_category && touched.product_category ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    >
                      <option value="">Select Product Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Appliances">Appliances</option>
                      <option value="Software">Software</option>
                    </select>
                    {errors.product_category && touched.product_category && (
                      <p className="mt-1 text-sm text-red-500">{errors.product_category}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input 
                      type="number" 
                      name="quantity"
                      value={formData.quantity || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.quantity && touched.quantity ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                      placeholder="Enter quantity"
                    />
                    {errors.quantity && touched.quantity && (
                      <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
                    )}
                  </div>
                </>
              )}
              
              {formData.profile_type === 'AMC' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AMC Type</label>
                    <select 
                      name="amc_type"
                      value={formData.amc_type || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.amc_type && touched.amc_type ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    >
                      <option value="">Select AMC Type</option>
                      <option value="Comprehensive">Comprehensive</option>
                      <option value="Non-Comprehensive">Non-Comprehensive</option>
                      <option value="Labor Only">Labor Only</option>
                    </select>
                    {errors.amc_type && touched.amc_type && (
                      <p className="mt-1 text-sm text-red-500">{errors.amc_type}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                    <input 
                      type="number" 
                      name="duration"
                      value={formData.duration || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.duration && touched.duration ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                      placeholder="Enter duration in months"
                    />
                    {errors.duration && touched.duration && (
                      <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
                    )}
                  </div>
                </>
              )}
              
              {formData.profile_type === 'Complaint' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Type</label>
                    <select 
                      name="complaint_type"
                      value={formData.complaint_type || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.complaint_type && touched.complaint_type ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    >
                      <option value="">Select Complaint Type</option>
                      <option value="Product Quality">Product Quality</option>
                      <option value="Service Quality">Service Quality</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Billing">Billing</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.complaint_type && touched.complaint_type && (
                      <p className="mt-1 text-sm text-red-500">{errors.complaint_type}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    <select 
                      name="severity"
                      value={formData.severity || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.severity && touched.severity ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    >
                      <option value="">Select Severity</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                    {errors.severity && touched.severity && (
                      <p className="mt-1 text-sm text-red-500">{errors.severity}</p>
                    )}
                  </div>
                </>
              )}
              
              {formData.profile_type === 'Info' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Information Category</label>
                  <select 
                    name="info_category"
                    value={formData.info_category || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-md border ${
                      errors.info_category && touched.info_category ? 'border-red-500' : 'border-gray-300'
                    } px-3 py-2 text-sm`}
                  >
                    <option value="">Select Information Category</option>
                    <option value="Product Information">Product Information</option>
                    <option value="Service Details">Service Details</option>
                    <option value="Company Information">Company Information</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.info_category && touched.info_category && (
                    <p className="mt-1 text-sm text-red-500">{errors.info_category}</p>
                  )}
                </div>
              )}
              
              {formData.profile_type === 'Job' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Position</label>
                    <input 
                      type="text" 
                      name="job_position"
                      value={formData.job_position || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.job_position && touched.job_position ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                      placeholder="Enter job position"
                    />
                    {errors.job_position && touched.job_position && (
                      <p className="mt-1 text-sm text-red-500">{errors.job_position}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select 
                      name="department"
                      value={formData.department || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.department && touched.department ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    >
                      <option value="">Select Department</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Operations">Operations</option>
                    </select>
                    {errors.department && touched.department && (
                      <p className="mt-1 text-sm text-red-500">{errors.department}</p>
                    )}
                  </div>
                </>
              )}
              
              {formData.profile_type === 'Site Visit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Visit Date</label>
                    <input 
                      type="date" 
                      name="site_visit_date"
                      value={formData.site_visit_date || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.site_visit_date && touched.site_visit_date ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                    />
                    {errors.site_visit_date && touched.site_visit_date && (
                      <p className="mt-1 text-sm text-red-500">{errors.site_visit_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site Visit Location</label>
                    <input 
                      type="text" 
                      name="site_visit_location"
                      value={formData.site_visit_location || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-md border ${
                        errors.site_visit_location && touched.site_visit_location ? 'border-red-500' : 'border-gray-300'
                      } px-3 py-2 text-sm`}
                      placeholder="Enter site visit location"
                    />
                    {errors.site_visit_location && touched.site_visit_location && (
                      <p className="mt-1 text-sm text-red-500">{errors.site_visit_location}</p>
                    )}
                  </div>
                </>
              )}
              
              {/* Common fields for all profile types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea 
                  name="remarks"
                  value={formData.remarks || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-md border ${
                    errors.remarks && touched.remarks ? 'border-red-500' : 'border-gray-300'
                  } px-3 py-2 text-sm`}
                  placeholder="Enter any additional remarks"
                  rows="3"
                ></textarea>
                {errors.remarks && touched.remarks && (
                  <p className="mt-1 text-sm text-red-500">{errors.remarks}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
              <button 
                onClick={handlePrevStep}
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300 transition-colors"
              >
                Previous Step
              </button>
              <button 
                onClick={handleNextStep}
                className="px-5 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Review & Confirm */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Step 4: Review & Confirm</h2>
            <p className="mb-4 text-gray-600">
              Please review the information below before confirming the conversion.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="font-medium mb-2">Enquiry Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Enquiry ID</p>
                  <p className="font-medium">{enquiry.enquiry_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{enquiry.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="font-medium">{enquiry.contact_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{enquiry.email}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="font-medium mb-2">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Profile Type</p>
                  <p className="font-medium">{formData.profile_type}</p>
                </div>
                
                {formData.profile_type === 'Project' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Project Name</p>
                      <p className="font-medium">{formData.project_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Project Type</p>
                      <p className="font-medium">{formData.project_type || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                {formData.profile_type === 'Product' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Product Category</p>
                      <p className="font-medium">{formData.product_category || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="font-medium">{formData.quantity || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                {formData.profile_type === 'AMC' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">AMC Type</p>
                      <p className="font-medium">{formData.amc_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration (Months)</p>
                      <p className="font-medium">{formData.duration || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                {formData.profile_type === 'Complaint' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Complaint Type</p>
                      <p className="font-medium">{formData.complaint_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Severity</p>
                      <p className="font-medium">{formData.severity || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                {formData.profile_type === 'Info' && (
                  <div>
                    <p className="text-sm text-gray-500">Information Category</p>
                    <p className="font-medium">{formData.info_category || 'Not specified'}</p>
                  </div>
                )}
                
                {formData.profile_type === 'Job' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Job Position</p>
                      <p className="font-medium">{formData.job_position || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{formData.department || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                {formData.profile_type === 'Site Visit' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Visit Date</p>
                      <p className="font-medium">{formData.site_visit_date || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{formData.site_visit_location || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Remarks</p>
                  <p className="font-medium">{formData.remarks || 'No remarks'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button 
                onClick={handlePrevStep}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
              >
                Previous Step
              </button>
              <button 
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                Confirm & Convert
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversionWizard;