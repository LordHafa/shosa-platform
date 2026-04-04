require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = Number(process.env.PORT || 4000);

// =========================
// Config
// =========================
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "shosa.db");

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, "uploads");

// Admin credentials (simple for now)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@shosa.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ShosaAdmin2025!";

// Event images root (your website folder)
const EVENTS_IMAGES_ROOT =
  process.env.EVENTS_IMAGES_ROOT ||
  path.join(__dirname, "..", "SHOSA-Website", "assets", "images", "events");

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// =========================
// Multer uploads
// =========================
const uploadStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

// =========================
// Middleware
// =========================
app.use(
  helmet({
    // ✅ allows <img> from backend (4000) to be embedded in frontend (5500)
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: false,
  })
);

app.use(express.json({ limit: "2mb" }));

// Serve uploads from backend
app.use("/uploads", express.static(UPLOADS_DIR));

// Serve website event images via backend so gallery URLs work
if (fs.existsSync(EVENTS_IMAGES_ROOT)) {
  app.use("/assets/images/events", express.static(EVENTS_IMAGES_ROOT));
}

// Basic rate limiter for API
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// =========================
// SQLite connection + helpers (Promises)
// =========================
const db = new sqlite3.Database(DB_FILE);

function nowIso() {
  return new Date().toISOString();
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function initSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS alumni (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      gradYear INTEGER,
      campus TEXT,
      period TEXT,
      house TEXT,
      occupation TEXT,
      city TEXT,
      country TEXT,
      bio TEXT,
      profilePhoto TEXT,
      passwordHash TEXT NOT NULL,
      lastProfileUpdate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_alumni_email ON alumni(email)`);

  await run(`
    CREATE TABLE IF NOT EXISTS sacco_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alumniId INTEGER NOT NULL,
      membershipType TEXT NOT NULL,
      monthlyContribution INTEGER NOT NULL,
      startDate TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_sacco_alumniId ON sacco_memberships(alumniId)`);

  await run(`
    CREATE TABLE IF NOT EXISTS mobilemoney_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alumniId INTEGER NOT NULL,
      paymentType TEXT NOT NULL,
      label TEXT,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'UGX',
      phone TEXT,
      network TEXT,
      description TEXT,
      rawPayload TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_payments_alumniId ON mobilemoney_payments(alumniId)`);

  await run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE,
      title TEXT,
      description TEXT,
      location TEXT,
      startUtc TEXT,
      endUtc TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      label TEXT,
      year INTEGER,
      url TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      passwordHash TEXT,
      role TEXT DEFAULT 'admin',
      createdAt TEXT NOT NULL
    )
  `);
}

// =========================
// Auth helpers
// =========================
function generateToken(alumni) {
  return jwt.sign(
    { id: alumni.id, email: alumni.email, fullName: alumni.fullName, role: "alumni" },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function generateAdminToken() {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function adminMiddleware(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing admin token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
}

// =========================
// Root
// =========================
app.get("/", (req, res) => {
  res.json({
    status: "SHOSA API (SQLite + uploads + gallery) - Node20",
    ok: true,
    db: DB_FILE,
  });
});

// =========================
// Admin auth
// =========================
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
    return res.status(400).json({ error: "Invalid admin credentials." });
  }
  res.json({ token: generateAdminToken() });
});

// =========================
// Admin data endpoints (for admin-dashboard.html)
// =========================
app.get("/api/admin/alumni", adminMiddleware, async (req, res) => {
  try {
    const alumni = await all(
      `SELECT id, fullName, email, phone, gradYear, campus, period, createdAt
       FROM alumni
       ORDER BY datetime(createdAt) DESC`
    );
    res.json({ alumni });
  } catch (err) {
    console.error("admin/alumni:", err);
    res.status(500).json({ error: "Failed to load alumni." });
  }
});

app.get("/api/admin/sacco", adminMiddleware, async (req, res) => {
  try {
    const memberships = await all(
      `SELECT sm.id, sm.alumniId, sm.membershipType, sm.monthlyContribution, sm.status, sm.startDate,
              a.fullName AS alumniName, a.email AS alumniEmail, a.phone AS alumniPhone
       FROM sacco_memberships sm
       JOIN alumni a ON a.id = sm.alumniId
       ORDER BY datetime(sm.createdAt) DESC`
    );
    res.json({ memberships });
  } catch (err) {
    console.error("admin/sacco:", err);
    res.status(500).json({ error: "Failed to load SACCO memberships." });
  }
});

