'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { api, errorMessage } from '@/lib/api';
import { homeFor } from '@/lib/auth';
import { loginSchema, signupSchema } from '@/lib/schemas';
import { clearSession, setSession } from '@/lib/session';
import type { AuthResult } from '@/lib/types';

export type FormState =
  | { error?: string; success?: string; fieldErrors?: Record<string, string[] | undefined> }
  | undefined;

async function authenticate(path: '/auth/login' | '/auth/signup', body: unknown): Promise<FormState> {
  let result: AuthResult;
  try {
    result = await api<AuthResult>(path, { method: 'POST', body, auth: false });
    await setSession(result.token, result.user);

  } catch (e) {
    return { error: errorMessage(e) };
  }
  redirect(homeFor(result.user.role)); // outside try/catch: redirect works by throwing
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  return authenticate('/auth/login', parsed.data);
}

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  return authenticate('/auth/signup', parsed.data);
}

export async function logout() {
  await clearSession();
  redirect('/login');
}