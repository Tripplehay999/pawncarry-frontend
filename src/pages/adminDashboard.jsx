import React, { useEffect, useMemo, useState } from "react";

const API = "https://backend-pc-deuu.onrender.com";

export default function AdminDashboard() {
  // -----------------------------
  // Auth / shared state
  // -----------------------------
  const token = localStorage.getItem("token");

  // Core datasets
  const [users, setUsers] = useState([]);
  const [txs, setTxs] = useState([]);

  // Page lifecycle
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // -----------------------------
  // Edit User modal state
  // -----------------------------
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "user",
    balance: 0,
  });
  const [userFormError, setUserFormError] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  // Delete user confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // -----------------------------
  // Add User modal state
  // -----------------------------
  const [showAddUser, setShowAddUser] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    balance: 0,
  });

  // -----------------------------
  // Success modal (re-usable)
  // -----------------------------
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // -----------------------------
  // Load users + transactions
  // -----------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [uRes, tRes] = await Promise.all([
          fetch(`${API}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API}/api/admin/transactions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!alive) return;

        if (!uRes.ok) throw new Error(`Users ${uRes.status}`);
        if (!tRes.ok) throw new Error(`Transactions ${tRes.status}`);

        const [uData, tData] = await Promise.all([uRes.json(), tRes.json()]);

            // Fetch payment methods for each user
            const userWithMethods = await Promise.all(
              uData.map(async (u) => {
                const pmRes = await fetch(`${API}/api/admin/users/${u.id}/payment-methods`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const pm = pmRes.ok ? await pmRes.json() : [];
                return { ...u, paymentMethod: pm.find((m) => m.preferred) || pm[0] || null };
              })
            );

            setUsers(userWithMethods || []);


        setUsers(Array.isArray(uData) ? uData : []);
        setTxs(Array.isArray(tData) ? tData : []);
        setErr("");
      } catch (e) {
        setErr(e?.message || "Failed to load admin data");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [token]);

  // -----------------------------
  // Stats
  // -----------------------------
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalWithdrawals = txs.length;
    const pending = txs.filter((t) => t.status === "Pending").length;
    return { totalUsers, totalWithdrawals, pending };
  }, [users, txs]);

  // -----------------------------
  // Withdrawals: Approve / Reject
  // -----------------------------
  async function onUpdateStatus(id, status) {
    try {
      const res = await fetch(`${API}/api/admin/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const updated = await res.json();
      setTxs((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      alert(e.message || "Could not update transaction");
    }
  }

  // -----------------------------
  // Users: open/close edit modal
  // -----------------------------
  function openUserModal(u) {
    setSelectedUser(u);
    setEditForm({
      username: u?.username || "",
      email: u?.email || "",
      role: u?.role || "user",
      balance: Number(u?.balance ?? 0),
    });
    setUserFormError("");
    setShowUserModal(true);
  }

  function closeUserModal() {
    setShowUserModal(false);
    setSelectedUser(null);
  }

  // -----------------------------
  // Users: edit/save handlers
  // -----------------------------
  function handleUserChange(e) {
    const { name, value } = e.target;
    setEditForm((f) => ({
      ...f,
      [name]: name === "balance" ? value : value,
    }));
  }

  async function saveUser() {
    if (!selectedUser) return;
    setSavingUser(true);
    setUserFormError("");

    const username = (editForm.username || "").trim();
    const email = (editForm.email || "").trim();
    const role = editForm.role || "user";
    const balNum = Number(editForm.balance);

    if (!username) {
      setUserFormError("Username is required.");
      setSavingUser(false);
      return;
    }
    if (!email) {
      setUserFormError("Email is required.");
      setSavingUser(false);
      return;
    }
    if (!Number.isFinite(balNum) || balNum < 0) {
      setUserFormError("Balance must be a non-negative number.");
      setSavingUser(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          email,
          role,
          balance: balNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUserFormError(data?.message || "Failed to save user.");
        setSavingUser(false);
        return;
      }

      // Update list locally
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.id
            ? {
                ...u,
                username: data.username,
                email: data.email,
                role: data.role,
                balance: data.balance,
              }
            : u
        )
      );

      setSavingUser(false);
      closeUserModal();
      setSuccessMessage(`✅ Saved changes for "${data.username}".`);
      setShowSuccessModal(true);
    } catch (e) {
      setUserFormError("Network error while saving user.");
      setSavingUser(false);
    }
  }

  // -----------------------------
  // Delete user (confirm + delete)
  // -----------------------------
  async function handleDeleteUser() {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete user.");
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setDeleting(false);
      setShowDeleteConfirm(false);
      setShowUserModal(false);
      setSuccessMessage(`🗑️ User "${selectedUser.username}" deleted successfully.`);
      setShowSuccessModal(true);
    } catch (e) {
      alert(e.message);
      setDeleting(false);
    }
  }

  // -----------------------------
  // Add user handlers
  // -----------------------------
  function handleAddUserChange(e) {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAddUserSubmit(e) {
    e.preventDefault();
    setAddingUser(true);
    setAddUserError("");

    if (!newUser.username || !newUser.email || !newUser.password) {
      setAddUserError("All fields are required.");
      setAddingUser(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to create user.");

      setUsers((prev) => [...prev, data]);
      setShowAddUser(false);
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "user",
        balance: 0,
      });

      setSuccessMessage(`✅ User "${data.username}" created successfully!`);
      setShowSuccessModal(true);
    } catch (err) {
      setAddUserError(err.message || "Network error.");
    } finally {
      setAddingUser(false);
    }
  }

  // -----------------------------
  // Render states
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-white">
        Loading admin…
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <div className="bg-red-500/10 border border-red-500/40 text-red-300 rounded-xl p-4">
          <div className="font-semibold mb-1">Couldn’t load admin data</div>
          <div className="text-sm opacity-90">{String(err)}</div>
          <button
            className="mt-4 px-4 py-2 rounded bg-white/10 hover:bg-white/20"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Main render
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Total Users", value: stats.totalUsers },
          { label: "Total Withdrawals", value: stats.totalWithdrawals },
          { label: "Pending Withdrawals", value: stats.pending },
        ].map((c, i) => (
          <div
            key={i}
            className="bg-gray-800 p-6 rounded-2xl border border-gray-700"
          >
            <div className="text-gray-400">{c.label}</div>
            <div className="text-2xl font-bold mt-2">{c.value}</div>
          </div>
        ))}
      </div>

      {/* USERS */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold">Users</h2>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Username</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Balance</th>
                <th className="py-2 px-3">Payment Method</th>

              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="bg-gray-800/60 hover:bg-gray-800 rounded-xl cursor-pointer"
                  onClick={() => openUserModal(u)}
                >
                  <td className="py-3 px-3">{u.id}</td>
                  <td className="py-3 px-3">{u.username}</td>
                  <td className="py-3 px-3">{u.email}</td>
                  <td className="py-3 px-3">{u.role}</td>
                  <td className="py-3 px-3">
                    ${Number(u.balance ?? 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-gray-300">
                        {u.paymentMethod 
                        ? `${u.paymentMethod.type}: ${u.paymentMethod.account}` 
                        : "—"}
                   </td>

                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="py-6 px-3 text-gray-400" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WITHDRAWALS */}
      <div className="mb-4">
        <h2 className="text-2xl font-semibold mb-3">Withdrawals</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">User</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Fee</th>
                <th className="py-2 px-3">Total</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
             {txs.map((tx) => {
  const user = users.find((u) => u.id === tx.userId);
  const payment = user?.paymentMethods?.[0];

  return (
    <tr
      key={tx.id}
      className="bg-gray-800/60 hover:bg-gray-800 rounded-xl"
    >
      <td className="py-3 px-3">{tx.id}</td>
      <td className="py-3 px-3">{user?.username || "Unknown"}</td>
      <td className="py-3 px-3">${Number(tx.amount).toFixed(2)}</td>
      <td className="py-3 px-3">${Number(tx.fee).toFixed(2)}</td>
      <td className="py-3 px-3">${Number(tx.total).toFixed(2)}</td>
      <td className="py-3 px-3">{tx.date}</td>

      {/* ✅ Preferred payment method column */}
      <td className="py-3 px-3">
        {payment
          ? `${payment.type}: ${payment.account}`
          : "No payment method added"}
      </td>

      <td
        className={`py-3 px-3 ${
          tx.status === "Completed"
            ? "text-green-400"
            : tx.status === "Rejected"
            ? "text-red-400"
            : "text-yellow-400"
        }`}
      >
        {tx.status}
      </td>

      <td className="py-3 px-3 space-x-2">
        {tx.status === "Pending" ? (
          <>
            <button
              type="button"
              className="px-3 py-1 rounded bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(tx.id, "Completed");
              }}
            >
              Approve
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateStatus(tx.id, "Rejected");
              }}
            >
              Reject
            </button>
          </>
        ) : (
          <span className="text-gray-400 text-sm">No actions</span>
        )}
      </td>
    </tr>
  );
})}

              
              {txs.length === 0 && (
                <tr>
                  <td className="py-6 px-3 text-gray-400" colSpan={8}>
                    No withdrawals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===========================
          MODALS
         =========================== */}

      {/* EDIT USER MODAL */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
          <div className="bg-gray-800 w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl p-6 relative">
            <button
              onClick={closeUserModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-2xl font-semibold mb-4">Edit User</h3>

            {userFormError && (
              <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2 text-sm">
                {userFormError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">Username</span>
                <input
                  name="username"
                  value={editForm.username}
                  onChange={handleUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">Email</span>
                <input
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">Role</span>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">Balance</span>
                <input
                  name="balance"
                  type="number"
                  step="0.01"
                  value={editForm.balance}
                  onChange={handleUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-sm"
              >
                Delete User
              </button>
              <div className="flex gap-3">
                <button
                  onClick={closeUserModal}
                  className="px-4 py-2 rounded bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={saveUser}
                  disabled={savingUser}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {savingUser ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-semibold text-red-400 mb-3">
              Confirm Delete
            </h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold text-white">
                {selectedUser?.username}
              </span>
              ?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center z-50">
          <div className="bg-gray-800 w-full max-w-lg rounded-2xl border border-gray-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddUser(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-2xl font-semibold mb-4">Add New User</h3>

            {addUserError && (
              <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 text-red-300 px-3 py-2 text-sm">
                {addUserError}
              </div>
            )}

            <form
              onSubmit={handleAddUserSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <label className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">Username</span>
                <input
                  name="username"
                  value={newUser.username}
                  onChange={handleAddUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">Email</span>
                <input
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleAddUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">Password</span>
                <input
                  name="password"
                  type="password"
                  value={newUser.password}
                  onChange={handleAddUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-gray-400 text-sm">Role</span>
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleAddUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-gray-400 text-sm">Initial Balance</span>
                <input
                  name="balance"
                  type="number"
                  step="0.01"
                  value={newUser.balance}
                  onChange={handleAddUserChange}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white"
                />
              </label>

              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 rounded bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-60"
                >
                  {addingUser ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center shadow-2xl max-w-md w-full">
            <h2 className="text-2xl font-semibold text-green-400 mb-3">
              Success!
            </h2>
            <p className="text-gray-300 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


