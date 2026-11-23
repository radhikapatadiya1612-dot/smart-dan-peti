import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext();

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
    return null;
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

  // Verify token on mount with live backend
  useEffect(() => {
    if (token && !user) {
      api.getProfile()
        .then((res) => {
          if (res?.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        })
        .catch(() => {});
    }
  }, []);

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
      return { success: false, message: res.error || res.message || 'Invalid administrator email or password.' };
    } catch (err) {
      return { success: false, message: 'Server connection error during admin sign in: ' + err.message };
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
      return { success: false, message: res.error || res.message || 'Failed to create admin account in database.' };
    } catch (err) {
      return { success: false, message: err.message || 'Error creating administrator account.' };
    } finally {
      setLoading(false);
    }
  };

  // Quick sign-in using actual seeded administrator credentials in MySQL
  const quickDemoLogin = async () => {
    return await login('admin@smartdanpeti.org', 'admin123');
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setAuthToken('');
    localStorage.removeItem('sdp_user');
    localStorage.removeItem('sdp_token');
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
        demoAdmin: { email: 'admin@smartdanpeti.org', password: 'admin123' }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
