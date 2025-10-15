const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import middleware
const errorHandler = require('./middleware/error');
const asyncHandler = require('./middleware/async');
const cookieParser = require('cookie-parser');

// Import auth routes
const authRoutes = require('./routes/auth');
const securityRoutes = require('./routes/auth/security');

// Import profile routes
const projectProfileRoutes = require('./routes/profile/projectProfiles');
const productProfileRoutes = require('./routes/profile/productProfiles');
const amcProfileRoutes = require('./routes/profile/amcProfiles');
const complaintProfileRoutes = require('./routes/profile/complaintProfiles');
const jobProfileRoutes = require('./routes/profile/jobProfiles');
const infoProfileRoutes = require('./routes/profile/infoProfiles');
const siteVisitScheduleRoutes = require('./routes/profile/siteVisitSchedules');
const profileMappingRoutes = require('./routes/profile/profileMappings');
const profileToProfileLinksRoutes = require('./routes/profile/profileToProfileLinks');
const teamsRoutes = require('./routes/profile/teams');
const notificationLogRoutes = require('./routes/profile/notificationLogs');
const userActivityLogRoutes = require('./routes/profile/userActivityLogs');
const customerMasterRoutes = require('./routes/profile/customerMaster');
const employeeRoutes = require('./routes/profile/employees');
const roleRoutes = require('./routes/profile/roles');
const deviceRegistryRoutes = require('./routes/profile/deviceRegistry');

// Import Info routes
const infoTypesRoutes = require('./routes/info/infoTypes');
const infoStatusesRoutes = require('./routes/info/infoStatuses');
const infoActionsRoutes = require('./routes/info/infoActions');
const infoSlaRulesRoutes = require('./routes/info/infoSlaRules');
const infoAuditLogsRoutes = require('./routes/info/infoAuditLogs');
const infoAttachmentsRoutes = require('./routes/info/infoAttachments');
const infoFeedbacksRoutes = require('./routes/info/infoFeedbacks');
const infoResponsesRoutes = require('./routes/info/infoResponses');

// Import enquiry routes
const enquiryRoutes = require('./routes/enquiry/enquiries');
const statusLogRoutes = require('./routes/enquiry/statusLogs');
const assignmentLogRoutes = require('./routes/enquiry/assignmentLogs');
const communicationLogRoutes = require('./routes/enquiry/communicationLogs');
const callLogRoutes = require('./routes/enquiry/callLogs');
const taskRoutes = require('./routes/enquiry/tasks');
const integrationConfigRoutes = require('./routes/enquiry/integrationConfigs');
const validationRoutes = require('./routes/enquiry/validation');
const sourceChannelRoutes = require('./routes/enquiry/sourceChannels');
const statusTypeRoutes = require('./routes/enquiry/statusTypes');
const automationRuleRoutes = require('./routes/enquiry/automationRules');
const automationTriggerRoutes = require('./routes/enquiry/automationTriggers');
const auditLogRoutes = require('./routes/enquiry/auditLogs');
const priorityScoreTypeRoutes = require('./routes/enquiry/priorityScoreTypes');

const app = express();

// Connect to database
connectDB();

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Enable CORS
app.use(cors({
    origin: ['http://localhost:3000', 'https://crm-server-orpin.vercel.app'],
    credentials: true
}));

// Authentication API Routes
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/enquiries/validation', validationRoutes);

// API Routes
app.use('/api/profiles/project', projectProfileRoutes);
app.use('/api/profiles/product', productProfileRoutes);
app.use('/api/profiles/amc', amcProfileRoutes);
app.use('/api/profiles/complaint', complaintProfileRoutes);
app.use('/api/profiles/job', jobProfileRoutes);
app.use('/api/profiles/info', infoProfileRoutes);
app.use('/api/profiles/site-visit', siteVisitScheduleRoutes);
app.use('/api/profiles/mappings', profileMappingRoutes);
app.use('/api/profiles/links', profileToProfileLinksRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/notifications', notificationLogRoutes);
app.use('/api/notification-logs', notificationLogRoutes);
app.use('/api/user-activity-logs', userActivityLogRoutes);
app.use('/api/customers', customerMasterRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/devices', deviceRegistryRoutes);

// Info Management API Routes
app.use('/api/info/types', infoTypesRoutes);
app.use('/api/info/statuses', infoStatusesRoutes);
app.use('/api/info/actions', infoActionsRoutes);
app.use('/api/info/sla-rules', infoSlaRulesRoutes);
app.use('/api/info/audit-logs', infoAuditLogsRoutes);
app.use('/api/info/attachments', infoAttachmentsRoutes);
app.use('/api/info/feedbacks', infoFeedbacksRoutes);
app.use('/api/info/responses', infoResponsesRoutes);

// Enquiry Management API Routes
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/status-logs', statusLogRoutes);
app.use('/api/assignment-logs', assignmentLogRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/communication-logs', communicationLogRoutes);
app.use('/api/call-logs', callLogRoutes);
app.use('/api/source-channels', sourceChannelRoutes);
app.use('/api/status-types', statusTypeRoutes);
app.use('/api/automation-rules', automationRuleRoutes);
app.use('/api/automation-triggers', automationTriggerRoutes);
app.use('/api/integration-configs', integrationConfigRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/priority-score-types', priorityScoreTypeRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Profile Backend Server is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Profile & Enquiry Management Backend API',
        version: '1.0.0',
        endpoints: {
            profiles: {
                project: '/api/profiles/project',
                product: '/api/profiles/product',
                amc: '/api/profiles/amc',
                complaint: '/api/profiles/complaint',
                job: '/api/profiles/job',
                info: '/api/profiles/info',
                siteVisit: '/api/profiles/site-visit'
            },
            info: {
                types: '/api/info/types',
                statuses: '/api/info/statuses',
                actions: '/api/info/actions',
                slaRules: '/api/info/sla-rules',
                auditLogs: '/api/info/audit-logs',
                attachments: '/api/info/attachments',
                feedbacks: '/api/info/feedbacks',
                responses: '/api/info/responses'
            },
            enquiry: {
                enquiries: '/api/enquiries',
                statusLogs: '/api/status-logs',
                assignmentLogs: '/api/assignment-logs',
                tasks: '/api/tasks',
                communicationLogs: '/api/communication-logs',
                callLogs: '/api/call-logs',
                sourceChannels: '/api/source-channels',
                statusTypes: '/api/status-types',
                automationRules: '/api/automation-rules',
                automationTriggers: '/api/automation-triggers',
                integrationConfigs: '/api/integration-configs',
                auditLogs: '/api/audit-logs',
                priorityScoreTypes: '/api/priority-score-types'
            },
            system: {
                mapping: '/api/profiles/mapping',
                links: '/api/profiles/links',
                teams: '/api/teams',
                notifications: '/api/notifications'
            },
            health: '/api/health'
        }
    });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🚀 Profile Backend Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📋 API Documentation: http://localhost:${PORT}/`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});

module.exports = app;