/**
 * Session Management Validation Utilities
 * Provides comprehensive validation for session and login attempt data
 */

/**
 * Validation schemas for different data types
 */
export const ValidationSchemas = {
  session: {
    required: ['_id', 'user_id', 'device_info', 'ip_address', 'issued_at', 'expires_at', 'is_active'],
    optional: ['session_id', 'token'],
    types: {
      _id: 'string',
      session_id: 'string',
      token: 'string',
      user_id: ['string', 'object'],
      device_info: 'string',
      ip_address: 'string',
      issued_at: ['string', 'object'],
      expires_at: ['string', 'object'],
      is_active: 'boolean'
    }
  },
  
  loginAttempt: {
    required: ['_id', 'user_id', 'email', 'ip_address', 'status', 'timestamp'],
    optional: ['attempt_id', 'device_info', 'reason'],
    types: {
      _id: 'string',
      attempt_id: 'string',
      user_id: ['string', 'object'],
      email: 'string',
      ip_address: 'string',
      device_info: 'string',
      status: 'string',
      reason: 'string',
      timestamp: ['string', 'object']
    }
  },

  user: {
    required: ['_id'],
    optional: ['name', 'first_name', 'last_name', 'email', 'role_id'],
    types: {
      _id: 'string',
      name: 'string',
      first_name: 'string',
      last_name: 'string',
      email: 'string',
      role_id: ['string', 'object']
    }
  }
};

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Check if value is of expected type
 */
function isValidType(value, expectedTypes) {
  const actualType = typeof value;
  const types = Array.isArray(expectedTypes) ? expectedTypes : [expectedTypes];
  
  return types.some(type => {
    switch (type) {
      case 'string':
        return actualType === 'string' && value.length > 0;
      case 'boolean':
        return actualType === 'boolean';
      case 'number':
        return actualType === 'number' && !isNaN(value);
      case 'object':
        return value !== null && actualType === 'object' && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return actualType === type;
    }
  });
}

/**
 * Validate data against schema
 */
