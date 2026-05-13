import { getDefaultContentModeForSite, getSiteConfig } from "@/lib/site-config";

type AnyRecord = Record<string, any>;

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function inferCanonical(siteId: string, slug: string, fallbackCanonical?: string) {
  if (fallbackCanonical) {
    return fallbackCanonical;
  }

  const config = getSiteConfig(siteId);
  const baseUrl = config ? process.env[config.publicBaseUrlEnv] : "";
  if (!config || !baseUrl) {
    return "";
  }

  return `${baseUrl.replace(/\/$/, "")}${config.blogPostPath(slug)}`;
}

export function normalizePostPayload(input: AnyRecord) {
  const featuredImageUrl =
    input.featuredImage?.url || input.image || input.mainImage?.url || "";
  const featuredImageAlt =
    input.featuredImage?.alt || input.mainImage?.alt || input.title || "";
  const tags = Array.isArray(input.tags)
    ? input.tags
    : typeof input.tags === "string"
      ? input.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean)
      : [];
  const seoKeywords = Array.isArray(input.seo?.keywords)
    ? input.seo.keywords
    : Array.isArray(input.keywords)
      ? input.keywords
      : [];
  const description = input.description || input.excerpt || "";
  const excerpt = input.excerpt || description;
  const contentMode = input.contentMode || getDefaultContentModeForSite(String(input.siteId || ""));
  const contentHtml =
    typeof input.contentHtml === "string"
      ? input.contentHtml
      : typeof input.content === "string"
        ? input.content
        : "";

  return {
    siteId: input.siteId,
    status: input.status || "published",
    title: input.title?.trim(),
    slug: input.slug?.trim(),
    description,
    excerpt,
    category: input.category || "",
    tags,
    readTime: input.readTime || "",
    author: {
      name: input.author?.name || input.author || "",
      image: input.author?.image || input.authorImage || "",
      bio: input.author?.bio || input.authorBio || "",
    },
    quote: {
      text: input.quote?.text || "",
      author: input.quote?.author || "",
    },
    featuredImage: {
      url: featuredImageUrl,
      alt: featuredImageAlt,
    },
    publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
    contentMode,
    contentHtml,
    portableText: Array.isArray(input.portableText)
      ? input.portableText
      : Array.isArray(input.body)
        ? input.body
        : [],
    structuredContent: {
      intro: Array.isArray(input.structuredContent?.intro)
        ? input.structuredContent.intro
        : Array.isArray(input.content?.intro)
          ? input.content.intro
          : [],
      strategies: Array.isArray(input.structuredContent?.strategies)
        ? input.structuredContent.strategies
        : Array.isArray(input.content?.strategies)
          ? input.content.strategies
          : [],
    },
    seo: {
      metaTitle: input.seo?.metaTitle || input.metaTitle || input.title || "",
      metaDescription:
        input.seo?.metaDescription || input.metaDescription || excerpt || description || "",
      ogImage: input.seo?.ogImage || input.ogImage || featuredImageUrl,
      canonical: inferCanonical(input.siteId, input.slug, input.seo?.canonical || input.canonical),
      keywords: seoKeywords,
      noIndex: Boolean(input.seo?.noIndex || input.noIndex),
    },
    schemaType: input.schemaType || "BlogPosting",
    legacy: input.legacy || {},
  };
}

const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || "").replace(/\/$/, "");

function ensureAbsoluteUrl(url: string | undefined | null) {
  if (!url) return "";
  if (url.startsWith("/")) {
    return `${CMS_URL}${url}`;
  }
  return url;
}

export function serializePost(post: AnyRecord) {
  const publishedAt = post.publishedAt instanceof Date
    ? post.publishedAt.toISOString()
    : new Date(post.publishedAt).toISOString();
  const description = post.description || post.excerpt || "";
  const excerpt = post.excerpt || description;

  return {
    id: String(post._id),
    _id: String(post._id),
    siteId: post.siteId,
    status: post.status,
    title: post.title,
    slug: post.slug,
    description,
    excerpt,
    category: post.category || "",
    tags: post.tags || [],
    readTime: post.readTime || "",
    date: publishedAt,
    publishedAt,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedAt,
    image: ensureAbsoluteUrl(post.featuredImage?.url || post.image || ""),
    mainImage: (post.featuredImage?.url || post.image)
      ? { 
          url: ensureAbsoluteUrl(post.featuredImage?.url || post.image), 
          alt: post.featuredImage?.alt || post.title 
        }
      : null,
    featuredImage: {
      url: ensureAbsoluteUrl(post.featuredImage?.url || ""),
      alt: post.featuredImage?.alt || ""
    },
    author: {
      name: post.author?.name || "",
      image: ensureAbsoluteUrl(post.author?.image || ""),
      bio: post.author?.bio || "",
    },
    authorImage: ensureAbsoluteUrl(post.author?.image || ""),
    authorBio: post.author?.bio || "",
    quote: post.quote || { text: "", author: "" },
    contentMode: post.contentMode || "html",
    contentHtml: post.contentHtml || "",
    content:
      post.contentMode === "nexavvyStructured"
        ? {
            ...post.structuredContent,
            strategies: (post.structuredContent?.strategies || []).map((s: any) => ({
              ...s,
              image: ensureAbsoluteUrl(s.image)
            }))
          }
        : post.contentHtml || "",
    body: post.contentMode === "html" ? (post.contentHtml || "") : (post.portableText || []),
    portableText: post.portableText || [],
    structuredContent: post.structuredContent || { intro: [], strategies: [] },
    seo: {
      metaTitle: post.seo?.metaTitle || post.title,
      metaDescription: post.seo?.metaDescription || excerpt || description,
      ogImage: ensureAbsoluteUrl(post.seo?.ogImage || post.featuredImage?.url || ""),
      canonical: post.seo?.canonical || inferCanonical(post.siteId, post.slug),
      keywords: post.seo?.keywords || [],
      noIndex: Boolean(post.seo?.noIndex),
    },
    metaTitle: post.seo?.metaTitle || post.title,
    metaDescription: post.seo?.metaDescription || excerpt || description,
    ogImage: ensureAbsoluteUrl(post.seo?.ogImage || post.featuredImage?.url || ""),
    canonical: post.seo?.canonical || inferCanonical(post.siteId, post.slug),
    keywords: post.seo?.keywords || [],
    schemaType: post.schemaType || "BlogPosting",
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : publishedAt,
    legacy: post.legacy || {},
    plainText:
      post.contentMode === "html"
        ? stripHtml(post.contentHtml || "")
        : "",
  };
}
