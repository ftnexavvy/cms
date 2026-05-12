import { createClient } from "@sanity/client";
import { readFile } from "fs/promises";
import mongoose from "mongoose";
import vm from "vm";

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "b5wrbu9i",
  dataset: process.env.SANITY_DATASET || "blog",
  apiVersion: "2024-04-25",
  useCdn: false,
});

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/blogs";

const PostSchema = new mongoose.Schema(
  {
    siteId: String,
    status: String,
    title: String,
    slug: String,
    description: String,
    excerpt: String,
    category: String,
    tags: [String],
    readTime: String,
    author: {
      name: String,
      image: String,
      bio: String,
    },
    quote: {
      text: String,
      author: String,
    },
    featuredImage: {
      url: String,
      alt: String,
    },
    publishedAt: Date,
    contentMode: String,
    contentHtml: String,
    portableText: [mongoose.Schema.Types.Mixed],
    structuredContent: mongoose.Schema.Types.Mixed,
    seo: mongoose.Schema.Types.Mixed,
    schemaType: String,
    legacy: mongoose.Schema.Types.Mixed,
  },
  { strict: false },
);

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

function parseExportedArray(source, constName) {
  const regex = new RegExp(`export const ${constName} = (\\[[\\s\\S]*?\\n\\]);`);
  const match = source.match(regex);
  if (!match) {
    throw new Error(`Could not find exported array "${constName}"`);
  }
  return vm.runInNewContext(match[1], {});
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphsToHtml(paragraphs = []) {
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n");
}

function isoDate(dateLike) {
  const date = new Date(dateLike);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function upsertPost(filter, payload) {
  await Post.findOneAndUpdate(filter, payload, { upsert: true, new: true });
}

async function importBhadrik() {
  const posts = await sanityClient.fetch(`*[
    _type == "post" &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ] | order(coalesce(publishedAt, _createdAt) desc) {
    title,
    "slug": slug.current,
    description,
    "excerpt": description,
    "image": mainImage.asset->url,
    "imageAlt": mainImage.alt,
    category,
    readTime,
    publishedAt,
    keywords,
    body,
    _createdAt
  }`);

  for (const post of posts) {
    await upsertPost(
      { siteId: "bhadrik-panchal", slug: post.slug },
      {
        siteId: "bhadrik-panchal",
        status: "published",
        title: post.title,
        slug: post.slug,
        description: post.description || "",
        excerpt: post.excerpt || post.description || "",
        category: post.category || "",
        tags: [],
        readTime: post.readTime || "",
        author: {
          name: "Bhadrik Panchal",
          image: "",
          bio: "",
        },
        quote: { text: "", author: "" },
        featuredImage: {
          url: post.image || "",
          alt: post.imageAlt || post.title,
        },
        publishedAt: post.publishedAt || post._createdAt,
        contentMode: "portableText",
        contentHtml: "",
        portableText: Array.isArray(post.body) ? post.body : [],
        structuredContent: { intro: [], strategies: [] },
        seo: {
          metaTitle: post.title,
          metaDescription: post.description || "",
          ogImage: post.image || "",
          canonical: "",
          keywords: post.keywords || [],
          noIndex: false,
        },
        schemaType: "BlogPosting",
        legacy: {
          importedFrom: "sanity",
        },
      },
    );
  }

  return posts.length;
}

async function importNexavvy() {
  const file = await readFile(
    "/Users/ftnexavvy/Desktop/desktop/dixit/nexavvy-frontend 2/src/sections/data/blogs.js",
    "utf8",
  );
  const blogs = parseExportedArray(file, "blogs");

  for (const blog of blogs) {
    await upsertPost(
      { siteId: "nexavvy", slug: blog.slug },
      {
        siteId: "nexavvy",
        status: "published",
        title: blog.title,
        slug: blog.slug,
        description: blog.title,
        excerpt: blog.title,
        category: blog.category || "",
        tags: [],
        readTime: blog.readTime || "",
        author: {
          name: blog.author || "",
          image: blog.authorImage || "",
          bio: blog.authorBio || "",
        },
        quote: blog.quote || { text: "", author: "" },
        featuredImage: {
          url: blog.image || "",
          alt: blog.title,
        },
        publishedAt: isoDate(blog.date),
        contentMode: "nexavvyStructured",
        contentHtml: "",
        portableText: [],
        structuredContent: blog.content || { intro: [], strategies: [] },
        seo: {
          metaTitle: blog.title,
          metaDescription: blog.title,
          ogImage: blog.image || "",
          canonical: "",
          keywords: [],
          noIndex: false,
        },
        schemaType: "BlogPosting",
        legacy: {
          importedFrom: "nexavvy-blogs-js",
          originalId: blog.id,
        },
      },
    );
  }

  return blogs.length;
}

async function importKeadigi() {
  const file = await readFile(
    "/Users/ftnexavvy/Desktop/main keadigi/growth-catalyst/src/data/site.ts",
    "utf8",
  );
  const posts = parseExportedArray(file, "POSTS");

  for (const post of posts) {
    await upsertPost(
      { siteId: "growth-catalyst", slug: post.slug },
      {
        siteId: "growth-catalyst",
        status: "published",
        title: post.title,
        slug: post.slug,
        description: post.excerpt || "",
        excerpt: post.excerpt || "",
        category: post.category || "",
        tags: [],
        readTime: post.readTime || "",
        author: {
          name: "KEADIGI",
          image: "",
          bio: "",
        },
        quote: { text: "", author: "" },
        featuredImage: {
          url: "",
          alt: post.title,
        },
        publishedAt: isoDate(post.date),
        contentMode: "html",
        contentHtml: paragraphsToHtml([post.excerpt || ""]),
        portableText: [],
        structuredContent: { intro: [], strategies: [] },
        seo: {
          metaTitle: post.title,
          metaDescription: post.excerpt || "",
          ogImage: "",
          canonical: "",
          keywords: [],
          noIndex: false,
        },
        schemaType: "BlogPosting",
        legacy: {
          importedFrom: "keadigi-site-ts",
          bodyAvailability: "excerpt-only",
        },
      },
    );
  }

  return posts.length;
}

async function main() {
  await mongoose.connect(mongoUri);

  const [bhadrikCount, nexavvyCount, keadigiCount] = await Promise.all([
    importBhadrik(),
    importNexavvy(),
    importKeadigi(),
  ]);

  await mongoose.disconnect();
  console.log(
    JSON.stringify(
      {
        ok: true,
        imported: {
          "bhadrik-panchal": bhadrikCount,
          nexavvy: nexavvyCount,
          "growth-catalyst": keadigiCount,
        },
      },
      null,
      2,
    ),
  );
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
