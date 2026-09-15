import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import LogoutButton from "./LogoutButton";

const NAV_LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/ajustes", label: "Ajustes" },
];

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
            Baboon · Admin
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/70">{session.email}</span>
            <LogoutButton />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6 flex gap-4 text-sm pb-3">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-white/80 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-5xl w-full px-6 py-8 flex-1">{children}</main>
    </div>
  );
}
