"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import { canReadRecords } from "@/lib/permissions";
import { useAuthStore } from "@/lib/store";
import type { DashboardData, TrendPoint, TrendWeek } from "@/types/api";
import MonthlyChart from "@/components/charts/MonthlyChart";
import WeeklyChart from "@/components/charts/WeeklyChart";
import CategoryPieChart from "@/components/charts/CategoryPieChart";

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const setLoading = useAuthStore((s) => s.setGlobalLoading);
  const [data, setData] = useState<DashboardData | null>(null);
  const [monthly, setMonthly] = useState<TrendPoint[]>([]);
  const [weekly, setWeekly] = useState<TrendWeek[]>([]);
  const [error, setError] = useState("");

  const getMostActiveCategory = () => {
    if (!data?.by_category?.length) return "N/A";
    const totals = data.by_category.reduce((acc, row) => {
      acc.set(row.category, (acc.get(row.category) ?? 0) + row.total);
      return acc;
    }, new Map<string, number>());
    let best = "N/A";
    let bestValue = 0;
    for (const [category, value] of totals.entries()) {
      if (value > bestValue) {
        bestValue = value;
        best = category;
      }
    }
    return best;
  };

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const [dash, month, week] = await Promise.all([
        api.dashboard.summary(token),
        api.dashboard.monthlyTrends(token),
        api.dashboard.weeklyTrends(token),
      ]);
      setData(dash.data);
      setMonthly(month.data);
      setWeekly(week.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, setLoading]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="container page-main">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Summary and recent activity</p>
        </div>
        {canReadRecords(role) && (
          <Link href="/records" className="btn">
            Manage records
          </Link>
        )}
      </div>

      {error && <div className="card error-banner">{error}</div>}

      {data && (
        <>
          <section className="grid grid-3">
            <div className="card stat-card">
              <h3>Total income</h3>
              <p className="stat-value income">{data.overview.total_income.toLocaleString()}</p>
            </div>
            <div className="card stat-card">
              <h3>Total expenses</h3>
              <p className="stat-value expense">{data.overview.total_expenses.toLocaleString()}</p>
            </div>
            <div className="card stat-card">
              <h3>Net balance</h3>
              <p className="stat-value">{data.overview.net_balance.toLocaleString()}</p>
            </div>
          </section>

          <section className="card insights-card">
            <h3>Insight</h3>
            <p>
              {data.overview.net_balance >= 0
                ? "Great job! You are in net-positive cash flow."
                : "Warning: your expenses exceed income. Review cost categories."}
            </p>
            <p>Most active category: {getMostActiveCategory()}</p>
          </section>

          <section className="card">
            <h3>Monthly Trends</h3>
            <MonthlyChart data={monthly} />
          </section>


          <section className="card">
            <h3>Weekly Trends</h3>
            <WeeklyChart data={weekly} />
          </section>


          <section className="card">
            <h3>Category Distribution</h3>
            <CategoryPieChart data={data.by_category} />
          </section>

          <section className="card">
            <h3>Recent activity</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_activity.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.type}</td>
                      <td>{r.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
