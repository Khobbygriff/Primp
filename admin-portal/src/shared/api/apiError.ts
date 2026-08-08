import { AxiosError } from 'axios';

/**
 * The backend is a set of independent Spring Boot services fronted by a
 * hand-rolled gateway (GatewayController) that forwards raw responses. There
 * is no consistent error envelope across services — some throw
 * ResponseStatusException with a plain-text reason, some let a RuntimeException
 * bubble into Spring's default error body, and the gateway itself returns
 * plain text ("Service unavailable: ...") on 502. This normalizes all of
 * that into one shape the UI can rely on.
 */
export interface NormalizedApiError {
  status: number | null;
  message: string;
  /** True if this looks like a gateway-level failure rather than a downstream service rejecting the request. */
  isGatewayFailure: boolean;
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? null;
    const data = error.response?.data;

    let message: string;
    if (typeof data === 'string' && data.trim()) {
      message = data;
    } else if (data && typeof data === 'object' && 'message' in data && typeof (data as { message?: unknown }).message === 'string') {
      message = (data as { message: string }).message;
    } else if (status === 401 || status === 403) {
      message = 'You do not have permission to do that.';
    } else if (error.code === 'ECONNABORTED') {
      message = 'The request timed out. Please try again.';
    } else {
      message = error.message || 'Something went wrong contacting the server.';
    }

    return {
      status,
      message,
      isGatewayFailure: status === 502 || status === 503 || status === null,
    };
  }

  return {
    status: null,
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    isGatewayFailure: false,
  };
}
