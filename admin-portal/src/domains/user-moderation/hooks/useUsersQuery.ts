import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listUsers, type ListUsersParams } from '@/domains/user-moderation/api/userAdminApi';

export const usersQueryKey = (params: ListUsersParams) => ['admin', 'users', params] as const;

export function useUsersQuery(params: ListUsersParams) {
  return useQuery({
    queryKey: usersQueryKey(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
