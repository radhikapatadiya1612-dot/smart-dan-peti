import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext();

const DEMO_ADMIN = {
  id: 1,
  name: 'Srikanth Ramanathan',
  email: 'admin@smartdanpeti.org',
  role: 'ADMIN',
  phone: '+91 98765 43210',
  pan_number: 'ABCDE1234F'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sdp_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'ADMIN' || parsed.role === 'TRUSTEE')) {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return DEMO_ADMIN;
  });

  const [token, setToken] = useState(() => getAuthToken());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('sdp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sdp_user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        setAuthToken(res.token);
        return { success: true };
      }
      // Demo fallback
      if (email.toLowerCase() === DEMO_ADMIN.email.toLowerCase() && (password === 'admin123' || password === 'admin@123')) {
        setUser(DEMO_ADMIN);
        const mockToken = 'mock_jwt_token_admin';
        setToken(mockToken);
        setAuthToken(mockToken);
        return { success: true };
      }
      return { success: false, message: res.error || res.message || 'Invalid administrator email or password.' };
    } catch (err) {
      if (email.toLowerCase() === DEMO_ADMIN.email.toLowerCase() && (password === 'admin123' || password === 'admin@123')) {
        setUser(DEMO_ADMIN);
        return { success: true };
      }
      return { success: false, message: 'Server connection error during admin sign in.' };
    } finally {
      setLoading(false);
    }
  };

  const registerAdmin = async (adminData) => {
    setLoading(true);
    try {
      const res = await api.register({ ...adminData, role: 'ADMIN' });
      if (res.success && res.user) {
        setUser(res.user);
        setToken(res.token);
        setAuthToken(res.token);
        return { success: true };
      }
      // Offline fallback
      if (adminData.name && adminData.email) {
        const fallbackAdmin = {
          id: Date.now(),
          name: adminData.name,
          email: adminData.email,
          role: 'ADMIN',
          phone: adminData.phone || '+91 98765 00000',
          pan_number: adminData.pan_number || 'TRADM9999Z'
        };
        setUser(fallbackAdmin);
        const mockToken = 'mock_jwt_token_admin_new';
        setToken(mockToken);
        setAuthToken(mockToken);
        return { success: true };
      }
      return { success: false, message: res.error || res.message || 'Failed to create admin account.' };
    } catch (err) {
      return { success: false, message: err.message || 'Error creating administrator account.' };
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = () => {
    setUser(DEMO_ADMIN);
    const mockToken = 'mock_jwt_token_admin';
    setToken(mockToken);
    setAuthToken(mockToken);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setAuthToken('');
    localStorage.removeItem('sdp_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerAdmin,
        quickDemoLogin,
        logout,
        demoAdmin: DEMO_ADMIN
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
