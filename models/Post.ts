import mongoose, { Schema, model, models } from "mongoose";

const StrategySchema = new Schema(
  {
    title: { type: String, trim: true },
    paragraphs: [{ type: String, trim: true }],
  },
  { _id: false },
);

const StructuredContentSchema = new Schema(
  {
    intro: [{ type: String, trim: true }],
    strategies: [StrategySchema],
  },
  { _id: false },
);

const ImageAssetSchema = new Schema(
  {
    url: { type: String, trim: true, default: "" },
    alt: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const AuthorSchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const QuoteSchema = new Schema(
  {
    text: { type: String, trim: true, default: "" },
    author: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const SeoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "" },
    ogImage: { type: String, trim: true, default: "" },
    canonical: { type: String, trim: true, default: "" },
    keywords: [{ type: String, trim: true }],
    noIndex: { type: Boolean, default: false },
  },
  { _id: false },
);

const PostSchema = new Schema(
  {
    siteId: {
      type: String,
      required: true,
      enum: ["bhadrik-panchal", "nexavvy", "growth-catalyst"],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    excerpt: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],
    readTime: { type: String, trim: true, default: "" },
    author: { type: AuthorSchema, default: () => ({}) },
    quote: { type: QuoteSchema, default: () => ({}) },
    featuredImage: { type: ImageAssetSchema, default: () => ({}) },
    publishedAt: { type: Date, default: Date.now, index: true },
    contentMode: {
      type: String,
      required: true,
      enum: ["html", "portableText", "nexavvyStructured"],
      default: "html",
    },
    contentHtml: { type: String, default: "" },
    portableText: { type: [Schema.Types.Mixed], default: [] },
    structuredContent: { type: StructuredContentSchema, default: () => ({}) },
    seo: { type: SeoSchema, default: () => ({}) },
    schemaType: { type: String, trim: true, default: "BlogPosting" },
    legacy: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

PostSchema.index({ siteId: 1, slug: 1 }, { unique: true });

const Post = models.Post || model("Post", PostSchema);

export default Post;
