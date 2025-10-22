import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

/**
 * TransactionChart - bar chart of recent withdrawals per day (mock data input)
 * props:
 *  - data: [{ date: 'Oct 01', amount: 200 }, ...]
 */
export default function TransactionChart({ data = [] }) {
  return (
    <div className="glass-card p-4 rounded-2xl border border-white/8">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Withdrawals (last 7 days)</div>
        <div className="text-sm muted">USD</div>
      </div>

      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#cbd5e1" }} />
            <YAxis tick={{ fill: "#cbd5e1" }} />
            <Tooltip contentStyle={{ background: "#0f1720", border: "1px solid rgba(255,255,255,0.06)" }} />
            <Bar dataKey="amount" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
