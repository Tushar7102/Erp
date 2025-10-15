import api from '../../utils/api';

/**
 * Session Service
 * Handles all session-related API operations with authentication
 */
class SessionService {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
    };
  }

  /**
   * Retry logic with exponential backoff
   */
  async retryRequest(requestFn, retries = this.retryConfig.maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, this.retryConfig.maxRetries - retries),
          this.retryConfig.maxDelay
        );
        
        console.log(`Request failed, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Determine if error should trigger a retry
   */
  shouldRetry(error) {
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429; // Server errors, timeout, rate limit
  }

  /**
   * Validate session data structure
   */
  validateSessionData(session) {
    const requiredFields = ['_id', 'user_id', 'device_info', 'ip_address', 'issued_at', 'expires_at', 'is_active'];
    const missingFields = requiredFields.filter(field => !(field in session));
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid session data: missing fields ${missingFields.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Validate login attempt data structure
   */
  validateLoginAttemptData(attempt) {
    const requiredFields = ['_id', 'user_id', 'email', 'ip_address', 'status', 'timestamp'];
    const missingFields = requiredFields.filter(field => !(field in attempt));
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid login attempt data: missing fields ${missingFields.join(', ')}`);
    }
    
    return true;
  }

  /**
   * Transform session data from backend to frontend format
   */
  transformSessionData(session) {
    this.validateSessionData(session);
    
    // Handle user_id which might be populated or just an ObjectId
    const user = session.user_id || {};
    const userId = typeof user === 'object' && user._id ? user._id : session.user_id;
    const userName = user.name || 
                    (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '') ||
                    'Unknown User';
    const userEmail = user.email || 'Unknown Email';
    
    return {
      id: session._id,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      deviceInfo: session.device_info || 'Unknown Device',
      ipAddress: session.ip_address || 'Unknown IP',
      issuedAt: new Date(session.issued_at),
      expiresAt: new Date(session.expires_at),
      isActive: session.is_active,
      location: this.extractLocationFromIP(session.ip_address, session.location),
      deviceType: this.extractDeviceType(session.device_info),
      browser: this.extractBrowser(session.device_info),
      lastActivity: new Date(session.issued_at),
      duration: this.calculateSessionDuration(session.issued_at, session.expires_at)
    };
  }

  /**
   * Transform login attempt data from backend to frontend format
   */
  transformLoginAttemptData(attempt) {
    this.validateLoginAttemptData(attempt);
    
    // Handle user_id which might be populated or just an ObjectId
    const user = attempt.user_id || {};
    const userId = typeof user === 'object' && user._id ? user._id : attempt.user_id;
    const userName = user.name || 
                    (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '') ||
                    'Unknown User';
    
    return {
      id: attempt._id,
      attemptId: attempt.attempt_id || attempt._id,
      userId: userId,
      userName: userName,
      email: attempt.email,
      ipAddress: attempt.ip_address || 'Unknown IP',
      deviceInfo: attempt.device_info || 'Unknown Device',
      status: attempt.status,
      reason: attempt.reason || null,
      timestamp: new Date(attempt.timestamp || attempt.attempted_at),
      location: this.extractLocationFromIP(attempt.ip_address, attempt.location),
      deviceType: this.extractDeviceType(attempt.device_info),
      browser: this.extractBrowser(attempt.device_info),
      success: attempt.status === 'success'
    };
  }

  /**
   * Extract device type from user agent string
   */
  extractDeviceType(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') return 'Unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  }

  /**
   * Extract browser from user agent string
   */
  extractBrowser(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') return 'Unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Extract location from device info or use location data from backend
   */
  extractLocationFromIP(ipAddress, locationData) {
    // If location data is directly provided from backend, use it
    if (locationData && typeof locationData === 'object') {
      const { country, region, city } = locationData;
      
      if (city && region && country) {
        return `${city}, ${region}, ${country}`;
      } else if (city && country) {
        return `${city}, ${country}`;
      } else if (region && country) {
        return `${region}, ${country}`;
      } else if (country) {
        return country;
      } else if (city) {
        return city;
      }
    }
    
    if (!ipAddress || ipAddress === 'Unknown IP') return 'Unknown Location';
    
    // For localhost/development
    if (ipAddress.includes('127.0.0.1') || ipAddress.includes('localhost')) {
      return 'Local Development';
    }
    
    return 'Unknown Location';
  }

  /**
   * Calculate session duration
   */
  calculateSessionDuration(issuedAt, expiresAt) {
    const issued = new Date(issuedAt);
    const expires = new Date(expiresAt);
    const durationMs = expires.getTime() - issued.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(params = {}) {
    const requestFn = async () => {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      
      const response = await api.get(`/auth/sessions?${queryParams.toString()}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch sessions');
      }
      
      // Validate raw backend data before transformation
      const rawSessions = response.data.data || [];
      rawSessions.forEach((session, index) => {
        try {
          this.validateSessionData(session);
        } catch (error) {
          console.warn(`Session validation warning at index ${index}:`, error.message);
          // Continue processing other sessions
        }
      });
      
      return {
        sessions: rawSessions.map(session => this.transformSessionData(session)),
        pagination: response.data.pagination || {},
        total: response.data.total || rawSessions.length,
        count: response.data.count || rawSessions.length
      };
    };

    try {
      return await this.retryRequest(requestFn);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      throw this.handleError(error, 'Failed to fetch active sessions');
    }
  }

  /**
   * Get user login history
   */
  async getUserLoginHistory(userId, params = {}) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const requestFn = async () => {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);

      const response = await api.get(`/auth/users/${userId}/login-history?${queryParams.toString()}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch login history');
      }
      
      return {
        loginAttempts: response.data.data.map(attempt => this.transformLoginAttemptData(attempt)),
        pagination: response.data.pagination || {},
        total: response.data.total || response.data.data.length,
        count: response.data.count || response.data.data.length
      };
    };

    try {
      return await this.retryRequest(requestFn);
    } catch (error) {
      console.error('Error fetching user login history:', error);
      throw this.handleError(error, 'Failed to fetch user login history');
    }
  }

  /**
   * Revoke a session
   */
  async revokeSession(id, data = {}) {
    if (!id) {
      throw new Error('Session ID is required');
    }

    const requestFn = async () => {
      const response = await api.put(`/auth/sessions/${id}/revoke`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to revoke session');
      }
      
      return {
        success: true,
        message: response.data.message || 'Session revoked successfully'
      };
    };

    try {
      return await this.retryRequest(requestFn);
    } catch (error) {
      console.error('Error revoking session:', error);
      throw this.handleError(error, 'Failed to revoke session');
    }
  }

  /**
   * Get login attempts with pagination and filtering
   */
  async getLoginAttempts(params = {}) {
    const requestFn = async () => {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.startDate) queryParams.append('start_date', params.startDate);
      if (params.endDate) queryParams.append('end_date', params.endDate);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await api.get(`/auth/login-attempts?${queryParams.toString()}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch login attempts');
      }
      
      // Validate raw backend data before transformation
      const rawAttempts = response.data.data || [];
      rawAttempts.forEach((attempt, index) => {
        try {
          this.validateLoginAttemptData(attempt);
        } catch (error) {
          console.warn(`Login attempt validation warning at index ${index}:`, error.message);
          // Continue processing other attempts
        }
      });
      
      return {
        loginAttempts: rawAttempts.map(attempt => this.transformLoginAttemptData(attempt)),
        pagination: response.data.pagination || {},
        total: response.data.total || rawAttempts.length,
        count: response.data.count || rawAttempts.length
      };
    };

    try {
      return await this.retryRequest(requestFn);
    } catch (error) {
      console.error('Error fetching login attempts:', error);
      throw this.handleError(error, 'Failed to fetch login attempts');
    }
  }

  /**
   * Get session details by ID
   */
  async getSessionDetails(id) {
    if (!id) {
      throw new Error('Session ID is required');
    }

    const requestFn = async () => {
      const response = await api.get(`/auth/sessions/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch session details');
      }
      
      const sessionData = response.data.data;
      this.validateSessionData(sessionData);
      
      return this.transformSessionData(sessionData);
    };

    try {
      return await this.retryRequest(requestFn);
    } catch (error) {
      console.error('Error fetching session details:', error);
      throw this.handleError(error, 'Failed to fetch session details');
    }
  }

  /**
   * Refresh session data by ID
   */
  async refreshSession(id) {
    if (!id) {
      throw new Error('Session ID is required');
    }

    const requestFn = async () => {
      const response = await api.post(`/auth/sessions/${id}/refresh`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to refresh session');
      }
      
      const sessionData = response.data.data;
      this.validateSessionData(sessionData);
      
      return this.transformSessionData(sessionData);
    };

    try {
      return await this.retryRequest(requestFn);
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw this.handleError(error, 'Failed to refresh session');
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics() {
    try {
      const sessions = await this.getActiveSessions({ limit: 1000 }); // Get all sessions for stats
      
      const stats = {
        totalActiveSessions: sessions.total,
        deviceTypes: {},
        browsers: {},
        locations: {},
        recentActivity: 0
      };

      // Calculate statistics from session data
      sessions.sessions.forEach(session => {
        // Device type distribution
        stats.deviceTypes[session.deviceType] = (stats.deviceTypes[session.deviceType] || 0) + 1;
        
        // Browser distribution
        stats.browsers[session.browser] = (stats.browsers[session.browser] || 0) + 1;
        
        // Location distribution
        stats.locations[session.location] = (stats.locations[session.location] || 0) + 1;
        
        // Recent activity (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (session.lastActivity > oneDayAgo) {
          stats.recentActivity++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching session statistics:', error);
      throw this.handleError(error, 'Failed to fetch session statistics');
    }
  }

  /**
   * Handle API errors consistently
   */
  handleError(error, defaultMessage = 'An error occurred') {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || defaultMessage;
      
      switch (status) {
        case 401:
          return new Error('Authentication required. Please log in again.');
        case 403:
          return new Error('You do not have permission to perform this action.');
        case 404:
          return new Error('The requested resource was not found.');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
          return new Error('Server error. Please try again later.');
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      return new Error(error.message || defaultMessage);
    }
  }
}

// Export singleton instance
export default new SessionService();