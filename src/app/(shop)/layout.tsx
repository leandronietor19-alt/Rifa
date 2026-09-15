import Link from "next/link";
import { getStoreSettings } from "@/lib/store";
import StoreHeader from "./StoreHeader";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return (
    <div className="flex-1 flex flex-col">
      <StoreHeader storeName={settings.storeName} />
      <div className="flex-1 flex flex-col">{children}</div>
      <footer className="border-t border-black/10 py-6 text-center text-xs text-black/50 space-y-1">
        <p>{settings.storeName}</p>
        <p>
          <Link href="/admin/login" className="underline underline-offset-2">
            Acceso administración
          </Link>
        </p>
      </footer>
    </div>
  );
}
