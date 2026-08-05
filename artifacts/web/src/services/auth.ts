import { apiClient, type ApiEnvelope } from './api';

export interface AuthRole {
  id: number;
  name: string;
  slug: string;
}

export interface AuthUser {
  id: number;
  role?: AuthRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country_code: string | null;
  avatar_path: string | null;
  bio: string | null;
  locale: string;
  status: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  created_at: string;
}

interface AuthPayload {
  user: AuthUser;
  token: string;
  token_type: string;
}

interface RegistrationPayload {
  user: AuthUser;
  email_verification_required: boolean;
}

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_code: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordInput {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const authApi = {
  async register(input: RegisterInput) {
    const response = await apiClient.post<ApiEnvelope<RegistrationPayload>>(
      '/auth/register',
      input,
    );
    return response.data.data;
  },

  async login(email: string, password: string) {
    const response = await apiClient.post<ApiEnvelope<AuthPayload>>(
      '/auth/login',
      { email, password },
    );
    return response.data.data;
  },

  async me() {
    const response = await apiClient.get<ApiEnvelope<{ user: AuthUser }>>(
      '/auth/me',
    );
    return response.data.data.user;
  },

  async logout() {
    await apiClient.post<ApiEnvelope<null>>('/auth/logout');
  },

  async forgotPassword(email: string) {
    await apiClient.post<ApiEnvelope<null>>('/auth/forgot-password', { email });
  },

  async resetPassword(input: ResetPasswordInput) {
    await apiClient.post<ApiEnvelope<null>>('/auth/reset-password', input);
  },

  async verifyEmail(
    id: string,
    hash: string,
    signedParams: { expires: string; signature: string },
  ) {
    const params = new URLSearchParams(signedParams);
    const response = await apiClient.get<ApiEnvelope<{ user: AuthUser }>>(
      `/auth/email/verify/${encodeURIComponent(id)}/${encodeURIComponent(hash)}?${params.toString()}`,
    );
    return response.data.data.user;
  },

  async resendVerification(email: string) {
    const response = await apiClient.post<
      ApiEnvelope<{ email_verification_sent: boolean; retry_after: number }>
    >('/auth/email/resend', { email });
    return response.data.data;
  },
};