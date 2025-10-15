import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save, User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';

const UserManagementModal = ({ 
  isOpen, 
  onClose, 
  mode = 'create', // 'create', 'edit', 'view'
  user = null,
  onSave 
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    role_id: '',
    status: 'Active',
    department: '',
    employee_id: '',
    hire_date: '',
    manager_id: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Mock roles data
  const roles = [
    { id: 1, name: 'Super Admin' },
    { id: 2, name: 'Admin' },
    { id: 3, name: 'Manager' },
    { id: 4, name: 'Staff' },
    { id: 5, name: 'Viewer' }
  ];

  // Mock managers data
  const managers = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Mike Johnson' }
  ];

  useEffect(() => {
    if (user && (mode === 'edit' || mode === 'view')) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        date_of_birth: user.date_of_birth || '',
        role_id: user.role_id || '',
        status: user.status || 'Active',
        department: user.department || '',
        employee_id: user.employee_id || '',
        hire_date: user.hire_date || '',
        manager_id: user.manager_id || ''
      });
    } else {
      // Reset form for create mode
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        date_of_birth: '',
        role_id: '',
        status: 'Active',
        department: '',
        employee_id: '',
        hire_date: '',
        manager_id: ''
      });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.role_id) newErrors.role_id = 'Role is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (only for create mode or when password is provided in edit mode)
    if (mode === 'create' || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Phone validation
    if (formData.phone) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (mode === 'view') {
      onClose();
      return;
    }

    if (validateForm()) {
      const submitData = { ...formData };
      
      // Remove password fields if they're empty in edit mode
      if (mode === 'edit' && !submitData.password) {
        delete submitData.password;
        delete submitData.confirmPassword;
      }

      onSave(submitData);
      onClose();
    }
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (mode) {
      case 'create': return 'Create New User';
      case 'edit': return 'Edit User';
      case 'view': return 'User Details';
      default: return 'User Management';
    }
  };

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <User className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {getModalTitle()}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {mode === 'create' && 'Add a new user to the system'}
                      {mode === 'edit' && 'Update user information'}
                      {mode === 'view' && 'View user details and permissions'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Basic Information
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      readOnly={isReadOnly}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } ${
                        errors.username 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        readOnly={isReadOnly}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                          isReadOnly 
                            ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        } ${
                          errors.first_name 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                      />
                      {errors.first_name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.first_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        readOnly={isReadOnly}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                          isReadOnly 
                            ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        } ${
                          errors.last_name 
                            ? 'border-red-300 dark:border-red-600' 
                            : 'border-gray-300 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                      />
                      {errors.last_name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      readOnly={isReadOnly}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } ${
                        errors.email 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      readOnly={isReadOnly}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } ${
                        errors.phone 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                    )}
                  </div>

                  {!isReadOnly && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password {mode === 'create' ? '*' : '(Leave blank to keep current)'}
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`block w-full border rounded-md px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                              errors.password 
                                ? 'border-red-300 dark:border-red-600' 
                                : 'border-gray-300 dark:border-gray-600'
                            } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirm Password {mode === 'create' ? '*' : ''}
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={`block w-full border rounded-md px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                              errors.confirmPassword 
                                ? 'border-red-300 dark:border-red-600' 
                                : 'border-gray-300 dark:border-gray-600'
                            } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Role and Organization */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Role & Organization
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role *
                    </label>
                    <select
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } ${
                        errors.role_id 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    {errors.role_id && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      readOnly={isReadOnly}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      readOnly={isReadOnly}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Manager
                    </label>
                    <select
                      name="manager_id"
                      value={formData.manager_id}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    >
                      <option value="">Select Manager</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>{manager.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        readOnly={isReadOnly}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                          isReadOnly 
                            ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Hire Date
                      </label>
                      <input
                        type="date"
                        name="hire_date"
                        value={formData.hire_date}
                        onChange={handleInputChange}
                        readOnly={isReadOnly}
                        className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                          isReadOnly 
                            ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      readOnly={isReadOnly}
                      rows={3}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm ${
                        isReadOnly 
                          ? 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      } border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {!isReadOnly && (
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;