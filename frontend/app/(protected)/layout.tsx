import { logout } from '@/actions/auth';
import { requireUser } from '@/lib/auth';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3 text-sm">
        <span>{user.name} · {user.role}</span>
        <form action={logout}><button className="underline">Log out</button></form>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </>
  );
}