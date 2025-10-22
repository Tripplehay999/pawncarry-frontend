import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WITHDRAWAL_FEE_PERCENT = 5;

const Dashboard = () => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawableAmount, setWithdrawableAmount] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const token = localStorage.getItem("token");


  const money = (v) => {
    const n =
      typeof v === "string"
        ? Number(v.replace(/[^\d.-]/g, ""))
        : Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : "0.00";
  };
  const safe = (v, fallback = "—") => (v ?? fallback);
 

  // Fetch user data on mount
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setWalletBalance(data.wallet.balance);
        setWithdrawableAmount(data.wallet.balance);
      });

    fetch("http://localhost:5000/api/transactions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTransactions(data));

    fetch("http://localhost:5000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data));
  }, [token]);

  const handleWithdrawClick = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    const fee = (amount * WITHDRAWAL_FEE_PERCENT) / 100;
    const totalDeduction = amount + fee;
    if (totalDeduction > withdrawableAmount) {
      setError("Insufficient withdrawable balance for amount + fee.");
      return;
    }
    setError("");
    setShowConfirm(true);
  };


  const confirmWithdrawal = async () => {
    const amount = Number(withdrawAmount);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/transactions/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Only send amount; server computes fee & total
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Failed to process withdrawal.");
        setShowConfirm(false);
        return;
      }

      // Update UI from authoritative server response
      // data = { transaction, wallet }
      setTransactions((prev) => [data.transaction, ...prev]);
      setWalletBalance(data.wallet.balance);
      setWithdrawableAmount(data.wallet.balance);
      setTotalWithdrawn((prev) => Math.round((prev + data.transaction.amount) * 100) / 100);

      setNotifications((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: `Withdrawal $${data.transaction.amount} requested.`,
          time: "Just now",
        },
      ]);

      setWithdrawAmount("");
      setShowConfirm(false);
    } catch (e) {
      setError("Network error while processing withdrawal.");
      setShowConfirm(false);
    }
  };


  // Line chart
  const chartData = {
    labels: transactions.slice().reverse().map((tx) => tx.date),
    datasets: [
      {
        label: "Withdrawals ($)",
        data: transactions.slice().reverse().map((tx) => Number(                                                                                                                                                                                                                                        )),
        borderColor: "rgba(99, 102, 241, 0.8)",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: "#fff" } },
      y: { grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#fff" } },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Wallet Balance", value: walletBalance },
          { label: "Withdrawable Amount", value: withdrawableAmount },
          { label: "Total Withdrawn", value: totalWithdrawn },
        ].map((item, idx) => (
          <div
            key={idx}
            className="relative bg-gray-800 bg-opacity-60 p-6 rounded-2xl shadow-xl border border-gray-700 backdrop-blur-md hover:scale-105 transition-transform"
          >
            <h2 className="text-lg text-gray-400 mb-2">{item.label}</h2>
            <p className="text-3xl font-bold">${Number(item.value).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Withdrawal Form */}
      <div className="bg-gray-800 bg-opacity-60 rounded-2xl p-6 border border-gray-700 mb-10">
        <h2 className="text-2xl font-semibold mb-4">Request Withdrawal</h2>
        <form className="flex flex-col md:flex-row gap-4" onSubmit={handleWithdrawClick}>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Enter withdrawal amount"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-6 py-3 font-medium transition-all"
          >
            Withdraw
          </button>
        </form>
        {withdrawAmount && !error && (
          <p className="text-gray-400 mt-2">
            Fee: ${(withdrawAmount * WITHDRAWAL_FEE_PERCENT / 100).toFixed(2)} | Total Deducted: {(Number(withdrawAmount) * 1.05).toFixed(2)}
          </p>
        )}
        {error && <p className="text-red-400 mt-3">{error}</p>}
      </div>

      {/* Line Chart */}
      <div className="bg-gray-800 bg-opacity-60 p-6 rounded-2xl border border-gray-700 mb-10">
        <h2 className="text-2xl font-semibold mb-4">Withdrawal History</h2>
        <div style={{ height: "250px" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800 bg-opacity-60 p-6 rounded-2xl border border-gray-700 mb-10">
        <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-gray-400 text-sm">
              <th className="py-2">Type</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Date</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTransaction(tx)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedTransaction(tx)}
                className="bg-gray-900/50 hover:bg-gray-900 cursor-pointer transition-colors rounded-xl"
              >
                <td className="py-3 px-2">{safe(tx.type, "Withdrawal")}</td>
                <td className="py-3 px-2 font-semibold">${money(tx.amount)}</td>
                <td className="py-3 px-2 text-gray-400">{safe(tx.date)}</td>
                <td
                  className={`py-3 px-2 font-medium ${
                    tx.status === "Completed"
                      ? "text-green-400"
                      : tx.status === "Rejected"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {safe(tx.status, "Pending")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirm Withdrawal Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl text-center max-w-sm w-full">
            <h2 className="text-2xl font-semibold mb-3">Confirm Withdrawal</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to withdraw{" "}
              <span className="text-white font-bold">${withdrawAmount}</span>?<br />
              Fee: {(Number(withdrawAmount) * WITHDRAWAL_FEE_PERCENT / 100).toFixed(2)} | Total Deducted: {(Number(withdrawAmount) * 1.05).toFixed(2)}
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmWithdrawal} className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg">
                Confirm
              </button>
              <button onClick={() => setShowConfirm(false)} className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Transaction Details Modal (resilient) ---------- */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
              aria-label="Close"
            >
              ✕
            </button>

            <h2 className="text-2xl font-semibold mb-4 text-center">Transaction Details</h2>

            <div className="space-y-3">
              <p><span className="text-gray-400">Type:</span> {safe(selectedTransaction.type, "Withdrawal")}</p>
              <p><span className="text-gray-400">Amount:</span> ${money(selectedTransaction.amount)}</p>
              {"fee" in selectedTransaction && (
                <p><span className="text-gray-400">Fee:</span> ${money(selectedTransaction.fee)}</p>
              )}
              {"total" in selectedTransaction && (
                <p><span className="text-gray-400">Total Deducted:</span> ${money(selectedTransaction.total)}</p>
              )}
              <p><span className="text-gray-400">Date:</span> {safe(selectedTransaction.date)}</p>
              <p>
                <span className="text-gray-400">Status:</span>{" "}
                <span
                  className={
                    selectedTransaction.status === "Completed"
                      ? "text-green-400"
                      : selectedTransaction.status === "Rejected"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }
                >
                  {safe(selectedTransaction.status, "Pending")}
                </span>
              </p>
              <p><span className="text-gray-400">Reference ID:</span> {safe(selectedTransaction.reference)}</p>
            </div>
          </div>
        </div>
      )}

            {/* User Adds Payment Method */}

{/*  <body>
    <h2>Select Your Payment Method</h2>

    <form>
        <label for="payment-method">Choose a payment method:</label>
        <select id="payment-method" name="payment-method">
            <option value="credit-card">Credit Card</option>
            <option value="paypal">PayPal</option>
            <option value="bank-transfer">Bank Transfer</option>
            <option value="bitcoin">Bitcoin</option>
             <option value="usdt-TRC20">usdt-TRC20</option>
              </select>
        
        <button type="submit">Submit</button>
    </form>
</body>

*/}

{/* IT'S JUST WHAT COPILOT PUT FOR NOW. GOOD PROGRAMMERS USE PIECES OF OTHER CODE THEN ERASE IT}
{/* It's a PAYOUT ashbosard for goodness sakes fym APPLE PAY.. BROS TYPING THE COMMENTS MANUALY BRO CANT SPELL */}
      {/* ---------------------------------------------------------------- */}
    </div>
  );
};

export default Dashboard;
