import { serviceUrl, type Service } from '@/api/real/http/servicePaths.ts';
import { toApiError } from '@/api/real/http/apiError.ts';

/**
 * Unauthenticated JSON POST — for the handful of `/public/*` endpoints that
 * take neither `basicAuth` (§1.3's auth-client credentials) nor a user
 * bearer token: password recovery's three steps and the OAuth init/exchange
 * pair. (§2.3 flags step 1 as declared `bearerAuth` in the Swagger, almost
 * certainly wrong for a "forgot my password" endpoint — implemented here
 * without the header per that section's explicit instruction; question B5.)
 */
export async function publicPost<T>(service: Service, path: string, body: unknown): Promise<T> {
  const reqId = crypto.randomUUID();
  const res = await fetch(serviceUrl(service, path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-request-id': reqId },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await toApiError(res, reqId);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
