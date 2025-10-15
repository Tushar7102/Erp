import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, ArrowLeft, CheckCircle, Shield, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: '',
    resetType: 'email' // 'email' or 'phone'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleChange = (e) => {
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
    
    if (!formData.email.trim()) {
      newErrors.email = formData.resetType === 'email' ? 'Email is required' : 'Phone number is required';
    } else if (formData.resetType === 'email' && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.resetType === 'phone' && !/^\d{10}$/.test(formData.email.replace(/\D/g, ''))) {
      newErrors.email = 'Please enter a valid 10-digit phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await forgotPassword(formData.email);
      
      if (result.success) {
        setIsSubmitted(true);
      } else {
        setErrors({ submit: result.error || 'Failed to send reset link. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleResetType = () => {
    setFormData(prev => ({
      ...prev,
      resetType: prev.resetType === 'email' ? 'phone' : 'email',
      email: ''
    }));
    setErrors({});
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-primary-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Check your {formData.resetType}
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <span className="font-semibold text-gray-900">{formData.email}</span>
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-primary-800 mb-2">
                    Didn't receive the {formData.resetType === 'email' ? 'email' : 'SMS'}?
                  </h3>
                  <ul className="text-sm text-primary-700 space-y-1">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                      Check your spam folder
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                      Verify {formData.email} is correct
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                      Wait 2-3 minutes for delivery
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try different {formData.resetType === 'email' ? 'email' : 'phone number'}
              </button>
              
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Password Recovery</h1>
            <p className="text-xl text-primary-100 mb-8">
              Secure and quick password reset process to get you back to your dashboard
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-primary-100">Secure verification process</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-primary-100">Multiple recovery options</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-primary-100">Instant password reset</span>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-6">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
              
              <div className="text-center">
                <div className="lg:hidden w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {formData.resetType === 'email' ? (
                    <Mail className="w-6 h-6 text-white" />
                  ) : (
                    <Phone className="w-6 h-6 text-white" />
                  )}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                <p className="text-gray-600">No worries, we'll send you reset instructions</p>
              </div>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.resetType === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {formData.resetType === 'email' ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Phone className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    id="email"
                    name="email"
                    type={formData.resetType === 'email' ? 'email' : 'tel'}
                    autoComplete={formData.resetType === 'email' ? 'email' : 'tel'}
                    required
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-gray-50 focus:bg-white transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
                    } focus:ring-4 focus:outline-none`}
                    placeholder={formData.resetType === 'email' ? 'Enter your email address' : 'Enter your phone number'}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-red-600 flex items-center"><span className="mr-1">⚠️</span>{errors.email}</p>}
                
                <button
                  type="button"
                  onClick={toggleResetType}
                  className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Use {formData.resetType === 'email' ? 'phone number' : 'email'} instead
                </button>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-red-400">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{errors.submit}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    `Send Reset ${formData.resetType === 'email' ? 'Email' : 'SMS'}`
                  )}
                </button>
              </div>

              <div className="text-center">
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <p className="text-sm font-medium text-primary-800 mb-2">Security Notice</p>
                  <p className="text-xs text-primary-600">
                    Reset links expire in 15 minutes for your security. If you don't receive the message, please check your spam folder.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;