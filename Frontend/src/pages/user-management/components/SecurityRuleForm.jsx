import React, { useState, useEffect } from 'react';
import { X, Shield, Clock, AlertTriangle, Plus, Minus, Save, Settings, Target, Zap, Bell, Lock, Globe, User, Calendar, Timer } from 'lucide-react';

const SecurityRuleForm = ({ rule, isOpen, onClose, onSubmit, title }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'login_attempt',
    status: 'active',
    priority: 'medium',
    conditions: [
      {
        field: 'failed_attempts',
        operator: 'greater_than',
        value: '5',
        time_window: '15'
      }
    ],
    actions: [
      {
        type: 'block_user',
        duration: '30',
        notification: true
      }
    ],
    triggers: [],
    schedule: {
      enabled: false,
      start_time: '',
      end_time: '',
      days: []
    },
    notifications: {
      email: true,
      webhook: false,
      webhook_url: ''
    },
    exceptions: {
      ip_whitelist: '',
      user_whitelist: [],
      device_whitelist: []
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rule types
  const ruleTypes = [
    { id: 'login_attempt', name: 'Login Attempt', description: 'Monitor failed login attempts' },
    { id: 'device_access', name: 'Device Access', description: 'Control device access patterns' },
    { id: 'api_usage', name: 'API Usage', description: 'Monitor API usage and rate limits' },
    { id: 'data_access', name: 'Data Access', description: 'Control sensitive data access' },
    { id: 'location_based', name: 'Location Based', description: 'Location-based access control' },
    { id: 'time_based', name: 'Time Based', description: 'Time-based access restrictions' },
    { id: 'behavioral', name: 'Behavioral', description: 'Detect unusual user behavior' },
    { id: 'compliance', name: 'Compliance', description: 'Ensure regulatory compliance' }
  ];

  // Condition fields based on rule type
  const conditionFields = {
    login_attempt: [
      { id: 'failed_attempts', name: 'Failed Attempts', type: 'number' },
      { id: 'success_rate', name: 'Success Rate (%)', type: 'number' },
      { id: 'login_frequency', name: 'Login Frequency', type: 'number' },
      { id: 'ip_address', name: 'IP Address', type: 'text' },
      { id: 'user_agent', name: 'User Agent', type: 'text' }
    ],
    device_access: [
      { id: 'device_count', name: 'Device Count', type: 'number' },
      { id: 'new_device', name: 'New Device', type: 'boolean' },
      { id: 'device_type', name: 'Device Type', type: 'select' },
      { id: 'os_version', name: 'OS Version', type: 'text' },
      { id: 'location_change', name: 'Location Change', type: 'boolean' }
    ],
    api_usage: [
      { id: 'request_count', name: 'Request Count', type: 'number' },
      { id: 'error_rate', name: 'Error Rate (%)', type: 'number' },
      { id: 'response_time', name: 'Response Time (ms)', type: 'number' },
      { id: 'endpoint', name: 'Endpoint', type: 'text' },
      { id: 'method', name: 'HTTP Method', type: 'select' }
    ],
    data_access: [
      { id: 'data_volume', name: 'Data Volume (MB)', type: 'number' },
      { id: 'sensitive_data', name: 'Sensitive Data Access', type: 'boolean' },
      { id: 'export_count', name: 'Export Count', type: 'number' },
      { id: 'access_pattern', name: 'Access Pattern', type: 'select' }
    ],
    location_based: [
      { id: 'country', name: 'Country', type: 'text' },
      { id: 'city', name: 'City', type: 'text' },
      { id: 'distance_km', name: 'Distance (km)', type: 'number' },
      { id: 'vpn_detected', name: 'VPN Detected', type: 'boolean' }
    ],
    time_based: [
      { id: 'hour', name: 'Hour (0-23)', type: 'number' },
      { id: 'day_of_week', name: 'Day of Week', type: 'select' },
      { id: 'business_hours', name: 'Business Hours', type: 'boolean' },
      { id: 'timezone', name: 'Timezone', type: 'text' }
    ],
    behavioral: [
      { id: 'activity_score', name: 'Activity Score', type: 'number' },
      { id: 'pattern_deviation', name: 'Pattern Deviation (%)', type: 'number' },
      { id: 'session_duration', name: 'Session Duration (min)', type: 'number' },
      { id: 'action_frequency', name: 'Action Frequency', type: 'number' }
    ],
    compliance: [
      { id: 'retention_days', name: 'Retention Days', type: 'number' },
      { id: 'encryption_required', name: 'Encryption Required', type: 'boolean' },
      { id: 'audit_trail', name: 'Audit Trail', type: 'boolean' },
      { id: 'data_classification', name: 'Data Classification', type: 'select' }
    ]
  };

  // Operators
  const operators = [
    { id: 'equals', name: 'Equals', types: ['text', 'number', 'select'] },
    { id: 'not_equals', name: 'Not Equals', types: ['text', 'number', 'select'] },
    { id: 'greater_than', name: 'Greater Than', types: ['number'] },
    { id: 'less_than', name: 'Less Than', types: ['number'] },
    { id: 'greater_equal', name: 'Greater or Equal', types: ['number'] },
    { id: 'less_equal', name: 'Less or Equal', types: ['number'] },
    { id: 'contains', name: 'Contains', types: ['text'] },
    { id: 'not_contains', name: 'Does Not Contain', types: ['text'] },
    { id: 'starts_with', name: 'Starts With', types: ['text'] },
    { id: 'ends_with', name: 'Ends With', types: ['text'] },
    { id: 'is_true', name: 'Is True', types: ['boolean'] },
    { id: 'is_false', name: 'Is False', types: ['boolean'] }
  ];

  // Action types
  const actionTypes = [
    { id: 'block_user', name: 'Block User', hasDuration: true },
    { id: 'block_ip', name: 'Block IP Address', hasDuration: true },
    { id: 'require_2fa', name: 'Require 2FA', hasDuration: false },
    { id: 'force_logout', name: 'Force Logout', hasDuration: false },
    { id: 'send_alert', name: 'Send Alert', hasDuration: false },
    { id: 'quarantine_device', name: 'Quarantine Device', hasDuration: true },
    { id: 'limit_access', name: 'Limit Access', hasDuration: true },
    { id: 'log_event', name: 'Log Event', hasDuration: false },
    { id: 'webhook', name: 'Trigger Webhook', hasDuration: false },
    { id: 'escalate', name: 'Escalate to Admin', hasDuration: false }
  ];

  // Mock data for users and devices
  const users = [
    { id: 'user_001', name: 'John Smith', email: 'john@company.com' },
    { id: 'user_002', name: 'Sarah Johnson', email: 'sarah@company.com' },
    { id: 'user_003', name: 'Mike Wilson', email: 'mike@company.com' }
  ];

  const devices = [
    { id: 'device_001', name: 'John\'s iPhone', type: 'Mobile' },
    { id: 'device_002', name: 'Sarah\'s MacBook', type: 'Laptop' },
    { id: 'device_003', name: 'Office Desktop', type: 'Desktop' }
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        rule_type: rule.rule_type || 'login_attempt',
        status: rule.status || 'active',
        priority: rule.priority || 'medium',
        conditions: rule.conditions || [
          {
            field: 'failed_attempts',
            operator: 'greater_than',
            value: '5',
            time_window: '15'
          }
        ],
        actions: rule.actions || [
          {
            type: 'block_user',
            duration: '30',
            notification: true
          }
        ],
        triggers: rule.triggers || [],
        schedule: rule.schedule || {
          enabled: false,
          start_time: '',
          end_time: '',
          days: []
        },
        notifications: rule.notifications || {
          email: true,
          webhook: false,
          webhook_url: ''
        },
        exceptions: rule.exceptions || {
          ip_whitelist: '',
          user_whitelist: [],
          device_whitelist: []
        }
      });
    } else {
      setFormData({
        name: '',
        description: '',
        rule_type: 'login_attempt',
        status: 'active',
        priority: 'medium',
        conditions: [
          {
            field: 'failed_attempts',
            operator: 'greater_than',
            value: '5',
            time_window: '15'
          }
        ],
        actions: [
          {
            type: 'block_user',
            duration: '30',
            notification: true
          }
        ],
        triggers: [],
        schedule: {
          enabled: false,
          start_time: '',
          end_time: '',
          days: []
        },
        notifications: {
          email: true,
          webhook: false,
          webhook_url: ''
        },
        exceptions: {
          ip_whitelist: '',
          user_whitelist: [],
          device_whitelist: []
        }
      });
    }
    setErrors({});
  }, [rule, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (formData.conditions.length === 0) {
      newErrors.conditions = 'At least one condition is required';
    }

    if (formData.actions.length === 0) {
      newErrors.actions = 'At least one action is required';
    }

    // Validate conditions
    formData.conditions.forEach((condition, index) => {
      if (!condition.field || !condition.operator || !condition.value) {
        newErrors[`condition_${index}`] = 'All condition fields are required';
      }
    });

    // Validate actions
    formData.actions.forEach((action, index) => {
      if (!action.type) {
        newErrors[`action_${index}`] = 'Action type is required';
      }
    });

    // Validate webhook URL if webhook notifications are enabled
    if (formData.notifications.webhook && !formData.notifications.webhook_url) {
      newErrors.webhook_url = 'Webhook URL is required when webhook notifications are enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleConditionChange = (index, field, value) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      conditions: newConditions
    }));
  };

  const addCondition = () => {
    const newCondition = {
      field: '',
      operator: 'equals',
      value: '',
      time_window: '15'
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const handleActionChange = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index] = {
      ...newActions[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      actions: newActions
    }));
  };

  const addAction = () => {
    const newAction = {
      type: 'send_alert',
      duration: '',
      notification: true
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const removeAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleScheduleDayChange = (day) => {
    const newDays = formData.schedule.days.includes(day)
      ? formData.schedule.days.filter(d => d !== day)
      : [...formData.schedule.days, day];
    
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        days: newDays
      }
    }));
  };

  const handleExceptionChange = (type, value) => {
    if (type === 'ip_whitelist') {
      setFormData(prev => ({
        ...prev,
        exceptions: {
          ...prev.exceptions,
          ip_whitelist: value
        }
      }));
    } else {
      const currentList = formData.exceptions[type];
      const newList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      
      setFormData(prev => ({
        ...prev,
        exceptions: {
          ...prev.exceptions,
          [type]: newList
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save security rule. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableFields = () => {
    return conditionFields[formData.rule_type] || [];
  };

  const getAvailableOperators = (fieldType) => {
    return operators.filter(op => op.types.includes(fieldType));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {title || (rule ? 'Edit Security Rule' : 'Create New Security Rule')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {rule ? 'Update security rule configuration and conditions' : 'Configure automated security rule with conditions and actions'}
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
          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
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

            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Rule Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rule Name *
                  </label>
                  <div className="mt-1 relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.name 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="e.g., Block Multiple Failed Logins"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Rule Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rule Type
                  </label>
                  <div className="mt-1 relative">
                    <Target className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <select
                      name="rule_type"
                      value={formData.rule_type}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {ruleTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="testing">Testing</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe what this security rule does"
                  />
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Conditions *
                </h4>
                <button
                  type="button"
                  onClick={addCondition}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Condition
                </button>
              </div>

              {formData.conditions.map((condition, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Condition {index + 1}
                    </span>
                    {formData.conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Field */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Field
                      </label>
                      <select
                        value={condition.field}
                        onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">Select Field</option>
                        {getAvailableFields().map(field => (
                          <option key={field.id} value={field.id}>{field.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Operator */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Operator
                      </label>
                      <select
                        value={condition.operator}
                        onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        {getAvailableOperators('number').map(operator => (
                          <option key={operator.id} value={operator.id}>{operator.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Value */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Enter value"
                      />
                    </div>

                    {/* Time Window */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time Window (min)
                      </label>
                      <input
                        type="number"
                        value={condition.time_window}
                        onChange={(e) => handleConditionChange(index, 'time_window', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="15"
                      />
                    </div>
                  </div>
                  {errors[`condition_${index}`] && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`condition_${index}`]}</p>
                  )}
                </div>
              ))}
              {errors.conditions && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.conditions}</p>
              )}
            </div>

            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Actions *
                </h4>
                <button
                  type="button"
                  onClick={addAction}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Action
                </button>
              </div>

              {formData.actions.map((action, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Action {index + 1}
                    </span>
                    {formData.actions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Action Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Action Type
                      </label>
                      <select
                        value={action.type}
                        onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="">Select Action</option>
                        {actionTypes.map(actionType => (
                          <option key={actionType.id} value={actionType.id}>{actionType.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    {actionTypes.find(at => at.id === action.type)?.hasDuration && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={action.duration}
                          onChange={(e) => handleActionChange(index, 'duration', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="30"
                        />
                      </div>
                    )}

                    {/* Notification */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={action.notification}
                        onChange={(e) => handleActionChange(index, 'notification', e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                        Send Notification
                      </label>
                    </div>
                  </div>
                  {errors[`action_${index}`] && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`action_${index}`]}</p>
                  )}
                </div>
              ))}
              {errors.actions && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actions}</p>
              )}
            </div>

            {/* Schedule */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="schedule.enabled"
                    checked={formData.schedule.enabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Enable scheduled activation
                  </label>
                </div>

                {formData.schedule.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name="schedule.start_time"
                        value={formData.schedule.start_time}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        End Time
                      </label>
                      <input
                        type="time"
                        name="schedule.end_time"
                        value={formData.schedule.end_time}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Active Days
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map(day => (
                          <label key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.schedule.days.includes(day)}
                              onChange={() => handleScheduleDayChange(day)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="ml-1 text-sm text-gray-900 dark:text-white">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </h4>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notifications.email"
                    checked={formData.notifications.email}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Email notifications
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="notifications.webhook"
                    checked={formData.notifications.webhook}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Webhook notifications
                  </label>
                </div>

                {formData.notifications.webhook && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      name="notifications.webhook_url"
                      value={formData.notifications.webhook_url}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.webhook_url 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="https://your-app.com/webhooks/security-alerts"
                    />
                    {errors.webhook_url && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.webhook_url}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Exceptions */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Exceptions
              </h4>
              
              <div className="space-y-6">
                {/* IP Whitelist */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    IP Whitelist
                  </label>
                  <input
                    type="text"
                    value={formData.exceptions.ip_whitelist}
                    onChange={(e) => handleExceptionChange('ip_whitelist', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="192.168.1.1, 10.0.0.1"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Comma-separated IP addresses that are exempt from this rule
                  </p>
                </div>

                {/* User Whitelist */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Whitelist
                  </label>
                  <div className="space-y-2">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.exceptions.user_whitelist.includes(user.id)}
                          onChange={() => handleExceptionChange('user_whitelist', user.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {user.name} ({user.email})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Device Whitelist */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Device Whitelist
                  </label>
                  <div className="space-y-2">
                    {devices.map(device => (
                      <label key={device.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.exceptions.device_whitelist.includes(device.id)}
                          onChange={() => handleExceptionChange('device_whitelist', device.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {device.name} ({device.type})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
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
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {rule ? 'Update Rule' : 'Create Rule'}
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

export default SecurityRuleForm;