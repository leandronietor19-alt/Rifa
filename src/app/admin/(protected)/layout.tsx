import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import LogoutButton from "./LogoutButton";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="font-semibold">
            Rifa Debate España · Admin
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/70">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl w-full px-6 py-8 flex-1">{children}</main>
    </div>
  );
}
