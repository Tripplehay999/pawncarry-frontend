import React, { useMemo, useState } from "react";

/**
 * TransactionsPanel
 * props:
 *  - transactions: array of tx objects
 *  - onSelect(tx) called when row clicked
 */
export default function TransactionsPanel({ transactions = [], onSelect = () => {} }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return transactions.filter(tx => {
      if (statusFilter !== "all" && tx.status.toLowerCase() !== statusFilter) return false;
      if (!qq) return true;
      // search in type, date, amount, reference
      return (
        String(tx.type).toLowerCase().includes(qq) ||
        String(tx.date).toLowerCase().includes(qq) ||
        String(tx.amount).toLowerCase().includes(qq) ||
        (tx.reference && String(tx.reference).toLowerCase().includes(qq))
      );
    });
  }, [transactions, q, statusFilter]);

  return (
    <div>
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
        <div className="flex-1 flex gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transactions, date, amount, reference..."
            className="input-plain w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <select className="input-plain" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card border border-white/6 rounded-2xl p-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-300" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <th className="py-2 px-3 w-12">#</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3 w-36">Amount</th>
                <th className="py-2 px-3 w-28">Date</th>
                <th className="py-2 px-3 w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 px-3 text-center muted">No matching transactions</td>
                </tr>
              ) : filtered.map(tx => (
                <tr
                  key={tx.id}
                  onClick={() => onSelect(tx)}
                  className="cursor-pointer hover:bg-white/4 transition"
                >
                  <td className="py-3 px-3 text-gray-400">{tx.id}</td>
                  <td className="py-3 px-3">{tx.type}{tx.reference ? <div className="text-xs muted">Ref: {tx.reference}</div> : null}</td>
                  <td className={`py-3 px-3 font-medium ${tx.amount[0] === '-' ? "text-red-400" : "text-green-400"}`}>{tx.amount}</td>
                  <td className="py-3 px-3 text-gray-400">{tx.date}</td>
                  <td className="py-3 px-3">
                    {tx.status === "Completed" && <span className="badge badge-success">Completed</span>}
                    {tx.status === "Pending" && <span className="badge badge-pending">Pending</span>}
                    {tx.status === "Rejected" && <span className="badge badge-danger">Rejected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
