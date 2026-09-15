"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function StoreHeader({ storeName }: { storeName: string }) {
  const { totalItems, hydrated } = useCart();

  return (
    <header className="bg-brand-navy text-white sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          {storeName}
        </Link>
        <Link
          href="/carrito"
          className="relative flex items-center gap-2 text-sm font-medium border border-white/25 rounded-full px-4 py-2 hover:bg-white/10"
        >
          Carrito
          {hydrated && totalItems > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-brand-gold text-black text-xs font-bold">
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
