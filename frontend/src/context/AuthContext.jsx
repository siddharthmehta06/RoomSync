import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getAuthToken, 
  setAuthToken, 
  getAuthUser, 
  setAuthUser, 
  clearAuth, 
  loginUser, 
  registerUser, 
  getMe 
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getAuthToken());
  const [user, setUserState] = useState(() => getAuthUser());
  const [loading, setLoading] = useState(true);

  // Initialize and verify session against backend /api/auth/me
  const checkAuth = useCallback(async () => {
    const savedToken = getAuthToken();
    if (!savedToken) {
      setUserState(null);
      setTokenState(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await getMe(savedToken);
      setUserState(userData);
      setAuthUser(userData);
      setTokenState(savedToken);
    } catch (err) {
      console.warn('[Auth] Stored session invalid or expired:', err.message);
      clearAuth();
      setUserState(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login action
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      setTokenState(data.token);
      setUserState(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Register action
  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await registerUser(userData);
      setTokenState(data.token);
      setUserState(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Logout action
  const logout = () => {
    clearAuth();
    setTokenState(null);
    setUserState(null);
  };

  // Update user in state and local storage
  const updateUser = (updatedUser) => {
    setUserState(updatedUser);
    setAuthUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    updateUser,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
