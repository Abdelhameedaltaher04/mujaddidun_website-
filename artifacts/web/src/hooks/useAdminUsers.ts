import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminUsersApi,
  type UpdateUserInput,
  type UserRoleSlug,
  type UsersListParams,
  type UserStatus,
} from '@/services/adminUsers';

const USERS_KEY = ['admin', 'users'] as const;

export function useAdminUsersList(params: UsersListParams) {
  return useQuery({
    queryKey: [...USERS_KEY, 'list', params],
    queryFn: () => adminUsersApi.listUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUser(id: number | null) {
  return useQuery({
    queryKey: [...USERS_KEY, 'detail', id],
    queryFn: () => adminUsersApi.getUser(id as number),
    enabled: id !== null,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: USERS_KEY });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUserInput }) =>
      adminUsersApi.updateUser(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateUserStatus() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) =>
      adminUsersApi.updateUserStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useUpdateUserRole() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRoleSlug }) =>
      adminUsersApi.updateUserRole(id, role),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: number) => adminUsersApi.deleteUser(id),
    onSuccess: invalidate,
  });
}
