import React, { createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api';

interface APIContextType {
  api: AxiosInstance;
}

const APIContext = createContext<APIContextType | undefined>(undefined);

export const useAPI = () => {
  const context = useContext(APIContext);
  if (context === undefined) {
    throw new Error('useAPI must be used within an APIProvider');
  }
  return context;
};

interface APIProviderProps {
  children: React.ReactNode;
}

export const APIProvider: React.FC<APIProviderProps> = ({ children }) => {
  const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
  });

  // Request interceptor to add auth token
  api.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('token');
      console.log('[API] Request interceptor - token:', token ? 'present' : 'missing');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Added Authorization header');
      }
      console.log('[API] Request config:', {
        url: config.url,
        method: config.method,
        headers: config.headers
      });
      return config;
    },
    (error) => {
      console.log('[API] Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle auth errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, logout user
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
        // You might want to trigger a logout action here
      }
      return Promise.reject(error);
    }
  );

  const value: APIContextType = {
    api,
  };

  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
};
