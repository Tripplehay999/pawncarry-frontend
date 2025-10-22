import React from "react";

export default function Wallet() {
  return (
    <div className="flex flex-col items-center justify-center p-10 gap-10">
      <h1 className="text-5xl font-arcade glow-green mb-10">Your Wallet</h1>
      <div className="bg-gray-900 p-10 rounded-2xl shadow-neonGreen text-center">
        <p className="text-white text-3xl">Balance: $1200</p>
      </div>
    </div>
  );
}
