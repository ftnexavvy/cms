import { createClient } from "@sanity/client";
import mongoose from "mongoose";

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
  },
  { strict: false },
);

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

async function migrate() {
  await mongoose.connect(mongoUri);

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
    await Post.findOneAndUpdate(
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
      },
      { upsert: true, new: true },
    );
  }

  await mongoose.disconnect();
  console.log(`Migrated ${posts.length} Sanity posts into MongoDB.`);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