app.get("/api/admin/payments", adminMiddleware, async (req, res) => {
  try {
    const payments = await all(
      `SELECT id, alumniId, paymentType, label, amount, currency, phone, network, description, createdAt
       FROM mobilemoney_payments
       ORDER BY datetime(createdAt) DESC
       LIMIT 500`
    );
    res.json({ payments });
  } catch (err) {
    console.error("admin/payments:", err);
    res.status(500).json({ error: "Failed to load payments." });
  }
});

// =========================
// Alumni auth & profile
// =========================
app.post("/api/auth/register", upload.single("profilePhoto"), async (req, res) => {
  try {
    const body = req.body || {};
    const {
      fullName,
      email,
      phone,
      gradYear,
      campus,
      period,
      house,
      occupation,
      city,
      country,
      bio,
      password,
      passwordConfirm,
      customPeriod,
    } = body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "fullName, email and password are required." });
    }

    if (typeof passwordConfirm !== "undefined" && passwordConfirm !== password) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    let finalPeriod = period || null;
    if (finalPeriod === "SingleClass" && customPeriod) {
      finalPeriod = `Only ${customPeriod}`;
    }

    const existing = await get(`SELECT id FROM alumni WHERE email = ?`, [String(email).toLowerCase()]);
    if (existing) return res.status(400).json({ error: "An alumni with that email already exists." });

    const passwordHash = bcrypt.hashSync(password, 10);
    const createdAt = nowIso();
    const updatedAt = createdAt;
    const profilePhoto = req.file ? "/uploads/" + req.file.filename : null;

    const info = await run(
      `
      INSERT INTO alumni
      (fullName, email, phone, gradYear, campus, period, house, occupation, city, country, bio, profilePhoto,
       passwordHash, lastProfileUpdate, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        fullName,
        String(email).toLowerCase(),
        phone || null,
        gradYear ? parseInt(gradYear, 10) || null : null,
        campus || null,
        finalPeriod,
        house || null,
        occupation || null,
        city || null,
        country || null,
        bio || null,
        profilePhoto,
        passwordHash,
        null,
        createdAt,
        updatedAt,
      ]
    );

    const alumni = await get(`SELECT id, fullName, email, profilePhoto FROM alumni WHERE id = ?`, [info.lastID]);
    const token = generateToken(alumni);

    res.json({ token, alumni });
  } catch (err) {
    console.error("register:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required." });

    const alumni = await get(`SELECT * FROM alumni WHERE email = ?`, [String(email).toLowerCase()]);
    if (!alumni) return res.status(400).json({ error: "Invalid email or password." });

    const ok = bcrypt.compareSync(password, alumni.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid email or password." });

    const token = generateToken(alumni);
    res.json({
      token,
      alumni: { id: alumni.id, fullName: alumni.fullName, email: alumni.email, profilePhoto: alumni.profilePhoto || null },
    });
  } catch (err) {
    console.error("login:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const alumni = await get(`SELECT * FROM alumni WHERE id = ?`, [req.user.id]);
    if (!alumni) return res.status(404).json({ error: "Alumni not found." });
    delete alumni.passwordHash;
    res.json(alumni);
  } catch (err) {
    console.error("me:", err);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

app.put("/api/me", authMiddleware, upload.single("profilePhoto"), async (req, res) => {
  try {
    const alumni = await get(`SELECT * FROM alumni WHERE id = ?`, [req.user.id]);
    if (!alumni) return res.status(404).json({ error: "Alumni not found." });

    const now = new Date();

    if (alumni.lastProfileUpdate) {
      const last = new Date(alumni.lastProfileUpdate);
      const diffDays = (now - last) / (1000 * 60 * 60 * 24);
      if (!Number.isNaN(diffDays) && diffDays < 365) {
        const nextAllowed = new Date(last.getTime() + 365 * 24 * 60 * 60 * 1000);
        return res.status(400).json({
          error: "Profile can only be updated once every 12 months.",
          lastProfileUpdate: alumni.lastProfileUpdate,
          nextAllowedUpdate: nextAllowed.toISOString(),
        });
      }
    }

    const body = req.body || {};

    const updated = {
      fullName: typeof body.fullName !== "undefined" ? body.fullName : alumni.fullName,
      phone: typeof body.phone !== "undefined" ? body.phone : alumni.phone,
      gradYear:
        typeof body.gradYear !== "undefined"
          ? body.gradYear
            ? parseInt(body.gradYear, 10) || null
            : null
          : alumni.gradYear,
      campus: typeof body.campus !== "undefined" ? (body.campus || null) : alumni.campus,
      period: typeof body.period !== "undefined" ? (body.period || null) : alumni.period,
      house: typeof body.house !== "undefined" ? (body.house || null) : alumni.house,
      occupation: typeof body.occupation !== "undefined" ? (body.occupation || null) : alumni.occupation,
      city: typeof body.city !== "undefined" ? (body.city || null) : alumni.city,
      country: typeof body.country !== "undefined" ? (body.country || null) : alumni.country,
      bio: typeof body.bio !== "undefined" ? (body.bio || null) : alumni.bio,
      profilePhoto: req.file ? "/uploads/" + req.file.filename : alumni.profilePhoto,
      lastProfileUpdate: now.toISOString(),
      updatedAt: nowIso(),
    };

    await run(
      `
      UPDATE alumni SET
        fullName = ?,
        phone = ?,
        gradYear = ?,
        campus = ?,
        period = ?,
        house = ?,
        occupation = ?,
        city = ?,
        country = ?,
        bio = ?,
        profilePhoto = ?,
        lastProfileUpdate = ?,
        updatedAt = ?
      WHERE id = ?
    `,
      [
        updated.fullName,
        updated.phone,
        updated.gradYear,
        updated.campus,
        updated.period,
        updated.house,
        updated.occupation,
        updated.city,
        updated.country,
        updated.bio,
        updated.profilePhoto,
        updated.lastProfileUpdate,
        updated.updatedAt,
        req.user.id,
      ]
    );

    const saved = await get(`SELECT * FROM alumni WHERE id = ?`, [req.user.id]);
    delete saved.passwordHash;
    res.json(saved);
  } catch (err) {
    console.error("update me:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

app.post("/api/me/photo", authMiddleware, upload.single("profilePhoto"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "profilePhoto file is required." });

    await run(`UPDATE alumni SET profilePhoto = ?, updatedAt = ? WHERE id = ?`, [
      "/uploads/" + req.file.filename,
      nowIso(),
      req.user.id,
    ]);

    res.json({ profilePhoto: "/uploads/" + req.file.filename });
  } catch (err) {
    console.error("me/photo:", err);
    res.status(500).json({ error: "Failed to update photo." });
  }
});

// =========================
// SACCO (alumni)
// =========================
app.post("/api/sacco/register", authMiddleware, async (req, res) => {
  try {
    const { membershipType, monthlyContribution, startDate, status, notes } = req.body || {};

    if (!membershipType || !monthlyContribution || !startDate) {
      return res.status(400).json({ error: "membershipType, monthlyContribution and startDate are required." });
    }

    const contribution = parseInt(monthlyContribution, 10);
    if (Number.isNaN(contribution) || contribution <= 0) {
      return res.status(400).json({ error: "monthlyContribution must be a positive number." });
    }

    const existing = await get(`SELECT * FROM sacco_memberships WHERE alumniId = ?`, [req.user.id]);
    const t = nowIso();

    if (existing) {
      await run(
        `
        UPDATE sacco_memberships SET
          membershipType = ?,
          monthlyContribution = ?,
          startDate = ?,
          status = ?,
          notes = ?,
          updatedAt = ?
        WHERE alumniId = ?
      `,
        [
          membershipType,
          contribution,
          startDate,
          status || existing.status || "active",
          notes || null,
          t,
          req.user.id,
        ]
      );
      return res.json({ id: existing.id, alumniId: req.user.id });
    }

    const info = await run(
      `
      INSERT INTO sacco_memberships
      (alumniId, membershipType, monthlyContribution, startDate, status, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [req.user.id, membershipType, contribution, startDate, status || "active", notes || null, t, t]
    );

    res.json({ id: info.lastID, alumniId: req.user.id });
  } catch (err) {
    console.error("sacco/register:", err);
    res.status(500).json({ error: "Failed to register SACCO membership." });
  }
});

