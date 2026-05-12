import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { getSession } from "@/lib/auth";
import { serializePost } from "@/lib/posts";

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ siteId: string; slug: string }> },
) {
  try {
    await connectDB();
    const { siteId, slug } = await params;
    const includeDraft = new URL(request.url).searchParams.get("includeDraft") === "true";
    const session = includeDraft ? await getSession() : null;
    const query: Record<string, string> = { siteId, slug };

    if (!includeDraft || !session) {
      query.status = "published";
    }

    const post = await Post.findOne(query).lean<Record<string, any> | null>();
    if (!post) {
      return withCors(NextResponse.json({ error: "Post not found" }, { status: 404 }));
    }

    return withCors(NextResponse.json(serializePost(post)));
  } catch (error: any) {
    return withCors(
      NextResponse.json({ error: error.message || "Failed to fetch post" }, { status: 500 }),
    );
  }
}

export async function OPTIONS() {
  return withCors(NextResponse.json({ ok: true }));
}
