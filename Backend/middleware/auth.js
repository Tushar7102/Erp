const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/profile/User');
const Role = require('../models/auth/Role');
const ModulePermission = require('../models/auth/ModulePermission');
const EmployeeRoleAssignment = require('../models/auth/EmployeeRoleAssignment');
const Session = require('../models/auth/Session');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Set token from cookie
  if (req.cookies?.token) {
    token = req.cookies.token;
  }
  // Or from Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorResponse('Authentication failed - invalid or expired token', 401));
    }

    // Check if user is active
    if (!user.is_active) {
      return next(new ErrorResponse('Your account is not verified. Please check your email for verification link.', 401));
    }

    // Check if session is active
    const session = await Session.findOne({ token, user_id: user._id });
    if (!session) {
      return next(new ErrorResponse('Session not found - please login again', 401));
    }

    if (!session.is_active) {
      // Check if session was terminated by admin
      if (session.is_terminated) {
        return next(new ErrorResponse('Your session has been terminated by an administrator. Please login again.', 401));
      }
      return next(new ErrorResponse('Your session is no longer active. Please login again.', 401));
    }

    // Check if session has expired
    if (session.expires_at < new Date()) {
      // Mark session as inactive
      session.is_active = false;
      await session.save();
      return next(new ErrorResponse('Your session has expired. Please login again.', 401));
    }

    req.user = user;
    req.session = session; // Add session to request for potential future use
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    // Get user with role
    const user = await User.findById(req.user.id).populate('role_id');

    if (!user || !user.role_id) {
      return next(new ErrorResponse('User role not found', 403));
    }

    // Check if user role is in allowed roles (case-insensitive)
    const userRole = (user.role_id.role_name || '').toLowerCase();
    const allowedRoles = roles.map(role => role.toLowerCase());
    
    if (!allowedRoles.includes(userRole)) {
      return next(
        new ErrorResponse(
          `User role ${user.role_id.role_name} is not authorized to access this route`,
          403
        )
      );
    }

    next();
  });
};

// Legacy permission check (for backward compatibility)
exports.checkPermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    // Admin has all permissions
    if (req.user.role === 'Admin') {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return next(
        new ErrorResponse(
          `Access denied. Required permission: ${permission}`,
          403
        )
      );
    }

    next();
  });
};

// Module-level permission check
exports.checkModulePermission = (moduleName, permissionType) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    // Admin has all permissions
    if (req.user.role === 'Admin') {
      return next();
    }

    try {
      // Get user's role assignment
      const assignment = await EmployeeRoleAssignment.getActiveAssignment(req.user._id);
      
      if (!assignment) {
        return next(new ErrorResponse('No active role assignment found', 403));
      }

      // Get user's effective permissions
      const userPermissions = await EmployeeRoleAssignment.getUserPermissions(req.user._id);
      
      // Check for the specific module permission
      const requiredPermission = `${moduleName.toLowerCase().replace(/\s+/g, '_')}_${permissionType}`;
      
      if (!userPermissions.includes(requiredPermission)) {
        return next(
          new ErrorResponse(
            `Access denied. Required permission: ${requiredPermission}`,
            403
          )
        );
      }

      next();
    } catch (error) {
      return next(new ErrorResponse('Error checking permissions', 500));
    }
  });
};

// Enhanced permission check that supports both legacy and module permissions
exports.checkPermissionEnhanced = (permission, moduleName = null, permissionType = null) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    // Admin has all permissions
    if (req.user.role === 'Admin') {
      return next();
    }

    try {
      let hasPermission = false;

      // Check legacy permission first
      if (req.user.permissions && req.user.permissions.includes(permission)) {
        hasPermission = true;
      }

      // If no legacy permission and module info provided, check module permission
      if (!hasPermission && moduleName && permissionType) {
        const userPermissions = await EmployeeRoleAssignment.getUserPermissions(req.user._id);
        const modulePermission = `${moduleName.toLowerCase().replace(/\s+/g, '_')}_${permissionType}`;
        hasPermission = userPermissions.includes(modulePermission);
      }

      if (!hasPermission) {
        return next(
          new ErrorResponse(
            `Access denied. Required permission: ${permission}`,
            403
          )
        );
      }

      next();
    } catch (error) {
      return next(new ErrorResponse('Error checking permissions', 500));
    }
  });
};

// Check module access (view permission)
exports.checkModuleAccess = (moduleName) => {
  return exports.checkModulePermission(moduleName, 'view');
};

// Check role assignment management permission
exports.checkRoleAssignmentPermission = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('User not authenticated', 401));
  }

  // Only Admin and HR can manage role assignments
  if (!['Admin', 'HR'].includes(req.user.role)) {
    return next(
      new ErrorResponse(
        'Access denied. Only Admin and HR can manage role assignments',
        403
      )
    );
  }

  next();
});