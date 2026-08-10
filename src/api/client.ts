import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '../stores/authStore';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    await logout();
    return null;
  }

  try {
    const { data } = await axios.post<{
      accessToken: string;
      refreshToken?: string;
    }>(`${baseURL}/auth/refresh`, { refreshToken });

    setTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || refreshToken,
    });
    return data.accessToken;
  } catch {
    await logout();
    return null;
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const url = original.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/login-pin') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);
