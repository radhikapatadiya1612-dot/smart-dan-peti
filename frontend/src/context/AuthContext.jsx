import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext();

const DEMO_USERS = {
  ADMIN: { id: 1, name: 'Srikanth Ramanathan', email: 'admin@smartdanpeti.org', role: 'ADMIN', phone: '+91 98765 43210', pan_number: 'ABCDE1234F' },
  TRUSTEE: { id: 2, name: 'Mahant Aniruddha Das', email: 'trustee@smartdanpeti.org', role: 'TRUSTEE', phone: '+91 98765 43211', pan_number: 'TRUST9876G' },
  PRIEST: { id: 3, name: 'Pandit Radheshyam', email: 'priest@smartdanpeti.org', role: 'PRIEST', phone: '+91 98765 43212', pan_number: 'PRIEST123H' },
  AUDITOR: { id: 4, name: 'Suresh K. Auditor', email: 'auditor@smartdanpeti.org', role: 'AUDITOR', phone: '+91 98765 43213', pan_number: 'AUDIT4567J' },
  OPERATOR: { id: 5, name: 'Sunil Sharma', email: 'operator@smartdanpeti.org', role: 'OPERATOR', phone: '+91 98765 43214', pan_number: 'OPERA1234K' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sdp_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    // Default logged in as ADMIN for immediate out-of-the-box convenience
    return DEMO_USERS.ADMIN;
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
      // If backend offline or login fails, check demo accounts
      const matchedDemo = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchedDemo && password === 'admin123') {
        setUser(matchedDemo);
        const mockToken = 'mock_jwt_token_' + matchedDemo.role.toLowerCase();
        setToken(mockToken);
        setAuthToken(mockToken);
        return { success: true };
      }
      return { success: false, message: res.error || 'Invalid email or password' };
    } catch (err) {
      const matchedDemo = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchedDemo && password === 'admin123') {
        setUser(matchedDemo);
        return { success: true };
      }
      return { success: false, message: 'Server error during authentication' };
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = (roleName) => {
    const demo = DEMO_USERS[roleName] || DEMO_USERS.ADMIN;
    setUser(demo);
    const mockToken = 'mock_jwt_token_' + demo.role.toLowerCase();
    setToken(mockToken);
    setAuthToken(mockToken);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setAuthToken('');
    localStorage.removeItem('sdp_user');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, quickDemoLogin, logout, hasRole, demoUsers: DEMO_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
