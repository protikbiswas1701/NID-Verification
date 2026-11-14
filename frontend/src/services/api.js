import axios from 'axios';
import { TOKEN_KEY } from '../utils/constants';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid session clears the token and tells AuthContext to log out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  const data = error.response?.data;
  if (data && typeof data === 'object' && !(data instanceof Blob)) {
    if (data.errors?.length) return data.errors[0].message;
    if (data.message) return data.message;
  }
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error.request && !error.response) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
};

export default api;
