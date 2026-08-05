import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'mujaddidun.access_token';
const SESSION_TOKEN_KEY = 'mujaddidun.session_token';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

function readToken(): string | null {
  try {
    return (
      window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
      window.sessionStorage.getItem(SESSION_TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

export function storeAccessToken(token: string, remember = false): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
    window[remember ? 'localStorage' : 'sessionStorage'].setItem(
      remember ? ACCESS_TOKEN_KEY : SESSION_TOKEN_KEY,
      token,
    );
  } catch {
    // The API remains usable for the current request if storage is unavailable.
  }
}

export function clearAccessToken(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export function getAccessToken(): string | null {
  return readToken();
}

function loginUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const query = returnTo && !window.location.pathname.endsWith('/login')
    ? `?redirect=${encodeURIComponent(returnTo)}`
    : '';
  return `${base.replace(/\/$/, '/') }login${query}`;
}

apiClient.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !error.config?.url?.includes('/auth/login')
    ) {
      clearAccessToken();
      if (!window.location.pathname.endsWith('/login')) {
        window.location.assign(loginUrl());
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface ApiErrorData {
  message?: string;
  errors?: Record<string, string[]>;
}

export function getApiError(error: unknown): {
  message: string;
  fields: Record<string, string>;
  status?: number;
} {
  const axiosError = error as AxiosError<ApiErrorData>;
  const response = axiosError.response;
  const fieldErrors = response?.data?.errors ?? {};

  return {
    message: response?.data?.message || 'Unable to complete the request.',
    fields: Object.fromEntries(
      Object.entries(fieldErrors).map(([key, messages]) => [
        key,
        messages?.[0] || 'Please check this field.',
      ]),
    ),
    status: response?.status,
  };
}

export type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};