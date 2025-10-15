import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import enquiryService from '../../../services/enquire_management/enquiryService';
const EnquiryForm = ({ onClose, onCancel, onSubmitSuccess }) => {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Handle form close with a dedicated function
  const handleFormClose = () => {
    // Try all possible close handlers
    if (typeof onClose === 'function') {
      onClose();
      return; // Return after first successful close
    }
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };
  
  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        handleFormClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    sources: [],
    users: [],
    states: [],
    districts: {},
    branches: {},
    projectTypes: ['Residential', 'Commercial', 'Industrial', 'Agricultural'],
    categories: ['On-Grid', 'Off-Grid', 'Hybrid'],
    connectionTypes: ['LT', 'HT'],
    subsidyTypes: ['Central', 'State', 'None'],
    businessModels: ['CAPEX', 'RESCO', 'PPA'],
    meteringTypes: ['Net Metering', 'Gross Metering', 'None'],
    roofTypes: ['RCC', 'Metal Sheet', 'Asbestos', 'Others'],
    leadTypes: ['B2B', 'B2C'],
    leadStatuses: ['New', 'In Progress', 'Qualified', 'Converted', 'Lost'],
    leadSources: ['Website', 'Referral', 'Social Media', 'Direct', 'Other'],
    channelTypes: ['Online', 'Offline', 'Partner'],
    quotationStatuses: ['Draft', 'Sent', 'Accepted', 'Rejected'],
    enquiryProfiles: ['Project', 'Product', 'AMC/Service', 'Complaint', 'Job', 'Info Request', 'Installation', 'Unknown']
  });

  const [formData, setFormData] = useState({
    // Step 1: Customer Information
    name: '',
    mobile: '',
    email: '',
    state: '',
    district: '',
    branch: '',
    pincode: '',
    enquiry_profile: '',

    // B2B specific customer fields
    company_name: '',
    designation: '',
    gst_number: '',
    company_address: '',
    company_website: '',
    industry_type: '',

    // B2C specific customer fields
    aadhaar_number: '',
    pan_number: '',
    residential_address: '',
    occupation: '',

    // Step 2: Lead Classification
    type_of_lead: 'B2C',
    status_of_lead: 'New',
    status_type: '',
    stage: '',
    priority_type: '',
    assigned_team: '',
    source_of_lead: '',
    source_type: '',
    source_of_reference: '',
    channel_type: '',
    priority_score: 5,

    // B2B specific lead fields
    decision_maker_name: '',
    decision_maker_contact: '',
    decision_maker_email: '',
    annual_revenue: null,
    employee_count: null,

    // B2C specific lead fields
    family_size: '',
    income_range: '',
    property_ownership: '',

    // Step 3: Project Details
    project_type: '',
    category: '',
    connection_type: '',
    business_model: '',
    subsidy_type: '',
    project_enhancement: false,
    need_loan: false,
    pv_capacity_kw: '',
    roof_type: '',
    area_sqft: '',
    metering: '',
    project_location: '',

    // B2B specific project fields
    energy_consumption: '',
    existing_power_source: '',
    power_backup: '',
    operation_hours: '',
    expansion_plans: '',

    // B2C specific project fields
    monthly_electricity_bill: '',
    electricity_connection_type: '',
    roof_ownership: '',
    shading_issues: '',

    // Step 4: Document Upload (previously Step 3)
    aadhaar_card: null,
    electricity_bill: null,
    bank_statement: null,
    pan_card: null,

    // B2B specific documents
    company_registration: null,
    tax_documents: null,
    utility_bills: null,
    site_photos: null,

    // B2C specific documents
    property_documents: null,
    consent_letter: null,
    id_proof: null,

    // Step 5: Quotation Information
    quotation_amount: '',
    quotation_date: '',
    quotation_status: '',

    // B2B specific quotation fields
    payment_terms: '',
    contract_duration: '',
    service_level_agreement: '',

    // B2C specific quotation fields
    emi_option: '',
    subsidy_amount: '',
    net_amount: '',

    // Step 6: Remarks
    add_remarks: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await enquiryService.getEnquiryFilters();
        setFilterOptions(prev => ({
          ...prev,
          ...(response.data || {})
        }));
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };

    fetchFilterOptions();
  }, []);

  // Update available districts when state changes
  useEffect(() => {
    if (formData.state && filterOptions.districts) {
      setAvailableDistricts(filterOptions.districts[formData.state] || []);
      setFormData(prev => ({ ...prev, district: '' }));
    }
  }, [formData.state, filterOptions.districts]);

  // Update available branches when district changes
  useEffect(() => {
    if (formData.district && filterOptions.branches) {
      setAvailableBranches(filterOptions.branches[formData.district] || []);
      setFormData(prev => ({ ...prev, branch: '' }));
    }
  }, [formData.district, filterOptions.branches]);

  // Validate a single field
  const validateField = (name, value) => {
    let error = null;
    
    // Basic validation rules
    if (name === 'name' && !value) error = 'Name is required';
    if (name === 'mobile' && !value) error = 'Phone number is required';
    if (name === 'mobile' && value && !/^\d{10}$/.test(value)) error = 'Phone number must be 10 digits';
    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) error = 'Invalid email format';
    if (name === 'state' && !value) error = 'State is required';
    if (name === 'district' && !value) error = 'District is required';
    if (name === 'pincode' && value && !/^\d{6}$/.test(value)) error = 'Pincode must be 6 digits';
    
    // B2B specific validations
    if (formData.type_of_lead === 'B2B') {
      if (name === 'company_name' && !value) error = 'Company name is required';
      if (name === 'company_address' && !value) error = 'Company address is required';
      if (name === 'company_website' && value && !/^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}$/.test(value)) error = 'Invalid website format';
      if (name === 'industry_type' && !value) error = 'Industry type is required';
    }
    
    // B2C specific validations
    if (formData.type_of_lead === 'B2C') {
      if (name === 'aadhaar_number' && value && !/^\d{12}$/.test(value)) error = 'Aadhaar number must be 12 digits';
      if (name === 'pan_number' && value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value)) error = 'Invalid PAN format';
      if (name === 'residential_address' && !value) error = 'Residential address is required';
    }
    
    // Update the error state for this field
    if (error) {
      setFormErrors(prev => ({
        ...prev,
        [name]: error
      }));
      return false;
    }
    
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    // Special handling for type_of_lead to ensure consistency
    if (name === 'type_of_lead' && formData.type_of_lead && formData.type_of_lead !== value && currentStep > 1) {
      // If user has already proceeded beyond Step 1, don't allow changing lead type
      setFormErrors(prev => ({
        ...prev,
        type_of_lead: 'Cannot change lead type after proceeding to next steps. Please create a new enquiry instead.'
      }));
      return;
    }

    if (type === 'file' && files) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else if (name === 'area_sqft' || name === 'monthly_electricity_bill' || name === 'annual_revenue' || name === 'employee_count') {
      // Only allow numeric input for these fields
      if (value === '') {
        // Allow empty values for optional fields
        setFormData(prev => ({
          ...prev,
          [name]: null
        }));
        
        // Clear any existing error for this field
        if (formErrors[name]) {
          setFormErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
          });
        }
      } else if (/^\d+$/.test(value)) {
        // Only allow positive integers
        const numValue = Number(value);
        setFormData(prev => ({
          ...prev,
          [name]: numValue
        }));
        
        // Clear any existing error for this field
        if (formErrors[name]) {
          setFormErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
          });
        }
      } else {
        // Don't update the form data if input is not a positive integer
        const fieldName = name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        setFormErrors(prev => ({
          ...prev,
          [name]: `${fieldName} must be a positive whole number`
        }));
      }
    } else {
      const newValue = type === 'checkbox' ? checked : value;
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
    
    // Clear the specific error when user changes the input
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Validate the field immediately to provide instant feedback
    validateField(name, type === 'checkbox' ? checked : value);

    // Clear error for this field when user makes changes
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};
    let isValid = true;

    switch (step) {
      case 1: // Customer Information
        if (!formData.name || !formData.name.trim()) errors.name = 'Name is required';
        if (!formData.mobile || !formData.mobile.trim()) errors.mobile = 'Mobile number is required';
        if (formData.mobile && !/^\d{10}$/.test(formData.mobile.trim())) {
          errors.mobile = 'Mobile number must be 10 digits';
          isValid = false;
        }
        // Email is not required for B2C leads
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = 'Invalid email format';
          isValid = false;
        }
        if (!formData.state) errors.state = 'State is required';
        if (!formData.district) errors.district = 'District is required';
        // Branch is not required
        if (!formData.type_of_lead) errors.type_of_lead = 'Type of lead is required';
        if (!formData.enquiry_profile) errors.enquiry_profile = 'Enquiry profile is required';

        // B2B specific validations
        if (formData.type_of_lead === 'B2B') {
          if (!formData.company_name?.trim()) errors.company_name = 'Company name is required';
          if (!formData.email?.trim()) errors.email = 'Email is required for B2B leads';
          // GST validation - only validate if provided
          if (formData.gst_number && formData.gst_number.trim() && 
              !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst_number.trim())) {
            errors.gst_number = 'Invalid GST format';
            isValid = false;
          }
        }

        // B2C specific validations
        if (formData.type_of_lead === 'B2C') {
          // Address and pincode are optional
          if (formData.pincode && formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
            errors.pincode = 'Pincode must be 6 digits';
            isValid = false;
          }

          // Aadhaar validation - only validate if provided
          if (formData.aadhaar_number && formData.aadhaar_number.trim() && 
              !/^\d{12}$/.test(formData.aadhaar_number.trim())) {
            errors.aadhaar_number = 'Aadhaar number must be exactly 12 digits';
            isValid = false;
          }

          // PAN validation - only validate if provided
          if (formData.pan_number && formData.pan_number.trim() && 
              !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number.trim().toUpperCase())) {
            errors.pan_number = 'Invalid PAN number format (e.g., ABCDE1234F)';
            isValid = false;
          }
        }
        // Return validation result for step 1
        setFormErrors(errors);
        return isValid && Object.keys(errors).length === 0;
        break;

      case 2: // Lead Classification
        if (!formData.type_of_lead) errors.type_of_lead = 'Type of lead is required';
        if (!formData.source_of_lead) errors.source_of_lead = 'Source of lead is required';
        if (!formData.source_type) errors.source_type = 'Source Type is required';
        if (!formData.status_of_lead) errors.status_of_lead = 'Status of lead is required';
        if (!formData.status_type) errors.status_type = 'Status type is required';
        if (!formData.stage) errors.stage = 'Stage is required';
        if (!formData.priority_type) errors.priority_type = 'Priority type is required';
        if (!formData.assigned_team) errors.assigned_team = 'Assigned team is required';

        // Priority score validation
        if (formData.priority_score) {
          const score = Number(formData.priority_score);
          if (isNaN(score) || score < 1 || score > 10) {
            errors.priority_score = 'Priority score must be a number between 1 and 10';
            return false;
          }
        }

        // B2B specific validations
        if (formData.type_of_lead === 'B2B') {
          // Company name validation - required for B2B
          if (!formData.company_name?.trim()) {
            errors.company_name = 'Company name is required for B2B leads';
            isValid = false;
          }
          
          if (!formData.decision_maker_name?.trim()) {
            errors.decision_maker_name = 'Decision maker name is required';
            isValid = false;
          }
          
          // Validate annual_revenue and employee_count
          if (formData.annual_revenue !== null && formData.annual_revenue !== undefined) {
            if (typeof formData.annual_revenue === 'string') {
              if (!/^\d+$/.test(formData.annual_revenue)) {
                errors.annual_revenue = 'Annual Revenue must be a positive whole number';
                isValid = false;
              }
            } else if (typeof formData.annual_revenue !== 'number' || isNaN(formData.annual_revenue) || formData.annual_revenue < 0) {
              errors.annual_revenue = 'Annual Revenue must be a positive whole number';
              isValid = false;
            }
          }
          
          if (formData.employee_count !== null && formData.employee_count !== undefined) {
            if (typeof formData.employee_count === 'string') {
              if (!/^\d+$/.test(formData.employee_count)) {
                errors.employee_count = 'Employee Count must be a positive whole number';
                isValid = false;
              }
            } else if (typeof formData.employee_count !== 'number' || isNaN(formData.employee_count) || formData.employee_count < 0) {
              errors.employee_count = 'Employee Count must be a positive whole number';
              isValid = false;
            }
          }
          
          // Decision maker contact validation
          if (!formData.decision_maker_contact?.trim()) {
            errors.decision_maker_contact = 'Decision maker contact is required';
            isValid = false;
          } else if (!/^\d{10}$/.test(formData.decision_maker_contact.trim())) {
            errors.decision_maker_contact = 'Mobile number must be 10 digits';
            isValid = false;
          }
          
          if (!formData.decision_maker_email?.trim()) {
            errors.decision_maker_email = 'Decision maker email is required';
            isValid = false;
          } else if (!/\S+@\S+\.\S+/.test(formData.decision_maker_email)) {
            errors.decision_maker_email = 'Invalid email format for decision maker';
            isValid = false;
          }
          
          // Annual revenue validation
          if (formData.annual_revenue !== null && formData.annual_revenue !== undefined && formData.annual_revenue !== '') {
            const revenue = Number(formData.annual_revenue);
            if (isNaN(revenue) || revenue <= 0 || !Number.isInteger(revenue)) {
              errors.annual_revenue = 'Annual Revenue must be a positive whole number';
              isValid = false;
            } else {
              // Ensure it's stored as a number in formData
              formData.annual_revenue = revenue;
            }
          }
          
          // Employee count validation
          if (formData.employee_count !== null && formData.employee_count !== undefined && formData.employee_count !== '') {
            const count = Number(formData.employee_count);
            if (isNaN(count) || count <= 0 || !Number.isInteger(count)) {
              errors.employee_count = 'Employee Count must be a positive whole number';
              isValid = false;
            } else {
              // Ensure it's stored as a number in formData
              formData.employee_count = count;
            }
          }
        }

        // B2C specific validations
        if (formData.type_of_lead === 'B2C') {
          if (!formData.income_range) errors.income_range = 'Income range is required';
        }
        break;

      case 3: // Project Details
        if (!formData.pv_capacity_kw) errors.pv_capacity_kw = 'PV capacity is required';
        if (formData.pv_capacity_kw && isNaN(Number(formData.pv_capacity_kw))) {
          errors.pv_capacity_kw = 'PV capacity must be a number';
          return false;
        }
        if (!formData.project_type) errors.project_type = 'Project type is required';
        if (!formData.category) errors.category = 'Category is required';
        if (!formData.connection_type) errors.connection_type = 'Connection type is required';
        if (!formData.business_model) errors.business_model = 'Business model is required';
        if (!formData.metering) errors.metering = 'Metering is required';
        if (!formData.project_location) errors.project_location = 'Project location is required';

        // B2B specific validations
        if (formData.type_of_lead === 'B2B') {
          if (!formData.electricity_consumption) errors.electricity_consumption = 'Electricity consumption is required';
          if (!formData.industry_type) errors.industry_type = 'Industry type is required';
        }

        // B2C specific validations
        if (formData.type_of_lead === 'B2C') {
          if (!formData.residence_type) errors.residence_type = 'Residence type is required';
          if (!formData.monthly_electricity_bill) errors.monthly_electricity_bill = 'Monthly electricity bill is required';
        }
        break;

      case 4: // Document Upload
        if (formData.need_loan) {
          if (!formData.bank_statement) errors.bank_statement = 'Bank statement is required for loan';
          if (!formData.income_proof) errors.income_proof = 'Income proof is required for loan';
        }
        break;

      case 5: // Quotation Information
        if (!formData.quotation_amount) errors.quotation_amount = 'Quotation amount is required';
        if (formData.quotation_amount && isNaN(parseFloat(formData.quotation_amount))) {
          errors.quotation_amount = 'Quotation amount must be a number';
        }

        // B2B specific validations
        if (formData.type_of_lead === 'B2B' && formData.corporate_discount) {
          if (isNaN(parseFloat(formData.corporate_discount)) || parseFloat(formData.corporate_discount) < 0 || parseFloat(formData.corporate_discount) > 100) {
            errors.corporate_discount = 'Discount must be between 0 and 100';
          }
        }

        // B2C specific validations
        if (formData.type_of_lead === 'B2C' && formData.residential_discount) {
          if (isNaN(parseFloat(formData.residential_discount)) || parseFloat(formData.residential_discount) < 0 || parseFloat(formData.residential_discount) > 100) {
            errors.residential_discount = 'Discount must be between 0 and 100';
          }
        }
        break;

      default:
        break;
    }

    setFormErrors(errors);
    console.log("Validation errors:", errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    // Validate the current step before proceeding
    if (validateStep(currentStep)) {
      // Always increment to the next step, including from step 5 to 6
      setCurrentStep(prev => prev < 6 ? prev + 1 : prev);
    } else {
      // Show validation errors but don't navigate
      console.log("Validation failed for step", currentStep);
      // Force re-render to ensure error messages are displayed
      setFormErrors({...formErrors});
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all steps before submission
    for (let i = 1; i <= 6; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setFormErrors({});

      // Create FormData object for file uploads
      const formDataObj = new FormData();

      // Convert enum values to match backend expectations (using correct case)
      const processedData = {
        ...formData,
        // Remove ObjectId reference fields that are causing errors
        status_type: undefined,
        priority_type: undefined,
        // Fix enum values to exactly match backend expectations
        category: formData.category ? (
          formData.category === 'On-Grid' || formData.category === 'on-grid' ? 'Residential' : 
          formData.category === 'Commercial' || formData.category === 'commercial' ? 'Commercial' : 
          formData.category === 'Industrial' || formData.category === 'industrial' ? 'Industrial' : 
          formData.category === 'Government' || formData.category === 'government' ? 'Government' : 
          'Residential' // Default to Residential if no match
        ) : 'Residential',
        connection_type: formData.connection_type === 'LT' ? 'Yes' : formData.connection_type === 'HT' ? 'No' : 'Yes',
        business_model: formData.business_model ? (
          formData.business_model.toUpperCase() === 'CAPEX' ? 'Capex' : 
          formData.business_model.toUpperCase() === 'OPEX' ? 'Opex' : 
          'Capex' // Default to Capex if no match
        ) : 'Capex',
        channel_type: formData.channel_type ? (
          formData.channel_type.toLowerCase() === 'online' ? 'Online' : 
          formData.channel_type.toLowerCase() === 'offline' ? 'Offline' : 
          'Online' // Default to Online if no match
        ) : 'Online',
        stage: formData.stage ? (
          formData.stage === 'Initial Contact' || formData.stage === 'initial contact' ? 'Captured' : 
          formData.stage === 'Follow-Up' || formData.stage === 'follow-up' ? 'Follow-Up' : 
          formData.stage === 'Quoted' || formData.stage === 'quoted' ? 'Quoted' : 
          formData.stage === 'Closed - Converted' || formData.stage === 'closed - converted' ? 'Closed - Converted' : 
          formData.stage === 'Closed - Rejected' || formData.stage === 'closed - rejected' ? 'Closed - Rejected' : 
          'Captured' // Default to Captured if no match
        ) : 'Captured',
        quotation_status: formData.quotation_status ? (
          formData.quotation_status === 'Draft' || formData.quotation_status === 'draft' ? 'Not Generated' :
          formData.quotation_status === 'Sent' || formData.quotation_status === 'sent' ? 'Sent' :
          formData.quotation_status === 'Viewed' || formData.quotation_status === 'viewed' ? 'Viewed' :
          formData.quotation_status === 'Accepted' || formData.quotation_status === 'accepted' ? 'Accepted' :
          formData.quotation_status === 'Rejected' || formData.quotation_status === 'rejected' ? 'Rejected' :
          formData.quotation_status === 'Revised' || formData.quotation_status === 'revised' ? 'Revised' :
          'Not Generated' // Default to Not Generated if no match
        ) : 'Not Generated',
        priority: formData.priority ? formData.priority.toUpperCase() : 'MEDIUM'
      };

      // Convert numeric fields to proper number types
      const numericFields = ['pv_capacity_kw', 'priority_score', 'quotation_amount'];

      // Append all form fields
      Object.keys(formData).forEach(key => {
        // Skip B2B specific fields if lead type is B2C
        if (processedData.type_of_lead === 'B2C' && [
          'company_name', 'gst_number', 'decision_maker_name', 'decision_maker_contact',
          'decision_maker_email', 'annual_revenue', 'employee_count', 'electricity_consumption',
          'industry_type', 'gst_certificate', 'company_registration', 'financial_statements',
          'corporate_discount', 'contract_duration', 'special_corporate_requirements', 'follow_up_schedule'
        ].includes(key)) {
          return;
        }

        // Skip B2C specific fields if lead type is B2B
        if (processedData.type_of_lead === 'B2B' && [
          'address', 'pincode', 'family_size', 'income_range', 'property_ownership',
          'residence_type', 'monthly_electricity_bill', 'aadhaar_card', 'pan_card',
          'residential_discount', 'warranty_period', 'installation_preferences', 'referral_information'
        ].includes(key)) {
          return;
        }

        // Handle file uploads
        if (key.includes('_file') && processedData[key] instanceof File) {
          formDataObj.append(key, processedData[key]);
        }
        // Convert numeric fields to numbers
        else if (numericFields.includes(key) && processedData[key] !== null && processedData[key] !== undefined && processedData[key] !== '') {
          formDataObj.append(key, Number(processedData[key]));
        }
        // Append other fields as is
        else if (processedData[key] !== null && processedData[key] !== undefined) {
          formDataObj.append(key, processedData[key]);
        }
      });

      // Create the enquiry
      const response = await enquiryService.createEnquiry(formDataObj);

      // Show success message
      alert('Enquiry created successfully!');

      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(response);
      }

      // Close the form
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormErrors({
        submit: error.response?.data?.message || 'Failed to create enquiry. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex justify-center mb-8">
        {[1, 2, 3, 4, 5, 6].map(step => (
          <div
            key={step}
            className={`flex flex-col items-center mx-2 ${step < currentStep ? 'cursor-pointer' : ''}`}
            onClick={() => step < currentStep && setCurrentStep(step)}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                ${step === currentStep
                  ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : step < currentStep
                    ? isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                }
              `}
            >
              {step < currentStep ? <Check size={16} /> : step}
            </div>
            <span
              className={`text-xs ${step === currentStep
                ? isDark ? 'text-blue-400' : 'text-blue-600'
                : isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
            >
              {step === 1 ? 'Customer Information' :
                step === 2 ? 'Lead Classification' :
                  step === 3 ? 'Project Details' :
                    step === 4 ? 'Document Upload' :
                      step === 5 ? 'Quotation Information' : 'Additional Remarks'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mb-6">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Type of Lead <span className="text-red-500">*</span>
                </label>
                <select
                  name="type_of_lead"
                  value={formData.type_of_lead}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Enquiry Profile <span className="text-red-500">*</span>
                </label>
                <select
                  name="enquiry_profile"
                  value={formData.enquiry_profile}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  {filterOptions.enquiryProfiles.map((profile) => (
                    <option key={profile} value={profile}>{profile}</option>
                  ))}
                </select>
                {formErrors.enquiry_profile && <p className="mt-1 text-sm text-red-500 font-semibold">{formErrors.enquiry_profile}</p>}
              </div>
            </div>

            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  {formData.type_of_lead === 'B2B' ? 'Contact Person Name' : 'Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                  placeholder={formData.type_of_lead === 'B2B' ? 'Contact Person Name' : 'Full Name'}
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500 font-semibold">{formErrors.name}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                  placeholder="10-digit mobile number"
                />
                {formErrors.mobile && <p className="mt-1 text-sm text-red-500 font-semibold">{formErrors.mobile}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Email {formData.type_of_lead === 'B2B' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                  placeholder="Email Address"
                />
                {formErrors.email && <p className="mt-1 text-sm text-red-500 font-semibold">{formErrors.email}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Enter state"
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                />
                {formErrors.state && <p className="mt-1 text-sm text-red-500 font-semibold">{formErrors.state}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="Enter district"
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                />
                {formErrors.district && <p className="mt-1 text-sm text-red-500">{formErrors.district}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Branch
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  placeholder="Enter branch"
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                />
                {formErrors.branch && <p className="mt-1 text-sm text-red-500">{formErrors.branch}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                  placeholder="Pincode"
                />
                {formErrors.pincode && <p className="mt-1 text-sm text-red-500">{formErrors.pincode}</p>}
              </div>
            </div>

            {/* B2B Specific Fields */}
            {formData.type_of_lead === 'B2B' && (
              <>
                <h3 className={`text-lg font-semibold mt-8 mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Company Name"
                    />
                    {formErrors.company_name && <p className="mt-1 text-sm text-red-500">{formErrors.company_name}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Designation
                    </label>
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Designation"
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gst_number"
                      value={formData.gst_number}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="GST Number"
                    />
                    {formErrors.gst_number && <p className="mt-1 text-sm text-red-500">{formErrors.gst_number}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Company Address
                    </label>
                    <input
                      type="text"
                      name="company_address"
                      value={formData.company_address}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Company Address"
                    />
                    {formErrors.company_address && <p className="mt-1 text-sm text-red-500">{formErrors.company_address}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Company Website
                    </label>
                    <input
                      type="text"
                      name="company_website"
                      value={formData.company_website}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Company Website"
                    />
                    {formErrors.company_website && <p className="mt-1 text-sm text-red-500">{formErrors.company_website}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Industry Type
                    </label>
                    <input
                      type="text"
                      name="industry_type"
                      value={formData.industry_type}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Industry Type"
                    />
                    {formErrors.industry_type && <p className="mt-1 text-sm text-red-500">{formErrors.industry_type}</p>}
                  </div>
                </div>
              </>
            )}

            {/* B2C Specific Fields */}
            {formData.type_of_lead === 'B2C' && (
              <>
                <h3 className={`text-lg font-semibold mt-8 mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      name="aadhaar_number"
                      value={formData.aadhaar_number}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Aadhaar Number"
                    />
                    {formErrors.aadhaar_number && <p className="mt-1 text-sm text-red-500">{formErrors.aadhaar_number}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="PAN Number"
                    />
                    {formErrors.pan_number && <p className="mt-1 text-sm text-red-500">{formErrors.pan_number}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Residential Address
                    </label>
                    <input
                      type="text"
                      name="residential_address"
                      value={formData.residential_address}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Residential Address"
                    />
                    {formErrors.residential_address && <p className="mt-1 text-sm text-red-500">{formErrors.residential_address}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Occupation
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Occupation"
                    />
                    {formErrors.occupation && <p className="mt-1 text-sm text-red-500">{formErrors.occupation}</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 2: // Lead Classification (previously Step 4)
        return (
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              Lead Classification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Status of Lead <span className="text-red-500">*</span>
                </label>
                <select
                  name="status_of_lead"
                  value={formData.status_of_lead}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="">Select Status</option>
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
                {formErrors.status_of_lead && <p className="mt-1 text-sm text-red-500">{formErrors.status_of_lead}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Status Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="status_type"
                  value={formData.status_type || ''}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="">Select Status Type</option>
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
                </select>
                {formErrors.status_type && <p className="mt-1 text-sm text-red-500">{formErrors.status_type}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Source of Lead <span className="text-red-500">*</span>
                </label>
                <select
                  name="source_of_lead"
                  value={formData.source_of_lead}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="">Select Source</option>
                  {filterOptions.leadSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
                {formErrors.source_of_lead && <p className="mt-1 text-sm text-red-500">{formErrors.source_of_lead}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Source Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="source_type"
                  value={formData.source_type}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="">Select Source Type</option>
                  <option value="Website">Website</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="JustDial">JustDial</option>
                  <option value="IndiaMART">IndiaMART</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.source_type && <p className="mt-1 text-sm text-red-500">{formErrors.source_type}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Stage <span className="text-red-500">*</span>
                </label>
                <select
                  name="stage"
                  value={formData.stage || ''}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="">Select Stage</option>
                  <option value="Initial Contact">Initial Contact</option>
                  <option value="Needs Assessment">Needs Assessment</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed">Closed</option>
                </select>
                {formErrors.stage && <p className="mt-1 text-sm text-red-500">{formErrors.stage}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Priority Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority_type"
                  value={formData.priority_type || ''}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="">Select Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                {formErrors.priority_type && <p className="mt-1 text-sm text-red-500">{formErrors.priority_type}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Assigned Team <span className="text-red-500">*</span>
                </label>
                <select
                  name="assigned_team"
                  value={formData.assigned_team || ''}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="">Select Team</option>
                  <option value="Sales">Sales</option>
                  <option value="Technical">Technical</option>
                  <option value="Support">Support</option>
                  <option value="Management">Management</option>
                </select>
                {formErrors.assigned_team && <p className="mt-1 text-sm text-red-500">{formErrors.assigned_team}</p>}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Channel Type
                </label>
                <select
                  name="channel_type"
                  value={formData.channel_type}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                >
                  <option value="">Select Channel Type</option>
                  {formData.type_of_lead === 'B2B' ? (
                    <>
                      <option value="online">Corporate Online</option>
                      <option value="in_person">Corporate Offline</option>
                      <option value="event">Business Event</option>
                      <option value="conference">Industry Conference</option>
                      <option value="exhibition">Trade Exhibition</option>
                    </>
                  ) : (
                    <>
                      <option value="online">Consumer Online</option>
                      <option value="in_person">Consumer Offline</option>
                      <option value="event">Community Event</option>
                      <option value="direct_reference">Friend Referral</option>
                      <option value="advertisement">Advertisement</option>
                    </>
                  )}
                </select>
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Priority Score (1-10)
                </label>
                <input
                  type="number"
                  name="priority_score"
                  value={formData.priority_score}
                  onChange={handleInputChange}
                  className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            {/* B2B Specific Fields */}
            {formData.type_of_lead === 'B2B' && (
              <>
                <h3 className={`text-lg font-semibold mt-8 mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  B2B Lead Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Decision Maker Name
                    </label>
                    <input
                      type="text"
                      name="decision_maker_name"
                      value={formData.decision_maker_name}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Decision Maker Name"
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Decision Maker Contact
                    </label>
                    <input
                      type="tel"
                      name="decision_maker_contact"
                      value={formData.decision_maker_contact}
                      onChange={handleInputChange}
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="10-digit mobile number"
                    />
                    {formErrors.decision_maker_contact && <p className="mt-1 text-sm text-red-500">{formErrors.decision_maker_contact}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Decision Maker Email
                    </label>
                    <input
                      type="email"
                      name="decision_maker_email"
                      value={formData.decision_maker_email}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Decision Maker Email"
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Annual Revenue
                    </label>
                    <input
                      type="number"
                      name="annual_revenue"
                      value={formData.annual_revenue}
                      onChange={handleInputChange}
                      min="1"
                      step="any"
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Annual Revenue (positive number)"
                    />
                    {formErrors.annual_revenue && <p className="mt-1 text-sm text-red-500">{formErrors.annual_revenue}</p>}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Employee Count
                    </label>
                    <input
                      type="number"
                      name="employee_count"
                      value={formData.employee_count}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Employee Count"
                    />
                  </div>
                </div>
              </>
            )}

            {/* B2C Specific Fields */}
            {formData.type_of_lead === 'B2C' && (
              <>
                <h3 className={`text-lg font-semibold mt-8 mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  B2C Lead Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Family Size
                    </label>
                    <input
                      type="number"
                      name="family_size"
                      value={formData.family_size}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      placeholder="Family Size"
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Income Range
                    </label>
                    <select
                      name="income_range"
                      value={formData.income_range}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    >
                      <option value="">Select Income Range</option>
                      <option value="Below 5 Lakhs">Below 5 Lakhs</option>
                      <option value="5-10 Lakhs">5-10 Lakhs</option>
                      <option value="10-15 Lakhs">10-15 Lakhs</option>
                      <option value="15-25 Lakhs">15-25 Lakhs</option>
                      <option value="Above 25 Lakhs">Above 25 Lakhs</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Property Ownership
                    </label>
                    <select
                      name="property_ownership"
                      value={formData.property_ownership}
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    >
                      <option value="">Select Ownership</option>
                      <option value="Own">Own</option>
                      <option value="Rent">Rent</option>
                      <option value="Lease">Lease</option>
                      <option value="Family Owned">Family Owned</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 3: // Project Details (previously Step 2)
        return (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Project Type <span className="text-red-500">*</span>
              </label>
              <select
                name="project_type"
                value={formData.project_type}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Project Type</option>
                {filterOptions.projectTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {formErrors.project_type && <p className="mt-1 text-sm text-red-500">{formErrors.project_type}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Category</option>
                <option value="On-Grid">On-Grid</option>
                <option value="Off-Grid">Off-Grid</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              {formErrors.category && <p className="mt-1 text-sm text-red-500">{formErrors.category}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Connection Type <span className="text-red-500">*</span>
              </label>
              <select
                name="connection_type"
                value={formData.connection_type}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Connection Type</option>
                <option value="LT">LT (Low Tension (Low Voltage))</option>
                <option value="HT">HT (High Tension (High Voltage))</option>
              </select>
              {formErrors.connection_type && <p className="mt-1 text-sm text-red-500">{formErrors.connection_type}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Business Model <span className="text-red-500">*</span>
              </label>
              <select
                name="business_model"
                value={formData.business_model}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Business Model</option>
                <option value="CAPEX">CAPEX (Capital Expenditure Model)</option>
                <option value="RESCO">RESCO (Renewable Energy Service Company Model)</option>
                <option value="PPA">PPA (Power Purchase Agreement)</option>
              </select>
              {formErrors.business_model && <p className="mt-1 text-sm text-red-500">{formErrors.business_model}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Subsidy Type
              </label>
              <select
                name="subsidy_type"
                value={formData.subsidy_type}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Subsidy Type</option>
                <option value="Subsidy">Subsidy</option>
                <option value="Non Subsidy">Non Subsidy</option>
              </select>
            </div>

            {/* B2B Specific Project Fields */}
            {formData.type_of_lead === 'B2B' && (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Electricity Consumption (kWh/month)
                  </label>
                  <input
                    type="number"
                    name="electricity_consumption"
                    value={formData.electricity_consumption}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    placeholder="Monthly Consumption"
                  />
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Industry Type
                  </label>
                  <select
                    name="industry_type"
                    value={formData.industry_type}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                  >
                    <option value="">Select Industry Type</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="IT/ITES">IT/ITES</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Education">Education</option>
                    <option value="Retail">Retail</option>
                    <option value="Others">Others</option>
              </select>
              {formErrors.roof_type && <p className="mt-1 text-sm text-red-500">{formErrors.roof_type}</p>}
                {formErrors.residence_type && <p className="mt-1 text-sm text-red-500">{formErrors.residence_type}</p>}
                </div>
              </>
            )}

            {/* B2C Specific Project Fields */}
            {formData.type_of_lead === 'B2C' && (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Residence Type
                  </label>
                  <select
                    name="residence_type"
                    value={formData.residence_type}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                  >
                    <option value="">Select Residence Type</option>
                    <option value="Independent House">Independent House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                    <option value="Farmhouse">Farmhouse</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Monthly Electricity Bill (₹)
                  </label>
                  <input
                    type="number"
                    name="monthly_electricity_bill"
                    value={formData.monthly_electricity_bill}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    placeholder="Monthly Bill"
                />
                {formErrors.monthly_electricity_bill && <p className="mt-1 text-sm text-red-500">{formErrors.monthly_electricity_bill}</p>}
                </div>
              </>
            )}

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                PV Capacity (kW) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="pv_capacity_kw"
                value={formData.pv_capacity_kw}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                placeholder="PV Capacity in kW"
                min="0"
                step="0.01"
              />
              {formErrors.pv_capacity_kw && <p className="mt-1 text-sm text-red-500">{formErrors.pv_capacity_kw}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Roof Type
              </label>
              <select
                name="roof_type"
                value={formData.roof_type}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Roof Type</option>
                {filterOptions.roofTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Area (sqft)
              </label>
              <input
                type="number"
                name="area_sqft"
                value={formData.area_sqft}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                placeholder="Area in square feet"
                min="0"
              />
              {formErrors.area_sqft && <p className="mt-1 text-sm text-red-500">{formErrors.area_sqft}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Metering <span className="text-red-500">*</span>
              </label>
              <select
                name="metering"
                value={formData.metering}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Metering Type</option>
                <option value="Net Metering">Net Metering</option>
                <option value="Gross Metering">Gross Metering</option>
              </select>
              {formErrors.metering && <p className="mt-1 text-sm text-red-500">{formErrors.metering}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Project Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="project_location"
                value={formData.project_location}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                placeholder="Project Location"
              />
              {formErrors.project_location && <p className="mt-1 text-sm text-red-500">{formErrors.project_location}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Project Enhancement
              </label>
              <select
                name="project_enhancement"
                value={formData.project_enhancement}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Project Enhancement</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {formErrors.project_enhancement && <p className="mt-1 text-sm text-red-500">{formErrors.project_enhancement}</p>}
            </div>

            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="need_loan"
                name="need_loan"
                checked={formData.need_loan}
                onChange={handleInputChange}
                className={`mr-2 h-4 w-4 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
              <label htmlFor="need_loan" className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Need Loan
              </label>
            </div>
          </div>
        );

      case 4: // Document Upload (previously Step 3)
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Common Documents for both B2B and B2C */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Electricity Bill
              </label>
              <input
                type="file"
                name="electricity_bill"
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                key="electricity_bill_input"
              />
              {formErrors.electricity_bill && <p className="mt-1 text-sm text-red-500">{formErrors.electricity_bill}</p>}
            </div>

            {/* B2C specific documents */}
            {formData.type_of_lead === 'B2C' && (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Aadhaar Card
                  </label>
                  <input
                    type="file"
                    name="aadhaar_card"
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    key="aadhaar_card_input"
                  />
                  {formErrors.aadhaar_card && <p className="mt-1 text-sm text-red-500">{formErrors.aadhaar_card}</p>}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    PAN Card
                  </label>
                  <input
                    type="file"
                    name="pan_card"
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    key="pan_card_input"
                  />
                  {formErrors.pan_card && <p className="mt-1 text-sm text-red-500">{formErrors.pan_card}</p>}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Bank Statement
                  </label>
                  <input
                    type="file"
                    name="bank_statement"
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    key="bank_statement_input"
                  />
                  {formErrors.bank_statement && <p className="mt-1 text-sm text-red-500">{formErrors.bank_statement}</p>}
                </div>
              </>
            )}

            {/* B2B specific documents */}
            {formData.type_of_lead === 'B2B' && (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    GST Certificate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="gst_certificate"
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    key="gst_certificate_input"
                  />
                  {formErrors.gst_certificate && <p className="mt-1 text-sm text-red-500">{formErrors.gst_certificate}</p>}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Company Registration
                  </label>
                  <input
                    type="file"
                    name="company_registration"
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    key="company_registration_input"
                  />
                  {formErrors.company_registration && <p className="mt-1 text-sm text-red-500">{formErrors.company_registration}</p>}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Financial Statements
                  </label>
                  <input
                    type="file"
                    name="financial_statements"
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    key="financial_statements_input"
                  />
                  {formErrors.financial_statements && <p className="mt-1 text-sm text-red-500">{formErrors.financial_statements}</p>}
                </div>
              </>
            )}

            {/* Loan related documents - show if need_loan is checked */}
            {formData.need_loan && (
              <div className="mb-4 col-span-2">
                <h3 className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-3`}>Loan Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Income Proof
                    </label>
                    <input
                      type="file"
                      name="income_proof"
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      key="income_proof_input"
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Bank Statement
                    </label>
                    <input
                      type="file"
                      name="bank_statement"
                      onChange={handleInputChange}
                      className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                      key="bank_statement_loan_input"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                PAN Card
              </label>
              <input
                type="file"
                name="pan_card"
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                key="pan_card_input"
              />
              {formErrors.pan_card && <p className="mt-1 text-sm text-red-500">{formErrors.pan_card}</p>}
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Project Proposal
              </label>
              <input
                type="file"
                name="project_proposal"
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                key="project_proposal_input"
              />
              {formErrors.project_proposal && <p className="mt-1 text-sm text-red-500">{formErrors.project_proposal}</p>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Quotation Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="quotation_amount"
                value={formData.quotation_amount}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                placeholder="Amount in INR"
              />
              {formErrors.quotation_amount && <p className="mt-1 text-sm text-red-500">{formErrors.quotation_amount}</p>}
            </div>

            {/* Common fields for both B2B and B2C */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Payment Terms
              </label>
              <select
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Payment Terms</option>
                <option value="Full Advance">Full Advance</option>
                <option value="50% Advance">50% Advance</option>
                <option value="30% Advance">30% Advance</option>
                <option value="Milestone Based">Milestone Based</option>
              </select>
              {formErrors.payment_terms && <p className="mt-1 text-sm text-red-500">{formErrors.payment_terms}</p>}
            </div>

            {/* B2B specific fields */}
            {formData.type_of_lead === 'B2B' && (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Corporate Discount (%)
                  </label>
                  <input
                    type="number"
                    name="corporate_discount"
                    value={formData.corporate_discount}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    placeholder="Discount percentage"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  {formErrors.corporate_discount && <p className="mt-1 text-sm text-red-500">{formErrors.corporate_discount}</p>}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Contract Duration (Months)
                  </label>
                  <input
                    type="number"
                    name="contract_duration"
                    value={formData.contract_duration}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    placeholder="Duration in months"
                    min="0"
                  />
                  {formErrors.contract_duration && <p className="mt-1 text-sm text-red-500">{formErrors.contract_duration}</p>}
                </div>
              </>
            )}

            {/* B2C specific fields */}
            {formData.type_of_lead === 'B2C' && (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Residential Discount (%)
                  </label>
                  <input
                    type="number"
                    name="residential_discount"
                    value={formData.residential_discount}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    placeholder="Discount percentage"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Warranty Period (Years)
                  </label>
                  <input
                    type="number"
                    name="warranty_period"
                    value={formData.warranty_period}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    placeholder="Warranty in years"
                    min="0"
                  />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Quotation Date
              </label>
              <input
                type="date"
                name="quotation_date"
                value={formData.quotation_date}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Quotation Status
              </label>
              <select
                name="quotation_status"
                value={formData.quotation_status}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
              >
                <option value="">Select Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="grid grid-cols-1 gap-6">
            <div className="mb-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Additional Remarks
              </label>
              <textarea
                name="add_remarks"
                value={formData.add_remarks}
                onChange={handleInputChange}
                className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                rows="4"
                placeholder="Enter any additional information or notes about this enquiry"
              ></textarea>
            </div>

            {/* B2B specific fields */}
            {formData.type_of_lead === 'B2B' && (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Special Corporate Requirements
                  </label>
                  <textarea
                    name="special_corporate_requirements"
                    value={formData.special_corporate_requirements}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    rows="3"
                    placeholder="Any special corporate requirements or customizations"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Follow-up Schedule
                  </label>
                  <input
                    type="date"
                    name="followup_schedule"
                    value={formData.followup_schedule}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                  />
                </div>
              </>
            )}

            {/* B2C specific fields */}
            {formData.type_of_lead === 'B2C' && (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Installation Preferences
                  </label>
                  <textarea
                    name="installation_preferences"
                    value={formData.installation_preferences}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    rows="3"
                    placeholder="Any specific installation preferences or timing requirements"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Referral Information
                  </label>
                  <input
                    type="text"
                    name="referral_information"
                    value={formData.referral_information}
                    onChange={handleInputChange}
                    className={`w-full rounded-md border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-black'} px-3 py-2`}
                    placeholder="Details about any referrals"
                  />
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Create New Enquiry</h2>
          <button
            onClick={handleFormClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {formErrors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {formErrors.submit}
            </div>
          )}

          {renderStepIndicator()}

          <form onSubmit={(e) => {
              e.preventDefault();
              if (currentStep < 6) {
                handleNext();
              } else {
                handleSubmit(e);
              }
            }}>
            {renderStepContent()}

            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className={`px-4 py-2 rounded-md flex items-center ${isDark
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={`px-4 py-2 rounded-md flex items-center ${isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  {currentStep === 5 ? "Next" : "Next"}
                  <ChevronRight size={16} className="ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md flex items-center ${isDark
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-green-500 text-white hover:bg-green-600'
                    } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnquiryForm;