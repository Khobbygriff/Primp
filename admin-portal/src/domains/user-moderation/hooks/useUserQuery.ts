import { useQuery } from '@tanstack/react-query';
import { getAdminUserDetail } from '@/domains/user-moderation/api/userAdminApi';

export function useUserQuery(userId: number | null) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => getAdminUserDetail(userId as number),
    enabled: userId !== null,
  });
}