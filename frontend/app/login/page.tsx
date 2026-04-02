"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingOverlay } from "@/components/LoadingOverlay";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { Role } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setGlobalLoading);
  const globalLoading = useAuthStore((s) => s.globalLoading);

  const [email, setEmail] = useState("admin@finance.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loginRes = await api.auth.login(email, password);
      const me = await api.auth.me(loginRes.data.token);
      setAuth({
        token: loginRes.data.token,
        role: me.data.role as Role,
        email: me.data.email,
        userId: me.data.id,
        name: me.data.name,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container login-page">
      <LoadingOverlay show={globalLoading} />
      <div className="card login-card">
        <h2>Sign in</h2>
        <p className="muted small">Use your finance account. Roles: viewer / analyst / admin.</p>
        <form onSubmit={onSubmit} className="grid" style={{ marginTop: 16 }}>
          <label>
            Email
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
