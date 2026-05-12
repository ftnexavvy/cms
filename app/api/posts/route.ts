import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { getSession } from "@/lib/auth";
import { normalizePostPayload, serializePost } from "@/lib/posts";

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const limit = Number(searchParams.get("limit") || "0");
    const includeDrafts = searchParams.get("includeDrafts") === "true";
    const session = includeDrafts ? await getSession() : null;

    const query: Record<string, unknown> = {};
    if (siteId) query.siteId = siteId;
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (!includeDrafts || !session) {
      query.status = "published";
    }

    let queryBuilder = Post.find(query).sort({ publishedAt: -1, createdAt: -1 });
    if (limit > 0) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const posts = await queryBuilder.lean<Record<string, any>[]>();
    return withCors(NextResponse.json(posts.map(serializePost)));
  } catch (error: any) {
    return withCors(
      NextResponse.json({ error: error.message || "Failed to fetch posts" }, { status: 500 }),
    );
  }
}

export async function OPTIONS() {
  return withCors(NextResponse.json({ ok: true }));
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const payload = normalizePostPayload(body);

    if (!payload.siteId || !payload.title || !payload.slug) {
      return NextResponse.json(
        { error: "siteId, title, and slug are required." },
        { status: 400 },
      );
    }

    const post = await Post.create(payload);
    return NextResponse.json(serializePost(post.toObject()), { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "This slug already exists for the selected website." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message || "Failed to create post" }, { status: 500 });
  }
}
