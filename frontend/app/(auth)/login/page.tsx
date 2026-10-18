import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getUser, homeFor } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getUser(); // validated server-side; no cookie-based redirect loops
  if (user) redirect(homeFor(user.role));
  return <AuthForm mode="login" />;
}