// components/charts/MonthlyChart.tsx

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import type { TrendPoint } from "@/types/api";

export default function MonthlyChart({ data }: { data: TrendPoint[] }) {
  if (!data?.length) return <p>No data</p>;

  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00c49f" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00c49f" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff8042" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ff8042" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fill: '#333' }} />
          <YAxis tick={{ fill: '#333' }} />
          <Tooltip formatter={(value) => [`$${value}`, '']} />
          <Legend />
          <Bar dataKey="income" fill="url(#incomeGradient)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="expenses" fill="url(#expenseGradient)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}