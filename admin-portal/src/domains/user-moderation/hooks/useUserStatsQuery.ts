import { useQuery } from '@tanstack/react-query';
import { getUserStats } from '@/domains/user-moderation/api/userAdminApi';

export function useUserStatsQuery() {
  return useQuery({
    queryKey: ['admin', 'user-stats'],
    queryFn: getUserStats,
    staleTime: 60_000,
  });
}