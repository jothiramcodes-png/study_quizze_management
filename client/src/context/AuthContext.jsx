import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success || response.data.token || response.data.data) {
        const payload = response.data.data || response.data;
        const accessToken = payload.accessToken || payload.token;
        const userData = payload.user || payload;
        
        // Save to local storage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
        toast.success(`Welcome back, ${userData.firstName || userData.name}!`);
        return userData;
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Login failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success || response.data.token || response.data.data) {
        const payload = response.data.data || response.data;
        const accessToken = payload.accessToken || payload.token;
        const savedUser = payload.user || payload;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(savedUser));
        
        setUser(savedUser);
        toast.success('Registration successful!');
        return savedUser;
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const googleLogin = async (credential) => {
    try {
      const response = await api.post('/auth/google', { token: credential });
      
      if (response.data.success || response.data.token || response.data.data) {
        const payload = response.data.data || response.data;
        const accessToken = payload.accessToken || payload.token;
        const userData = payload.user || payload;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        toast.success(`Welcome back, ${userData.firstName || userData.name}!`);
        return userData;
      }
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Google Login failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, loading, hasRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
