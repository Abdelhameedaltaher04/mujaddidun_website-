/**
 * Admin users management service.
 *
 * Every function mirrors the future Laravel endpoint noted alongside it and
 * already accepts/returns the exact payload shapes (including Laravel-style
 * pagination meta), so the API swap only replaces the mock calls with
 * `apiClient` requests — no component changes.
 *
 * Future endpoints:
 *   GET    /users            (list; server-side filters + pagination)
 *   GET    /users/{id}
 *   POST   /users
 *   PUT    /users/{id}
 *   PATCH  /users/{id}/status
 *   PATCH  /users/{id}/role
 *   DELETE /users/{id}
 */
import { mockUsersDb } from './mocks/adminUsersMock';

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

export const adminUsersApi = {
  /** GET /users */
  async listUsers(
    params: UsersListParams,
  ): Promise<PaginatedResponse<AdminUser>> {
    return mockUsersDb.list(params);
  },

  /** GET /users/{id} */
  async getUser(id: number): Promise<AdminUser> {
    return mockUsersDb.get(id);
  },

  /** PUT /users/{id} */
  async updateUser(id: number, input: UpdateUserInput): Promise<AdminUser> {
    return mockUsersDb.update(id, input);
  },

  /** PATCH /users/{id}/status — backend must also revoke tokens on suspend. */
  async updateUserStatus(id: number, status: UserStatus): Promise<AdminUser> {
    return mockUsersDb.update(id, { status });
  },

  /** PATCH /users/{id}/role */
  async updateUserRole(id: number, role: UserRoleSlug): Promise<AdminUser> {
    return mockUsersDb.update(id, { role });
  },

  /** DELETE /users/{id} */
  async deleteUser(id: number): Promise<void> {
    return mockUsersDb.remove(id);
  },
};
