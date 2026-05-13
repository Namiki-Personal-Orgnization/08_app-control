"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TrendChart({
  data,
}: {
  data: { label: string; yearMonth: string; total: number }[];
}) {
  if (!data.some((d) => d.total > 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        確定済みの月が増えるとここにグラフが表示されます。
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" className="text-xs" />
          <YAxis className="text-xs" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              fontSize: 12,
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--background))",
            }}
            formatter={(v: number) => [`${v.toLocaleString()}`, "消費合計"]}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
