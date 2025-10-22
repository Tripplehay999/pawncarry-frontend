import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ username = "booster1", onLogout }) {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef();
  const profileRef = useRef();
  const navigate = useNavigate();

  const notifications = [
    { id: 1, text: "Withdrawal $250 is pending review", time: "2h ago" },
    { id: 2, text: "TXN987452 completed", time: "1 day ago" },
    { id: 3, text: "New payout policy update", time: "3 days ago" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <nav className="w-full border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-md gradient-edge">
            <div className="glass-card px-3 py-2 text-white font-semibold">PawnCarry</div>
          </div>
          <div className="text-sm text-gray-400">User Dashboard</div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-white hover:text-accent transition">Dashboard</Link>
          <Link to="/wallet" className="text-white hover:text-accent2 transition">Wallet</Link>
          <Link to="/payments" className="text-white hover:underline transition">Withdraw</Link>
          <Link to="/profile" className="text-white hover:text-indigo-400 transition">Profile</Link>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(v => !v)}
              className="p-2 rounded hover:bg-white/10 transition bg-gray-900/40"
              title="Notifications"
            >
              🔔
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-800/95 rounded-lg border border-white/10 shadow-lg z-40 p-3 backdrop-blur-md">
                <div className="text-sm font-semibold mb-2 text-white">Notifications</div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 rounded hover:bg-white/5 transition text-white">
                      <div className="text-sm">{n.text}</div>
                      <div className="text-xs text-gray-400">{n.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-2 p-1 rounded hover:bg-white/10 transition bg-gray-900/40"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-black font-bold">
                {username[0].toUpperCase()}
              </div>
              <div className="text-sm text-white">{username}</div>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-800/95 rounded-lg border border-white/10 shadow-lg z-40 p-2 backdrop-blur-md">
                <Link
                  to="/profile"
                  className="block w-full text-left p-2 rounded hover:bg-white/5 text-white"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>
                <button
                  className="w-full text-left p-2 rounded hover:bg-white/5 text-white"
                  onClick={() => alert('Settings page not ready yet')}
                >
                  Settings
                </button>
                <button
                  className="w-full text-left p-2 rounded hover:bg-white/5 text-white"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
