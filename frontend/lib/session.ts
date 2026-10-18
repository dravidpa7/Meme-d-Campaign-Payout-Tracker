import 'server-only';
import { cookies } from 'next/headers';
import type { User } from './types';

const TOKEN_COOKIE = 'memed_token'; // proxy.ts uses this same name
const USER_COOKIE = 'memed_user';

const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // match JWT_EXPIRES_IN=1d
};

export async function setSession(token: string, user: User) {
  const jar = await cookies();
  jar.set(TOKEN_COOKIE, token, options);
  jar.set(USER_COOKIE, JSON.stringify(user), options);
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(TOKEN_COOKIE);
  jar.delete(USER_COOKIE);
}

export async function getToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export async function getStoredUser() {
  return (await cookies()).get(USER_COOKIE)?.value;
}