import { NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/store";

// Configure as a Vercel Cron job (vercel.json) hitting this route periodically.
// Optional CRON_SECRET env var restricts it to authorized callers.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await releaseExpiredReservations();
  return NextResponse.json({ ok: true });
}
