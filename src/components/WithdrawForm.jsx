import React, { useState, useMemo } from "react";

/**
 * WithdrawForm shows input, fee calculation and produces a payload when user confirms.
 * onConfirm(amount, fee) callback required.
 */
export default function WithdrawForm({ balance, onConfirm }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal"); // placeholder

  // Fee rules: flat $1 + 1% of amount (example)
  const fee = useMemo(() => {
    const a = parseFloat(amount) || 0;
    if (a <= 0) return 0;
    return Math.max(1, Math.round((a * 0.01 + 1) * 100) / 100);
  }, [amount]);

  const net = useMemo(() => {
    const a = parseFloat(amount) || 0;
    return Math.max(0, Math.round((a - fee) * 100) / 100);
  }, [amount, fee]);

  const handleAll = () => {
    // withdraw full minus fee approx: solve a - fee(a) = balance -> approximate set amount = balance
    setAmount(String(Math.max(0, Math.floor((balance - 1) * 100) / 100)));
  };

  const submit = () => {
    const a = parseFloat(amount);
    if (!a || a <= 0) {
      alert("Enter a valid amount");
      return;
    }
    if (a > balance) {
      alert("Insufficient balance");
      return;
    }
    onConfirm(a, fee, method);
    setAmount("");
  };

  return (
    <div className="p-4 bg-transparent">
      <div className="flex gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="input-plain flex-1"
          min="0"
          step="0.01"
        />
        <button onClick={handleAll} className="px-4 py-2 rounded bg-white/6 text-white">Max</button>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="input-plain w-40">
          <option value="paypal">PayPal</option>
          <option value="bank">Bank transfer</option>
          <option value="crypto">Crypto</option>
        </select>
        <div className="ml-auto text-sm muted">
          Fee: <span className="text-white">${fee.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm muted">You will receive</div>
        <div className="text-right">
          <div className="text-white font-semibold">${net.toFixed(2)}</div>
          <div className="text-xs muted">after fees</div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={submit}
          className="w-full bg-accent hover:bg-accent/90 transition text-white py-3 rounded-lg font-semibold"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}
