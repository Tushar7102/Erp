import React, { useState, useEffect } from 'react';
import { X, Users, Building2, MapPin, User, Mail, Phone, Calendar, Save, AlertTriangle } from 'lucide-react';
import userService from '../../../services/user_management/userService';

const TeamForm = ({ team, isOpen, onClose, onSubmit, title }) => {
  const [formData, setFormData] = useState({
    team_name: '',
    department: '',
    description: '',
    team_lead_id: '',
    territory: '',
    status: 'Active',
    target_goals: '',
    budget: '',
    location: '',
    contact_email: '',
    contact_phone: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamLeads, setTeamLeads] = useState([]);
  const [teamLeadsLoading, setTeamLeadsLoading] = useState(true);
  const [teamLeadsError, setTeamLeadsError] = useState(null);

  // Mock data for departments
  const departments = [
    'Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 
    'Operations', 'Customer Support', 'Product', 'Legal', 'IT'
  ];

  const territories = [
    'North India', 'South India', 'East India', 'West India', 
    'Central India', 'Pan India', 'International', 'Remote', 'Global'
  ];

  // Load team leads from user database
  const loadTeamLeads = async () => {
    try {
      setTeamLeadsLoading(true);
      setTeamLeadsError(null);
      
      const response = await userService.getUsers({
        is_active: true, // Only get active users
        limit: 100 // Get enough users for team lead selection
      });
      
      if (response.success) {
        const transformedUsers = response.data.map(user => {
          const transformed = userService.transformUserData(user);
          return {
            id: transformed.user_id || transformed._id,
            name: `${transformed.firstName || transformed.first_name} ${transformed.lastName || transformed.last_name}`,
            email: transformed.email,
            role: transformed.role_assignment?.role_name || transformed.role
          };
        });
        setTeamLeads(transformedUsers);
      } else {
        throw new Error(response.message || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading team leads:', error);
      setTeamLeadsError(error.message);
      // Fallback to empty array
      setTeamLeads([]);
    } finally {
      setTeamLeadsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTeamLeads();
    }
  }, [isOpen]);

  // Clear team lead error when team leads are loaded and a valid selection exists
  useEffect(() => {
    if (!teamLeadsLoading && teamLeads.length > 0 && formData.team_lead_id) {
      const selectedLead = teamLeads.find(lead => lead.id.toString() === formData.team_lead_id.toString());
      if (selectedLead && errors.team_lead_id) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.team_lead_id;
          return newErrors;
        });
      }
    }
  }, [teamLeadsLoading, teamLeads, formData.team_lead_id]);

  useEffect(() => {
    if (team) {
      console.log("Team data received in form:", team);
      setFormData({
        team_name: team.team_name || team.name || '',
        department: team.department || '',
        description: team.description || '',
        team_lead_id: team.team_lead_id || team.team_lead?._id || '',
        territory: team.territory || '',
        status: team.status || 'Active',
        target_goals: team.target_goals || '',
        budget: team.budget || '',
        location: team.location || '',
        contact_email: team.contact_email || '',
        contact_phone: team.contact_phone || ''
      });
    } else {
      setFormData({
        team_name: '',
        department: '',
        description: '',
        team_lead_id: '',
        territory: '',
        status: 'Active',
        target_goals: '',
        budget: '',
        location: '',
        contact_email: '',
        contact_phone: ''
      });
    }
    setErrors({});
  }, [team, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.team_name.trim()) {
      newErrors.team_name = 'Team name is required';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Improved team lead validation
    if (teamLeadsLoading) {
      // Don't validate if still loading
      console.log('Team leads still loading, skipping validation');
    } else if (!formData.team_lead_id || formData.team_lead_id.trim() === '') {
      newErrors.team_lead_id = 'Team lead is required';
    } else if (teamLeads.length > 0) {
      // Only validate if team leads are loaded
      const selectedLead = teamLeads.find(lead => lead.id.toString() === formData.team_lead_id.toString());
      if (!selectedLead) {
        newErrors.team_lead_id = 'Please select a valid team lead';
      }
    }

    if (!formData.territory) {
      newErrors.territory = 'Territory is required';
    }

    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    if (formData.contact_phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.contact_phone)) {
      newErrors.contact_phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for team_lead_id to also populate team_lead field and contact details
    if (name === 'team_lead_id') {
      const selectedLead = teamLeads.find(lead => lead.id.toString() === value.toString());
      
      if (selectedLead) {
        // Auto-populate contact details from the selected team lead
        userService.getUser(selectedLead.id)
          .then(response => {
            if (response.success) {
              const userData = response.data;
              setFormData(prev => ({
                ...prev,
                [name]: value,
                team_lead: selectedLead.name,
                contact_email: userData.email || prev.contact_email,
                contact_phone: userData.phone || prev.contact_phone
              }));
            } else {
              console.error('Failed to fetch user details:', response.message);
            }
          })
          .catch(error => {
            console.error('Error fetching user details:', error);
          });
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          team_lead: ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user makes a selection/input
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Special handling for team_lead_id to immediately clear error when valid selection is made
    if (name === 'team_lead_id' && value && value.trim() !== '') {
      setErrors(prev => ({
        ...prev,
        team_lead_id: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if team leads are still loading
    if (teamLeadsLoading) {
      setErrors({ submit: 'Please wait for team leads to load before submitting.' });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Prepare data for submission
    const teamData = {
      name: formData.team_name,
      department: formData.department,
      description: formData.description,
      team_lead: formData.team_lead_id, // Ensure this is the correct ID
      team_lead_id: formData.team_lead_id, // Include both formats for compatibility
      territory: formData.territory,
      status: formData.status.toLowerCase(),
      target_goals: formData.target_goals,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      location: formData.location,
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone
    };
    
    try {
      await onSubmit(teamData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save team. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {title || (team ? 'Edit Team' : 'Create New Team')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {team ? 'Update team information and settings' : 'Add a new team to your organization'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <div className="text-sm text-red-700 dark:text-red-400">
                    {errors.submit}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Team Name *
                </label>
                <div className="mt-1 relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="team_name"
                    value={formData.team_name}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.team_name 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="Enter team name"
                  />
                </div>
                {errors.team_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.team_name}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department *
                </label>
                <div className="mt-1 relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.department 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.department}</p>
                )}
              </div>

              {/* Team Lead */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Team Lead *
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    name="team_lead_id"
                    value={formData.team_lead_id}
                    onChange={handleInputChange}
                    disabled={teamLeadsLoading}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      teamLeadsLoading ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      errors.team_lead_id 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  >
                    <option value="">
                      {teamLeadsLoading ? 'Loading team leads...' : 'Select Team Lead'}
                    </option>
                    {teamLeads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} ({lead.email}) - {lead.role}
                      </option>
                    ))}
                  </select>
                  {teamLeadsLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    </div>
                  )}
                </div>
                {teamLeadsError && (
                  <div className="mt-1 flex items-center text-sm text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>Failed to load team leads: {teamLeadsError}</span>
                  </div>
                )}
                {errors.team_lead_id && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.team_lead_id}</p>
                )}
              </div>

              {/* Territory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Territory *
                </label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    name="territory"
                    value={formData.territory}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.territory 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  >
                    <option value="">Select Territory</option>
                    {territories.map(territory => (
                      <option key={territory} value={territory}>{territory}</option>
                    ))}
                  </select>
                </div>
                {errors.territory && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.territory}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.description 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Describe the team's purpose and responsibilities"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>

              {/* Target Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Goals
                </label>
                <input
                  type="text"
                  name="target_goals"
                  value={formData.target_goals}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., 100 sales per month"
                />
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Budget
                </label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., ₹50,00,000"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Office location"
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Email
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.contact_email 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="team@company.com"
                  />
                </div>
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact_email}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Phone
                </label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.contact_phone 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    placeholder="+91 9876543210"
                  />
                </div>
                {errors.contact_phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact_phone}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || teamLeadsLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : teamLeadsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {team ? 'Update Team' : 'Create Team'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamForm;