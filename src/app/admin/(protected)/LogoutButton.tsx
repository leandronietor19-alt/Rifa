"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logout } from "../login/actions";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await logout();
          router.push("/admin/login");
          router.refresh();
        })
      }
      disabled={isPending}
      className="text-white/70 hover:text-white underline underline-offset-4"
    >
      Cerrar sesión
    </button>
  );
}
