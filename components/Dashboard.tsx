"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Edit3,
  FileText,
  Globe2,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  LayoutGrid,
  Search,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { getSiteConfig, SITES } from "@/lib/site-config";

type Post = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
  image: string;
  status: string;
};

function Topbar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="topbar">
      <div>
        <h1
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              margin: "2px 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div style={{ display: "flex", gap: 10 }}>{action}</div>}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="stat-card">
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <span className="text-label">{label}</span>
        <div
          style={{
            width: 32,
            height: 32,
            background: "var(--bg-overlay)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
          }}
        >
          <Icon size={14} />
        </div>
      </div>
      <p
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: "var(--text-primary)",
          lineHeight: 1,
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 8,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSiteId = searchParams.get("siteId") || SITES[0].id;
  const [selectedSite, setSelectedSite] = useState(initialSiteId);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    setSelectedSite(initialSiteId);
  }, [initialSiteId]);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        const res = await fetch(`/api/posts?siteId=${selectedSite}&includeDrafts=true`);
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }
    void loadPosts();
  }, [selectedSite]);

  const selectedSiteMeta = useMemo(() => getSiteConfig(selectedSite), [selectedSite]);
  const selectedSiteName = selectedSiteMeta?.name || "Website";
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.length - publishedCount;

  const filtered = useMemo(() => {
    let result = posts;
    if (filter === "published") result = result.filter((p) => p.status === "published");
    if (filter === "draft") result = result.filter((p) => p.status !== "published");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q),
      );
    }
    return result;
  }, [posts, filter, search]);

  async function deletePost(id: string) {
    if (!window.confirm("Permanently delete this post?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((c) => c.filter((p) => p._id !== id));
  }

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={selectedSiteName}
        action={
          <Link
            href={`/admin/posts/new?siteId=${selectedSite}`}
            className="btn btn-primary btn-sm"
          >
            <Plus size={13} />
            New Post
          </Link>
        }
      />

      <div className="admin-content">
        {/* ── Site Switcher ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {SITES.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => {
                setSelectedSite(site.id);
                router.replace(`/?siteId=${site.id}`);
              }}
              className={`site-chip ${selectedSite === site.id ? "active" : ""}`}
            >
              <Globe2 size={11} />
              {site.name}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          <StatCard
            label="Total Posts"
            value={posts.length}
            icon={FileText}
            sub="Across all statuses"
          />
          <StatCard
            label="Published"
            value={publishedCount}
            icon={CheckCircle2}
            sub="Live on website"
          />
          <StatCard
            label="Drafts"
            value={draftCount}
            icon={Circle}
            sub="Unpublished content"
          />
          <StatCard
            label="Sites"
            value={SITES.length}
            icon={Globe2}
            sub="Connected websites"
          />
        </div>

        {/* ── Posts Table ── */}
        <div className="card" style={{ overflow: "hidden" }}>
          {/* Table toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["all", "published", "draft"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    background: filter === f ? "var(--bg-elevated)" : undefined,
                    color: filter === f ? "var(--text-primary)" : undefined,
                    border: filter === f ? "1px solid var(--border-default)" : "1px solid transparent",
                    textTransform: "capitalize",
                  }}
                >
                  {f === "all" ? `All (${posts.length})` : f === "published" ? `Published (${publishedCount})` : `Draft (${draftCount})`}
                </button>
              ))}
            </div>

            <div className="search-bar" style={{ width: 220 }}>
              <Search size={13} color="var(--text-faint)" />
              <input
                className="search-input"
                placeholder="Search posts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table body */}
          {loading ? (
            <div className="empty-state">
              <Loader2 size={24} color="var(--text-faint)" className="animate-spin" />
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading posts…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={20} />
              </div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {search ? "No matching posts" : "No posts yet"}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                {search
                  ? "Try a different search term."
                  : "Create your first post to get started."}
              </p>
              {!search && (
                <Link
                  href={`/admin/posts/new?siteId=${selectedSite}`}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 8 }}
                >
                  <Plus size={13} />
                  Create Post
                </Link>
              )}
            </div>
          ) : (
            <table className="posts-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }} />
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post._id}>
                    <td>
                      <div className="thumbnail">
                        {post.image ? (
                          <img src={post.image} alt="" />
                        ) : (
                          <FileText size={14} color="var(--text-faint)" />
                        )}
                      </div>
                    </td>
                    <td>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          margin: 0,
                          maxWidth: 340,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.title}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--text-faint)",
                          margin: "3px 0 0",
                          fontFamily: "monospace",
                        }}
                      >
                        /{post.slug}
                      </p>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {post.category || "General"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${post.status === "published" ? "badge-live" : "badge-draft"}`}
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
                        {post.status}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Link
                          href={`/admin/posts/edit/${post._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit3 size={12} />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void deletePost(post._id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--status-error-text)", padding: "6px 8px" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Showing {filtered.length} of {posts.length} posts
              </p>
              {selectedSiteMeta && (
                <a
                  href={`https://${selectedSite}.com${selectedSiteMeta.blogIndexPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 11 }}
                >
                  <ArrowUpRight size={12} />
                  View Live Site
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Site Info ── */}
        {selectedSiteMeta && (
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { label: "Content Mode", value: selectedSiteMeta.defaultContentMode },
              { label: "Blog Index", value: selectedSiteMeta.blogIndexPath },
              { label: "Post Path", value: selectedSiteMeta.blogPostPath("{slug}") },
              { label: "Local Project", value: selectedSiteMeta.localProjectPath },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                <p className="text-label" style={{ marginBottom: 6 }}>
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    margin: 0,
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
