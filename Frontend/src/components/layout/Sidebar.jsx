// React and Router imports
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// Icon imports
import { 
  // Navigation icons
  LayoutDashboard,
  MessageSquare,
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings,
  Phone,
  Mail,
  Calendar,
  ClipboardList,
  Bell,
  ListChecks,
  ArrowRightCircle,
  Zap,
  Link,
  Bot,
  GitCompare,
  
  // User management icons
  Shield,
  UserCheck,
  UserPlus,
  Monitor,
  Smartphone,
  Key,
  Activity,
  Lock,
  
  // UI control icons
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  
  // Check if current path is user management related
  const isUserManagementPath = location.pathname.startsWith('/user-management');
  const [userManagementOpen, setUserManagementOpen] = useState(isUserManagementPath);

  // Auto-open/close User Management dropdown based on current route
  useEffect(() => {
    setUserManagementOpen(isUserManagementPath);
  }, [isUserManagementPath]);

  // Check if current path is enquiry management related
  const isEnquiryManagementPath = location.pathname.startsWith('/enquiry-management');
  const [enquiryManagementOpen, setEnquiryManagementOpen] = useState(isEnquiryManagementPath);

  // Auto-open/close Enquiry Management dropdown based on current route
  useEffect(() => {
    setEnquiryManagementOpen(isEnquiryManagementPath);
  }, [isEnquiryManagementPath]);
  
  // Check if current path is info profile related
  const isInfoProfilePath = location.pathname.startsWith('/info');
  const [infoProfileOpen, setInfoProfileOpen] = useState(isInfoProfilePath);

  // Auto-open/close Info Profile dropdown based on current route
  useEffect(() => {
    setInfoProfileOpen(isInfoProfilePath);
  }, [isInfoProfilePath]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: location.pathname === '/' },
    { name: 'Reports', href: '/reports', icon: BarChart3, current: location.pathname === '/reports' },
    { name: 'Settings', href: '/settings', icon: Settings, current: location.pathname === '/settings' }
  ];
  
  // Info Profile items
  const infoProfileItems = [
    { name: 'Info Profiles List', href: '/info', icon: FileText, current: location.pathname === '/info' },
    { name: 'Create Info Request', href: '/info/create', icon: FileText, current: location.pathname === '/info/create' },
    { name: 'Assign Info Request', href: '/info/assign', icon: ArrowRightCircle, current: location.pathname.includes('/info') && location.pathname.includes('/assign') }
    // Feedback & Closure removed as it's similar to Assign Info Request
  ];
  
  // Enquiry management items
  const enquiryManagementItems = [
    { name: 'Enquiry List', href: '/enquiry-management', icon: MessageSquare, current: location.pathname === '/enquiry-management' },
    { name: 'Tasks', href: '/enquiry-management/tasks', icon: ClipboardList, current: location.pathname === '/enquiry-management/tasks' },
    { name: 'Communication', href: '/enquiry-management/communication', icon: Mail, current: location.pathname === '/enquiry-management/communication' },
    { name: 'Conversion', href: '/enquiry-management/conversion', icon: UserPlus, current: location.pathname === '/enquiry-management/conversion' },
    { name: 'Notifications', href: '/enquiry-management/notifications', icon: Bell, current: location.pathname === '/enquiry-management/notifications' },
    { name: 'SLA Monitoring', href: '/enquiry-management/sla', icon: Activity, current: location.pathname === '/enquiry-management/sla' },
    { name: 'Call Management', href: '/enquiry-management/calls', icon: Phone, current: location.pathname === '/enquiry-management/calls' },
    { name: 'Assignment Log', href: '/enquiry-management/assignment-log', icon: ArrowRightCircle, current: location.pathname === '/enquiry-management/assignment-log' },
    { name: 'Status Log', href: '/enquiry-management/status-log', icon: ListChecks, current: location.pathname === '/enquiry-management/status-log' },
    { name: 'Audit Log', href: '/enquiry-management/audit-log', icon: Shield, current: location.pathname === '/enquiry-management/audit-log' },
    { name: 'Profile Mapping', href: '/enquiry-management/profile-mapping', icon: Users, current: location.pathname === '/enquiry-management/profile-mapping' },
    { name: 'Integration Config', href: '/enquiry-management/integration-config', icon: Settings, current: location.pathname === '/enquiry-management/integration-config' },
    { name: 'Lead Validation', href: '/enquiry-management/lead-validation', icon: UserCheck, current: location.pathname === '/enquiry-management/lead-validation' },
    { name: 'Lead Scoring', href: '/enquiry-management/lead-scoring', icon: BarChart3, current: location.pathname === '/enquiry-management/lead-scoring' },
    { name: 'KPI Dashboard', href: '/kpi-dashboard', icon: BarChart3, current: location.pathname === '/kpi-dashboard' },
    { name: 'Automation Rules', href: '/automation-rules', icon: Zap, current: location.pathname === '/automation-rules' },
    { name: 'External Integrations', href: '/external-integrations', icon: Link, current: location.pathname === '/external-integrations' },
    { name: 'AI Suggestion Panel', href: '/ai-suggestion-panel', icon: Bot, current: location.pathname === '/ai-suggestion-panel' },
    { name: 'Deduplication Settings', href: '/deduplication-settings', icon: GitCompare, current: location.pathname === '/deduplication-settings' },
  ];
    
  // User management related state and items

  const userManagementItems = [
    { name: 'Users', href: '/user-management/users', icon: Users, current: location.pathname === '/user-management/users' },
    { name: 'Roles & Permissions', href: '/user-management/roles', icon: Shield, current: location.pathname === '/user-management/roles' },
    { name: 'Teams Management', href: '/user-management/teams', icon: UserCheck, current: location.pathname === '/user-management/teams' },
    { name: 'Employee Roles', href: '/user-management/employee-roles', icon: UserPlus, current: location.pathname === '/user-management/employee-roles' },
    { name: 'Sessions', href: '/user-management/sessions', icon: Monitor, current: location.pathname === '/user-management/sessions' },
    // { name: 'Device Registry', href: '/user-management/devices', icon: Smartphone, current: location.pathname === '/user-management/devices' },
    { name: 'API Tokens', href: '/user-management/api-tokens', icon: Key, current: location.pathname === '/user-management/api-tokens' },
    { name: 'Security Logs', href: '/user-management/security-logs', icon: Activity, current: location.pathname === '/user-management/security-logs' },
    { name: 'Security Rules', href: '/user-management/security-rules', icon: Lock, current: location.pathname === '/user-management/security-rules' },
  ];

  const isUserManagementActive = userManagementItems.some(item => item.current);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col
        fixed inset-y-0 left-0 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64  
      `}>
        {/* Header */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">CRM</span>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-8 px-4 overflow-y-auto">
          <div className="space-y-2">
            {/* Regular Navigation Items */}
            {navigation.map((item) => {
              const Icon = item.icon;
              
              if (isCollapsed) {
                // Collapsed mode - with title under icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex flex-col items-center justify-center px-2 py-3 text-xs font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                    onClick={(e) => {
                      // Close mobile sidebar when navigating
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                      
                      // Ensure navigation happens
                      e.stopPropagation();
                    }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0 mb-1" />
                    <span className="text-center leading-tight truncate w-full max-w-[3rem]" title={item.name}>
                      {item.name.length > 6 ? `${item.name.substring(0, 6)}...` : item.name}
                    </span>
                  </NavLink>
                );
              }
              
              // Expanded mode - without tooltip
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                  onClick={() => {
                    // Close mobile sidebar when navigating
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <Icon className="h-5 w-5 flex-shrink-0 mr-3" />
                  {item.name}
                  <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              );
            })}

            {/* Enquiry Management Dropdown */}
            <div className="space-y-1">
              {isCollapsed ? (
                // Collapsed mode - show enquiry management items as individual icons
                <div className="space-y-2">
                  {enquiryManagementItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          `group relative flex flex-col items-center justify-center px-2 py-3 text-xs font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }`
                        }
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onClose();
                          }
                        }}
                        title={item.name}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0 mb-1" />
                        <span className="text-center leading-tight truncate w-full max-w-[3rem]">
                          {item.name.length > 6 ? `${item.name.substring(0, 6)}...` : item.name}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              ) : (
                // Expanded mode - show dropdown
                <>
                  <button
                    onClick={() => setEnquiryManagementOpen(!enquiryManagementOpen)}
                    className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isEnquiryManagementPath
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <MessageSquare className="h-5 w-5 flex-shrink-0 mr-3" />
                    Enquiry Management
                    {enquiryManagementOpen ? (
                      <ChevronUp className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  
                  {enquiryManagementOpen && (
                    <div className="ml-6 space-y-1">
                      {enquiryManagementItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                              `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }`
                            }
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                onClose();
                              }
                            }}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0 mr-3" />
                            {item.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Info Profile Dropdown */}
            <div className="space-y-1">
              {isCollapsed ? (
                // Collapsed mode - show info profile items as individual icons
                <div className="space-y-2">
                  {infoProfileItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          `group relative flex flex-col items-center justify-center px-2 py-3 text-xs font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }`
                        }
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onClose();
                          }
                        }}
                        title={item.name}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0 mb-1" />
                        <span className="text-center leading-tight truncate w-full max-w-[3rem]">
                          {item.name.length > 6 ? `${item.name.substring(0, 6)}...` : item.name}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              ) : (
                // Expanded mode - show dropdown
                <>
                  <button
                    onClick={() => setInfoProfileOpen(!infoProfileOpen)}
                    className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isInfoProfilePath
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="h-5 w-5 flex-shrink-0 mr-3" />
                    Info Profile
                    {infoProfileOpen ? (
                      <ChevronUp className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  
                  {infoProfileOpen && (
                    <div className="ml-6 space-y-1">
                      {infoProfileItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                              `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }`
                            }
                            onClick={() => {
                              if (window.innerWidth < 1024) {
                                onClose();
                              }
                            }}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0 mr-3" />
                            {item.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* User Management section starts below */}
            
            {/* User Management Dropdown */}
            <div className="space-y-1">
              {isCollapsed ? (
                // Collapsed mode - show user management items as individual icons
                <div className="space-y-2">
                  {userManagementItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          `group relative flex flex-col items-center justify-center px-2 py-3 text-xs font-medium rounded-lg transition-all duration-200 ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                          }`
                        }
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onClose();
                          }
                        }}
                        title={item.name}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0 mb-1" />
                        <span className="text-center leading-tight truncate w-full max-w-[3rem]">
                          {item.name.length > 6 ? `${item.name.substring(0, 6)}...` : item.name}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              ) : (
                // Expanded mode - show dropdown
                <>
                  <button
                    onClick={() => setUserManagementOpen(!userManagementOpen)}
                    className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isUserManagementActive
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Shield className="h-5 w-5 flex-shrink-0 mr-3" />
                    User Management
                    {userManagementOpen ? (
                      <ChevronUp className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    )}
                  </button>
                  
                  {userManagementOpen && (
                    <div className="ml-6 space-y-1">
                      {userManagementItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                              `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive
                                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                              }`
                            }
                            onClick={() => {
                              // Close mobile sidebar when navigating
                              if (window.innerWidth < 1024) {
                                onClose();
                              }
                            }}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0 mr-3" />
                            {item.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>



        {/* Collapse/Expand Toggle Button - Desktop Only */}
        <div className="hidden lg:block p-4 border-t border-gray-200 dark:border-gray-700">
          
            <button
              onClick={onToggleCollapse}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 mr-3" />
                  Collapse
                </>
              )}
            </button>
         
        </div>
      </div>
    </>
  );
};

export default Sidebar;