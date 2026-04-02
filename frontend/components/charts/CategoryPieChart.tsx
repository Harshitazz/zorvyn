// components/charts/CategoryPieChart.tsx

"use client";

import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function CategoryPieChart({ data }: { data: any[] }) {
  const formatted = data.map((d) => ({
    name: d.category,
    value: d.total,
  }));

  const total = formatted.reduce((sum, item) => sum + item.value, 0);
  const colors = ["#6366f1", "#14b8a6", "#f97316", "#a855f7", "#f43f5e", "#1d4ed8", "#0ea5e9"];

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={formatted}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            innerRadius={50}
            fill="#8884d8"
            label={(entry) => `${entry.name}: ${((entry.value / total) * 100).toFixed(0)}%`}
            animationDuration={800}
          >
            {formatted.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`$${value}`, 'Total']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}