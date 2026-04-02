"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import AppNav from "@/components/AppNav";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useAuthHydration } from "@/hooks/useAuthHydration";
import { useAuthStore } from "@/lib/store";

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydration();
  const token = useAuthStore((s) => s.token);
  const loading = useAuthStore((s) => s.globalLoading);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated) {
    return (
      <div className="container" style={{ paddingTop: 48 }}>
        <p className="muted">Loading session…</p>
      </div>
    );
  }

  if (!token) return null;

  return (
    <>
      <AppNav />
      <div className="page-wrap">{children}</div>
      <LoadingOverlay show={loading} />
    </>
  );
}
