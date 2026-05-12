import PostEditor from "@/components/PostEditor";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  const params = await searchParams;
  return <PostEditor mode="create" defaultSiteId={params.siteId} />;
}
