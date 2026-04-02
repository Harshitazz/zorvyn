// components/charts/WeeklyChart.tsx

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import type { TrendWeek } from "@/types/api";

export default function WeeklyChart({ data }: { data: TrendWeek[] }) {
  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer>
        <LineChart data={data}> 
          <XAxis dataKey="week" tick={{ fill: '#3f3f46' }} />
          <YAxis tick={{ fill: '#3f3f46' }} />
          <Tooltip formatter={(value) => [`$${value}`, '']} />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}