import api from '../utils/api';

class AuthService {
  // Login with email/phone and password
  async login(credentials) {
    try {
      const payload = {
        password: credentials.password
      };

      // Determine if input is email or phone number
      if (credentials.email.includes('@')) {
        // It's an email
        payload.email = credentials.email;
      } else {
        // It's a phone number - clean and format for backend
        const cleanPhone = credentials.email.replace(/\D/g, '');
        // Add +91 country code for Indian numbers
        payload.phone = `${cleanPhone}`;
      }
      
      // Get user's current location before login
      try {
        const locationData = await this.getUserCurrentLocation();
        if (locationData) {
          payload.current_location = locationData;
        }
      } catch (locationError) {
        console.warn('Could not get user location:', locationError);
      }

      const response = await api.post('/auth/login', payload);

      if (response.data.success) {
        // Store token and user data in localStorage for persistence
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return {
          success: true,
          user: response.data.user,
          token: response.data.token
        };
      }

      return {
        success: false,
        error: response.data.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error);

      // Handle specific error responses
      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    }
  }

  // Login with OTP (for phone/email)
  async loginWithOTP(contact) {
    try {
      const payload = {};

      // Determine if it's email or phone
      if (contact.includes('@')) {
        payload.email = contact;
      } else {
        payload.phone = contact;
      }
      
      // Get user's current location before login
      try {
        const locationData = await this.getUserCurrentLocation();
        if (locationData) {
          payload.current_location = locationData;
        }
      } catch (locationError) {
        console.warn('Could not get user location:', locationError);
      }

      const response = await api.post('/auth/login/otp', payload);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'OTP sent successfully'
        };
      }

      return {
        success: false,
        error: response.data.message || 'Failed to send OTP'
      };
    } catch (error) {
      console.error('OTP login error:', error);

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  // Verify OTP
  async verifyOTP(contact, otp) {
    try {
      const payload = { otp };

      // Determine if it's email or phone
      if (contact.includes('@')) {
        payload.email = contact;
      } else {
        payload.phone = contact;
      }

      const response = await api.post('/auth/verify-otp', payload);

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return {
          success: true,
          user: response.data.user,
          token: response.data.token
        };
      }

      return {
        success: false,
        error: response.data.message || 'OTP verification failed'
      };
    } catch (error) {
      console.error('OTP verification error:', error);

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgotpassword', { email });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.data || 'Password reset email sent successfully'
        };
      }

      return {
        success: false,
        error: response.data.message || 'Failed to send reset email'
      };
    } catch (error) {
      console.error('Forgot password error:', error);

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await api.put(`/auth/resetpassword/${token}`, {
        password: newPassword
      });

      if (response.data.success) {
        // Store token and user data from successful reset
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          message: 'Password reset successfully'
        };
      }

      return {
        success: false,
        error: response.data.message || 'Password reset failed'
      };
    } catch (error) {
      console.error('Reset password error:', error);

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  // Logout
  async logout() {
    try {
      // Call backend logout endpoint
      await api.get('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if backend call fails
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  
  // Get user's current location using browser geolocation API
  async getUserCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get city and country
            const locationData = await this.reverseGeocode(latitude, longitude);
            resolve(locationData);
          } catch (error) {
            console.error('Error getting location details:', error);
            reject(error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  }
  
  // Reverse geocode coordinates to get location details
  async reverseGeocode(latitude, longitude) {
    try {
      // Using a free reverse geocoding API
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
      const data = await response.json();
      
      if (data && data.address) {
        return {
          city: data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown',
          state: data.address.state || 'Unknown',
          country: data.address.country || 'Unknown',
          latitude,
          longitude
        };
      }
      
      return {
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        latitude,
        longitude
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        latitude,
        longitude
      };
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');

      if (response.data.success) {
        return {
          success: true,
          user: response.data.data
        };
      }

      return {
        success: false,
        error: response.data.message || 'Failed to get user profile'
      };
    } catch (error) {
      console.error('Get current user error:', error);

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  // Update user details
  async updateUserDetails(userData) {
    try {
      const response = await api.put('/auth/updatedetails', userData);

      if (response.data.success) {
        // Update local storage with new user data
        localStorage.setItem('user', JSON.stringify(response.data.data));

        return {
          success: true,
          user: response.data.data
        };
      }

      return {
        success: false,
        error: response.data.message || 'Failed to update user details'
      };
    } catch (error) {
      console.error('Update user details error:', error);

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  // Update password
  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/updatepassword', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        return {
          success: true,
          message: 'Password updated successfully'
        };
      }

      return {
        success: false,
        error: response.data.message || 'Failed to update password'
      };
    } catch (error) {
      console.error('Update password error:', error);

      if (error.response?.data?.message) {
        return {
          success: false,
          error: error.response.data.message
        };
      }

      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get stored user data
  getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Get stored token
  getStoredToken() {
    return localStorage.getItem('token');
  }

  // Validate token by making a test API call
  async validateToken() {
    try {
      const token = this.getStoredToken();
      if (!token) return false;

      // Make a simple API call to validate token
      const response = await api.get('/auth/me');
      return response.data.success;
    } catch (error) {
      // If token is invalid, API will return 401
      return false;
    }
  }

  // Check session status specifically
  async validateSession() {
    try {
      const token = this.getStoredToken();
      if (!token) return { valid: false, reason: 'No token found' };

      // Make API call to validate session
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        return { valid: true, user: response.data.data };
      }
      
      return { valid: false, reason: 'Invalid response' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Unknown error';
      
      // Return specific reason for session invalidation
      if (errorMessage.includes('session has been terminated')) {
        return { valid: false, reason: 'session_terminated' };
      } else if (errorMessage.includes('session has expired')) {
        return { valid: false, reason: 'session_expired' };
      } else if (errorMessage.includes('Session not found')) {
        return { valid: false, reason: 'session_not_found' };
      } else if (errorMessage.includes('no longer active')) {
        return { valid: false, reason: 'session_inactive' };
      }
      
      return { valid: false, reason: 'authentication_failed' };
    }
  }
}

// Export a singleton instance
export default new AuthService();