import axios from 'axios';
import { API_BASE_URL } from '../config';

interface TokenResponse {
  success: boolean;
  tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
  };
  user: {
    email: string;
    name: string;
    picture?: string;
    role: string;
  };
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call the refresh token endpoint
        const response = await axios.post<TokenResponse>(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { tokens, user } = response.data;

        // Update tokens and user data in localStorage
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('idToken', tokens.idToken);
        localStorage.setItem('user', JSON.stringify(user));

        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        // Only clear tokens and redirect if it's not a refresh token request
        if (!originalRequest.url?.includes('/auth/refresh-token')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('idToken');
          localStorage.removeItem('user');
        window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance; 