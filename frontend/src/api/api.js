import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Bootstrap from localStorage on load
const BOOT_KEY = 'tm_access_token';
const bootToken =
  typeof window !== 'undefined' ? localStorage.getItem(BOOT_KEY) : null;
if (bootToken) {
  api.defaults.headers.common.Authorization = `Bearer ${bootToken}`;
}

// Helper to set/clear the auth header and persist the token
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(BOOT_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(BOOT_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
