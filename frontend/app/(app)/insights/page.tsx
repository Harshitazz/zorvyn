"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { canViewInsights } from "@/lib/permissions";
import { useAuthStore } from "@/lib/store";
import type { TrendPoint, TrendWeek } from "@/types/api";

export default function InsightsPage() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const setLoading = useAuthStore((s) => s.setGlobalLoading);
  const [year, setYear] = useState<number | "">("");
  const [monthly, setMonthly] = useState<TrendPoint[]>([]);
  const [weekly, setWeekly] = useState<TrendWeek[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !canViewInsights(role)) return;
    setError("");
    setLoading(true);
    try {
      const [m, w] = await Promise.all([
        api.dashboard.monthlyTrends(token, year === "" ? undefined : year),
        api.dashboard.weeklyTrends(token),
      ]);
      setMonthly(m.data);
      setWeekly(w.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [token, role, year, setLoading]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canViewInsights(role)) {
    return (
      <main className="container page-main">
        <div className="card error-banner">Insights are available to analyst and admin roles only.</div>
      </main>
    );
  }

  return (
    <main className="container page-main">
      <div className="page-head">
        <div>
          <h1>Insights</h1>
          <p className="muted">Monthly and weekly trends (cached on the server)</p>
        </div>
        <label className="year-filter">
          Year filter
          <input
            className="input"
            type="number"
            placeholder="All years"
            value={year}
            onChange={(e) => {
              const v = e.target.value;
              setYear(v === "" ? "" : parseInt(v, 10));
            }}
          />
        </label>
      </div>

      {error && <div className="card error-banner">{error}</div>}

      <section className="card">
        <h3>Monthly trends</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((row) => (
                <tr key={row.month}>
                  <td>{row.month}</td>
                  <td className="income">{row.income.toLocaleString()}</td>
                  <td className="expense">{row.expenses.toLocaleString()}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Weekly trends (latest)</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {weekly.map((row) => (
                <tr key={row.week}>
                  <td>{row.week}</td>
                  <td className="income">{row.income.toLocaleString()}</td>
                  <td className="expense">{row.expenses.toLocaleString()}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