app.get("/api/sacco/me", authMiddleware, async (req, res) => {
  try {
    const membership = await get(`SELECT * FROM sacco_memberships WHERE alumniId = ?`, [req.user.id]);
    res.json({ membership: membership || null });
  } catch (err) {
    console.error("sacco/me:", err);
    res.status(500).json({ error: "Failed to load SACCO membership." });
  }
});

// =========================
// Payments (alumni)
// =========================
app.post("/api/payments/mobilemoney", authMiddleware, async (req, res) => {
  try {
    const { paymentType, amount, phone, network, description } = req.body || {};

    if (!paymentType || !amount || !phone || !network) {
      return res.status(400).json({ error: "paymentType, amount, phone and network are required." });
    }

    const numericAmount = parseInt(amount, 10);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number." });
    }

    let minAmount = 0;
    let exactAmount = null;
    let label = "";

    switch (paymentType) {
      case "sacco_membership_fee":
        exactAmount = 50000;
        label = "SACCO membership registration";
        break;
      case "sacco_yearly_subscription":
        exactAmount = 100000;
        label = "SACCO yearly subscription";
        break;
      case "sacco_savings_monthly":
        minAmount = 50000;
        label = "SACCO monthly savings deposit";
        break;
      case "sacco_savings_quarterly":
        minAmount = 200000;
        label = "SACCO quarterly savings deposit";
        break;
      case "donation":
        minAmount = 1000;
        label = "Donation";
        break;
      default:
        return res.status(400).json({ error: "Unsupported paymentType." });
    }

    if (exactAmount !== null && numericAmount !== exactAmount) {
      return res.status(400).json({ error: `Amount for ${paymentType} must be exactly ${exactAmount} UGX.` });
    }

    if (minAmount > 0 && numericAmount < minAmount) {
      return res.status(400).json({ error: `Amount for ${paymentType} must be at least ${minAmount} UGX.` });
    }

    const createdAt = nowIso();

    const info = await run(
      `
      INSERT INTO mobilemoney_payments
      (alumniId, paymentType, label, amount, currency, phone, network, description, rawPayload, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        req.user.id,
        paymentType,
        label,
        numericAmount,
        "UGX",
        phone,
        network,
        description || null,
        JSON.stringify(req.body || {}, null, 2),
        createdAt,
      ]
    );

    res.json({
      id: info.lastID,
      status: "recorded",
      label,
      amount: numericAmount,
      currency: "UGX",
      message: "Payment recorded. In production, connect this to MTN/Airtel Mobile Money gateway.",
    });
  } catch (err) {
    console.error("payments/mobilemoney:", err);
    res.status(500).json({ error: "Failed to record payment." });
  }
});

// ✅ NEW: alumni can fetch their own payments
app.get("/api/payments/me", authMiddleware, async (req, res) => {
  try {
    const payments = await all(
      `SELECT id, paymentType, label, amount, currency, phone, network, description, createdAt
       FROM mobilemoney_payments
       WHERE alumniId = ?
       ORDER BY datetime(createdAt) DESC
       LIMIT 200`,
      [req.user.id]
    );
    res.json({ payments });
  } catch (err) {
    console.error("payments/me:", err);
    res.status(500).json({ error: "Failed to load your payments." });
  }
});

// =========================
// Events -> .ics (unchanged)
// =========================
function buildEventBySlug(slug) {
  switch (slug) {
    case "2025-league-launch":
      return {
        uid: "2025-league-launch@shosa",
        title: "SHOSA League 2025 – Launch",
        description: "Launch of the SHOSA League 2025 at Equinox.",
        location: "Equinox",
        start: "20251116T140000Z",
        end: "20251116T170000Z",
      };
    case "2016-alumni-dinner":
      return {
        uid: "2016-alumni-dinner@shosa",
        title: "SHOSA Alumni Dinner",
        description: "Alumni dinner and reunion.",
        location: "Seeta High (or official venue)",
        start: "20161210T160000Z",
        end: "20161210T200000Z",
      };
    case "career-guidance":
      return {
        uid: "career-guidance@shosa",
        title: "SHOSA Career Guidance Session",
        description: "Career guidance session for S.4 and S.6 candidates.",
        location: "Seeta High",
        start: "20250901T090000Z",
        end: "20250901T120000Z",
      };
    case "medical-camps":
      return {
        uid: "medical-camps@shosa",
        title: "SHOSA Medical Camp",
        description: "Medical camp organised by SHOSA health professionals.",
        location: "Seeta High",
        start: "20250815T070000Z",
        end: "20250815T150000Z",
      };
    default:
      return null;
  }
}

function buildIcs(evt) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SHOSA//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${evt.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${evt.start}`,
    `DTEND:${evt.end}`,
    `SUMMARY:${evt.title}`,
    `DESCRIPTION:${evt.description}`,
    `LOCATION:${evt.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

app.get("/api/events/:slug/ics", (req, res) => {
  const slug = req.params.slug;
  const evt = buildEventBySlug(slug);
  if (!evt) return res.status(404).send("Unknown event.");

  const ics = buildIcs(evt);
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${slug}.ics"`);
  res.send(ics);
});

