import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-brand-navy mb-1">Administración</h1>
        <p className="text-sm text-black/60 mb-6">Rifa Debate España</p>
        <LoginForm />
      </div>
    </div>
  );
}