export function validateData(data, schemaName) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Data must be a valid object');
  }

  const schema = ValidationSchemas[schemaName];
  if (!schema) {
    throw new ValidationError(`Unknown schema: ${schemaName}`);
  }

  const errors = [];

  // Check required fields
  schema.required.forEach(field => {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Check field types
  Object.keys(data).forEach(field => {
    const value = data[field];
    const expectedTypes = schema.types[field];
    
    if (value !== null && value !== undefined && expectedTypes) {
      if (!isValidType(value, expectedTypes)) {
        errors.push(`Invalid type for field '${field}': expected ${Array.isArray(expectedTypes) ? expectedTypes.join(' or ') : expectedTypes}, got ${typeof value}`);
      }
    }
  });

  if (errors.length > 0) {
    throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Validate session data
 */
export function validateSession(session) {
  try {
    validateData(session, 'session');
    
    // Additional session-specific validations
    if (session.user_id && typeof session.user_id === 'object') {
      validateData(session.user_id, 'user');
    }
    
    // Validate date fields
    const issuedAt = new Date(session.issued_at);
    const expiresAt = new Date(session.expires_at);
    
    if (isNaN(issuedAt.getTime())) {
      throw new ValidationError('Invalid issued_at date', 'issued_at', session.issued_at);
    }
    
    if (isNaN(expiresAt.getTime())) {
      throw new ValidationError('Invalid expires_at date', 'expires_at', session.expires_at);
    }
    
    if (expiresAt <= issuedAt) {
      throw new ValidationError('expires_at must be after issued_at');
    }
    
    // Validate status values
    const validStatuses = ['success', 'failed'];
    if (session.status && !validStatuses.includes(session.status)) {
      throw new ValidationError(`Invalid status: ${session.status}. Must be one of: ${validStatuses.join(', ')}`, 'status', session.status);
    }
    
    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Session validation failed: ${error.message}`);
  }
}

/**
 * Validate login attempt data
 */
export function validateLoginAttempt(attempt) {
  try {
    validateData(attempt, 'loginAttempt');
    
    // Additional login attempt-specific validations
    if (attempt.user_id && typeof attempt.user_id === 'object') {
      validateData(attempt.user_id, 'user');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(attempt.email)) {
      throw new ValidationError('Invalid email format', 'email', attempt.email);
    }
    
    // Validate timestamp
    const timestamp = new Date(attempt.timestamp || attempt.attempted_at);
    if (isNaN(timestamp.getTime())) {
      throw new ValidationError('Invalid timestamp', 'timestamp', attempt.timestamp);
    }
    
    // Validate status
    const validStatuses = ['success', 'failed'];
    if (!validStatuses.includes(attempt.status)) {
      throw new ValidationError(`Invalid status: ${attempt.status}. Must be one of: ${validStatuses.join(', ')}`, 'status', attempt.status);
    }
    
    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Login attempt validation failed: ${error.message}`);
  }
}

/**
 * Validate API response structure
 */
export function validateApiResponse(response, expectedDataType = null) {
  if (!response || typeof response !== 'object') {
    throw new ValidationError('Response must be a valid object');
  }
  
  // Check for standard API response structure
  if (!('success' in response)) {
    throw new ValidationError('Response missing success field');
  }
  
  if (typeof response.success !== 'boolean') {
    throw new ValidationError('Response success field must be boolean');
  }
  
  if (!response.success && !response.message && !response.error) {
    throw new ValidationError('Failed response must include message or error field');
  }
  
  if (response.success && !('data' in response)) {
    throw new ValidationError('Successful response must include data field');
  }
  
  // Validate data array if present
  if (response.data && Array.isArray(response.data) && expectedDataType) {
    response.data.forEach((item, index) => {
      try {
        if (expectedDataType === 'session') {
          validateSession(item);
        } else if (expectedDataType === 'loginAttempt') {
          validateLoginAttempt(item);
        }
      } catch (error) {
        throw new ValidationError(`Invalid data at index ${index}: ${error.message}`);
      }
    });
  }
  
  return true;
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params) {
  const errors = [];
  
  if (params.page !== undefined) {
    const page = parseInt(params.page);
    if (isNaN(page) || page < 1) {
      errors.push('Page must be a positive integer');
    }
  }
  
  if (params.limit !== undefined) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.push('Limit must be between 1 and 1000');
    }
  }
  
  if (params.startDate !== undefined) {
    const startDate = new Date(params.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push('Start date must be a valid date');
    }
  }
  
  if (params.endDate !== undefined) {
    const endDate = new Date(params.endDate);
    if (isNaN(endDate.getTime())) {
      errors.push('End date must be a valid date');
    }
  }
  
  if (params.startDate && params.endDate) {
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError(`Pagination validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

/**
 * Sanitize input data
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    Object.keys(input).forEach(key => {
      sanitized[key] = sanitizeInput(input[key]);
    });
    return sanitized;
  }
  
  return input;
}

/**
 * Validate and sanitize search parameters
 */
export function validateSearchParams(params) {
  const sanitized = sanitizeInput(params);
  
  if (sanitized.search && typeof sanitized.search === 'string') {
    if (sanitized.search.length > 100) {
      throw new ValidationError('Search query too long (max 100 characters)');
    }
  }
  
  validatePaginationParams(sanitized);
  
  return sanitized;
}

/**
 * Validate session ID format
 */
export function validateSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('Session ID must be a non-empty string');
  }
  
  // Check for MongoDB ObjectId format or custom session ID format
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  const customIdRegex = /^SESS-\d{8}-\d{4}$/;
  
  if (!objectIdRegex.test(sessionId) && !customIdRegex.test(sessionId)) {
    throw new ValidationError('Invalid session ID format');
  }
  
  return true;
}

/**
 * Validate user ID format
 */
export function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new ValidationError('User ID must be a non-empty string');
  }
  
  // Check for MongoDB ObjectId format
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdRegex.test(userId)) {
    throw new ValidationError('Invalid user ID format');
  }
  
  return true;
}

/**
 * Comprehensive validation for session management operations
 */
/**
 * Validate sessions API response structure
 */
export function validateSessionsResponse(response) {
  if (!response || typeof response !== 'object') {
    throw new ValidationError('Invalid response format', 'response', response);
  }

  // Check if response has required structure
  if (!response.hasOwnProperty('sessions')) {
    throw new ValidationError('Response missing sessions array', 'sessions', response);
  }

  if (!Array.isArray(response.sessions)) {
    throw new ValidationError('Sessions must be an array', 'sessions', response.sessions);
  }

  // Validate each session in the array
  response.sessions.forEach((session, index) => {
    try {
      validateSession(session);
    } catch (error) {
      throw new ValidationError(
        `Invalid session at index ${index}: ${error.message}`,
        `sessions[${index}]`,
        session
      );
    }
  });

  // Validate pagination if present
  if (response.pagination) {
    validatePaginationParams(response.pagination);
  }

  // Validate total and count if present
  if (response.total !== undefined && (typeof response.total !== 'number' || response.total < 0)) {
    throw new ValidationError('Total must be a non-negative number', 'total', response.total);
  }

  if (response.count !== undefined && (typeof response.count !== 'number' || response.count < 0)) {
    throw new ValidationError('Count must be a non-negative number', 'count', response.count);
  }

  return true;
}

/**
 * Validate login attempts API response structure
 */
export function validateLoginAttemptsResponse(response) {
  if (!response || typeof response !== 'object') {
    throw new ValidationError('Invalid response format', 'response', response);
  }

  // Check if response has required structure
  if (!response.hasOwnProperty('loginAttempts')) {
    throw new ValidationError('Response missing loginAttempts array', 'loginAttempts', response);
  }

  if (!Array.isArray(response.loginAttempts)) {
    throw new ValidationError('LoginAttempts must be an array', 'loginAttempts', response.loginAttempts);
  }

  // Validate each login attempt in the array
  response.loginAttempts.forEach((attempt, index) => {
    try {
      validateLoginAttempt(attempt);
    } catch (error) {
      throw new ValidationError(
        `Invalid login attempt at index ${index}: ${error.message}`,
        `loginAttempts[${index}]`,
        attempt
      );
    }
  });

  // Validate pagination if present
  if (response.pagination) {
    validatePaginationParams(response.pagination);
  }

  // Validate total and count if present
  if (response.total !== undefined && (typeof response.total !== 'number' || response.total < 0)) {
    throw new ValidationError('Total must be a non-negative number', 'total', response.total);
  }

  if (response.count !== undefined && (typeof response.count !== 'number' || response.count < 0)) {
    throw new ValidationError('Count must be a non-negative number', 'count', response.count);
  }

  return true;
}

export const SessionValidation = {
  validateSession,
  validateLoginAttempt,
  validateApiResponse,
  validateSessionsResponse,
  validateLoginAttemptsResponse,
  validatePaginationParams,
  validateSearchParams,
  validateSessionId,
  validateUserId,
  sanitizeInput,
  ValidationError,
  validateSessionData: function(session) {
    if (!session || typeof session !== 'object') {
      throw new ValidationError('Session data must be a valid object');
    }
    
    const requiredFields = ['id', 'userId', 'userName', 'deviceInfo', 'ipAddress', 'issuedAt', 'isActive'];
    const missingFields = requiredFields.filter(field => !(field in session));
    
    if (missingFields.length > 0) {
      throw new ValidationError(`Invalid session data: missing fields ${missingFields.join(', ')}`);
    }
    
    return true;
  }
};

export default SessionValidation;