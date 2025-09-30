// API Configuration
// This file centralizes all API endpoints and makes it easy to change the backend URL

export const API_CONFIG = {
  // Backend base URL - update this when your IP changes
  BASE_URL: 'http://192.168.1.4:8000',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
    },
    VERIFY: {
      UPLOAD: '/verify/',
    },
    LOGS: {
      POLICE: '/logs/police',
      ADMIN: '/logs/admin',
    },
    ADMIN: {
      USERS: '/admin/users',
      APPROVE: '/admin/approve',
    },
    HEALTH: '/health',
    DOCS: '/docs',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get auth endpoints
export const getAuthUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS.AUTH): string => {
  return getApiUrl(API_CONFIG.ENDPOINTS.AUTH[endpoint]);
};

// Helper function to get verify endpoints
export const getVerifyUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS.VERIFY): string => {
  return getApiUrl(API_CONFIG.ENDPOINTS.VERIFY[endpoint]);
};

// Helper function to get logs endpoints
export const getLogsUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS.LOGS): string => {
  return getApiUrl(API_CONFIG.ENDPOINTS.LOGS[endpoint]);
};

// Helper function to get admin endpoints
export const getAdminUrl = (endpoint: keyof typeof API_CONFIG.ENDPOINTS.ADMIN): string => {
  return getApiUrl(API_CONFIG.ENDPOINTS.ADMIN[endpoint]);
};


