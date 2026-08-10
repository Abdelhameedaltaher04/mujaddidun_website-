/**
 * Temporary in-memory users store for the admin users page.
 * Emulates Laravel server-side filtering + pagination so the UI is already
 * built against the real contract. Deleted once the API exists.
 */
import type {
  AdminUser,
  AdminUserRole,
  PaginatedResponse,
  UpdateUserInput,
  UserRoleSlug,
  UsersListParams,
  UserStatus,
} from '../adminUsers';

const ROLES: Record<UserRoleSlug, AdminUserRole> = {
  admin: { id: 1, name: 'Admin', slug: 'admin' },
  moderator: { id: 2, name: 'Moderator', slug: 'moderator' },
  volunteer: { id: 3, name: 'Volunteer', slug: 'volunteer' },
  user: { id: 4, name: 'User', slug: 'user' },
};

const FIRST_NAMES = [
  'أحمد', 'محمد', 'خالد', 'عمر', 'يوسف', 'سارة', 'ليان', 'نور',
  'فاطمة', 'ريم', 'زيد', 'حسن', 'مريم', 'لينا', 'طارق', 'هالة',
];
const LAST_NAMES = [
  'العبدالله', 'الخطيب', 'حداد', 'الزعبي', 'النجار', 'الشامي',
  'عوض', 'القضاة', 'أبو زيد', 'الرواشدة', 'صالح', 'الحوراني',
];

function buildUsers(): AdminUser[] {
  const users: AdminUser[] = [];
  const roleCycle: UserRoleSlug[] = [
    'user', 'user', 'user', 'volunteer', 'user', 'moderator',
    'volunteer', 'user', 'user', 'volunteer',
  ];
  for (let i = 1; i <= 57; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];
    const registered = new Date(Date.UTC(2025, 8, 1) + i * 5.5 * 86_400_000);
    const verified = i % 5 !== 0;
    users.push({
      id: i + 100,
      role: ROLES[i === 1 ? 'admin' : roleCycle[i % roleCycle.length]],
      first_name: first,
      last_name: last,
      email: `member${i}@example.com`,
      phone: `+9627${String(70000000 + i * 13577).slice(0, 8)}`,
      country_code: 'JO',
      avatar_url: null,
      status: i % 9 === 0 ? 'suspended' : 'active',
      email_verified_at: verified ? registered.toISOString() : null,
      last_activity_at:
        i % 4 === 0
          ? null
          : new Date(Date.UTC(2026, 7, 9) - i * 3.2 * 3_600_000).toISOString(),
      created_at: registered.toISOString(),
    });
  }
  return users.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

let users = buildUsers();

const DELAY_MS = 300;
const delay = () => new Promise((r) => setTimeout(r, DELAY_MS));

function matches(user: AdminUser, params: UsersListParams): boolean {
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    const haystack = [
      user.first_name,
      user.last_name,
      `${user.first_name} ${user.last_name}`,
      user.email,
      user.phone ?? '',
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (params.role && user.role.slug !== params.role) return false;
  if (params.status && user.status !== params.status) return false;
  if (params.verified === 'verified' && !user.email_verified_at) return false;
  if (params.verified === 'unverified' && user.email_verified_at) return false;
  if (
    params.registered_from &&
    user.created_at < new Date(params.registered_from).toISOString()
  )
    return false;
  if (params.registered_to) {
    const end = new Date(params.registered_to);
    end.setUTCHours(23, 59, 59, 999);
    if (user.created_at > end.toISOString()) return false;
  }
  return true;
}

export const mockUsersDb = {
  async list(params: UsersListParams): Promise<PaginatedResponse<AdminUser>> {
    await delay();
    const filtered = users.filter((u) => matches(u, params));
    const perPage = params.per_page ?? 10;
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
    const page = Math.min(Math.max(params.page ?? 1, 1), lastPage);
    const start = (page - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);
    return {
      data: slice.map((u) => ({ ...u })),
      meta: {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total: filtered.length,
        from: slice.length ? start + 1 : null,
        to: slice.length ? start + slice.length : null,
      },
    };
  },

  async get(id: number): Promise<AdminUser> {
    await delay();
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    return { ...user };
  },

  async update(
    id: number,
    input: Partial<UpdateUserInput> & {
      role?: UserRoleSlug;
      status?: UserStatus;
    },
  ): Promise<AdminUser> {
    await delay();
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error('User not found');
    if (input.first_name !== undefined) user.first_name = input.first_name;
    if (input.last_name !== undefined) user.last_name = input.last_name;
    if (input.phone !== undefined) user.phone = input.phone;
    if (input.status !== undefined) user.status = input.status;
    if (input.role !== undefined) user.role = { ...ROLES[input.role] };
    return { ...user };
  },

  async remove(id: number): Promise<void> {
    await delay();
    users = users.filter((u) => u.id !== id);
  },
};
