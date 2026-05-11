require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// ─── Pure-JS JSON database (lowdb v1) ────────────────────────────────────────

const DB_PATH = path.join(__dirname, "taskly.json");
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

db.defaults({ users: [], tasks: [] }).write();

console.log("✅ Database ready at:", DB_PATH);

// ─── Health & Readiness ───────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  res.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
});

app.get("/ready", (req, res) => {
  res.json({ status: "ready", timestamp: new Date().toISOString() });
});

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.get("users").find({ email: normalizedEmail }).value();
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = {
      id: uuidv4(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      created_at: new Date().toISOString(),
    };

    db.get("users").push(user).write();
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = db.get("users").find({ email: email.toLowerCase().trim() }).value();
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// ─── Task Endpoints ───────────────────────────────────────────────────────────

app.get("/api/tasks", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id is required." });

  try {
    const tasks = db
      .get("tasks")
      .filter({ user_id })
      .orderBy(["created_at"], ["desc"])
      .value();
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.post("/api/tasks", (req, res) => {
  const { user_id, title, description } = req.body;

  if (!user_id || !title || !title.trim()) {
    return res.status(400).json({ error: "user_id and title are required." });
  }

  try {
    const task = {
      id: uuidv4(),
      user_id,
      title: title.trim(),
      description: description ? description.trim() : "",
      complete: 0,
      created_at: new Date().toISOString(),
    };

    db.get("tasks").push(task).write();
    res.status(201).json(task);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.put("/api/tasks/:id", (req, res) => {
  const { id } = req.params;

  try {
    const task = db.get("tasks").find({ id }).value();
    if (!task) return res.status(404).json({ error: "Task not found." });

    db.get("tasks")
      .find({ id })
      .assign({ complete: task.complete ? 0 : 1 })
      .write();

    const updated = db.get("tasks").find({ id }).value();
    res.json(updated);
  } catch (err) {
    console.error("Toggle task error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.delete("/api/tasks/:id", (req, res) => {
  const { id } = req.params;

  try {
    const task = db.get("tasks").find({ id }).value();
    if (!task) return res.status(404).json({ error: "Task not found." });

    db.get("tasks").remove({ id }).write();
    res.json({ message: "Task deleted successfully." });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log("🚀 API server running at http://localhost:" + PORT);
});
