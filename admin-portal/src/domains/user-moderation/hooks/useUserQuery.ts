import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/domains/user-moderation/api/userAdminApi';

export function useUserQuery(userId: number | null) {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => getUserProfile(userId as number),
    enabled: userId !== null,
  });
}
