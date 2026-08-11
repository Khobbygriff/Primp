import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reinstateUser, suspendUser } from '@/domains/user-moderation/api/userAdminApi';

export function useSuspendUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) => suspendUser(userId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', variables.userId] });
    },
  });
}

export function useReinstateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => reinstateUser(userId),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
    },
  });
}
