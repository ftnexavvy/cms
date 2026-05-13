"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Code2,
  FileText,
  Globe2,
  Image as ImageIcon,
  Loader2,
  PenLine,
  UploadCloud,
  X,
} from "lucide-react";
import { slugify } from "@/lib/strings";
import {
  getDefaultContentModeForSite,
  getSiteConfig,
  SITES,
} from "@/lib/site-config";

type PostEditorProps = {
  mode: "create" | "edit";
  postId?: string;
  defaultSiteId?: string;
};

const emptyStructuredJson = JSON.stringify({ intro: [], strategies: [] }, null, 2);
const emptyPortableTextJson = JSON.stringify([], null, 2);

function resolveInitialSiteId(defaultSiteId?: string) {
  if (defaultSiteId && SITES.some((s) => s.id === defaultSiteId)) return defaultSiteId;
  return SITES[0].id;
}

/* ── Section wrapper ── */
function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="editor-section">
      <div className="editor-section-header">
        <div className="editor-section-icon">
          <Icon size={14} />
        </div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {title}
        </p>
      </div>
      <div className="editor-section-body">{children}</div>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

/* ── Topbar ── */
function EditorTopbar({
  isEdit,
  siteName,
  status,
  saving,
  siteId,
}: {
  isEdit: boolean;
  siteName: string;
  status: string;
  saving: boolean;
  siteId: string;
}) {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link
          href={`/?siteId=${siteId}`}
          className="btn btn-ghost btn-sm"
          style={{ padding: "6px 8px" }}
        >
          <ArrowLeft size={15} />
        </Link>
        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--border-subtle)",
          }}
        />
        <div>
          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {isEdit ? "Edit Post" : "Create Post"}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
            {siteName}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          className={`badge ${status === "published" ? "badge-live" : "badge-draft"}`}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "currentColor",
              display: "inline-block",
            }}
          />
          {status}
        </span>
        <button
          type="submit"
          form="post-editor-form"
          disabled={saving}
          className="btn btn-primary btn-sm"
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}
          {isEdit ? "Update" : "Publish"}
        </button>
      </div>
    </div>
  );
}

