/**
 * Centralized environment config. Mirrors the fail-fast pattern used in
 * primp-mobile/src/services/api.ts — better to crash on boot with a clear
 * message than to silently call `undefined/api/...` at request time.
 */

const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL?.trim();

if (!apiGatewayUrl) {
  throw new Error(
    'VITE_API_GATEWAY_URL is required. Copy .env.example to .env and point it at your API Gateway (e.g. http://localhost:8080).',
  );
}

export const env = {
  apiGatewayUrl,
} as const;
