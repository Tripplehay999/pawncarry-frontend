// User Picking Payment method (User. D) -> Send to AD.D


import React, { useState } from "react";

export default function Payments() {
  const [amount, setAmount] = useState("");

  const handleTopUp = () => {
    alert(`Top Up $${amount} (mock)`); 
    setAmount("");
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 gap-10">
      <h1 className="text-5xl font-arcade glow-pink mb-10">Add Payment Method</h1>
      <div className="bg-gray-900 p-10 rounded-2xl shadow-neonPink flex flex-col items-center gap-6">
        <input
          type="number"
          placeholder="Amount $"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="p-3 rounded-lg bg-gray-800 text-white text-xl w-64 focus:outline-none focus:ring-2 focus:ring-neonPink"
        />
        <button
          onClick={handleTopUp}
          className="bg-neonPink text-black px-6 py-3 rounded-lg font-bold hover:bg-pink-600 transition"
        >
          Add Payment Method
        </button>
      </div>
    </div>
  );
}
