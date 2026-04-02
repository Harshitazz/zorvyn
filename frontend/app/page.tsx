import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container" style={{ paddingTop: 48 }}>
      <h1 style={{ marginBottom: 8 }}>Zorvyn Finance</h1>
      <p className="muted" style={{ maxWidth: 520 }}>
        Role-based dashboard, records, insights, and user management powered by the FastAPI backend.
      </p>
      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/login" className="btn">
          Sign in
        </Link>
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
