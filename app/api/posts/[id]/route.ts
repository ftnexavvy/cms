import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import { getSession } from "@/lib/auth";
import { normalizePostPayload, serializePost } from "@/lib/posts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await getSession();
    const post = await Post.findById(id).lean<Record<string, any> | null>();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "published" && !session) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(serializePost(post));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const payload = normalizePostPayload(body);
    const post = await Post.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).lean<Record<string, any> | null>();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(serializePost(post));
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "This slug already exists for the selected website." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message || "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const post = await Post.findByIdAndDelete(id).lean<Record<string, any> | null>();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete post" }, { status: 500 });
  }
}
