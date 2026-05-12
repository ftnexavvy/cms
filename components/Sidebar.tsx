"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe2,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  PenSquare,
  Settings,
  Tag,
  Users,
  X,
  Zap,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
      { label: "All Posts",  href: "/admin/posts", icon: FileText },
      { label: "Create Post", href: "/admin/posts/new", icon: PenSquare },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Media Library", href: "/admin/media", icon: ImageIcon },
      { label: "Categories",    href: "/admin/categories", icon: Tag },
      { label: "Websites",      href: "/admin/websites", icon: Globe2 },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
      { label: "Users",     href: "/admin/users", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

function useIsActive(href: string, exact?: boolean) {
  const pathname = usePathname();
  if (exact) return pathname === href;
  return pathname.startsWith(href) && href !== "/";
}

function NavItem({
  item,
  collapsed,
  onClick,
}: {
  item: { label: string; href: string; icon: React.ElementType; exact?: boolean };
  collapsed: boolean;
  onClick?: () => void;
}) {
  const active = useIsActive(item.href, item.exact);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`sidebar-item ${active ? "active" : ""}`}
      style={{ justifyContent: collapsed ? "center" : undefined }}
    >
      <Icon className="sidebar-icon" />
      <span className="sidebar-item-text">{item.label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile hamburger ── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0f0f0f] text-white/60 transition-colors hover:text-white md:hidden"
        aria-label="Open sidebar"
      >
        <Menu size={16} />
      </button>

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          {/* Logo mark */}
          <div className="sidebar-logo" style={{ flexShrink: 0 }}>
            <Zap size={14} color="#080808" strokeWidth={2.5} />
          </div>

          {/* Wordmark */}
          <span
            className="sidebar-item-text"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            CMS Studio
          </span>

          {/* Mobile close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition-colors hover:text-white md:hidden"
            style={{ flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="sidebar-group">
              <p className="sidebar-group-label">{group.label}</p>
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Collapse toggle — desktop only */}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="sidebar-item hidden w-full md:flex"
            style={{ justifyContent: collapsed ? "center" : undefined }}
          >
            {collapsed ? (
              <ChevronRight className="sidebar-icon" />
            ) : (
              <ChevronLeft className="sidebar-icon" />
            )}
            <span className="sidebar-item-text">Collapse</span>
          </button>

          {/* Logout */}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="sidebar-item w-full mt-1"
              style={{
                justifyContent: collapsed ? "center" : undefined,
                color: "var(--status-error-text)",
              }}
            >
              <LogOut className="sidebar-icon" style={{ opacity: 0.7 }} />
              <span className="sidebar-item-text">Sign Out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
