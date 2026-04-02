"use client";

export function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-spinner" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