export default function PostEditor({ mode, postId, defaultSiteId }: PostEditorProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const initialSiteId = resolveInitialSiteId(defaultSiteId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prevSiteIdRef = useRef(initialSiteId);

  const [form, setForm] = useState({
    siteId: initialSiteId,
    status: "published",
    title: "",
    slug: "",
    description: "",
    category: "",
    tags: "",
    readTime: "",
    image: "",
    imageAlt: "",
    publishedAt: new Date().toISOString().slice(0, 16),
    authorName: "",
    authorImage: "",
    authorBio: "",
    quoteText: "",
    quoteAuthor: "",
    contentMode: getDefaultContentModeForSite(initialSiteId),
    contentHtml: "",
    portableTextJson: emptyPortableTextJson,
    structuredContentJson: emptyStructuredJson,
  });

  /* ── Load existing post ── */
  useEffect(() => {
    if (!isEdit || !postId) return;
    async function loadPost() {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load post");
        setForm({
          siteId: data.siteId || SITES[0].id,
          status: data.status || "published",
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          category: data.category || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          readTime: data.readTime || "",
          image: data.featuredImage?.url || "",
          imageAlt: data.featuredImage?.alt || "",
          authorName: data.author?.name || "",
          authorImage: data.author?.image || "",
          authorBio: data.author?.bio || "",
          quoteText: data.quote?.text || "",
          quoteAuthor: data.quote?.author || "",
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString().slice(0, 16)
            : "",
          contentMode:
            data.contentMode || getDefaultContentModeForSite(data.siteId || SITES[0].id),
          contentHtml: data.contentHtml || "",
          portableTextJson: JSON.stringify(data.portableText || [], null, 2),
          structuredContentJson: JSON.stringify(
            data.structuredContent || { intro: [], strategies: [] },
            null,
            2,
          ),
        });
      } catch (err: any) {
        setError(err.message || "Failed to load post");
      } finally {
        setLoading(false);
      }
    }
    void loadPost();
  }, [isEdit, postId]);

  const siteName = useMemo(
    () => SITES.find((s) => s.id === form.siteId)?.name || "Website",
    [form.siteId],
  );

  const activeSite = useMemo(() => getSiteConfig(form.siteId), [form.siteId]);

  /* ── Auto-switch content mode on site change ── */
  useEffect(() => {
    if (isEdit) { prevSiteIdRef.current = form.siteId; return; }
    if (prevSiteIdRef.current === form.siteId) return;
    prevSiteIdRef.current = form.siteId;
    setForm((c) => ({ ...c, contentMode: getDefaultContentModeForSite(form.siteId) }));
  }, [form.siteId, isEdit]);

  function update(field: string, value: string) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  /* ── Image upload ── */
  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      update("image", data.absoluteUrl || data.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        siteId: form.siteId,
        status: form.status,
        title: form.title,
        slug: slugify(form.slug || form.title),
        description: form.description,
        category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        readTime: form.readTime,
        featuredImage: { url: form.image, alt: form.imageAlt },
        publishedAt: form.publishedAt,
        author: {
          name: form.authorName,
          image: form.authorImage,
          bio: form.authorBio,
        },
        quote: {
          text: form.quoteText,
          author: form.quoteAuthor,
        },
        contentMode: form.contentMode,
        contentHtml: form.contentHtml,
        portableText: JSON.parse(form.portableTextJson || "[]"),
        structuredContent: JSON.parse(form.structuredContentJson || emptyStructuredJson),
      };
      const res = await fetch(isEdit ? `/api/posts/${postId}` : "/api/posts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save post");
      router.push(`/?siteId=${payload.siteId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <>
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 120, height: 18, borderRadius: 6 }} />
          </div>
        </div>
        <div className="admin-content" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[280, 200, 360].map((h, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: h, borderRadius: 16 }}
            />
          ))}
        </div>
      </>
    );
  }

  /* ── Content mode label ── */
  const contentModeLabels: Record<string, string> = {
    html: "HTML / Rich Text",
    portableText: "Portable Text JSON",
    nexavvyStructured: "Nexavvy Structured JSON",
  };

  return (
    <>
      <EditorTopbar
        isEdit={isEdit}
        siteName={siteName}
        status={form.status}
        saving={saving}
        siteId={form.siteId}
      />

      <div className="admin-content">
        <form
          id="post-editor-form"
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}
        >
          {/* ── 1. Publishing ── */}
          <Section title="Publishing" icon={Globe2}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              <Field label="Website">
                <select
                  value={form.siteId}
                  onChange={(e) => update("siteId", e.target.value)}
                  className="form-select"
                >
                  {SITES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="form-select"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </Field>

              <Field label="Publish Date">
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => update("publishedAt", e.target.value)}
                  className="form-input"
                />
              </Field>

              <Field label="Read Time">
                <input
                  value={form.readTime}
                  onChange={(e) => update("readTime", e.target.value)}
                  placeholder="5 min read"
                  className="form-input"
                />
              </Field>
            </div>

            {/* Site info pill */}
            {activeSite && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  display: "flex",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                {[
                  { k: "Mode", v: activeSite.defaultContentMode },
                  { k: "Blog path", v: activeSite.blogIndexPath },
                  { k: "Post URL", v: activeSite.blogPostPath("{slug}") },
                ].map((item) => (
                  <div key={item.k}>
                    <p className="text-label" style={{ marginBottom: 3 }}>
                      {item.k}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        fontFamily: "monospace",
                        margin: 0,
                      }}
                    >
                      {item.v}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* ── 2. Post Details ── */}
          <Section title="Post Details" icon={PenLine}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Title">
                <input
                  value={form.title}
                  onChange={(e) => {
                    update("title", e.target.value);
                    if (!form.slug) update("slug", slugify(e.target.value));
                  }}
                  className="form-input"
                  placeholder="Write a compelling headline…"
                  required
                  style={{ fontSize: 15, fontWeight: 600 }}
                />
              </Field>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Field label="Slug">
                  <input
                    value={form.slug}
                    onChange={(e) => update("slug", slugify(e.target.value))}
                    className="form-input"
                    placeholder="auto-generated-from-title"
                    required
                    style={{ fontFamily: "monospace", fontSize: 13 }}
                  />
                </Field>

                <Field label="Category">
                  <input
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="form-input"
                    placeholder="e.g. Marketing, Strategy"
                  />
                </Field>
              </div>

              <Field label="Tags (comma separated)">
                <input
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  className="form-input"
                  placeholder="seo, growth, founders"
                />
              </Field>

              <Field label="Description / Excerpt">
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className="form-textarea"
                  placeholder="Short summary shown in cards and social previews…"
                  style={{ minHeight: 96 }}
                />
              </Field>
            </div>
          </Section>

          {/* ── 3. Featured Image ── */}
          <Section title="Featured Image" icon={ImageIcon}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 20,
                alignItems: "start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* URL input row */}
                <div>
                  <label className="form-label">Image URL</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={form.image}
                      onChange={(e) => update("image", e.target.value)}
                      className="form-input"
                      placeholder="https://…"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn btn-secondary"
                      style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      {uploading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <UploadCloud size={13} />
                      )}
                      Upload
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadFile(f);
                      }}
                    />
                  </div>
                </div>

                <Field label="Alt Text">
                  <input
                    value={form.imageAlt}
                    onChange={(e) => update("imageAlt", e.target.value)}
                    className="form-input"
                    placeholder="Describe the image for accessibility…"
                  />
                </Field>

                {/* Drag-drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f && f.type.startsWith("image/")) void uploadFile(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1px dashed ${dragOver ? "var(--border-focus)" : "var(--border-subtle)"}`,
                    borderRadius: 10,
                    padding: "20px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    cursor: "pointer",
                    background: dragOver ? "rgba(255,255,255,0.03)" : "transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <UploadCloud size={16} color="var(--text-faint)" />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Drop image here or click to browse
                  </span>
                </div>
              </div>

              {/* Preview */}
              <div
                style={{
                  width: 180,
                  flexShrink: 0,
                }}
              >
                <p className="text-label" style={{ marginBottom: 8 }}>
                  Preview
                </p>
                <div
                  style={{
                    width: 180,
                    height: 120,
                    borderRadius: 12,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {form.image ? (
                    <img
                      src={form.image}
                      alt={form.imageAlt}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <ImageIcon size={24} color="var(--text-faint)" />
                  )}
                </div>

                {/* Card preview */}
                <div
                  style={{
                    marginTop: 10,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  {form.category && (
                    <span className="badge badge-neutral" style={{ marginBottom: 6, display: "inline-flex" }}>
                      {form.category}
                    </span>
                  )}
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {form.title || "Post title"}
                  </p>
                  {form.description && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        margin: "5px 0 0",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {form.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Section>
          {/* ── 4. Author & Quote (Nexavvy) ── */}
          <Section title="Author & Quote" icon={PenLine}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Author Name">
                  <input
                    value={form.authorName}
                    onChange={(e) => update("authorName", e.target.value)}
                    className="form-input"
                    placeholder="Bhadrik Panchal"
                  />
                </Field>
                <Field label="Author Designation / Bio">
                  <input
                    value={form.authorBio}
                    onChange={(e) => update("authorBio", e.target.value)}
                    className="form-input"
                    placeholder="Founder & CEO"
                  />
                </Field>
                <Field label="Author Image URL">
                  <input
                    value={form.authorImage}
                    onChange={(e) => update("authorImage", e.target.value)}
                    className="form-input"
                    placeholder="/uploads/author.png"
                  />
                </Field>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Quote Text">
                  <textarea
                    value={form.quoteText}
                    onChange={(e) => update("quoteText", e.target.value)}
                    className="form-textarea"
                    placeholder="Wisdom is not a product of schooling but of the lifelong attempt to acquire it."
                    style={{ minHeight: 80 }}
                  />
                </Field>
                <Field label="Quote Author">
                  <input
                    value={form.quoteAuthor}
                    onChange={(e) => update("quoteAuthor", e.target.value)}
                    className="form-input"
                    placeholder="Albert Einstein"
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ── 5. Content Body ── */}
          <Section title="Content Body" icon={Code2}>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Content Mode</label>
              <select
                value={form.contentMode}
                onChange={(e) => update("contentMode", e.target.value)}
                className="form-select"
                style={{ maxWidth: 260 }}
              >
                <option value="html">HTML / Rich Text</option>
                <option value="portableText">Portable Text JSON</option>
                <option value="nexavvyStructured">Nexavvy Structured JSON</option>
              </select>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <label className="form-label" style={{ margin: 0 }}>
                  {contentModeLabels[form.contentMode] || "Content"}
                </label>
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>
                  {form.contentMode === "html"
                    ? form.contentHtml.length
                    : form.contentMode === "portableText"
                      ? form.portableTextJson.length
                      : form.structuredContentJson.length}{" "}
                  chars
                </span>
                {form.contentMode === "nexavvyStructured" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Replace content with template?")) {
                        update("structuredContentJson", JSON.stringify({
                          intro: ["First introductory paragraph here.", "Second introductory paragraph."],
                          strategies: [
                            {
                              title: "Strategy One",
                              paragraphs: ["Details about strategy one.", "More details..."],
                              image: "/uploads/placeholder.png"
                            }
                          ]
                        }, null, 2));
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ marginLeft: "auto", padding: "4px 8px", fontSize: 10 }}
                  >
                    Load Template
                  </button>
                )}
              </div>

              {form.contentMode === "html" && (
                <textarea
                  value={form.contentHtml}
                  onChange={(e) => update("contentHtml", e.target.value)}
                  className="form-code"
                  placeholder="<p>Write your HTML content here…</p>"
                  style={{ height: 400 }}
                />
              )}

              {form.contentMode === "portableText" && (
                <textarea
                  value={form.portableTextJson}
                  onChange={(e) => update("portableTextJson", e.target.value)}
                  className="form-code"
                  style={{ height: 400 }}
                />
              )}

              {form.contentMode === "nexavvyStructured" && (
                <textarea
                  value={form.structuredContentJson}
                  onChange={(e) => update("structuredContentJson", e.target.value)}
                  className="form-code"
                  style={{ height: 400 }}
                />
              )}
            </div>
          </Section>

          {/* ── Error ── */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 16px",
                background: "var(--status-error-bg)",
                border: "1px solid var(--status-error-border)",
                borderRadius: 10,
                color: "var(--status-error-text)",
                fontSize: 13,
              }}
            >
              <X size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {/* ── Footer actions ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 8,
            }}
          >
            <Link href={`/?siteId=${form.siteId}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              {isEdit ? "Update Post" : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
