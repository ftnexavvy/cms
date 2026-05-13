import PostEditor from "@/components/PostEditor";
import { requireSession } from "@/lib/auth";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  await requireSession();
  const params = await searchParams;

  return <PostEditor mode="create" defaultSiteId={params.siteId} />;
}
