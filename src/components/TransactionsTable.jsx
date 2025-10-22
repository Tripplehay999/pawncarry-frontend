import React from "react";


export default function TransactionsTable({ transactions = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="text-sm text-gray-300 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <th className="py-3 px-4 w-16">#</th>
            <th className="py-3 px-4">Description</th>
            <th className="py-3 px-4 w-36">Amount</th>
            <th className="py-3 px-4 w-36">Date</th>
            <th className="py-3 px-4 w-28">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="table-row">
              <td className="py-3 px-4 text-gray-400">{tx.id}</td>
              <td className="py-3 px-4">{tx.type}</td>
              <td className={`py-3 px-4 font-medium ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
              </td>
              <td className="py-3 px-4 text-gray-400">{tx.date}</td>
              <td className="py-3 px-4">
                {tx.status === "completed" && <span className="badge badge-success">Completed</span>}
                {tx.status === "pending" && <span className="badge badge-pending">Pending</span>}
                {tx.status === "rejected" && <span className="badge badge-danger">Rejected</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
