import { NextResponse } from "next/server";

// Alias: /api/logout → /api/auth/logout
// The sidebar form POSTs here for simplicity.
export async function POST() {
  const res = NextResponse.redirect(
    new URL("/api/auth/logout", process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000"),
    { status: 307 },
  );
  return res;
}
