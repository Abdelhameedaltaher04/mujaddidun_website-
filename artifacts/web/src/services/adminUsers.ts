/**
 * Admin users management service — connected to the real Laravel API.
 *
 * Laravel endpoints (all under /api/v1, Sanctum bearer auth, admin policy):
 *   GET    /users            (server-side filters + pagination)
 *   GET    /users/{id}
 *   PUT    /users/{id}
 *   PATCH  /users/{id}/status
 *   PATCH  /users/{id}/role
 *   DELETE /users/{id}
 */
import { apiClient, type ApiEnvelope } from './api';

export type UserRoleSlug = 'admin' | 'moderator' | 'volunteer' | 'user';
export type UserStatus = 'active' | 'suspended';

export interface AdminUserRole {
  id: number;
  name: string;
  slug: UserRoleSlug;
}

export interface AdminUser {
  id: number;
  role: AdminUserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country_code: string | null;
  avatar_url: string | null;
  status: UserStatus;
  email_verified_at: string | null;
  last_activity_at: string | null;
  created_at: string;
}

/** Query params for GET /users — matches the Laravel request contract. */
export interface UsersListParams {
  search?: string;
  role?: UserRoleSlug;
  status?: UserStatus;
  /** 'verified' | 'unverified' */
  verified?: 'verified' | 'unverified';
  /** ISO dates limiting registration date. */
  registered_from?: string;
  registered_to?: string;
  page?: number;
  per_page?: number;
}

/** Laravel paginator envelope (data + meta). */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface UpdateUserInput {
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRoleSlug;
  status: UserStatus;
}

export const ROLE_SLUGS: UserRoleSlug[] = [
  'admin',
  'moderator',
  'volunteer',
  'user',
];

type ListEnvelope = ApiEnvelope<AdminUser[]> & {
  meta: PaginatedResponse<AdminUser>['meta'];
};

export const adminUsersApi = {
  /** GET /users */
  async listUsers(
    params: UsersListParams,
  ): Promise<PaginatedResponse<AdminUser>> {
    const response = await apiClient.get<ListEnvelope>('/users', { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  /** GET /users/{id} */
  async getUser(id: number): Promise<AdminUser> {
    const response = await apiClient.get<ApiEnvelope<AdminUser>>(
      `/users/${id}`,
    );
    return response.data.data;
  },

  /** PUT /users/{id} */
  async updateUser(id: number, input: UpdateUserInput): Promise<AdminUser> {
    const response = await apiClient.put<ApiEnvelope<AdminUser>>(
      `/users/${id}`,
      input,
    );
    return response.data.data;
  },

  /** PATCH /users/{id}/status — the backend revokes tokens on suspend. */
  async updateUserStatus(id: number, status: UserStatus): Promise<AdminUser> {
    const response = await apiClient.patch<ApiEnvelope<AdminUser>>(
      `/users/${id}/status`,
      { status },
    );
    return response.data.data;
  },

  /** PATCH /users/{id}/role */
  async updateUserRole(id: number, role: UserRoleSlug): Promise<AdminUser> {
    const response = await apiClient.patch<ApiEnvelope<AdminUser>>(
      `/users/${id}/role`,
      { role },
    );
    return response.data.data;
  },

  /** DELETE /users/{id} */
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
