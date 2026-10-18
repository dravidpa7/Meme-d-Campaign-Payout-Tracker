import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getStoredUser, getToken } from './session';
import type { Role, User } from './types';

const roleSchema = z.enum(['brand', 'creator']);
const claimsSchema = z.object({ sub: z.string(), role: roleSchema, exp: z.number() });
const userSchema = z.object({ id: z.string(), name: z.string(), email: z.string(), role: roleSchema });

export const homeFor = (role: Role) => (role === 'brand' ? '/brand' : '/creator');

function decodeClaims(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const parsed = claimsSchema.safeParse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function parseStoredUser(raw?: string) {
  try {
    return userSchema.parse(JSON.parse(raw ?? ''));
  } catch {
    return null;
  }
}

// cache() = memoised per request, so layout + page decode once.
export const getUser = cache(async (): Promise<User | null> => {
  const token = await getToken();
  if (!token) return null;

  const claims = decodeClaims(token);
  if (!claims || claims.exp * 1000 <= Date.now()) return null; // expired or malformed

  const user = parseStoredUser(await getStoredUser());
  return user && user.id === claims.sub && user.role === claims.role ? user : null;
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}