import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';
export const AUTH_TOKEN_KEY = 'tm_access_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Bootstrap from localStorage on load
const bootToken =
  typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
if (bootToken) {
  api.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
}

// Automatically clear the auth header when a 401 response is received
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

// Helper to set/clear the auth header and persist the token
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
