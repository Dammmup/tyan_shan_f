import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { AuthTokens, AuthUser, LoginResponse } from '../types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  restaurantId: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginPin: (pin: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  setTokens: (tokens: AuthTokens) => void;
  setSession: (data: LoginResponse) => void;
}

function normalizeUser(raw: LoginResponse): AuthUser {
  const user = raw.user as AuthUser & { userId?: string; _id?: string };
  return {
    ...user,
    id: user.id || user.userId || user._id || '',
    name: user.name || user.email || 'User',
    restaurantId: user.restaurantId ?? null,
    permissions: user.permissions ?? [],
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      restaurantId: null,

      setTokens: (tokens) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },

      setSession: (data) => {
        const user = normalizeUser(data);
        set({
          user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          restaurantId: user.restaurantId,
        });
      },

      login: async (email, password) => {
        const { data } = await axios.post<LoginResponse>(`${baseURL}/auth/login`, {
          email,
          password,
        });
        get().setSession(data);
        return normalizeUser(data);
      },

      loginPin: async (pin) => {
        const { data } = await axios.post<LoginResponse>(`${baseURL}/auth/login-pin`, {
          pin,
        });
        get().setSession(data);
        return normalizeUser(data);
      },

      logout: async () => {
        const { refreshToken, accessToken } = get();
        try {
          if (refreshToken) {
            await axios.post(
              `${baseURL}/auth/logout`,
              { refreshToken },
              {
                headers: accessToken
                  ? { Authorization: `Bearer ${accessToken}` }
                  : undefined,
              },
            );
          }
        } catch {
          // ignore logout network errors
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            restaurantId: null,
          });
        }
      },
    }),
    {
      name: 'tyan-shan-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        restaurantId: state.restaurantId,
      }),
    },
  ),
);
