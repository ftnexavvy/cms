import PostEditor from "@/components/PostEditor";
import { requireSession } from "@/lib/auth";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  return <PostEditor mode="edit" postId={id} />;
}