// =========================
// Gallery from filesystem (same behavior)
// =========================
function readEventFolder(subfolder, label, year) {
  const items = [];
  const folder = path.join(EVENTS_IMAGES_ROOT, subfolder);
  if (!fs.existsSync(folder)) return items;

  const files = fs.readdirSync(folder);
  files.forEach((fname) => {
    const ext = path.extname(fname).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return;

    const fullPath = path.join(folder, fname);
    let stats;
    try {
      stats = fs.statSync(fullPath);
    } catch {
      return;
    }

    items.push({
      url: `/assets/images/events/${subfolder}/${fname}`,
      label,
      year,
      createdAt: stats.mtime.toISOString(),
    });
  });

  return items;
}

app.get("/api/gallery/events", (req, res) => {
  try {
    const league = readEventFolder("2025-shosa-league-launch", "SHOSA League", 2025);
    const dinners2012 = readEventFolder("2012-first-dinner", "First SHOSA Dinner", 2012);
    const dinners2016 = readEventFolder("2016-alumni-dinner", "Alumni Dinner", 2016);
    const career = readEventFolder("career-guidance", "Career guidance", null);
    const medical = readEventFolder("medical-camps", "Medical camps", null);

    res.json({ league, dinners2012, dinners2016, career, medical });
  } catch (err) {
    console.error("Error in /api/gallery/events:", err);
    res.status(500).json({ error: "Failed to load gallery events." });
  }
});

