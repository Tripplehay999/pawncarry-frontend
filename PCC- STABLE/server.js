import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";
const FEE_RATE = 0.05; // 5%

// ===== HELPERS =====
const fmtDate = (d = new Date()) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const hash = (p) => bcrypt.hashSync(p, 10);

// ===== MOCK DATABASE =====
let users = [
  {
    id: 1,
    username: "admin",
    email: "admin@test.com",
    password: hash("admin123"),
    role: "admin",
    wallet: { balance: 1000 },
  },
  {
    id: 2,
    username: "booster1",
    email: "booster1@test.com",
    password: hash("booster123"),
    role: "user",
    wallet: { balance: 500 },
  },
];

let transactions = [
  {
    id: 1,
    userId: 2,
    type: "Withdrawal",
    amount: 200,
    fee: 10,
    total: 210,
    date: fmtDate(new Date("2025-10-08")),
    status: "Pending",
    reference: "TXN100001",
  },
];

let notifications = {
  1: [{ id: 1, text: "System online.", time: "Just now" }],
  2: [{ id: 1, text: "Welcome back!", time: "Just now" }],
};

// ===== MIDDLEWARE =====
const authMiddleware = (req, res, next) => {
  try {
    const hdr = req.headers["authorization"];
    if (!hdr) return res.status(401).json({ message: "No token provided" });
    const token = hdr.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied, admin only" });
  next();
};

// ===== AUTH =====
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(400).json({ message: "User not found" });

  if (!bcrypt.compareSync(password, user.password))
    return res.status(400).json({ message: "Incorrect password" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
  res.json({ token });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    wallet: user.wallet,
  });
});

// ===== NOTIFICATIONS =====
app.get("/api/notifications", authMiddleware, (req, res) => {
  const list = notifications[req.user.id] || [];
  res.json(list);
});

// ===== USER TRANSACTIONS =====
app.get("/api/transactions", authMiddleware, (req, res) => {
  const mine = transactions.filter((t) => t.userId === req.user.id);
  res.json(mine);
});

app.post("/api/transactions/withdraw", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const amount = Number(req.body.amount);
  if (!Number.isFinite(amount) || amount <= 0)
    return res.status(400).json({ message: "Invalid amount" });

  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const total = Math.round((amount + fee) * 100) / 100;

  if (total > user.wallet.balance)
    return res.status(400).json({ message: "Insufficient balance" });

  user.wallet.balance = Math.round((user.wallet.balance - total) * 100) / 100;

  const txn = {
    id: transactions.length + 1,
    userId: user.id,
    type: "Withdrawal",
    amount,
    fee,
    total,
    date: fmtDate(),
    status: "Pending",
    reference: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
  };

  transactions.unshift(txn);

  const note = { id: Date.now(), text: `Withdrawal $${amount} requested.`, time: "Just now" };
  notifications[user.id] = [...(notifications[user.id] || []), note];

  res.json({ transaction: txn, wallet: { balance: user.wallet.balance } });
});

// ===== ADMIN ROUTES =====

// Get all users
app.get("/api/admin/users", authMiddleware, adminMiddleware, (req, res) => {
  res.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      balance: u.wallet.balance,
    }))
  );
});

// Create a new user (admin only)
app.post("/api/admin/users", authMiddleware, adminMiddleware, (req, res) => {
  const { username, email, password, role, balance } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "Username, email, and password are required" });

  const existing = users.find((u) => u.username === username || u.email === email);
  if (existing)
    return res.status(400).json({ message: "User with that username or email already exists" });

  const allowedRoles = ["admin", "user"];
  const userRole = allowedRoles.includes(role) ? role : "user";
  const userBalance = Number.isFinite(Number(balance)) ? Number(balance) : 0;

  const newUser = {
    id: users.length + 1,
    username: username.trim(),
    email: email.trim(),
    password: hash(password),
    role: userRole,
    wallet: { balance: userBalance },
  };

  users.push(newUser);
  notifications[newUser.id] = [{ id: 1, text: "Welcome to PawnCarry!", time: "Just now" }];

  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    balance: newUser.wallet.balance,
  });
});

// Get single user
app.get("/api/admin/users/:id", authMiddleware, adminMiddleware, (req, res) => {
  const u = users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ message: "User not found" });

  res.json({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    balance: u.wallet.balance,
  });
});

// Update user
app.put("/api/admin/users/:id", authMiddleware, adminMiddleware, (req, res) => {
  const u = users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ message: "User not found" });

  const { username, email, role, balance } = req.body;
  const roles = ["admin", "user"];

  if (username && typeof username !== "string")
    return res.status(400).json({ message: "Invalid username" });
  if (email && typeof email !== "string")
    return res.status(400).json({ message: "Invalid email" });
  if (role && !roles.includes(role))
    return res.status(400).json({ message: "Invalid role" });
  if (balance != null && (!Number.isFinite(Number(balance)) || Number(balance) < 0))
    return res.status(400).json({ message: "Invalid balance" });

  if (username) u.username = username.trim();
  if (email) u.email = email.trim();
  if (role) u.role = role;
  if (balance != null) u.wallet.balance = Math.round(Number(balance) * 100) / 100;

  res.json({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    balance: u.wallet.balance,
  });
});

// Transactions (admin)
app.get("/api/admin/transactions", authMiddleware, adminMiddleware, (req, res) => {
  res.json(transactions);
});

app.put("/api/admin/transactions/:id", authMiddleware, adminMiddleware, (req, res) => {
  const txn = transactions.find((t) => t.id === Number(req.params.id));
  if (!txn) return res.status(404).json({ message: "Transaction not found" });

  const { status } = req.body;
  const allowed = ["Pending", "Completed", "Rejected"];
  if (!allowed.includes(status))
    return res.status(400).json({ message: "Invalid status" });

  txn.status = status;

  const note = { id: Date.now(), text: `Withdrawal ${txn.reference} ${status}.`, time: "Just now" };
  notifications[txn.userId] = [...(notifications[txn.userId] || []), note];

  res.json(txn);
});

// ===== START SERVER =====
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
