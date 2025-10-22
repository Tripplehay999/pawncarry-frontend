import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/adminDashboard";
import Login from "./pages/login";
import Profile from "./pages/profile"; // ✅ added

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("token");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <BrowserRouter>
      {user && <Navbar username={user.username} onLogout={handleLogout} />}
      <Routes>
        {/* Login */}
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.role === "admin" ? "/admin" : "/"} />} 
        />

        {/* User Dashboard */}
        <Route 
          path="/" 
          element={user && user.role === "user" ? <Dashboard /> : <Navigate to="/login" />} 
        />

        {/* ✅ Profile Route */}
        <Route 
          path="/profile" 
          element={user ? <Profile /> : <Navigate to="/login" />} 
        />

        {/* Admin Dashboard */}
        <Route 
          path="/admin" 
          element={user && user.role === "admin" ? <AdminDashboard /> : <Navigate to="/login" />} 
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/") : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}
