/**
 * Starting point for Google Sign-In.
 *
 * The SPA never talks to Google directly and never holds the client secret —
 * it hands the browser to Laravel, which owns the whole OAuth exchange. Laravel
 * redirects back to `/auth/google/callback` on this origin with a single-use
 * code that GoogleCallbackPage exchanges for a bearer token.
 */
import { API_BASE_URL } from '@/services/api';

/** Where to send the user once Google sign-in succeeds. */
const REDIRECT_STORAGE_KEY = 'mujaddidun.google_redirect';

export function startGoogleSignIn(redirectTo?: string): void {
  try {
    // Only same-origin paths are remembered, so a crafted link cannot use this
    // to bounce the user to an external site after login.
    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      window.sessionStorage.setItem(REDIRECT_STORAGE_KEY, redirectTo);
    } else {
      window.sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    }
  } catch {
    // Storage being unavailable only costs us the post-login redirect target.
  }

  window.location.href = `${API_BASE_URL}/auth/google`;
}

export function consumeGoogleRedirect(): string | null {
  try {
    const value = window.sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    window.sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
  } catch {
    return null;
  }
}
