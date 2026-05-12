/** Content shape each live frontend expects from the CMS API. */
export type SiteContentMode = "html" | "portableText" | "nexavvyStructured";

export const SITES = [
  {
    id: "bhadrik-panchal",
    name: "Bhadrik Panchal Website",
    publicBaseUrlEnv: "BHADRIK_SITE_URL",
    blogIndexPath: "/insights",
    blogPostPath: (slug: string) => `/insights/post?slug=${slug}`,
    localProjectPath: "/Users/ftnexavvy/Desktop/black and white",
    defaultContentMode: "html" satisfies SiteContentMode,
    contentGuidance:
      "Publish HTML body content. Listings use /insights; each post opens at /insights/[slug].",
  },
  {
    id: "nexavvy",
    name: "FT Nexavvy Website",
    publicBaseUrlEnv: "NEXAVVY_SITE_URL",
    blogIndexPath: "/pages/blogs/latestblog/",
    blogPostPath: (slug: string) => `/pages/blogs/insights?slug=${slug}`,
    localProjectPath: "/Users/ftnexavvy/Desktop/desktop/dixit/nexavvyfronend2",
    defaultContentMode: "nexavvyStructured" satisfies SiteContentMode,
    contentGuidance:
      "Use Nexavvy Structured JSON for the article body. Index at latest blog; detail uses query slug.",
  },
  {
    id: "growth-catalyst",
    name: "Keadigi Website",
    publicBaseUrlEnv: "KEADIGI_SITE_URL",
    blogIndexPath: "/blog",
    blogPostPath: (slug: string) => `/blog/${slug}`,
    localProjectPath: "/Users/ftnexavvy/Desktop/main keadigi/growth",
    defaultContentMode: "html" satisfies SiteContentMode,
    contentGuidance: "Publish HTML body content. Listings use /blog; each post opens at /blog/[slug].",
  },
] as const;

export const SITE_IDS = SITES.map((site) => site.id);

export type SiteId = (typeof SITE_IDS)[number];

export type SiteConfig = (typeof SITES)[number];

export function getSiteConfig(siteId: string): SiteConfig | undefined {
  return SITES.find((site) => site.id === siteId);
}

export function getDefaultContentModeForSite(siteId: string): SiteContentMode {
  return getSiteConfig(siteId)?.defaultContentMode ?? "html";
}

/** Safe for JSON APIs (no functions). */
export function serializeSitesForApi() {
  return SITES.map((site) => ({
    id: site.id,
    name: site.name,
    publicBaseUrlEnv: site.publicBaseUrlEnv,
    blogIndexPath: site.blogIndexPath,
    examplePostPath: site.blogPostPath("your-post-slug"),
    localProjectPath: site.localProjectPath,
    defaultContentMode: site.defaultContentMode,
    contentGuidance: site.contentGuidance,
  }));
}
