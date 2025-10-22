import React, { useEffect, useState } from "react";

const API = "http://localhost:5000";

export default function Profile() {
  const token = localStorage.getItem("token");
  const [methods, setMethods] = useState([]);
  const [type, setType] = useState("");
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadMethods();
  }, [token]);

  const loadMethods = async () => {
    try {
      const res = await fetch(`${API}/api/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMethods(data || []);
    } catch {
      setError("Failed to load payment methods.");
    }
  };

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!type || !account) {
      setError("All fields are required.");
      return;
    }

    const res = await fetch(`${API}/api/payment-methods`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, account }),
    });

    if (res.ok) {
      await loadMethods();
      setType("");
      setAccount("");
      setSuccess("✅ Payment method added successfully!");
    } else {
      const err = await res.json();
      setError(err.message || "Failed to add method.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this payment method?")) return;

    const res = await fetch(`${API}/api/payment-methods/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
      setSuccess("🗑️ Payment method deleted.");
    } else {
      setError("Failed to delete payment method.");
    }
  }

  async function handleSetPreferred(id) {
    const res = await fetch(`${API}/api/payment-methods/${id}/preferred`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      await loadMethods();
      setSuccess("🌟 Preferred payment method updated!");
    } else {
      setError("Failed to update preferred method.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Profile & Payment Methods</h1>

      {/* Add Method */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Add New Payment Method</h2>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        {success && <div className="text-green-400 mb-2">{success}</div>}

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg p-2"
          >
            <option value="">Select Type</option>
            <option value="PayPal">PayPal</option>
            <option value="Crypto">Crypto Wallet</option>
            <option value="Bank">Bank Transfer</option>
          </select>

          <input
            placeholder="Enter Account / Email / Wallet ID"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg p-2"
          />

          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Saved Methods */}
      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4">Saved Payment Methods</h2>
        {methods.length === 0 ? (
          <p className="text-gray-400">No payment methods added yet.</p>
        ) : (
          <table className="min-w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th>Type</th>
                <th>Account</th>
                <th>Preferred</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.id} className="bg-gray-900/70 hover:bg-gray-900/90">
                  <td className="py-2 px-3">{m.type}</td>
                  <td className="py-2 px-3">{m.account}</td>
                  <td className="py-2 px-3">
                    {m.preferred ? (
                      <span className="text-green-400 font-medium">Yes</span>
                    ) : (
                      <button
                        className="text-sm text-blue-400 hover:underline"
                        onClick={() => handleSetPreferred(m.id)}
                      >
                        Set as Preferred
                      </button>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      className="text-red-400 hover:text-red-500"
                      onClick={() => handleDelete(m.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
