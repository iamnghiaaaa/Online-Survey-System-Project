import axios from 'axios';

const trimmed = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

const baseURL =
  trimmed || (import.meta.env.DEV ? '' : 'http://localhost:5000');

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const TOKEN_KEY = 'auth_token';

api.interceptors.request.use((config) => {
  // FormData cần boundary tự sinh; không được ép Content-Type: application/json
  if (config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
