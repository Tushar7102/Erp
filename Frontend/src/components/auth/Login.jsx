import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Phone, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    loginType: 'email' // 'email' or 'phone'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [sessionMessage, setSessionMessage] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  // Check for session messages on component mount
  useEffect(() => {
    const message = localStorage.getItem('sessionMessage');
    if (message) {
      setSessionMessage(message);
      localStorage.removeItem('sessionMessage'); // Clear after displaying
    }
  }, []);

  const dismissSessionMessage = () => {
    setSessionMessage(null);
  };

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
      newErrors.email = formData.loginType === 'email' ? 'Email is required' : 'Phone number is required';
    } else if (formData.loginType === 'email' && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (formData.loginType === 'phone' && !/^\d{10}$/.test(formData.email.replace(/\D/g, ''))) {
      newErrors.email = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await login(formData);
    
    if (result.success) {
      // Role-based redirection
      const userRole = result.user.role.role_name.toLowerCase();
      switch (userRole) {
        case 'admin':
          navigate('/dashboard');
          break;
        case 'manager':
          navigate('/dashboard');
          break;
        case 'hr':
          navigate('/dashboard');
          break;
        case 'engineer':
          navigate('/dashboard');
          break;
        case 'telecaller':
          navigate('/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      setErrors({ submit: result.error || 'Login failed. Please try again.' });
    }
  };

  const toggleLoginType = () => {
    setFormData(prev => ({
      ...prev,
      loginType: prev.loginType === 'email' ? 'phone' : 'email',
      email: ''
    }));
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with proper gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white w-full">
          <div className="mb-8">
            {/* Logo/Icon */}
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold mb-4 leading-tight">CRM + ERP System</h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Streamline your business operations with our comprehensive management solution
            </p>
          </div>
          
          {/* Features List */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Customer Relationship Management</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Enterprise Resource Planning</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-white/90">Advanced Analytics & Reporting</span>
            </div>
          </div>
        </div>
        
        {/* Beautiful SVG Illustration */}
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2 opacity-20">
          <svg width="300" height="400" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Dashboard/Analytics Illustration */}
            <g opacity="0.8">
              {/* Main Dashboard */}
              <rect x="50" y="80" width="200" height="240" rx="12" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="2"/>
              
              {/* Header */}
              <rect x="60" y="90" width="180" height="30" rx="6" fill="white" fillOpacity="0.15"/>
              <circle cx="75" cy="105" r="6" fill="white" fillOpacity="0.3"/>
              <rect x="90" y="100" width="60" height="10" rx="5" fill="white" fillOpacity="0.3"/>
              
              {/* Charts */}
              <rect x="60" y="135" width="80" height="60" rx="8" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1"/>
              <rect x="160" y="135" width="80" height="60" rx="8" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1"/>
              
              {/* Bar Chart */}
              <rect x="70" y="175" width="8" height="15" fill="white" fillOpacity="0.4"/>
              <rect x="82" y="165" width="8" height="25" fill="white" fillOpacity="0.6"/>
              <rect x="94" y="170" width="8" height="20" fill="white" fillOpacity="0.5"/>
              <rect x="106" y="160" width="8" height="30" fill="white" fillOpacity="0.7"/>
              <rect x="118" y="180" width="8" height="10" fill="white" fillOpacity="0.3"/>
              
              {/* Pie Chart */}
              <circle cx="200" cy="165" r="20" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3"/>
              <path d="M 200 145 A 20 20 0 0 1 220 165 L 200 165 Z" fill="white" fillOpacity="0.4"/>
              <path d="M 220 165 A 20 20 0 0 1 200 185 L 200 165 Z" fill="white" fillOpacity="0.6"/>
              <path d="M 200 185 A 20 20 0 0 1 180 165 L 200 165 Z" fill="white" fillOpacity="0.3"/>
              
              {/* Data Rows */}
              <rect x="60" y="210" width="180" height="15" rx="4" fill="white" fillOpacity="0.1"/>
              <rect x="60" y="230" width="180" height="15" rx="4" fill="white" fillOpacity="0.1"/>
              <rect x="60" y="250" width="180" height="15" rx="4" fill="white" fillOpacity="0.1"/>
              <rect x="60" y="270" width="180" height="15" rx="4" fill="white" fillOpacity="0.1"/>
              
              {/* Small indicators */}
              <circle cx="70" cy="217" r="3" fill="white" fillOpacity="0.5"/>
              <circle cx="70" cy="237" r="3" fill="white" fillOpacity="0.5"/>
              <circle cx="70" cy="257" r="3" fill="white" fillOpacity="0.5"/>
              <circle cx="70" cy="277" r="3" fill="white" fillOpacity="0.5"/>
              
              {/* Floating Elements */}
              <circle cx="280" cy="60" r="15" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1"/>
              <circle cx="20" cy="350" r="20" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1"/>
              <rect x="10" y="50" width="25" height="25" rx="6" fill="white" fillOpacity="0.1" stroke="white" strokeWidth="1"/>
              
              {/* Connection Lines */}
              <line x1="100" y1="40" x2="150" y2="70" stroke="white" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="5,5"/>
              <line x1="250" y1="100" x2="280" y2="60" stroke="white" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="5,5"/>
            </g>
          </svg>
        </div>
        
        {/* Decorative geometric elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full backdrop-blur-sm"></div>
        <div className="absolute top-40 left-10 w-16 h-16 bg-white/5 rounded-lg rotate-45"></div>
        <div className="absolute bottom-40 right-10 w-20 h-20 bg-white/5 rounded-lg rotate-12"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="lg:hidden w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>

            {/* Session Message Display */}
            {sessionMessage && (
              <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg relative">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-amber-700 font-medium">
                      Session Notice
                    </p>
                    <p className="text-sm text-amber-600 mt-1">
                      {sessionMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={dismissSessionMessage}
                    className="flex-shrink-0 ml-3 text-amber-400 hover:text-amber-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {formData.loginType === 'email' ? 'Email Address' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      {formData.loginType === 'email' ? (
                        <Mail className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Phone className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <input
                      id="email"
                      name="email"
                      type={formData.loginType === 'email' ? 'email' : 'tel'}
                      autoComplete={formData.loginType === 'email' ? 'email' : 'tel'}
                      required
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-gray-50 focus:bg-white transition-all duration-200 ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
                      } focus:ring-4 focus:outline-none`}
                      placeholder={formData.loginType === 'email' ? 'Enter your email address' : 'Enter your phone number'}
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-red-600 flex items-center"><span className="mr-1">⚠️</span>{errors.email}</p>}
                  
                  <button
                    type="button"
                    onClick={toggleLoginType}
                    className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Use {formData.loginType === 'email' ? 'phone number' : 'email'} instead
                  </button>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl bg-gray-50 focus:bg-white transition-all duration-200 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'
                      } focus:ring-4 focus:outline-none`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-red-600 flex items-center"><span className="mr-1">⚠️</span>{errors.password}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
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
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>

              <div className="text-center">
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <p className="text-sm font-medium text-primary-800 mb-2">Demo Credentials</p>
                  <div className="text-xs text-primary-600 space-y-1">
                    <p><strong>Admin:</strong> admin@example.com</p>
                    <p><strong>Manager:</strong> manager@example.com</p>
                    <p><strong>HR:</strong> hr@example.com</p>
                    <p><strong>Password:</strong> password123</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;