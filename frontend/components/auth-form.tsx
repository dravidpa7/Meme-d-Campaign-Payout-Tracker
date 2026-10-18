'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { login, signup } from '@/actions/auth';
import { Field } from './field';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  const [state, action, pending] = useActionState(isSignup ? signup : login, undefined);
  const fe = state?.fieldErrors;

  return (
    <form action={action} className="mx-auto mt-24 flex max-w-sm flex-col gap-3 p-4">
      <h1 className="text-xl font-semibold">{isSignup ? 'Create account' : 'Log in'}</h1>

      {isSignup && <Field label="Name" name="name" required minLength={2} maxLength={60} autoComplete="name" error={fe?.['name']} />}
      <Field label="Email" name="email" type="email" required maxLength={254} autoComplete="email" error={fe?.['email']} />
      <Field
        label="Password" name="password" type="password" required
        minLength={isSignup ? 8 : 1} maxLength={72}
        autoComplete={isSignup ? 'new-password' : 'current-password'} error={fe?.['password']}
      />
      {isSignup && (
        <label className="flex flex-col gap-1 text-sm">
          I am a
          <select name="role" defaultValue="creator" className="rounded border px-3 py-2">
            <option value="creator">Creator</option>
            <option value="brand">Brand</option>
          </select>
        </label>
      )}

      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">
        {pending ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
      </button>
      <Link href={isSignup ? '/login' : '/signup'} className="text-sm underline">
        {isSignup ? 'Already have an account?' : 'Need an account?'}
      </Link>
    </form>
  );
}