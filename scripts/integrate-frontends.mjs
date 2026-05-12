import { mkdir, writeFile } from "fs/promises";
import path from "path";

async function write(targetPath, contents) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, contents, "utf8");
  console.log(`Updated ${targetPath}`);
}

async function repairTemplateEscapes(files) {
  const { readFile, writeFile } = await import("fs/promises");
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const repaired = text.replace(/\\`/g, "`").replace(/\\\$\{/g, "${");
    if (repaired !== text) {
      await writeFile(file, repaired, "utf8");
      console.log(`Repaired template escapes in ${file}`);
    }
  }
}

const bhadrikRoot = "/Users/ftnexavvy/Desktop/black and white";
const nexavvyRoot = "/Users/ftnexavvy/Desktop/desktop/dixit/nexavvy-frontend 2";
const keadigiRoot = "/Users/ftnexavvy/Desktop/main keadigi/growth-catalyst";

await write(
  path.join(bhadrikRoot, "lib/sanity.ts"),
  String.raw`const CMS_BASE_URL = (process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:3000").replace(/\/$/, "");

type CmsImage = {
  url?: string;
  alt?: string;
} | null;

type CmsPost = {
  title: string;
  slug: string;
  description?: string;
  excerpt?: string;
  image?: string;
  mainImage?: CmsImage;
  category?: string;
  readTime?: string;
  publishedAt: string;
  keywords?: string[];
  portableText?: unknown[];
  contentHtml?: string;
  content?: string;
  seo?: {
    keywords?: string[];
  };
};

export const postsQuery = "cms:posts";
export const postBySlugQuery = "cms:postBySlug";

async function fetchCms(pathname: string) {
  const response = await fetch(\`\${CMS_BASE_URL}\${pathname}\`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(\`CMS request failed: \${response.status}\`);
  }

  return response.json();
}

function toMainImage(post: CmsPost) {
  if (post.mainImage?.url) {
    return post.mainImage;
  }

  if (post.image) {
    return {
      url: post.image,
      alt: post.title,
    };
  }

  return null;
}

function mapListPost(post: CmsPost) {
  return {
    title: post.title,
    slug: post.slug,
    description: post.description || post.excerpt || "",
    mainImage: toMainImage(post),
    category: post.category || "",
    readTime: post.readTime || "",
    publishedAt: post.publishedAt,
    date: post.publishedAt,
  };
}

function mapDetailPost(post: CmsPost) {
  return {
    ...mapListPost(post),
    keywords: post.keywords || post.seo?.keywords || [],
    body: Array.isArray(post.portableText) ? post.portableText : [],
    contentHtml: post.contentHtml || (typeof post.content === "string" ? post.content : ""),
  };
}

export const client = {
  async fetch(query: string, params?: { slug?: string }) {
    if (query === postsQuery) {
      const posts = await fetchCms("/api/posts?siteId=bhadrik-panchal");
      return Array.isArray(posts) ? posts.map(mapListPost) : [];
    }

    if (query === postBySlugQuery && params?.slug) {
      const post = await fetchCms(\`/api/posts/slug/bhadrik-panchal/\${params.slug}\`);
      return mapDetailPost(post);
    }

    throw new Error("Unsupported CMS query");
  },
};

export function urlFor(source: { url?: string } | string | null) {
  const value = typeof source === "string" ? source : source?.url || "";
  return {
    url() {
      return value;
    },
  };
}
`,
);

await write(
  path.join(bhadrikRoot, "app/insights/[slug]/page.tsx"),
  String.raw`import React from "react";
import InsightClientPage from "./InsightClientPage";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <InsightClientPage slug={slug} />;
}
`,
);

await write(
  path.join(bhadrikRoot, "app/insights/[slug]/InsightClientPage.tsx"),
  String.raw`"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { client, postBySlugQuery, urlFor } from "@/lib/sanity";
import SectionWrapper from "@/components/SectionWrapper";
import { PortableText } from "@portabletext/react";
import { components } from "@/components/PortableTextContent";
import { motion } from "framer-motion";

interface Post {
  title: string;
  category: string;
  publishedAt: string;
  readTime: string;
  description: string;
  mainImage: { url?: string; alt?: string } | null;
  body: any;
  contentHtml?: string;
}

export default function InsightClientPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const data = await client.fetch(postBySlugQuery, { slug });
        setPost(data);
      } catch (error) {
        console.error("Error fetching live post:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <main className="bg-black text-white min-h-screen pt-48 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] uppercase tracking-[0.5em] text-gray-500">Loading Insight...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="bg-black text-white min-h-screen pt-48 text-center">
        <h1 className="text-4xl font-black mb-8">INSIGHT NOT FOUND</h1>
        <Link href="/insights" className="text-gray-400 underline uppercase tracking-widest text-xs">Back to all insights</Link>
      </main>
    );
  }

  return (
    <main className="bg-black text-white min-h-screen pt-24">
      <SectionWrapper className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] tracking-[0.4em] uppercase text-white/50 font-bold mb-6"
              >
                {post.category} •{" "}
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}{" "}
                • {post.readTime}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-6xl lg:text-5xl xl:text-7xl font-black uppercase tracking-tight italic leading-[0.95] mb-8"
              >
                {post.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/75 text-xl leading-relaxed"
              >
                {post.description}
              </motion.p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/10 group">
                {post.mainImage && (
                  <Image
                    src={urlFor(post.mainImage).url()}
                    alt={post.mainImage.alt || post.title}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                    priority
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper className="pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-4">
            {Array.isArray(post.body) && post.body.length > 0 ? (
              <PortableText value={post.body} components={components} />
            ) : (
              <div
                className="space-y-6 [&_blockquote]:border-l-4 [&_blockquote]:border-white/20 [&_blockquote]:pl-6 [&_blockquote]:text-xl [&_blockquote]:italic [&_blockquote]:text-white/60 [&_h1]:mb-6 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:uppercase [&_h1]:italic [&_h1]:text-white [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:uppercase [&_h2]:italic [&_h2]:text-white [&_li]:rounded-2xl [&_li]:border [&_li]:border-white/10 [&_li]:bg-white/[0.02] [&_li]:p-5 [&_li]:text-sm [&_li]:tracking-wide [&_li]:text-white/80 [&_p]:mb-8 [&_p]:rounded-3xl [&_p]:border [&_p]:border-white/10 [&_p]:bg-white/[0.03] [&_p]:p-8 [&_p]:text-lg [&_p]:leading-relaxed [&_p]:text-white/75 [&_ul]:mb-12 [&_ul]:mt-8 [&_ul]:grid [&_ul]:gap-4 sm:[&_ul]:grid-cols-2"
                dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
              />
            )}
          </div>

          <div className="mt-20 flex flex-wrap gap-4 items-center border-t border-white/10 pt-12">
            <Link
              href="/contact"
              className="px-8 py-4 rounded-full bg-white text-black text-xs uppercase tracking-[0.3em] font-black min-h-12 inline-flex items-center hover:scale-105 transition-transform"
            >
              Book Strategy Call
            </Link>
            <Link
              href="/insights"
              className="px-8 py-4 rounded-full border border-white/20 text-white text-xs uppercase tracking-[0.3em] font-black min-h-12 inline-flex items-center hover:bg-white/5 transition-colors"
            >
              Back To Insights
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
`,
);

await write(
  path.join(bhadrikRoot, "next.config.ts"),
  String.raw`import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  assetPrefix: process.env.NEXT_PUBLIC_CDN_URL || undefined,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap", "lucide-react"],
    inlineCss: true,
  },
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
      preventFullImport: true,
    },
  },
  images: {
    unoptimized: true,
  },
};

export default withAnalyzer(nextConfig);
`,
);

await write(
  path.join(nexavvyRoot, "src/lib/cmsBlog.js"),
  String.raw`const CMS_BASE_URL = (process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:3000").replace(/\/$/, "");

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function normalizeNexavvyBlog(post) {
  return {
    ...post,
    id: post.id || post._id || post.slug,
    date: formatDate(post.publishedAt || post.date),
    image: post.image || post.featuredImage?.url || "/assets/images/blogpostimage1.webp",
    author: post.author?.name || post.author || "FT Nexavvy",
    authorImage: post.authorImage || post.author?.image || "/assets/images/female.webp",
    authorBio: post.authorBio || post.author?.bio || "FT Nexavvy editorial team.",
    quote: post.quote?.text ? post.quote : { text: "", author: "" },
    content:
      post.contentMode === "nexavvyStructured"
        ? post.structuredContent || post.content || { intro: [], strategies: [] }
        : post.content || post.contentHtml || "",
  };
}

export async function fetchNexavvyBlogs() {
  const response = await fetch(\`\${CMS_BASE_URL}/api/posts?siteId=nexavvy\`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch blogs");
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeNexavvyBlog) : [];
}

export async function fetchNexavvyBlog(slug) {
  const response = await fetch(\`\${CMS_BASE_URL}/api/posts/slug/nexavvy/\${slug}\`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch blog");
  }

  return normalizeNexavvyBlog(await response.json());
}
`,
);

await write(
  path.join(nexavvyRoot, "src/app/pages/blogs/insights/page.jsx"),
  String.raw`"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fetchNexavvyBlog } from "@/lib/cmsBlog";

import MenuBurger from "@/components/MenuBurger";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import Insightsheader from "@/sections/Insights/insightsheader";
import Strategy from "@/sections/Insights/strategy";
import Relatedblog from "@/sections/Insights/relatedblog";
import Letstalk from "@/sections/Services/letstalk";

function InsightsContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlog() {
      try {
        setLoading(true);
        const data = await fetchNexavvyBlog(slug);
        setBlog(data);
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        setBlog(null);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadBlog();
    }
  }, [slug]);

  if (loading) return <div className="text-white p-10 min-h-screen bg-black">Loading Insight...</div>;
  if (!blog) return <div className="text-white p-10 min-h-screen bg-black">Insight not found.</div>;

  return (
    <>
      <MenuBurger />
      <Header variant="insights" />

      <div className="bg-[#000001] pt-6">
        <Breadcrumbs
          items={[
            { label: "Blog", href: "/pages/blogs/latestblog/" },
            { label: blog.category },
            { label: blog.title }
          ]}
        />
      </div>

      <Insightsheader blog={blog} />
      <Strategy blog={blog} />
      <Relatedblog currentSlug={slug} />
      <Letstalk />
    </>
  );
}

export default function Insights() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <InsightsContent />
    </Suspense>
  );
}
`,
);

await write(
  path.join(nexavvyRoot, "src/sections/Blogs/bloglist.jsx"),
  String.raw`"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { fetchNexavvyBlogs } from "@/lib/cmsBlog";

const SideGlowUnified = dynamic(() => import("@/components/SideGlowUnified"), { ssr: false });

const categories = [
  "All Articles",
  "Analytics",
  "Branding",
  "Content Marketing",
  "SEO Strategies",
  "Social Media",
];

export default function Bloglist() {
  const [active, setActive] = useState("All Articles");
  const [blogsList, setBlogsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const dateRef = useRef(null);

  useEffect(() => {
    async function loadBlogs() {
      try {
        setLoading(true);
        const data = await fetchNexavvyBlogs();
        setBlogsList(data);
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  const blogs = blogsList;

  return (
    <section className="relative section-padding-y w-full bg-[#000001]">
      <SideGlowUnified variant="green" className="z-20" />
      <div className="px-wrapper mx-auto">
        <h1 className="relative z-30 font-poppins text-4xl sm:text-5xl lg:text-[56px] xl:text-[48px] 2xl:text-[60px] 3xl:text-[72px] font-light text-white uppercase leading-tight">
          Insights that{" "}
          <span className="bg-linear-to-r from-[#1999D5] to-[#3E9D62] bg-clip-text font-medium text-transparent">
            drive growth
          </span>
        </h1>

        <h2 className="sr-only">
          Latest digital marketing insights, strategies, and trends from FT Nexavvy Ahmedabad
        </h2>

        <p className="relative z-30 mt-5 max-w-272.5 text-[13px] text-[#848484] md:text-[18px] lg:text-[22px] xl:text-[12px] 2xl:text-[15px] 3xl:text-[18px]">
          Insights, strategies, and trends from the world of digital marketing. Discover how to grow
          your business in the digital age.
        </p>

        <div className="relative z-1 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0 xl:mt-3.5 2xl:mt-6 3xl:mt-6">
          <div className="flex sm:mt-0 mt-5 flex-wrap gap-2 sm:gap-4">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setActive(item)}
                className={\`rounded-md px-3 py-2 text-[9px] whitespace-nowrap transition-all duration-300 sm:px-5 sm:py-3 md:text-[15px] xl:px-2.5 xl:py-1.5 xl:text-[11px] 2xl:px-4 2xl:py-2 2xl:text-[14px] 3xl:px-5.5 3xl:py-2 3xl:text-[15px] \${active === item
                    ? "bg-linear-to-r from-[#1999D5] to-[#3E9D62] text-white shadow-md"
                    : "border border-[#333B36] text-[#7E7E81] hover:border-[#3E9D62] hover:text-white"
                  } \`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex h-13 w-full items-center gap-3 rounded-lg bg-[#02141B] px-4 lg:w-105 xl:h-9 xl:w-80 xl:px-2 xl:py-1 2xl:w-110 2xl:px-4 2xl:py-6 3xl:h-8 3xl:w-120 3xl:px-6 3xl:py-6">
            <Image
              src="/assets/images/searchbox.webp"
              alt=""
              aria-hidden="true"
              width={1000}
              height={1000}
              className="h-5 w-5 opacity-70 xl:h-4 xl:w-4 2xl:h-5 2xl:w-5 3xl:h-6 3xl:w-6"
            />
            <input
              placeholder="Search Blogs..."
              aria-label="Search blogs"
              className="w-full bg-transparent text-[14px] text-[#babad3] outline-none md:text-[15px] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px]"
            />
          </div>
        </div>

        <div className="relative z-30 mx-auto mt-4 h-px w-full bg-[linear-gradient(120deg,rgba(138,138,138,0.5)_-6.43%,rgba(255,255,255,0)_100%)]" />
        <div className="relative z-30 mt-4 flex items-center justify-between xl:mt-2 2xl:mt-4 3xl:mt-6">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/images/filter icon.webp"
              width={5}
              height={5}
              alt="filter icon"
              aria-hidden="true"
              className="h-5 w-5 opacity-70 xl:h-4 xl:w-4 2xl:h-5 2xl:w-5 3xl:h-6 3xl:w-6"
            />
            <p className="text-[13px] text-[#9E9E9E] md:text-[15px] xl:text-[11px] 2xl:text-[14px] 3xl:text-[17px]">
              All Categories • Sorted by Latest
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Sort by date"
            onClick={() => dateRef.current?.showPicker()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dateRef.current?.showPicker(); } }}
            className="flex h-11.75 w-50 cursor-pointer items-center justify-between rounded-lg border border-[#333B36] bg-transparent px-2 xl:h-8 xl:w-35 2xl:h-11.75 2xl:w-50 3xl:h-12 3xl:w-55"
          >
            <Image
              src="/assets/images/Calander.webp"
              width={5}
              height={5}
              alt=""
              aria-hidden="true"
              className="h-5 w-5 opacity-70 xl:h-4 xl:w-4 2xl:h-5 2xl:w-5 3xl:h-6 3xl:w-6"
            />
            <span className="text-[14px] text-[#9E9E9E] md:text-[15px] xl:text-[12px] 2xl:text-[16px] 3xl:text-[18px]">
              Latest First
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9L12 15L18 9" stroke="#9A9A9D" strokeWidth="2" />
            </svg>
          </div>

          <input ref={dateRef} type="date" aria-label="Select date" className="hidden" />
        </div>

        <div className="relative z-30 mt-6 grid grid-cols-1 items-start gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_420px] 2xl:gap-12 3xl:grid-cols-[minmax(0,1fr)_480px] 3xl:gap-16">
          <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 xl:gap-8 2xl:gap-10 3xl:gap-12">
            {!loading && blogs
              .filter(
                (blog) =>
                  active === "All Articles" ||
                  blog.category === active ||
                  (active === "Social Media" && blog.category === "Social Media") ||
                  (active === "SEO Strategies" && blog.category.includes("SEO")) ||
                  (active === "Content Marketing" && blog.category.includes("Marketing")) ||
                  (active === "Analytics" && blog.category.includes("Analytics")) ||
                  (active === "Branding" && blog.category.includes("Branding"))
              )
              .map((blog) => (
                <article
                  key={blog.id}
                  className="flex h-full w-full flex-col rounded-2xl bg-[#02141B] p-4 transition hover:-translate-y-1 sm:p-5 2xl:p-6 3xl:p-7"
                >
                  <Link
                    href={\`/pages/blogs/insights?slug=\${blog.slug}\`}
                    className="group relative block aspect-[1.6] w-full shrink-0 overflow-hidden rounded-lg"
                  >
                    <Image
                      src={blog.image}
                      alt={blog.title}
                      width={1000}
                      height={1000}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" aria-hidden />
                  </Link>

                  <Link
                    href={\`/pages/blogs/insights?slug=\${blog.slug}\`}
                    className="mt-5 block text-lg font-medium leading-snug text-white sm:text-xl lg:text-[22px] xl:mt-4 xl:text-[17px] 2xl:mt-6 2xl:text-[22px] 3xl:mt-7 3xl:text-[25px] hover:text-[#3E9D62]"
                  >
                    {blog.title}
                  </Link>

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-sm text-[#D6D6D6] xl:text-[11px] 2xl:text-[14px] 3xl:text-[15px]">
                    <span className="uppercase">{blog.category}</span>
                    <span className="h-2 w-2 rounded-full bg-linear-to-r from-[#1999D5] to-[#3E9D62]" />
                    <span>{blog.date}</span>
                  </div>

                  <Link
                    href={\`/pages/blogs/insights?slug=\${blog.slug}\`}
                    className="mt-3 inline-flex items-center gap-2 text-[15px] font-medium text-[#3E9D62] hover:text-white xl:text-[12px] 2xl:text-[15px] 3xl:text-[17px]"
                  >
                    Read full article
                    <svg
                      xmlns="https://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </article>
              ))}
          </div>

          <aside className="rounded-2xl bg-[#02141B] p-5 h-fit lg:sticky lg:top-35 lg:p-8 xl:p-6 2xl:p-8 3xl:p-10">
            <h3 className="text-2xl font-medium text-white sm:text-3xl xl:text-[22px] xl:leading-snug 2xl:text-[28px] 2xl:leading-snug 3xl:text-[32px] 3xl:leading-snug">
              Subscribe To Our <br className="hidden sm:block" /> Newsletter!
            </h3>

            <p className="mt-4 text-[14px] leading-relaxed text-[#9E9EA5] xl:text-[12px] 2xl:text-[14px] 3xl:text-[16px]">
              Join our newsletter community of over 2,000 curious subscribers for exclusive updates
              on our latest blogs. Enter your email address
            </p>

            <label htmlFor="blog-newsletter-email" className="sr-only">Email for newsletter</label>
            <input
              id="blog-newsletter-email"
              type="email"
              className="mt-6 h-12 w-full rounded-lg border border-[#333B36] bg-transparent px-4 font-medium text-[#afafbe] outline-none focus:border-[#3E9D62] xl:mt-5 xl:h-11 xl:text-[13px] 2xl:mt-8 2xl:h-13 2xl:text-[15px] 3xl:mt-10 3xl:h-14 3xl:text-[16px]"
              placeholder="Enter your email"
            />

            <Link
              href="/contact"
              className="group mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-white/20 bg-linear-to-r from-[#1999D5] to-[#3E9D62] px-5 font-poppins text-[0.875rem] font-semibold text-white transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-105 hover:shadow-[0_12px_40px_rgba(62,157,98,0.35)] lg:h-11 lg:px-6 lg:text-[1rem] xl:mt-4 xl:h-10 xl:px-6 xl:text-[14px] 2xl:mt-6 2xl:h-12 2xl:gap-2 2xl:px-8 2xl:text-[16px] 3xl:mt-8 3xl:h-14 3xl:px-10 3xl:text-[18px]"
            >
              <span>Subscribe </span>
              <svg
                xmlns="https://www.w3.org/2000/svg"
                className="ml-2 h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45 lg:h-5 lg:w-5 xl:h-4 xl:w-4 2xl:h-5 2xl:w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
`,
);

await write(
  path.join(nexavvyRoot, "src/sections/HomePage/Populararticlesection/index.jsx"),
  String.raw`"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchNexavvyBlogs } from "@/lib/cmsBlog";

export default function PopularArticalSection() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    async function loadArticles() {
      try {
        const data = await fetchNexavvyBlogs();
        setArticles(data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      }
    }

    loadArticles();
  }, []);

  return (
    <section className="w-full bg-black relative pb-20 sm:pb-30">
      <div className="mx-auto px-wrapper">
        <div className="flex flex-col gap-10 sm:gap-16">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 sm:gap-8">
            <div className="flex flex-col gap-2 sm:gap-3">
              <span className="font-poppins font-light text-xl sm:text-[22px] lg:text-[24px] 2xl:text-[28px] 3xl:text-[45px] text-white">
                OUR
              </span>

              <h2 className="font-poppins font-semibold leading-tight text-4xl sm:text-4xl md:text-[48px] lg:text-[64px] xl:text-[46px] 2xl:text-[60px] 3xl:text-[100px]">
                <span className="bg-[linear-gradient(90deg,#1999D5_3.62%,#3E9D62_100%)] bg-clip-text text-transparent">
                  Popular Articles
                </span>
              </h2>
            </div>

            <Link
              href="/pages/blogs/latestblog/"
              className="w-full sm:w-fit h-12 sm:h-11 xl:h-10 2xl:h-12 px-6 lg:px-6 xl:px-6 3xl:px-8 3xl:py-6.5 inline-flex items-center justify-center border border-white/20 rounded-lg gap-3 xl:gap-2 2xl:gap-3 3xl:gap-4 bg-linear-to-r from-[#1999D5] to-[#3E9D62] text-white font-poppins font-semibold text-sm lg:text-[1rem] xl:text-[0.8rem] 2xl:text-[0.9rem] 3xl:text-[1.2rem] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-105 hover:shadow-[0_12px_40px_rgba(62,157,98,0.35)] group"
            >
              <span className="font-medium tracking-[0.05] capitalize">View All Articles</span>
              <svg
                xmlns="https://www.w3.org/2000/svg"
                className="w-4 h-4 lg:w-5 lg:h-5 xl:w-5 xl:h-4 2xl:h-5 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-45"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 2xl:gap-8 3xl:gap-10">
            {articles.map((article) => (
              <article
                key={article.id}
                className="flex h-full w-full flex-col rounded-2xl bg-[#02141B] p-4 transition hover:-translate-y-1 sm:p-5 2xl:p-6 3xl:p-7 group"
              >
                <Link
                  href={\`/pages/blogs/insights?slug=\${article.slug}\`}
                  className="relative block aspect-[1.6] w-full shrink-0 overflow-hidden rounded-lg"
                >
                  <Image
                    src={article.image}
                    alt={article.title}
                    width={1000}
                    height={1000}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span
                    className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30"
                    aria-hidden
                  />
                </Link>

                <Link
                  href={\`/pages/blogs/insights?slug=\${article.slug}\`}
                  className="mt-5 block text-lg font-medium leading-snug text-white sm:text-xl lg:text-[20px] xl:mt-4 xl:text-[17px] 2xl:mt-6 2xl:text-[22px] 3xl:mt-7 3xl:text-[25px] hover:text-[#3E9D62] transition-colors"
                >
                  {article.title}
                </Link>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-sm text-[#D6D6D6] xl:text-[11px] 2xl:text-[14px] 3xl:text-[15px]">
                  <span className="uppercase">{article.category}</span>
                  <span className="h-2 w-2 rounded-full bg-linear-to-r from-[#1999D5] to-[#3E9D62]" />
                  <span>{article.date}</span>
                </div>

                <Link
                  href={\`/pages/blogs/insights?slug=\${article.slug}\`}
                  className="mt-3 inline-flex items-center gap-2 text-[15px] font-medium text-[#3E9D62] hover:text-white xl:text-[12px] 2xl:text-[15px] 3xl:text-[17px]"
                >
                  Read full article
                  <svg
                    xmlns="https://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
`,
);

await write(
  path.join(nexavvyRoot, "src/sections/Insights/relatedblog.jsx"),
  String.raw`"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchNexavvyBlogs } from "@/lib/cmsBlog";

export default function Relatedblog({ currentSlug }) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    async function loadRelated() {
      try {
        const data = await fetchNexavvyBlogs();
        setRelated(data.filter((blog) => blog.slug !== currentSlug).slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch related blogs:", error);
      }
    }

    loadRelated();
  }, [currentSlug]);

  return (
    <section className="flex justify-center bg-[#000001] section-padding-y">
      <div className="w-full px-wrapper">
        <div className="flex flex-col gap-6 sm:gap-16 xl:gap-8 2xl:gap-6 3xl:gap-6 pt-8">
          <div className="flex items-center gap-2.5 px-4 sm:px-5 py-2 border-l-2 border-[#1999D5] w-fit">
            <span className="font-poppins font-medium text-xl xl:text-[22px] 2xl:text-[26px] 3xl:text-[34px] sm:text-[32px] text-white">
              Related Articles
            </span>
          </div>

          <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:gap-8 lg:gap-10 xl:grid-cols-3 xl:gap-6 2xl:gap-10 3xl:grid-cols-3 3xl:gap-14">
            {related.map((item) => (
              <article
                key={item.id}
                className="flex w-full flex-col gap-4 rounded-2xl bg-[#02141B] p-4 transition hover:-translate-y-1 hover:shadow-xl sm:p-5 xl:h-80 2xl:h-102.5 3xl:h-150"
              >
                <Link
                  href={\`/pages/blogs/insights?slug=\${item.slug}\`}
                  className="group relative block aspect-video 3xl:aspect-auto w-full overflow-hidden rounded-lg xl:h-60 2xl:h-60 3xl:h-125"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className=" transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
                </Link>

                <Link
                  href={\`/pages/blogs/insights?slug=\${item.slug}\`}
                  className="font-poppins font-medium text-lg sm:text-xl lg:text-[22px] xl:text-[17px] 2xl:text-[22px] 3xl:text-[27px] leading-snug text-white hover:text-[#3E9D62]"
                >
                  {item.title}
                </Link>

                <div className="mt-3 2xl:mt-6 3xl:mt-6 flex flex-wrap items-center gap-3 text-[#D6D6D6] text-sm sm:text-base xl:text-[10px] 2xl:text-[14px] 3xl:text-[18px]">
                  <span className="uppercase">{item.category}</span>
                  <span className="w-2 h-2 rounded-full bg-linear-to-r from-[#1999D5] to-[#3E9D62]" />
                  <span>{item.date}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
`,
);

await write(
  path.join(keadigiRoot, "src/lib/cms.ts"),
  String.raw`export const CMS_BASE_URL = (import.meta.env.VITE_CMS_URL || "http://localhost:3000").replace(/\/$/, "");

export function cmsUrl(path) {
  return \`\${CMS_BASE_URL}\${path.startsWith("/") ? path : \`/\${path}\`}\`;
}
`,
);

await write(
  path.join(keadigiRoot, "src/pages/Blog.tsx"),
  String.raw`import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowUpRight, Loader2 } from "lucide-react";
import { SITE } from "@/data/site";
import { SEO } from "@/components/SEO";
import { Separator } from "@/components/ui/separator";
import { CTASection } from "@/components/CTASection";
import { useState, useEffect } from "react";
import { cmsUrl } from "@/lib/cms";

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(cmsUrl("/api/posts?siteId=growth-catalyst"));
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const POSTS = posts;
  return (
    <>
      <SEO
        title="Marketing Blog — Insights from the Best Digital Agency in Ahmedabad"
        description="Master digital growth with insights from KEADIGI, Ahmedabad's top digital marketing agency. Explore expert articles on SEO, Meta Ads, and Performance Marketing."
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": \`\${SITE.url}/blog#webpage\`,
              "url": \`\${SITE.url}/blog\`,
              "name": "Digital Marketing Blog — KEADIGI Ahmedabad",
              "description": "Practical insights on SEO, Performance Marketing, and Digital Growth from Ahmedabad's leading digital agency.",
              "isPartOf": {
                "@id": \`\${SITE.url}/#website\`
              },
              "about": {
                "@id": \`\${SITE.url}/#organization\`
              }
            },
            {
              "@type": "ItemList",
              "@id": \`\${SITE.url}/blog#itemlist\`,
              "itemListElement": POSTS.map((post, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "url": \`\${SITE.url}/blog/\${post.slug}\`,
                "name": post.title
              }))
            }
          ]
        }}
      />

      <section className="relative overflow-hidden section-pad-y">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <span className="text-primary font-bold tracking-[0.3em] uppercase mb-4 block fluid-body-sm">
              Intelligence
            </span>
            <h1 className="fluid-hero-h1 font-bold mb-6 text-white uppercase">
              THE <span className="text-primary">INSIGHTS</span>.
            </h1>
            <p className="text-white/60 leading-relaxed max-w-2xl fluid-body">
              The latest trends, strategies, and case studies on digital marketing, SEO, and performance advertising from Ahmedabad's experts.
            </p>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </section>

      <Separator />

      <section className="section-pad">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : POSTS.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12">
            {POSTS.map((post, idx) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group flex flex-col"
              >
                <Link to={\`/blog/\${post.slug}\`} className="block overflow-hidden rounded-2xl aspect-[16/9] mb-6 bg-card border border-border group-hover:border-primary/50 transition-smooth relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-primary/20">
                      {post.category}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-4 text-xs text-white/40 mb-4 uppercase tracking-widest font-bold">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                </div>

                <Link to={\`/blog/\${post.slug}\`} className="block group-hover:text-primary transition-smooth">
                  <h2 className="fluid-h2 font-bold mb-4 leading-tight text-white group-hover:text-primary transition-smooth">
                    {post.title}
                  </h2>
                </Link>

                <p className="text-white/60 mb-6 line-clamp-2" style={{ fontSize: "clamp(14px,1.3vw,18px)" }}>
                  {post.excerpt}
                </p>

                <Link
                  to={\`/blog/\${post.slug}\`}
                  className="mt-auto inline-flex items-center text-sm font-bold uppercase tracking-widest text-primary group-hover:gap-2 transition-smooth"
                >
                  Read Article <ArrowUpRight className="ml-1 w-4 h-4" />
                </Link>
              </motion.article>
            ))}
          </div>
          ) : (
            <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl">
              <p className="text-white/40 uppercase tracking-widest font-bold">No posts found yet.</p>
            </div>
          )}
        </div>
      </section>

      <CTASection
        title="Get more insights delivered to your inbox."
        description="We share one technical growth playbook every week. High-authority tactics, no fluff. Subscribe via our newsletter in the footer."
        primaryCTA={{ text: "Go to Contact", link: "/contact" }}
        secondaryCTA={{ text: "Explore Services", link: "/services" }}
      />
    </>
  );
}
`,
);

await write(
  path.join(keadigiRoot, "src/pages/BlogPost.tsx"),
  String.raw`import { Link, useParams, Navigate } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { SITE } from "@/data/site";
import { useState, useEffect } from "react";
import { cmsUrl } from "@/lib/cms";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(cmsUrl(\`/api/posts/slug/growth-catalyst/\${slug}\`));
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setPost(data);
      } catch (error) {
        console.error("Failed to fetch blog post:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        path={\`/blog/\${post.slug}\`}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              "@id": \`\${SITE.url}/blog/\${post.slug}#article\`,
              "headline": post.title,
              "description": post.excerpt,
              "url": \`\${SITE.url}/blog/\${post.slug}\`,
              "datePublished": post.date,
              "dateModified": post.date,
              "articleSection": post.category,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": \`\${SITE.url}/blog/\${post.slug}\`
              },
              "author": {
                "@id": \`\${SITE.url}/#organization\`
              },
              "publisher": {
                "@id": \`\${SITE.url}/#organization\`
              },
              "image": post.ogImage || \`\${SITE.url}/og-image.jpg\`
            }
          ]
        }}
      />
      <section className="relative overflow-hidden section-pad-y">
        <div className="container relative z-10">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-primary hover:text-white mb-8 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-primary mb-5 uppercase tracking-widest font-bold fluid-body-sm">
              <span>{post.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
            </div>
            <h1 className="fluid-hero-h1 font-bold mb-6 text-white uppercase">
              {post.title}
            </h1>
            <p className="text-white/60 max-w-2xl leading-relaxed fluid-body">
              {post.excerpt}
            </p>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </section>
      <section className="section-pad">
        <div className="container max-w-3xl">

          <div
            className="prose prose-invert max-w-none mt-12 text-foreground/90 leading-relaxed space-y-5"
            dangerouslySetInnerHTML={{ __html: post.contentHtml || post.content }}
          />

          <div className="mt-16 p-8 rounded-2xl bg-gradient-card border border-border">
            <h3 className="font-display text-2xl font-semibold mb-3">Want results like these?</h3>
            <p className="text-muted-foreground mb-6">Let's talk about your growth goals.</p>
            <Button asChild variant="hero">
              <Link to="/contact">Book a free strategy call</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
`,
);

await repairTemplateEscapes([
  path.join(bhadrikRoot, "lib/sanity.ts"),
  path.join(nexavvyRoot, "src/lib/cmsBlog.js"),
  path.join(nexavvyRoot, "src/app/pages/blogs/insights/page.jsx"),
  path.join(nexavvyRoot, "src/sections/Blogs/bloglist.jsx"),
  path.join(nexavvyRoot, "src/sections/HomePage/Populararticlesection/index.jsx"),
  path.join(nexavvyRoot, "src/sections/Insights/relatedblog.jsx"),
  path.join(keadigiRoot, "src/lib/cms.ts"),
  path.join(keadigiRoot, "src/pages/Blog.tsx"),
  path.join(keadigiRoot, "src/pages/BlogPost.tsx"),
]);

console.log("Frontend integration files prepared.");
