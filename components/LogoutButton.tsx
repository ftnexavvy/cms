"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className="cms-btn-secondary px-4 py-2.5">
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
