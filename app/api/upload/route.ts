import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extension = path.extname(file.name || "") || ".png";
    const filename = `${randomUUID()}${extension}`;

    // ── Vercel Blob (Production) ──
    console.log("Checking Vercel Blob Token...");
    const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      console.log("Vercel Blob Token found, uploading...");
      const blob = await put(`uploads/${filename}`, file, {
        access: 'public',
        token: token,
      });
      return NextResponse.json({
        url: blob.url,
        absoluteUrl: blob.url,
      });
    }

    // ── Local Filesystem (Development fallback) ──
    // Note: This will not work reliably on Vercel production
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const baseUrl = (process.env.NEXT_PUBLIC_CMS_URL || "").replace(/\/$/, "");

    return NextResponse.json({
      url: `/uploads/${filename}`,
      absoluteUrl: baseUrl ? `${baseUrl}/uploads/${filename}` : `/uploads/${filename}`,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
