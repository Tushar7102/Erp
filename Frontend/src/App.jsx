import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { InfoProfileProvider } from './context/InfoProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Main Pages
import Dashboard from './pages/Dashboard';

// Info Profile Pages
import InfoProfilesList from './pages/info/InfoProfilesList';
import InfoProfileDetail from './pages/info/InfoProfileDetail';
import CreateInfoRequest from './pages/info/CreateInfoRequest';
import AssignInfoRequest from './pages/info/AssignInfoRequest';
import FeedbackAndClosure from './pages/info/FeedbackAndClosure';

// User Management Pages
import UserManagement from './pages/user-management/UserManagement';
import RolePermissions from './pages/user-management/RolePermissions';
import SessionManagement from './pages/user-management/SessionManagement';
import TeamsManagement from './pages/user-management/TeamsManagement';
import EmployeeRoleAssignment from './pages/user-management/EmployeeRoleAssignment';
// import DeviceRegistry from './pages/user-management/DeviceRegistry';
import ApiTokens from './pages/user-management/ApiTokens';
import SecurityLogs from './pages/user-management/SecurityLogs';
import AutomatedSecurityRules from './pages/user-management/AutomatedSecurityRules';

// Enquiry Management Pages
import EnquiryList from './pages/Enquire-management/EnquiryList';
import EnquiryDetail from './pages/Enquire-management/components/EnquiryDetail';
import TaskManagement from './pages/Enquire-management/TaskManagement';
import CommunicationLog from './pages/Enquire-management/CommunicationLog';
import ConversionWizard from './pages/Enquire-management/ConversionWizard';
import NotificationCenter from './pages/Enquire-management/NotificationCenter';
import SLAMonitoring from './pages/Enquire-management/SLAMonitoring';
import CallManagement from './pages/Enquire-management/CallManagement';
import AssignmentLog from './pages/Enquire-management/AssignmentLog';
import StatusLog from './pages/Enquire-management/StatusLog';
import AuditLog from './pages/Enquire-management/AuditLog';
import ProfileMapping from './pages/Enquire-management/ProfileMapping';
import IntegrationConfig from './pages/Enquire-management/IntegrationConfig';
import LeadValidation from './pages/Enquire-management/LeadValidation';
import LeadScoring from './pages/Enquire-management/LeadScoring';

// New UI Components
import AutomationRules from "./components/AutomationRules";
import ExternalIntegrations from "./components/ExternalIntegrations";
import KPIDashboard from "./components/KPIDashboard";
import AISuggestionPanel from "./components/AISuggestionPanel";
import DeduplicationSettings from "./components/DeduplicationSettings";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InfoProfileProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* Dashboard */}
                <Route index element={<Dashboard />} />
                
                {/* Info Profile Routes */}
                <Route path="/info" element={<InfoProfilesList />} />
                <Route path="/info/:id" element={<InfoProfileDetail />} />
                <Route path="/info/create" element={<CreateInfoRequest />} />
                <Route path="/info/:id/assign" element={<AssignInfoRequest />} />
                <Route path="/info/:id/feedback" element={<FeedbackAndClosure />} />
                
                {/* User Management Routes */}
              <Route path="/user-management/users" element={<UserManagement />} />
              <Route path="/user-management/roles" element={<RolePermissions />} />
              <Route path="/user-management/teams" element={<TeamsManagement />} />
              <Route path="/user-management/employee-roles" element={<EmployeeRoleAssignment />} />
              <Route path="/user-management/sessions" element={<SessionManagement />} />
              <Route path="/user-management/api-tokens" element={<ApiTokens />} />
              <Route path="/user-management/security-logs" element={<SecurityLogs />} />
              <Route path="/user-management/security-rules" element={<AutomatedSecurityRules />} />
                
                {/* Legacy routes for backward compatibility */}
                <Route path="users" element={<UserManagement />} />
                <Route path="roles" element={<RolePermissions />} />
                <Route path="sessions" element={<SessionManagement />} />
                
                {/* Placeholder routes for future implementation */}
                <Route path="leads" element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Leads management coming soon...</p>
                  </div>
                } />
                
                <Route path="projects" element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Project management coming soon...</p>
                  </div>
                } />
                
                <Route path="tasks" element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Task management coming soon...</p>
                  </div>
                } />
                
                <Route path="calendar" element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Calendar view coming soon...</p>
                  </div>
                } />
                
                <Route path="reports" element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Reports and analytics coming soon...</p>
                  </div>
                } />
                
                {/* Enquiry Management Routes */}
                <Route path="/enquiry-management" element={<EnquiryList />} />
                <Route path="/enquiry/:id" element={<EnquiryDetail />} />
                <Route path="/enquiry-management/tasks" element={<TaskManagement />} />
                <Route path="/enquiry-management/communication" element={<CommunicationLog />} />
                <Route path="/enquiry-management/conversion" element={<ConversionWizard />} />
                <Route path="/enquiry-management/notifications" element={<NotificationCenter />} />
                <Route path="/enquiry-management/sla" element={<SLAMonitoring />} />
                <Route path="/enquiry-management/calls" element={<CallManagement />} />
                <Route path="/enquiry-management/assignment-log" element={<AssignmentLog />} />
                <Route path="/enquiry-management/status-log" element={<StatusLog />} />
                <Route path="/enquiry-management/audit-log" element={<AuditLog />} />
                <Route path="/enquiry-management/profile-mapping" element={<ProfileMapping />} />
                <Route path="/enquiry-management/integration-config" element={<IntegrationConfig />} />
                <Route path="/enquiry-management/lead-validation" element={<LeadValidation />} />
                <Route path="/enquiry-management/lead-scoring" element={<LeadScoring />} />
                
                {/* New UI Components Routes */}
                <Route path="/automation-rules" element={<AutomationRules />} />
                <Route path="/external-integrations" element={<ExternalIntegrations />} />
                <Route path="/kpi-dashboard" element={<KPIDashboard />} />
                <Route path="/ai-suggestion-panel" element={<AISuggestionPanel />} />
                <Route path="/deduplication-settings" element={<DeduplicationSettings />} />
                
                <Route path="settings" element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Application settings coming soon...</p>
                  </div>
                } />
                
                <Route path="profile" element={
                  <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">User profile management coming soon...</p>
                  </div>
                } />
              </Route>
              
              {/* Catch all route - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </InfoProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;