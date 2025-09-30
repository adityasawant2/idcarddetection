import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { getAuthUrl } from '../config/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      console.log('[Auth] Loading stored user:', storedUser ? 'present' : 'missing');
      console.log('[Auth] Loading stored token:', storedToken ? 'present' : 'missing');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('[Auth] Setting user from storage:', userData.email);
        setUser(userData);
      } else {
        console.log('[Auth] No stored user found, setting user to null');
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[Auth] login() start', { email });
      const response = await fetch(getAuthUrl('LOGIN'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      });

      console.log('[Auth] /auth/login status', response.status);
      if (!response.ok) {
        const text = await response.text();
        console.log('[Auth] /auth/login error body', text);
        let message = 'Login failed';
        try { message = (JSON.parse(text).detail) || message; } catch {}
        throw new Error(message);
      }

      const data = await response.json();
      console.log('[Auth] /auth/login success', data);
      
      // Get user details
      console.log('[Auth] fetching /auth/me');
      const userResponse = await fetch(getAuthUrl('ME'), {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      });

      console.log('[Auth] /auth/me status', userResponse.status);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('[Auth] /auth/me success', userData);
        const user: User = {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          is_approved: userData.is_approved,
          created_at: userData.created_at,
        };

        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('token', data.access_token);
        setUser(user);
      } else {
        const text = await userResponse.text();
        console.log('[Auth] /auth/me error body', text);
        throw new Error('Failed to get user details');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, phone?: string) => {
    try {
      console.log('[Auth] register() start', { email, name, phone });
      const response = await fetch(getAuthUrl('REGISTER'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          phone,
          role: 'police',
        }),
      });

      console.log('[Auth] /auth/register status', response.status);
      if (!response.ok) {
        const text = await response.text();
        console.log('[Auth] /auth/register error body', text);
        let message = 'Registration failed';
        try { message = (JSON.parse(text).detail) || message; } catch {}
        throw new Error(message);
      }

      // Registration successful, user needs admin approval
      const okBodyText = await response.text();
      console.log('[Auth] /auth/register success', okBodyText);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Logout started');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      console.log('[Auth] Storage cleared');
      
      // Force state update
      setUser(null);
      console.log('[Auth] User state set to null');
      
      // Additional cleanup for web
      if (typeof window !== 'undefined') {
        // Clear any cached data in browser
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        console.log('[Auth] Browser localStorage cleared');
      }
      
      console.log('[Auth] Logout completed');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear the user state
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
