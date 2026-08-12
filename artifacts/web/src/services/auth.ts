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
  avatar_url: string | null;
  bio: string | null;
  locale: string;
  status: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  created_at: string;
}

/**
 * Staff = admin or moderator. Staff manage content in the dashboard and
 * must not be presented with normal-user actions (donate, register,
 * participate, volunteer). Laravel enforces this server-side as well.
 */
export function isStaff(user: AuthUser | null | undefined): boolean {
  return user?.role?.slug === 'admin' || user?.role?.slug === 'moderator';
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

export interface UpdateProfileInput {
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string;
  avatar?: File;
  remove_avatar?: boolean;
}

export interface ChangePasswordInput {
  current_password: string;
  new_password: string;
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

  async getProfile() {
    const response = await apiClient.get<ApiEnvelope<{ user: AuthUser }>>(
      '/profile',
    );
    return response.data.data.user;
  },

  async updateProfile(input: UpdateProfileInput) {
    const formData = new FormData();
    formData.append('first_name', input.first_name);
    formData.append('last_name', input.last_name);
    formData.append('phone', input.phone);
    formData.append('country_code', input.country_code);
    if (input.avatar) formData.append('avatar', input.avatar);
    if (input.remove_avatar) formData.append('remove_avatar', '1');

    const response = await apiClient.post<ApiEnvelope<{ user: AuthUser }>>(
      '/profile',
      formData,
    );
    return response.data.data.user;
  },

  async removeAvatar() {
    const response = await apiClient.delete<ApiEnvelope<{ user: AuthUser }>>(
      '/profile/avatar',
    );
    return response.data.data.user;
  },

  async changePassword(input: ChangePasswordInput) {
    await apiClient.post<ApiEnvelope<null>>('/profile/password', input);
  },
};