import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'mujaddidun.access_token';
const SESSION_TOKEN_KEY = 'mujaddidun.session_token';
export const SESSION_EXPIRED_EVENT = 'mujaddidun:session-expired';

let sessionExpirationNoticeActive = false;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Origin of the Laravel API, or '' when VITE_API_URL is same-origin relative
 * (e.g. the production '/api/v1', which is already proxied by the web server).
 */
const API_ORIGIN = /^[a-z][a-z0-9+.-]*:\/\//i.test(API_URL)
  ? new URL(API_URL).origin
  : '';

/**
 * Laravel resources return media as root-relative `/api/v1/files/...` paths.
 * In development the SPA is served from a different origin than the API, so the
 * browser would resolve them against the frontend origin and 404. This rebases
 * such paths onto the API origin; absolute/data/blob URLs are left untouched.
 */
export function resolveFileUrl<T extends string | null | undefined>(url: T): T {
  if (!url || !API_ORIGIN) return url;
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(url) || /^(data|blob):/i.test(url)) {
    return url;
  }
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}` as T;
}

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

export function getLoginUrl(): string {
  return loginUrl();
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
      readToken() &&
      ![
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/email/verify',
        '/auth/email/resend',
      ].some((path) => error.config?.url?.includes(path))
    ) {
      clearAccessToken();
      if (!sessionExpirationNoticeActive) {
        sessionExpirationNoticeActive = true;
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
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
  errors?: Record<string, string[] | string>;
}

export function getApiError(error: unknown): {
  message: string;
  fields: Record<string, string>;
  status?: number;
  retryAfter?: number;
} {
  const axiosError = error as AxiosError<ApiErrorData | string>;
  const response = axiosError.response;
  const responseData = response?.data;
  const structuredData =
    responseData && typeof responseData === 'object' ? responseData : undefined;
  const fieldErrors = structuredData?.errors ?? {};
  const rawResponseMessage =
    typeof responseData === 'string'
      ? responseData.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      : structuredData?.message;
  const requestMessage =
    error instanceof Error && error.message ? error.message : undefined;
  const statusMessage = response?.status
    ? `Request failed with status ${response.status}.`
    : undefined;
  const retryAfterHeader =
    response?.headers && typeof response.headers.get === 'function'
      ? response.headers.get('Retry-After')
      : response?.headers?.['retry-after'];
  const retryAfterValue = fieldErrors.retry_after;
  const retryAfter = Number(
    Array.isArray(retryAfterValue)
      ? retryAfterValue[0]
      : retryAfterValue ?? retryAfterHeader,
  );

  return {
    message:
      rawResponseMessage ||
      requestMessage ||
      statusMessage ||
      'The server did not return an error message.',
    fields: Object.fromEntries(
      Object.entries(fieldErrors).map(([key, messages]) => [
        key,
        Array.isArray(messages)
          ? messages.filter(Boolean).join(' ')
          : messages || 'Please check this field.',
      ]),
    ),
    status: response?.status,
    retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  };
}

export type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};