app.get("/api/gallery/images", (req, res) => {
  try {
    const league = readEventFolder("2025-shosa-league-launch", "SHOSA League", 2025);
    const dinners2012 = readEventFolder("2012-first-dinner", "First SHOSA Dinner", 2012);
    const dinners2016 = readEventFolder("2016-alumni-dinner", "Alumni Dinner", 2016);
    const career = readEventFolder("career-guidance", "Career guidance", null);
    const medical = readEventFolder("medical-camps", "Medical camps", null);

    const allImages = [...league, ...dinners2012, ...dinners2016, ...career, ...medical];
    const top3 = allImages
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    res.json({ images: top3 });
  } catch (err) {
    console.error("Error in /api/gallery/images:", err);
    res.status(500).json({ error: "Failed to load gallery images." });
  }
});

// =========================
// 404
// =========================
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// =========================
// Start
// =========================
(async function start() {
  try {
    await initSchema();
    app.listen(PORT, () => {
      console.log(`✅ SHOSA backend (SQLite3) running on http://localhost:${PORT}`);
      console.log(`✅ DB: ${DB_FILE}`);
      console.log(`✅ Uploads: ${UPLOADS_DIR}`);
      console.log(`✅ Events images: ${EVENTS_IMAGES_ROOT}`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
})();
