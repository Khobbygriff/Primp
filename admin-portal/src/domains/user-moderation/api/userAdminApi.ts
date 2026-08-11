import { httpClient } from '@/shared/api/httpClient';
import {
  adminUserResponseSchema,
  adminUserStatsSchema,
  paginatedSchema,
  userResponseSchema,
  type AdminUserStats,
  type AdminUserResponse,
  type Paginated,
  type UserRole,
  type UserResponse,
} from '@/shared/types/api-contracts';

export interface ListUsersParams {
  page: number; // 1-indexed
  pageSize: number;
  search?: string;
  role?: UserRole | 'ALL';
  includeSuspended?: boolean;
}


export async function listUsers(params: ListUsersParams): Promise<Paginated<AdminUserResponse>> {
  const { data } = await httpClient.get('/api/admin/users', {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      role: params.role && params.role !== 'ALL' ? params.role : undefined,
      includeSuspended: params.includeSuspended ?? true,
    },
  });
  return paginatedSchema(adminUserResponseSchema).parse(data);
}

export async function getAdminUserDetail(userId: number): Promise<AdminUserResponse> {
  const { data } = await httpClient.get(`/api/admin/users/${userId}`);
  return adminUserResponseSchema.parse(data);
}

export async function getUserProfile(userId: number): Promise<UserResponse> {
  const { data } = await httpClient.get(`/api/auth/profile/${userId}`);
  return userResponseSchema.parse(data);
}

export async function suspendUser(userId: number, reason: string): Promise<AdminUserResponse> {
  const { data } = await httpClient.post(`/api/admin/users/${userId}/suspend`, { reason });
  return adminUserResponseSchema.parse(data);
}

export async function reinstateUser(userId: number): Promise<AdminUserResponse> {
  const { data } = await httpClient.post(`/api/admin/users/${userId}/reinstate`);
  return adminUserResponseSchema.parse(data);
}

export async function getUserRatingSummary(userId: number) {
  const { data } = await httpClient.get(`/api/reviews/summary/${userId}`);
  return data;
}

export async function getUserStats(): Promise<AdminUserStats> {
  const { data } = await httpClient.get('/api/admin/users/stats');
  return adminUserStatsSchema.parse(data);
}
