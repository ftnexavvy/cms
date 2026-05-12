import { NextResponse } from "next/server";
import { serializeSitesForApi } from "@/lib/site-config";

export async function GET() {
  return NextResponse.json(serializeSitesForApi());
}
