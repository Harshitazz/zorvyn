"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { canManageUsers } from "@/lib/permissions";
import { useAuthStore } from "@/lib/store";
import type { Pagination, Role, User } from "@/types/api";

const PAGE_SIZE = 8;

export default function UsersPage() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const setLoading = useAuthStore((s) => s.setGlobalLoading);

  const [items, setItems] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("viewer");

  const load = useCallback(async () => {
    if (!token || !canManageUsers(role)) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.users.list(token, { page, limit: PAGE_SIZE });
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, role, page, setLoading]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canManageUsers(role)) {
    return (
      <main className="container page-main">
        <div className="card error-banner">User management is restricted to administrators.</div>
      </main>
    );
  }

  async function createUser(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormError("");
    setLoading(true);
    try {
      await api.users.create(token, {
        name,
        email,
        password,
        role: newRole,
      });
      setShowForm(false);
      setName("");
      setEmail("");
      setPassword("");
      setNewRole("viewer");
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  }

  async function patchUser(u: User, patch: Record<string, unknown>) {
    if (!token) return;
    setLoading(true);
    try {
      await api.users.update(token, u.id, patch);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeUser(u: User) {
    if (!token) return;
    if (!confirm(`Remove user ${u.email}?`)) return;
    setLoading(true);
    try {
      await api.users.remove(token, u.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container page-main">
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p className="muted">Create users and assign roles</p>
        </div>
        <button type="button" className="btn" onClick={() => setShowForm(true)}>
          Add user
        </button>
      </div>

      {error && <div className="card error-banner">{error}</div>}

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="input inline-select"
                      value={u.role}
                      onChange={(e) => patchUser(u, { role: e.target.value })}
                    >
                      <option value="viewer">viewer</option>
                      <option value="analyst">analyst</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="input inline-select"
                      value={u.status}
                      onChange={(e) => patchUser(u, { status: e.target.value })}
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => removeUser(u)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="muted">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowForm(false)}>
          <div className="modal card" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>New user</h3>
            <form className="grid" style={{ marginTop: 12 }} onSubmit={createUser}>
              <label>
                Name
                <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Email
                <input
                  className="input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  className="input"
                  type="password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label>
                Role
                <select
                  className="input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                >
                  <option value="viewer">viewer</option>
                  <option value="analyst">analyst</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              {formError && <p className="error-text">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
