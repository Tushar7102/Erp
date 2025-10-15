import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing token in localStorage
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          // Validate token by making a test API call
          const isValid = await authService.validateToken();
          
          if (isValid) {
            dispatch({
              type: 'LOGIN',
              payload: {
                token,
                user: JSON.parse(user)
              }
            });
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } catch (error) {
          // If validation fails, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Session monitoring effect
  useEffect(() => {
    let sessionCheckInterval;

    if (state.isAuthenticated) {
      // Check session status every 5 minutes
      sessionCheckInterval = setInterval(async () => {
        try {
          const sessionStatus = await authService.validateSession();
          
          if (!sessionStatus.valid) {
            // Session is no longer valid, logout user
            dispatch({ type: 'LOGOUT' });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Set appropriate message based on reason
            let message = 'Your session is no longer valid. Please login again.';
            if (sessionStatus.reason === 'session_terminated') {
              message = 'Your session has been terminated by an administrator. Please login again.';
            } else if (sessionStatus.reason === 'session_expired') {
              message = 'Your session has expired. Please login again.';
            } else if (sessionStatus.reason === 'session_inactive') {
              message = 'Your session is no longer active. Please login again.';
            } else if (sessionStatus.reason === 'session_not_found') {
              message = 'Your session was not found. Please login again.';
            }
            
            localStorage.setItem('sessionMessage', message);
            
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        } catch (error) {
          console.error('Session validation error:', error);
          // Don't logout on network errors, let the API interceptor handle it
        }
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [state.isAuthenticated]);

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success) {
        dispatch({
          type: 'LOGIN',
          payload: {
            user: result.user,
            token: result.token
          }
        });
        
        return { success: true, user: result.user };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const forgotPassword = async (email) => {
    try {
      const result = await authService.forgotPassword(email);
      return result;
    } catch (error) {
      return { success: false, error: error.message || 'Failed to send reset email' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const result = await authService.resetPassword(token, newPassword);
      
      if (result.success) {
        // Update auth state with new user data
        dispatch({
          type: 'LOGIN',
          payload: {
            user: result.user,
            token: result.token
          }
        });
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message || 'Password reset failed' };
    }
  };

  const loginWithOTP = async (email) => {
    try {
      const result = await authService.loginWithOTP(email);
      return result;
    } catch (error) {
      return { success: false, error: error.message || 'Failed to send OTP' };
    }
  };

  const verifyOTP = async (email, otp) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await authService.verifyOTP(email, otp);
      
      if (result.success) {
        dispatch({
          type: 'LOGIN',
          payload: {
            user: result.user,
            token: result.token
          }
        });
        
        return { success: true, user: result.user };
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
        return { success: false, error: result.error };
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: error.message || 'OTP verification failed' };
    }
  };

  const value = {
    ...state,
    login,
    logout,
    forgotPassword,
    resetPassword,
    loginWithOTP,
    verifyOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};