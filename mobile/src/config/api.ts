// API Configuration
// This file centralizes all API endpoints and makes it easy to change the backend URL

const detectBaseUrl = (): string => {
  // Prefer localhost for web development; fall back to current host for LAN
  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://127.0.0.1:8000';
      }
      // If app is served from a LAN IP, use that IP for the API
      const isLanIp = /^(10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(host);
      if (isLanIp) {
        return `http://${host}:8000`;
      }
    }
  } catch {}
  // Default fallback
  return 'http://127.0.0.1:8000';
};

export const API_CONFIG = {
  // Backend base URL - auto-detected for dev; override if needed
  BASE_URL: detectBaseUrl(),
  
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


