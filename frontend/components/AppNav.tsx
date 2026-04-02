"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  canManageUsers,
  canReadRecords,
  canViewDashboard,
  canViewInsights,
} from "@/lib/permissions";
import { useAuthStore } from "@/lib/store";

export default function AppNav() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.role);
  const name = useAuthStore((s) => s.name);
  const email = useAuthStore((s) => s.email);
  const clear = useAuthStore((s) => s.clear);

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/dashboard", label: "Dashboard", show: canViewDashboard(role) },
    { href: "/records", label: "Records", show: canReadRecords(role) },
    { href: "/insights", label: "Insights", show: canViewInsights(role) },
    { href: "/users", label: "Users", show: canManageUsers(role) },
  ];

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <Link href="/dashboard" className="brand">
          Zorvyn Finance
        </Link>
        <nav className="nav-links">
          {links
            .filter((l) => l.show)
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={pathname === l.href ? "nav-link active" : "nav-link"}
              >
                {l.label}
              </Link>
            ))}
        </nav>
        <div className="nav-user">
          <span className="muted small">
            {name || email}
            <span className="role-pill">{role}</span>
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              clear();
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
