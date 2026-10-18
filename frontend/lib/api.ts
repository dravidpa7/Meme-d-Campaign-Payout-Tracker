import 'server-only';
import { redirect, unstable_rethrow } from 'next/navigation';
import { env } from './env';
import { getToken } from './session';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// 5xx details never reach the UI; 4xx messages from the API are user-safe.
export const errorMessage = (e: unknown) => {
  unstable_rethrow(e);
  return e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';
};


type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};


/** `path` must be a constant or contain only ids validated with `objectId`. */
export async function api<T>(path: string, { method = 'GET', body, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${env.API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(503, 'Service unavailable. Please try again.');
  }

  const json = (await res.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null;
  if (res.status === 401 && auth) redirect('/session-expired'); // backend rejected our token

  if (!res.ok) {
    throw new ApiError(res.status, res.status >= 500 ? 'Server error. Please try again.' : (json?.error?.message ?? 'Request failed'));
  }
  return json?.data as T;
}