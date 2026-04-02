"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { canReadRecords, canWriteRecords } from "@/lib/permissions";
import { useAuthStore } from "@/lib/store";
import type { Pagination, RecordItem } from "@/types/api";
import { RECORD_CATEGORIES } from "@/types/api";

const PAGE_SIZE = 10;

export default function RecordsPage() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const setLoading = useAuthStore((s) => s.setGlobalLoading);

  const [items, setItems] = useState<RecordItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [recType, setRecType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<string>("other");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!token || !canReadRecords(role)) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.records.list(token, {
        page,
        limit: PAGE_SIZE,
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [token, role, page, typeFilter, categoryFilter, startDate, endDate, setLoading]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canReadRecords(role)) {
    return (
      <main className="container page-main">
        <div className="card error-banner">You do not have permission to view records (viewer role).</div>
      </main>
    );
  }

  function openCreate() {
    setEditing(null);
    setAmount("");
    setRecType("expense");
    setCategory("other");
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
    setFormError("");
    setShowForm(true);
  }

  function openEdit(r: RecordItem) {
    setEditing(r);
    setAmount(String(r.amount));
    setRecType(r.type);
    setCategory(r.category);
    setDate(r.date);
    setNotes(r.notes || "");
    setFormError("");
    setShowForm(true);
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!token || !canWriteRecords(role)) return;
    setFormError("");
    
    // Validate amount format
    if (!amount || parseFloat(amount) <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }
    
    const amountNum = parseFloat(amount);
    const decimalPlaces = (amount.split(".")[1] || "").length;
    if (decimalPlaces > 2) {
      setFormError("Amount can have maximum 2 decimal places");
      return;
    }
    
    if (!Number.isFinite(amountNum)) {
      setFormError("Invalid amount format");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: amountNum,
        type: recType,
        category,
        date,
        notes: notes || null,
      };
      if (editing) {
        await api.records.update(token, editing.id, payload);
      } else {
        await api.records.create(token, payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !canWriteRecords(role)) return;
    if (!confirm("Soft-delete this record?")) return;
    setLoading(true);
    try {
      await api.records.remove(token, id);
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
          <h1>Records</h1>
          <p className="muted">Filter, paginate, and manage transactions</p>
        </div>
        {canWriteRecords(role) && (
          <button type="button" className="btn" onClick={openCreate}>
            New record
          </button>
        )}
      </div>

      {error && <div className="card error-banner">{error}</div>}

      <section className="card filters">
        <div className="filter-row">
          <label>
            Type
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => {
                setPage(1);
                setTypeFilter(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label>
            Category
            <select
              className="input"
              value={categoryFilter}
              onChange={(e) => {
                setPage(1);
                setCategoryFilter(e.target.value);
              }}
            >
              <option value="">All</option>
              {RECORD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => {
                setPage(1);
                setStartDate(e.target.value);
              }}
            />
          </label>
          <label>
            To
            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => {
                setPage(1);
                setEndDate(e.target.value);
              }}
            />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Notes</th>
                {canWriteRecords(role) && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.type}</td>
                  <td>{r.category}</td>
                  <td>{r.amount.toLocaleString()}</td>
                  <td className="muted">{r.notes || "—"}</td>
                  {canWriteRecords(role) && (
                    <td className="row-actions">
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => openEdit(r)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>
                        Delete
                      </button>
                    </td>
                  )}
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
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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

      {showForm && canWriteRecords(role) && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowForm(false)}>
          <div className="modal card" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Edit record" : "New record"}</h3>
            <form className="grid" style={{ marginTop: 12 }} onSubmit={submitForm}>
              <label>
                Amount
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") setAmount("");
                    else if (/^\\d+(\\.\\d{0,2})?$/.test(val)) setAmount(val);
                  }}
                  placeholder="0.00"
                />
                <small className="muted" style={{ marginTop: 4, display: "block" }}>Max 2 decimal places</small>
              </label>
              <label>
                Type
                <select
                  className="input"
                  value={recType}
                  onChange={(e) => setRecType(e.target.value as "income" | "expense")}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </label>
              <label>
                Category
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {RECORD_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  className="input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Notes
                <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
              {formError && <p className="error-text">{formError}</p>}
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
