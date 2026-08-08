import { httpClient } from '@/shared/api/httpClient';
import {
  adminUserResponseSchema,
  paginatedSchema,
  userResponseSchema,
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

/**
 * BACKEND DEPENDENCY: GET /api/admin/users does not exist yet.
 * GET /api/auth/professionals is the closest existing endpoint but is
 * unsuitable — it silently filters to isAvailable=true and excludes
 * CLIENT-role accounts entirely (see UserService#getProfessionals), which
 * would hide exactly the accounts an admin most needs to find (suspended
 * or hidden professionals, and any client).
 *
 * This call is wired to the endpoint shape proposed in the endpoint
 * analysis so the UI is ready the moment it exists. Until then it will
 * 404 through the gateway (GatewayController has no /api/admin/** route
 * either — that also needs to be added).
 */
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

/**
 * Existing endpoint (AuthController#getProfile) — publicly reachable
 * through the gateway with no auth check at all today, so this works for
 * an admin session unmodified. Returns UserResponse, not AdminUserResponse
 * (no email/suspension fields) until the backend DTO is extended.
 */
export async function getUserProfile(userId: number): Promise<UserResponse> {
  const { data } = await httpClient.get(`/api/auth/profile/${userId}`);
  return userResponseSchema.parse(data);
}

/**
 * BACKEND DEPENDENCY: no suspend/reinstate endpoint or `isSuspended`
 * column exists on User.java today. Proposed contract below.
 */
export async function suspendUser(userId: number, reason: string): Promise<AdminUserResponse> {
  const { data } = await httpClient.post(`/api/admin/users/${userId}/suspend`, { reason });
  return adminUserResponseSchema.parse(data);
}

export async function reinstateUser(userId: number): Promise<AdminUserResponse> {
  const { data } = await httpClient.post(`/api/admin/users/${userId}/reinstate`);
  return adminUserResponseSchema.parse(data);
}

/**
 * BACKEND DEPENDENCY, and a second issue beyond "endpoint doesn't exist":
 * even GET /api/reviews/summary/{userId} (which DOES exist) currently
 * requires `authenticatedUserId.equals(userId)` in ReviewController — an
 * admin viewing someone else's rating summary will get a 403 from that
 * check as written today, regardless of role. That authorization check
 * needs an `|| isAdmin` escape hatch, not just a new route.
 */
export async function getUserRatingSummary(userId: number) {
  const { data } = await httpClient.get(`/api/reviews/summary/${userId}`);
  return data;
}
