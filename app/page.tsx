import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";

function DashboardSkeleton() {
  return (
    <>
      {/* Topbar skeleton */}
      <div
        style={{
          height: 64,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 32px",
          gap: 12,
        }}
      >
        <div
          className="skeleton"
          style={{ width: 120, height: 18, borderRadius: 6 }}
        />
        <div style={{ flex: 1 }} />
        <div
          className="skeleton"
          style={{ width: 88, height: 34, borderRadius: 10 }}
        />
      </div>

      {/* Content skeleton */}
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Site chips */}
        <div style={{ display: "flex", gap: 8 }}>
          {[100, 130, 110].map((w, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ width: w, height: 32, borderRadius: 99 }}
            />
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 110, borderRadius: 16 }}
            />
          ))}
        </div>

        {/* Table */}
        <div
          className="skeleton"
          style={{ height: 360, borderRadius: 16 }}
        />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
