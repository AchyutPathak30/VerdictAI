/**
 * VerdictAI Mobile API Client
 * Axios instance connecting to FastAPI backend (backend/app/api/v1/)
 * Supports:
 * - Dynamic platform-aware base URL resolution (Android 10.0.2.2 vs iOS/Web localhost)
 * - Environment variable override (EXPO_PUBLIC_API_URL)
 * - JWT Authorization header interceptor via expo-secure-store with web fallback
 */

import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

declare const process: {
  env?: {
    EXPO_PUBLIC_API_URL?: string;
    [key: string]: string | undefined;
  };
} | undefined;

const AUTH_TOKEN_KEY = 'verdictai_auth_token';

// Dynamic Base URL Resolution (Android Emulator maps host loopback to 10.0.2.2)
const resolveBaseUrl = (): string => {
  const envApiUrl = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL : undefined;
  if (envApiUrl) {
    return envApiUrl;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

export const BASE_URL = resolveBaseUrl();

let isBackendReachable = false;
export const getBackendReachable = () => isBackendReachable;
export const setBackendReachable = (val: boolean) => {
  isBackendReachable = val;
};

// Memory fallback for tokens
let inMemoryToken: string | null = null;

interface SimpleStorage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const getWebLocalStorage = (): SimpleStorage | null => {
  try {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return (globalThis as unknown as { localStorage: SimpleStorage }).localStorage;
    }
  } catch {
    // Ignore in non-web environments
  }
  return null;
};

export const setAuthToken = async (token: string | null): Promise<void> => {
  inMemoryToken = token;
  try {
    if (Platform.OS !== 'web') {
      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      }
    } else {
      const storage = getWebLocalStorage();
      if (storage) {
        if (token) {
          storage.setItem(AUTH_TOKEN_KEY, token);
        } else {
          storage.removeItem(AUTH_TOKEN_KEY);
        }
      }
    }
  } catch {
    // Graceful fallback to in-memory store
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (inMemoryToken) return inMemoryToken;
  try {
    if (Platform.OS !== 'web') {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } else {
      const storage = getWebLocalStorage();
      if (storage) {
        return storage.getItem(AUTH_TOKEN_KEY);
      }
    }
  } catch {
    // Graceful fallback
  }
  return null;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 3500, // Fast 3.5s timeout for seamless offline demo fallback
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor (attach auth token when available) ───────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Continue request without token if secure retrieval fails
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (global error handling) ─────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        `HTTP ${error.response.status}: Request failed`;
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(
        new Error('Network error: Unable to reach VerdictAI server. Is the backend running?')
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;
