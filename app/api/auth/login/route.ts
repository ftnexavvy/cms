import { NextResponse } from "next/server";
import { isValidAdminLogin, setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (!isValidAdminLogin(email, password)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await setAdminSession(email);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
