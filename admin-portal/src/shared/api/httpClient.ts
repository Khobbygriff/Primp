import axios from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from '@/shared/auth/tokenStorage';

/**
 * Every request goes through the API Gateway (GatewayController), never
 * directly at a downstream service — the gateway is what attaches the
 * X-Internal-Secret header downstream services require, and it's the only
 * place the JWT gets verified/decoded into X-User-Id / X-User-Role today.
 */
export const httpClient = axios.create({
  baseURL: env.apiGatewayUrl,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Listeners fired on a 401, so AuthContext can clear session state and
 * redirect to /login without this module needing to import React Router.
 */
type UnauthorizedListener = () => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      unauthorizedListeners.forEach((listener) => listener());
    }
    return Promise.reject(error);
  },
);
