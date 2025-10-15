const AuditLog = require('../models/enquiry/AuditLog');

/**
 * Middleware to automatically log model operations
 * @param {Object} options - Configuration options
 * @returns {Function} Middleware function
 */
const auditLogger = (options = {}) => {
  return async (req, res, next) => {
    // Store the original methods to restore them later
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Track if we've already logged for this request
    let logged = false;

    // Function to determine entity type from request path
    const getEntityTypeFromPath = (path) => {
      const pathSegments = path.split('/');
      
      // Map common path patterns to entity types
      const pathMappings = {
        'enquiries': 'Enquiry',
        'tasks': 'Task',
        'status-logs': 'StatusLog',
        'assignment-logs': 'AssignmentLog',
        'communication-logs': 'CommunicationLog',
        'call-logs': 'CallLog',
        'call-feedback': 'CallFeedback',
        'notifications': 'NotificationLog',
        'integration-configs': 'IntegrationConfig',
        'status-types': 'StatusType',
        'priority-score-types': 'PriorityScoreType',
        'source-channels': 'SourceChannel',
        'automation-rules': 'AutomationRule',
        'automation-triggers': 'AutomationTrigger',
        'users': 'User'
      };
      
      // Try to find a match in the path segments
      for (const segment of pathSegments) {
        if (pathMappings[segment]) {
          return pathMappings[segment];
        }
      }
      
      return 'Other';
    };

    // Function to determine action from request method
    const getActionFromMethod = (method, path) => {
      switch (method.toUpperCase()) {
        case 'POST':
          if (path.includes('login')) return 'LOGIN';
          if (path.includes('logout')) return 'LOGOUT';
          return 'CREATE';
        case 'GET':
          return 'READ';
        case 'PUT':
        case 'PATCH':
          if (path.includes('assign')) return 'ASSIGN';
          if (path.includes('activate')) return 'ACTIVATE';
          if (path.includes('deactivate')) return 'DEACTIVATE';
          return 'UPDATE';
        case 'DELETE':
          return 'DELETE';
        default:
          return 'OTHER';
      }
    };

    // Function to create audit log
    const createAuditLog = async (statusCode, responseBody) => {
      if (logged) return;
      logged = true;
      
      try {
        // Skip logging for certain paths if configured
        if (options.excludePaths && options.excludePaths.some(path => req.path.includes(path))) {
          return;
        }

        // Determine entity type and ID
        let entityType = options.entityType || getEntityTypeFromPath(req.path);
        let entityId = req.params.id || (responseBody && responseBody.data && responseBody.data._id) || 'unknown';
        
        // Determine action
        const action = options.action || getActionFromMethod(req.method, req.path);
        
        // Prepare changes array
        let changes = [];
        if (req.method === 'PUT' || req.method === 'PATCH') {
          // For updates, log the changes
          const requestBody = req.body;
          Object.keys(requestBody).forEach(key => {
            changes.push({
              field: key,
              new_value: requestBody[key],
              old_value: null, // We don't have the old value here
              change_type: 'modified'
            });
          });
        } else if (req.method === 'POST' && responseBody && responseBody.data) {
          // For creates, log all fields as added
          const newData = responseBody.data;
          Object.keys(newData).forEach(key => {
            if (key !== '_id' && key !== '__v' && key !== 'created_at' && key !== 'updated_at') {
              changes.push({
                field: key,
                new_value: newData[key],
                old_value: null,
                change_type: 'added'
              });
            }
          });
        }

        // Create the audit log
        await AuditLog.createLog(
          req.user ? req.user.id : null,
          entityType,
          entityId,
          action,
          changes,
          {
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            status: statusCode >= 400 ? 'failure' : 'success',
            severity: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low',
            description: `${req.method} ${req.originalUrl}`,
            session_id: req.session ? req.session.id : null,
            correlation_id: req.headers['x-correlation-id'] || null
          }
        );
      } catch (err) {
        console.error('Error creating audit log:', err);
        // Log to a dedicated error file for audit failures
        const errorDetails = {
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          method: req.method,
          userId: req.user ? req.user.id : null,
          error: err.message,
          stack: err.stack
        };
        
        // Continue request processing despite audit log error
        console.error('AUDIT LOG ERROR:', JSON.stringify(errorDetails));
      }
    };

    // Override res.send
    res.send = function (body) {
      let statusCode = res.statusCode;
      let responseBody;
      
      try {
        responseBody = JSON.parse(body);
      } catch (e) {
        responseBody = body;
      }
      
      createAuditLog(statusCode, responseBody);
      return originalSend.apply(res, arguments);
    };

    // Override res.json
    res.json = function (body) {
      let statusCode = res.statusCode;
      createAuditLog(statusCode, body);
      return originalJson.apply(res, arguments);
    };

    // Handle errors and failed requests
    res.on('finish', () => {
      if (!logged && res.statusCode >= 400) {
        createAuditLog(res.statusCode);
      }
    });

    next();
  };
};

module.exports = auditLogger;