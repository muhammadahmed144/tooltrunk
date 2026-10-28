'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logoutUser } from '../api/auth';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Non-blocking cookie clear
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchUserProfile = useCallback(async (authToken) => {
    try {
      const data = await getCurrentUser(authToken);
      if (data && data.user) {
        setUser(data.user);
        if (authToken) {
          setToken(authToken);
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setToken(null);
        setUser(null);
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('token');
    // Validate session with stored token or via HTTP-only cookie
    fetchUserProfile(storedToken);
  }, [fetchUserProfile]);

  const login = useCallback((newToken, loggedInUser) => {
    if (typeof window !== 'undefined' && newToken) {
      localStorage.setItem('token', newToken);
    }
    if (newToken) setToken(newToken);
    setUser(loggedInUser);
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => ({
      ...prev,
      ...updatedUserData,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
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
