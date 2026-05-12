import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CMS Studio — Centralized Blog CMS",
  description:
    "Unified publishing platform for Bhadrik Panchal, FT Nexavvy, and Keadigi.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <div className="admin-shell">
          <Sidebar />
          {/* Desktop: offset by sidebar width; mobile: full width */}
          <main
            className="admin-main"
            style={
              {
                "--sidebar-offset": "var(--sidebar-width)",
              } as React.CSSProperties
            }
          >
            <style>{`
              @media (min-width: 769px) {
                .admin-main { margin-left: var(--sidebar-width); }
              }
              @media (max-width: 768px) {
                .admin-main { margin-left: 0; }
              }
            `}</style>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
