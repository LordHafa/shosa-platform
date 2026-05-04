require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Node 22+ built-in SQLite
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 4000;

// =========================
// Config
// =========================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "dev-secret" || JWT_SECRET === "super-secret-change-me") {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ JWT_SECRET is not set or is using a default value. Set it in .env before running in production.");
    process.exit(1);
  } else {
    console.warn("⚠️  Using insecure default JWT_SECRET. Set JWT_SECRET in .env for production.");
  }
}
const JWT_SECRET_FINAL = JWT_SECRET || "CHANGE_ME_TO_A_LONG_RANDOM_SECRET";

const DB_FILE = process.env.DB_FILE || path.join(__dirname, "shosa.db");
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, "uploads");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "CHANGE_ME";
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
    const safeName = file.originalname.replace(/[/\\]+/g, "_").replace(/\s+/g, "_");
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

const galleryUpload = upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "photos", maxCount: 50 },
]);

// =========================
// Middleware
// =========================

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images to load cross-origin
}));

// CORS — read from env, fall back to localhost origins for dev
const DEFAULT_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
];
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : DEFAULT_ORIGINS;

app.use(cors({ origin: corsOrigins, credentials: false }));

// Rate limiting — general
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
}));

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts. Please try again later." },
});

app.use(express.json());

// Serve uploaded profile photos
app.use("/uploads", express.static(UPLOADS_DIR));

// Serve event images so gallery URLs work cross-origin
if (fs.existsSync(EVENTS_IMAGES_ROOT)) {
  app.use("/assets/images/events", express.static(EVENTS_IMAGES_ROOT));
}

// =========================
// SQLite helpers
// =========================
const db = new Database(DB_FILE);
console.log("✅ Connected to SQLite database:", DB_FILE);

function nowIso() {
  return new Date().toISOString();
}
function one(stmt, params = {}) {
  return db.prepare(stmt).get(params);
}
function all(stmt, params = {}) {
  return db.prepare(stmt).all(params);
}
function run(stmt, params = {}) {
  return db.prepare(stmt).run(params);
}

function hasMembershipFeePaid(alumniId) {
  return !!one(
    `SELECT id FROM mobilemoney_payments WHERE alumniId = :alumniId AND paymentType = 'sacco_membership_fee' LIMIT 1`,
    { alumniId }
  );
}

function addMonthsToIso(isoDate, months) {
  const d = isoDate ? new Date(isoDate) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function getMembershipActivationDate(alumniId) {
  const payment = one(
    `SELECT createdAt FROM mobilemoney_payments
     WHERE alumniId = :alumniId AND paymentType = 'sacco_membership_fee'
     ORDER BY createdAt ASC LIMIT 1`,
    { alumniId }
  );
  return payment?.createdAt || null;
}

function getSaccoYearlySubscriptionPolicy(alumniId) {
  const activationDate = getMembershipActivationDate(alumniId);
  if (!activationDate) {
    return {
      activationDate: null,
      yearlySubscriptionGraceMonths: 6,
      yearlySubscriptionDueAt: null,
      yearlySubscriptionInGrace: false,
      yearlySubscriptionDue: false,
      yearlySubscriptionPaid: false,
      yearlySubscriptionBlocking: false,
      yearlySubscriptionMessage: "Membership activation is pending the registration fee.",
    };
  }

  const dueAt = addMonthsToIso(activationDate, 6);
  const now = new Date();
  const dueDate = new Date(dueAt);
  const inGrace = now < dueDate;
  const paid = !!one(
    `SELECT id FROM mobilemoney_payments
     WHERE alumniId = :alumniId
       AND paymentType = 'sacco_yearly_subscription'
       AND datetime(createdAt) >= datetime(:dueAt)
     ORDER BY createdAt DESC LIMIT 1`,
    { alumniId, dueAt }
  );
  const blocking = !inGrace && !paid;

  return {
    activationDate,
    yearlySubscriptionGraceMonths: 6,
    yearlySubscriptionDueAt: dueAt,
    yearlySubscriptionInGrace: inGrace,
    yearlySubscriptionDue: !inGrace,
    yearlySubscriptionPaid: paid,
    yearlySubscriptionBlocking: blocking,
    yearlySubscriptionMessage: inGrace
      ? "You are within the 6-month SACCO activation grace period before yearly subscription becomes compulsory."
      : (paid ? "Yearly subscription is up to date for the current cycle." : "Yearly subscription is now compulsory before other SACCO payments."),
  };
}

function getSaccoStatusForUser(alumniId) {
  const membership = one(`SELECT * FROM sacco_memberships WHERE alumniId = :alumniId`, { alumniId }) || null;
  const membershipFeePaid = hasMembershipFeePaid(alumniId);
  const yearlyPolicy = getSaccoYearlySubscriptionPolicy(alumniId);
  const yearlyBlocking = !!membership && membershipFeePaid && yearlyPolicy.yearlySubscriptionBlocking;
  const canProceedAsMember = !!membership && membershipFeePaid && !yearlyBlocking;
  return {
    membership,
    membershipFeePaid,
    canProceedAsMember,
    ...yearlyPolicy,
    nextRequiredStep: !membership
      ? 'register_membership'
      : (!membershipFeePaid ? 'pay_membership_fee' : (yearlyBlocking ? 'pay_yearly_subscription' : null)),
  };
}

function hasColumn(tableName, columnName) {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return cols.some((c) => c.name === columnName);
}

function addColumnIfMissing(tableName, definitionSql, columnName) {
  if (!hasColumn(tableName, columnName)) {
    run(`ALTER TABLE ${tableName} ADD COLUMN ${definitionSql}`);
  }
}

function initSchema() {
  run(`
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
  run(`CREATE INDEX IF NOT EXISTS idx_alumni_email ON alumni(email)`);

  addColumnIfMissing("alumni", "campusCode TEXT", "campusCode");
  addColumnIfMissing("alumni", "membershipTier TEXT DEFAULT 'alumni_member'", "membershipTier");

  run(`
    CREATE TABLE IF NOT EXISTS campuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      committeeLabel TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    )
  `);

  run(`
    CREATE TABLE IF NOT EXISTS governance_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      module TEXT NOT NULL,
      scopeType TEXT NOT NULL,
      functionKey TEXT NOT NULL,
      description TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  run(`
    CREATE TABLE IF NOT EXISTS governance_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT,
      roleCode TEXT NOT NULL,
      scopeType TEXT NOT NULL,
      scopeValue TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      UNIQUE(roleCode, scopeType, scopeValue)
    )
  `);

  run(`
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
  run(`CREATE INDEX IF NOT EXISTS idx_sacco_alumniId ON sacco_memberships(alumniId)`);

  run(`
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
  run(`CREATE INDEX IF NOT EXISTS idx_payments_alumniId ON mobilemoney_payments(alumniId)`);
  addColumnIfMissing("mobilemoney_payments", "status TEXT DEFAULT 'pending_gateway_confirmation'", "status");
  addColumnIfMissing("mobilemoney_payments", "paymentChannel TEXT", "paymentChannel");
  addColumnIfMissing("mobilemoney_payments", "transactionRef TEXT", "transactionRef");
  addColumnIfMissing("mobilemoney_payments", "proofFileName TEXT", "proofFileName");
  addColumnIfMissing("mobilemoney_payments", "confirmedAt TEXT", "confirmedAt");
  addColumnIfMissing("mobilemoney_payments", "confirmedBy TEXT", "confirmedBy");

  run(`
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

  run(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      label TEXT,
      description TEXT,
      year INTEGER,
      url TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);
  addColumnIfMissing("gallery_images", "description TEXT", "description");

  run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adminEmail TEXT,
      adminRole TEXT,
      action TEXT NOT NULL,
      resourceType TEXT,
      resourceId TEXT,
      status TEXT NOT NULL,
      reason TEXT,
      ip TEXT,
      userAgent TEXT,
      metadataJson TEXT,
      createdAt TEXT NOT NULL
    )
  `);
  run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt DESC)`);
  run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`);
  run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status)`);
  run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_adminEmail ON audit_logs(adminEmail)`);

  run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      passwordHash TEXT,
      role TEXT DEFAULT 'admin',
      createdAt TEXT NOT NULL
    )
  `);
  const seededAt = nowIso();
  const campuses = [
    { code: "main", name: "Main Campus", committeeLabel: "Main Campus Committee", sortOrder: 1 },
    { code: "mbalala", name: "Mbalala Campus", committeeLabel: "Mbalala Campus Committee", sortOrder: 2 },
    { code: "green", name: "Green Campus", committeeLabel: "Green Campus Committee", sortOrder: 3 },
    { code: "alevel", name: "A Level Campus", committeeLabel: "A Level Campus Committee", sortOrder: 4 },
  ];
  campuses.forEach((campus) => {
    run(`INSERT OR IGNORE INTO campuses (code, name, committeeLabel, sortOrder, createdAt) VALUES (:code, :name, :committeeLabel, :sortOrder, :createdAt)`, { ...campus, createdAt: seededAt });
  });

  const roles = [
    ["super_admin", "Super Administrator", "system", "global", "system_admin", "Single top-level system operator with full access."],
    ["system_auditor", "System Auditor", "system", "global", "audit", "Read-only oversight across the full platform."],
    ["central_president", "Central President", "alumni", "global", "central_leadership", "Heads the umbrella alumni association."],
    ["central_secretary", "Central Secretary", "alumni", "global", "central_operations", "Coordinates central communication and execution."],
    ["central_treasurer", "Central Treasurer", "alumni", "global", "central_finance", "Handles alumni-side non-SACCO reporting and accountability."],
    ["campus_chair", "Campus Chair", "alumni", "campus", "campus_leadership", "Leads a campus committee."],
    ["campus_secretary", "Campus Secretary", "alumni", "campus", "campus_operations", "Runs campus committee records and communications."],
    ["campus_treasurer", "Campus Treasurer", "alumni", "campus", "campus_finance", "Handles campus-level alumni contribution records."],
    ["sacco_board", "SACCO Board", "sacco", "global", "sacco_policy", "Provides SACCO board oversight and policy direction."],
    ["credit_committee", "Credit Committee", "sacco", "global", "credit_review", "Reviews and recommends loan decisions."],
    ["supervisory_committee", "Supervisory Committee", "sacco", "global", "sacco_audit", "Independent SACCO oversight."],
    ["sacco_staff", "SACCO Staff", "sacco", "global", "sacco_operations", "Runs SACCO day-to-day operations."],
  ];
  roles.forEach(([code, name, module, scopeType, functionKey, description]) => {
    run(`INSERT OR IGNORE INTO governance_roles (code, name, module, scopeType, functionKey, description, createdAt) VALUES (:code, :name, :module, :scopeType, :functionKey, :description, :createdAt)`, { code, name, module, scopeType, functionKey, description, createdAt: seededAt });
  });
}

initSchema();

// =========================
// Audit helpers
// =========================
function safeMeta(input) {
  if (!input || typeof input !== "object") return null;
  const blockedFragments = ["password", "token", "authorization", "auth", "jwt", "secret", "cookie"];
  const out = {};

  Object.keys(input).forEach((key) => {
    const lower = String(key).toLowerCase();
    if (blockedFragments.some((fragment) => lower.includes(fragment))) return;

    const value = input[key];
    if (typeof value === "string" && value.length > 800) {
      out[key] = value.slice(0, 800) + "...";
    } else {
      out[key] = value;
    }
  });

  return out;
}

function writeAuditLog(req, details = {}) {
  try {
    const actorEmail = details.adminEmail || req?.admin?.email || req?.user?.email || null;
    const actorRole = details.adminRole || req?.admin?.role || req?.user?.role || null;
    const forwardedFor = req?.headers?.["x-forwarded-for"];
    const ip = forwardedFor ? String(forwardedFor).split(",")[0].trim() : (req?.ip || null);
    const userAgent = req?.headers?.["user-agent"] || null;
    const metadataJson = details.metadata ? JSON.stringify(safeMeta(details.metadata)) : null;

    run(
      `INSERT INTO audit_logs
        (adminEmail, adminRole, action, resourceType, resourceId, status, reason, ip, userAgent, metadataJson, createdAt)
       VALUES
        (:adminEmail, :adminRole, :action, :resourceType, :resourceId, :status, :reason, :ip, :userAgent, :metadataJson, :createdAt)`,
      {
        adminEmail: actorEmail,
        adminRole: actorRole,
        action: details.action || "unknown_action",
        resourceType: details.resourceType || null,
        resourceId: typeof details.resourceId !== "undefined" && details.resourceId !== null ? String(details.resourceId) : null,
        status: details.status || "unknown",
        reason: details.reason || null,
        ip,
        userAgent,
        metadataJson,
        createdAt: nowIso(),
      }
    );
  } catch (err) {
    console.error("Audit log write failed:", err?.message || err);
  }
}

// =========================
// Auth helpers
// =========================
function generateToken(alumni) {
  return jwt.sign(
    {
      id: alumni.id,
      email: alumni.email,
      fullName: alumni.fullName,
      campus: alumni.campus || null,
      campusCode: alumni.campusCode || null,
      membershipTier: alumni.membershipTier || "alumni_member",
    },
    JWT_SECRET_FINAL,
    { expiresIn: "7d" }
  );
}

function generateAdminToken(role = "super_admin") {
  return jwt.sign({ role }, JWT_SECRET_FINAL, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET_FINAL);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function adminAuthMiddleware(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET_FINAL);
    if (!["admin", "super_admin", "system_auditor", "central_president", "central_secretary", "central_treasurer", "campus_chair", "campus_secretary", "campus_treasurer", "sacco_board", "credit_committee", "supervisory_committee", "sacco_staff"].includes(decoded.role)) return res.status(403).json({ error: "Admin access required" });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// =========================
// Health check
// =========================
app.get("/", (req, res) => {
  res.json({ status: "SHOSA API", ok: true, env: process.env.NODE_ENV || "development" });
});

// =========================
// Public governance metadata
// =========================
app.get("/api/meta/campuses", (req, res) => {
  const campuses = all(`SELECT code, name, committeeLabel, sortOrder FROM campuses WHERE isActive = 1 ORDER BY sortOrder ASC`);
  res.json({ campuses });
});

app.get("/api/meta/governance", (req, res) => {
  const campuses = all(`SELECT code, name, committeeLabel, sortOrder FROM campuses WHERE isActive = 1 ORDER BY sortOrder ASC`);
  const roles = all(`SELECT code, name, module, scopeType, functionKey, description FROM governance_roles ORDER BY module, scopeType, name`);
  res.json({
    campuses,
    roles,
    blueprint: {
      alumniStructure: "One central SHOSA executive with four campus committees",
      saccoStructure: "One shared SACCO serving members from all campuses",
      adminPrinciple: "Reserve super-admin powers for a very small system layer to prevent duplicated authority",
    },
  });
});

// =========================
// Admin auth
// =========================
app.post("/api/admin/login", authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = email ? String(email).toLowerCase().trim() : null;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }

  if (normalizedEmail !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
    writeAuditLog(req, {
      action: "admin_login",
      status: "failure",
      reason: "invalid_credentials",
      adminEmail: normalizedEmail,
      adminRole: "unknown",
      metadata: { attemptedEmail: normalizedEmail },
    });
    return res.status(401).json({ error: "Invalid admin credentials." });
  }

  writeAuditLog(req, {
    action: "admin_login",
    status: "success",
    adminEmail: ADMIN_EMAIL,
    adminRole: "super_admin",
    metadata: { loginMethod: "env_admin" },
  });

  res.json({ token: generateAdminToken("super_admin"), admin: { email: ADMIN_EMAIL, role: "super_admin" } });
});

// =========================
// Admin — governance
// =========================
app.get("/api/admin/governance", adminAuthMiddleware, (req, res) => {
  const campuses = all(`SELECT code, name, committeeLabel, sortOrder FROM campuses WHERE isActive = 1 ORDER BY sortOrder ASC`);
  const roles = all(`SELECT code, name, module, scopeType, functionKey, description FROM governance_roles ORDER BY module, scopeType, name`);
  const assignments = all(`SELECT fullName, email, roleCode, scopeType, scopeValue, isActive FROM governance_assignments WHERE isActive = 1 ORDER BY scopeType, scopeValue, roleCode`);
  res.json({ campuses, roles, assignments });
});

app.get("/api/admin/audit-logs", adminAuthMiddleware, (req, res) => {
  const limitRaw = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100;
  const params = { limit };
  const where = [];

  if (req.query.action) {
    where.push("action = :action");
    params.action = String(req.query.action);
  }

  if (req.query.status) {
    where.push("status = :status");
    params.status = String(req.query.status);
  }

  if (req.query.adminEmail) {
    where.push("adminEmail = :adminEmail");
    params.adminEmail = String(req.query.adminEmail).toLowerCase().trim();
  }

  const sql = `SELECT id, adminEmail, adminRole, action, resourceType, resourceId, status, reason, ip, userAgent, metadataJson, createdAt
               FROM audit_logs ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY id DESC LIMIT :limit`;

  const logs = all(sql, params).map((row) => {
    let metadata = null;
    if (row.metadataJson) {
      try { metadata = JSON.parse(row.metadataJson); } catch { metadata = null; }
    }
    const { metadataJson, ...rest } = row;
    return { ...rest, metadata };
  });

  res.json({ logs, limit });
});

// =========================
// Admin — data access
// =========================

// All alumni (paginated)
app.get("/api/admin/alumni", adminAuthMiddleware, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search}%` : null;

  const rows = search
    ? all(
        `SELECT id, fullName, email, phone, gradYear, campus, period, house, occupation, city, country, profilePhoto, createdAt
         FROM alumni WHERE fullName LIKE :s OR email LIKE :s ORDER BY createdAt DESC LIMIT :limit OFFSET :offset`,
        { s: search, limit, offset }
      )
    : all(
        `SELECT id, fullName, email, phone, gradYear, campus, period, house, occupation, city, country, profilePhoto, createdAt
         FROM alumni ORDER BY createdAt DESC LIMIT :limit OFFSET :offset`,
        { limit, offset }
      );

  const total = search
    ? (one(`SELECT COUNT(*) as n FROM alumni WHERE fullName LIKE :s OR email LIKE :s`, { s: search })?.n || 0)
    : (one(`SELECT COUNT(*) as n FROM alumni`)?.n || 0);

  res.json({ alumni: rows, total, page, limit });
});

// Delete an alumni account
app.delete("/api/admin/alumni/:id", adminAuthMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "Invalid id." });
  const alumni = one(`SELECT id FROM alumni WHERE id = :id`, { id });
  if (!alumni) return res.status(404).json({ error: "Alumni not found." });
  run(`DELETE FROM alumni WHERE id = :id`, { id });
  run(`DELETE FROM sacco_memberships WHERE alumniId = :id`, { id });
  res.json({ ok: true });
});

// All payments
app.get("/api/admin/payments", adminAuthMiddleware, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
  const offset = (page - 1) * limit;

  const rows = all(
    `SELECT p.*, a.fullName AS alumniName, a.email AS alumniEmail
     FROM mobilemoney_payments p
     LEFT JOIN alumni a ON a.id = p.alumniId
     ORDER BY p.createdAt DESC LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );
  const total = one(`SELECT COUNT(*) as n FROM mobilemoney_payments`)?.n || 0;
  res.json({ payments: rows, total, page, limit });
});

// Dashboard stats
app.get("/api/admin/stats", adminAuthMiddleware, (req, res) => {
  const totalAlumni = one(`SELECT COUNT(*) as n FROM alumni`)?.n || 0;
  const totalSacco = one(`SELECT COUNT(*) as n FROM sacco_memberships WHERE status = 'active'`)?.n || 0;
  const totalPayments = one(`SELECT COUNT(*) as n FROM mobilemoney_payments`)?.n || 0;
  const totalRevenue = one(`SELECT COALESCE(SUM(amount), 0) as s FROM mobilemoney_payments`)?.s || 0;
  const recentAlumni = all(
    `SELECT id, fullName, email, gradYear, createdAt FROM alumni ORDER BY createdAt DESC LIMIT 5`
  );
  res.json({ totalAlumni, totalSaccoMembers: totalSacco, totalPayments, totalRevenue, recentAlumni });
});

// Admin gallery upload
app.post("/api/admin/gallery/upload", adminAuthMiddleware, upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "image file is required." });
  const { category, label, year } = req.body || {};
  const url = "/uploads/" + req.file.filename;
  const info = run(
    `INSERT INTO gallery_images (category, label, year, url, createdAt)
     VALUES (:category, :label, :year, :url, :createdAt)`,
    {
      category: category || null,
      label: label || null,
      year: year ? parseInt(year, 10) : null,
      url,
      createdAt: nowIso(),
    }
  );
  writeAuditLog(req, {
    action: "gallery_upload",
    resourceType: "gallery_image",
    resourceId: info.lastInsertRowid,
    status: "success",
    metadata: { filesUploaded: 1, category: category || null, label: label || null, year: year || null, endpoint: "/api/admin/gallery/upload" },
  });
  res.json({ id: info.lastInsertRowid, url });
});

// Admin gallery delete
app.delete("/api/admin/gallery/:id", adminAuthMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const img = one(`SELECT * FROM gallery_images WHERE id = :id`, { id });
  if (!img) {
    writeAuditLog(req, {
      action: "gallery_delete",
      resourceType: "gallery_image",
      resourceId: req.params.id,
      status: "failure",
      reason: "not_found",
      metadata: { endpoint: "/api/admin/gallery/:id" },
    });
    return res.status(404).json({ error: "Image not found." });
  }

  // Delete the physical file if it's in uploads
  if (img.url && img.url.startsWith("/uploads/")) {
    const filePath = path.join(UPLOADS_DIR, path.basename(img.url));
    try { fs.unlinkSync(filePath); } catch { /* file may already be gone */ }
  }

  run(`DELETE FROM gallery_images WHERE id = :id`, { id });
  writeAuditLog(req, {
    action: "gallery_delete",
    resourceType: "gallery_image",
    resourceId: id,
    status: "success",
    metadata: { endpoint: "/api/admin/gallery/:id", url: img.url || null, label: img.label || null },
  });
  res.json({ ok: true });
});

// =========================
// Alumni auth & profile
// =========================

// Register (with optional profile photo)
app.post("/api/auth/register", authLimiter, upload.single("profilePhoto"), (req, res) => {
  const body = req.body || {};
  const {
    fullName, email, phone, gradYear, campus, period, house,
    occupation, city, country, bio, password, passwordConfirm, customPeriod,
  } = body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "fullName, email and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }
  if (passwordConfirm && password !== passwordConfirm) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  const normalEmail = String(email).toLowerCase().trim();
  const existing = one(`SELECT id FROM alumni WHERE email = :email`, { email: normalEmail });
  if (existing) return res.status(400).json({ error: "Email already registered." });

  const passwordHash = bcrypt.hashSync(password, 12);
  const profilePhoto = req.file ? "/uploads/" + req.file.filename : null;
  const now = nowIso();
  const resolvedPeriod = period === "other" && customPeriod ? customPeriod : (period || null);

  const info = run(
    `INSERT INTO alumni
      (fullName, email, phone, gradYear, campus, campusCode, membershipTier, period, house, occupation, city, country, bio, profilePhoto, passwordHash, lastProfileUpdate, createdAt, updatedAt)
     VALUES
      (:fullName, :email, :phone, :gradYear, :campus, :campusCode, :membershipTier, :period, :house, :occupation, :city, :country, :bio, :profilePhoto, :passwordHash, NULL, :createdAt, :updatedAt)`,
    {
      fullName: String(fullName).trim(),
      email: normalEmail,
      phone: phone || null,
      gradYear: gradYear ? parseInt(gradYear, 10) || null : null,
      campus: campus || null,
      campusCode: ({"Main Campus":"main","Mbalala Campus":"mbalala","Green Campus":"green","A Level Campus":"alevel"}[campus] || null),
      membershipTier: "alumni_member",
      period: resolvedPeriod,
      house: house || null,
      occupation: occupation || null,
      city: city || null,
      country: country || null,
      bio: bio || null,
      profilePhoto,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    }
  );

  const alumni = one(`SELECT id, fullName, email, profilePhoto FROM alumni WHERE id = :id`, { id: info.lastInsertRowid });
  res.json({ token: generateToken(alumni), alumni });
});

// Login
app.post("/api/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required." });
  }
  const alumni = one(`SELECT * FROM alumni WHERE email = :email`, { email: String(email).toLowerCase().trim() });
  if (!alumni || !bcrypt.compareSync(password, alumni.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const token = generateToken(alumni);
  res.json({
    token,
    alumni: { id: alumni.id, fullName: alumni.fullName, email: alumni.email, profilePhoto: alumni.profilePhoto || null },
  });
});

// Get current profile
app.get("/api/me", authMiddleware, (req, res) => {
  const alumni = one(`SELECT * FROM alumni WHERE id = :id`, { id: req.user.id });
  if (!alumni) return res.status(404).json({ error: "Alumni not found." });
  delete alumni.passwordHash;
  res.json(alumni);
});

// Update profile (once per year)
app.put("/api/me", authMiddleware, upload.single("profilePhoto"), (req, res) => {
  const alumni = one(`SELECT * FROM alumni WHERE id = :id`, { id: req.user.id });
  if (!alumni) return res.status(404).json({ error: "Alumni not found." });

  const now = new Date();
  if (alumni.lastProfileUpdate) {
    const diffDays = (now - new Date(alumni.lastProfileUpdate)) / (1000 * 60 * 60 * 24);
    if (!Number.isNaN(diffDays) && diffDays < 365) {
      const nextAllowed = new Date(new Date(alumni.lastProfileUpdate).getTime() + 365 * 24 * 60 * 60 * 1000);
      return res.status(400).json({
        error: "Profile can only be updated once every 12 months.",
        lastProfileUpdate: alumni.lastProfileUpdate,
        nextAllowedUpdate: nextAllowed.toISOString(),
      });
    }
  }

  const body = req.body || {};
  const updated = {
    fullName: body.fullName || alumni.fullName,
    phone: typeof body.phone !== "undefined" ? (body.phone || null) : alumni.phone,
    gradYear: typeof body.gradYear !== "undefined" ? (body.gradYear ? parseInt(body.gradYear, 10) || null : null) : alumni.gradYear,
    campus: typeof body.campus !== "undefined" ? (body.campus || null) : alumni.campus,
    campusCode: typeof body.campus !== "undefined" ? (({"Main Campus":"main","Mbalala Campus":"mbalala","Green Campus":"green","A Level Campus":"alevel"}[body.campus]) || null) : alumni.campusCode,
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

  run(
    `UPDATE alumni SET
      fullName = :fullName, phone = :phone, gradYear = :gradYear, campus = :campus, campusCode = :campusCode, period = :period,
      house = :house, occupation = :occupation, city = :city, country = :country, bio = :bio,
      profilePhoto = :profilePhoto, lastProfileUpdate = :lastProfileUpdate, updatedAt = :updatedAt
     WHERE id = :id`,
    { ...updated, id: req.user.id }
  );

  const saved = one(`SELECT * FROM alumni WHERE id = :id`, { id: req.user.id });
  delete saved.passwordHash;
  res.json(saved);
});

// Update profile photo only (no yearly restriction)
app.post("/api/me/photo", authMiddleware, upload.single("profilePhoto"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "profilePhoto file is required." });
  run(
    `UPDATE alumni SET profilePhoto = :photo, updatedAt = :updatedAt WHERE id = :id`,
    { photo: "/uploads/" + req.file.filename, updatedAt: nowIso(), id: req.user.id }
  );
  res.json({ profilePhoto: "/uploads/" + req.file.filename });
});

// Delete own account
app.delete("/api/me", authMiddleware, (req, res) => {
  run(`DELETE FROM alumni WHERE id = :id`, { id: req.user.id });
  run(`DELETE FROM sacco_memberships WHERE alumniId = :id`, { id: req.user.id });
  res.json({ ok: true });
});

// =========================
// SACCO
// =========================
app.post("/api/sacco/register", authMiddleware, (req, res) => {
  // SACCO automation rule:
  // Public applicants cannot self-assign Founder/Executive categories or arbitrary contribution amounts.
  // New members are Regular by default; elevated categories must be assigned by an authorized admin later.
  const { contributionPlan, startDate, notes } = req.body || {};
  const existing = one(`SELECT * FROM sacco_memberships WHERE alumniId = :alumniId`, { alumniId: req.user.id });

  const PLAN_META = {
    monthly: {
      amount: 50000,
      label: "Monthly savings plan",
      systemPurpose: "Member selected monthly savings plan — UGX 50,000 per month.",
    },
    quarterly: {
      amount: 200000,
      label: "Quarterly savings plan",
      systemPurpose: "Member selected quarterly savings plan — UGX 200,000 per quarter.",
    },
    decide_later: {
      amount: 0,
      label: "Decide later",
      systemPurpose: "Member will choose a savings contribution plan after activation.",
    },
  };

  const selectedPlan = PLAN_META[contributionPlan] ? contributionPlan : "monthly";
  const plan = PLAN_META[selectedPlan];
  const contribution = plan.amount;
  const effectiveStartDate = startDate || new Date().toISOString().slice(0, 10);

  // Preserve any elevated category already assigned by admin. Otherwise force Regular.
  const currentType = existing && existing.membershipType ? String(existing.membershipType).toLowerCase() : "regular";
  const membershipType = ["founder", "executive"].includes(currentType) ? currentType : "regular";

  const cleanNotes = String(notes || "").trim();
  const automatedNotes = [
    plan.systemPurpose,
    cleanNotes ? `Member note: ${cleanNotes}` : null,
  ].filter(Boolean).join("\n");

  const membershipFeePaid = hasMembershipFeePaid(req.user.id);
  const enforcedStatus = membershipFeePaid ? ((existing && existing.status) || "active") : "pending_membership_fee";
  const t = nowIso();

  if (existing) {
    run(
      `UPDATE sacco_memberships SET
        membershipType = :membershipType,
        monthlyContribution = :monthlyContribution,
        startDate = :startDate,
        status = :status,
        notes = :notes,
        updatedAt = :updatedAt
       WHERE alumniId = :alumniId`,
      {
        membershipType,
        monthlyContribution: contribution,
        startDate: effectiveStartDate,
        status: enforcedStatus,
        notes: automatedNotes || null,
        updatedAt: t,
        alumniId: req.user.id,
      }
    );
    return res.json({
      id: existing.id,
      alumniId: req.user.id,
      membershipType,
      contributionPlan: selectedPlan,
      monthlyContribution: contribution,
      membershipFeePaid,
      status: enforcedStatus,
      nextRequiredStep: membershipFeePaid ? null : "pay_membership_fee",
      message: membershipFeePaid
        ? "SACCO preferences saved. Your membership remains active."
        : "SACCO application saved. Pay the required UGX 50,000 membership registration fee to activate membership.",
    });
  }

  const info = run(
    `INSERT INTO sacco_memberships
      (alumniId, membershipType, monthlyContribution, startDate, status, notes, createdAt, updatedAt)
     VALUES
      (:alumniId, :membershipType, :monthlyContribution, :startDate, :status, :notes, :createdAt, :updatedAt)`,
    {
      alumniId: req.user.id,
      membershipType,
      monthlyContribution: contribution,
      startDate: effectiveStartDate,
      status: enforcedStatus,
      notes: automatedNotes || null,
      createdAt: t,
      updatedAt: t,
    }
  );

  res.json({
    id: info.lastInsertRowid,
    alumniId: req.user.id,
    membershipType,
    contributionPlan: selectedPlan,
    monthlyContribution: contribution,
    membershipFeePaid,
    status: enforcedStatus,
    nextRequiredStep: membershipFeePaid ? null : "pay_membership_fee",
    message: "SACCO application saved. Next step: pay the required UGX 50,000 membership registration fee.",
  });
});

app.get("/api/sacco/me", authMiddleware, (req, res) => {
  res.json(getSaccoStatusForUser(req.user.id));
});

app.get("/api/sacco/status", authMiddleware, (req, res) => {
  res.json(getSaccoStatusForUser(req.user.id));
});

// =========================
// Payments
// =========================
app.post("/api/payments/mobilemoney", authMiddleware, (req, res) => {
  const { paymentType, amount, phone, network, description, paymentChannel, transactionRef, proofFileName } = req.body || {};
  if (!paymentType || !amount || !phone || !network) {
    return res.status(400).json({ error: "paymentType, amount, phone and network are required." });
  }

  const numericAmount = parseInt(amount, 10);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number." });
  }

  const PAYMENT_TYPES = {
    sacco_membership_fee:      { exactAmount: 50000,  minAmount: 0,      label: "SACCO membership registration" },
    sacco_yearly_subscription: { exactAmount: 100000, minAmount: 0,      label: "SACCO yearly subscription" },
    sacco_savings_monthly:     { exactAmount: 50000,  minAmount: 0,      label: "SACCO monthly savings deposit" },
    sacco_savings_quarterly:   { exactAmount: 200000, minAmount: 0,      label: "SACCO quarterly savings deposit" },
    sacco_extra_savings:       { exactAmount: null,   minAmount: 1000,   label: "SACCO extra savings/top-up" },
    donation:                  { exactAmount: null,   minAmount: 1000,   label: "Donation" },
    crypto_contribution:       { exactAmount: null,   minAmount: 1000,   label: "Crypto contribution / stablecoin equivalent" },
  };

  const membershipFeePaid = hasMembershipFeePaid(req.user.id);
  const membership = one(`SELECT * FROM sacco_memberships WHERE alumniId = :alumniId`, { alumniId: req.user.id }) || null;

  if (paymentType.startsWith("sacco_") && !membership) {
    return res.status(400).json({
      error: "Please complete your SACCO registration before making SACCO payments.",
      requiredFirstStep: "register_membership",
    });
  }

  if (!membershipFeePaid && paymentType !== "sacco_membership_fee") {
    return res.status(400).json({
      error: "Your first SACCO payment must be the membership registration fee of 50,000 UGX.",
      requiredFirstPayment: "sacco_membership_fee",
      requiredAmount: 50000,
    });
  }

  if (membershipFeePaid && paymentType.startsWith("sacco_") && paymentType !== "sacco_yearly_subscription") {
    const yearlyPolicy = getSaccoYearlySubscriptionPolicy(req.user.id);
    if (yearlyPolicy.yearlySubscriptionBlocking) {
      return res.status(400).json({
        error: "Your 6-month SACCO grace period has ended. Please pay the yearly subscription fee of 100,000 UGX before making other SACCO payments.",
        requiredFirstPayment: "sacco_yearly_subscription",
        requiredAmount: 100000,
        yearlySubscriptionDueAt: yearlyPolicy.yearlySubscriptionDueAt,
      });
    }
  }

  const pt = PAYMENT_TYPES[paymentType];
  if (!pt) return res.status(400).json({ error: "Unsupported paymentType." });

  if (pt.exactAmount !== null && numericAmount !== pt.exactAmount) {
    return res.status(400).json({ error: `Amount for ${paymentType} must be exactly ${pt.exactAmount} UGX.` });
  }
  if (pt.minAmount > 0 && numericAmount < pt.minAmount) {
    return res.status(400).json({ error: `Amount for ${paymentType} must be at least ${pt.minAmount} UGX.` });
  }

  const info = run(
    `INSERT INTO mobilemoney_payments
      (alumniId, paymentType, label, amount, currency, phone, network, description, paymentChannel, transactionRef, proofFileName, status, rawPayload, createdAt)
     VALUES
      (:alumniId, :paymentType, :label, :amount, :currency, :phone, :network, :description, :paymentChannel, :transactionRef, :proofFileName, :status, :rawPayload, :createdAt)`,
    {
      alumniId: req.user.id, paymentType, label: pt.label, amount: numericAmount,
      currency: "UGX", phone, network, description: description || null,
      paymentChannel: paymentChannel || (network === "Crypto" ? "crypto_manual_verification" : "mobile_money_gateway_pending"),
      transactionRef: transactionRef || null, proofFileName: proofFileName || null,
      status: network === "Crypto" ? "pending_verification" : "pending_gateway_confirmation",
      rawPayload: JSON.stringify(req.body || {}, null, 2), createdAt: nowIso(),
    }
  );

  if (paymentType === "sacco_membership_fee" && membership) {
    run(
      `UPDATE sacco_memberships SET status = :status, updatedAt = :updatedAt WHERE alumniId = :alumniId`,
      { status: "active", updatedAt: nowIso(), alumniId: req.user.id }
    );
  }

  res.json({
    id: info.lastInsertRowid,
    status: network === "Crypto" ? "pending_verification" : "pending_gateway_confirmation",
    label: pt.label,
    amount: numericAmount,
    currency: "UGX",
    message: network === "Crypto" ? "Crypto proof submitted for admin verification." : "Payment request submitted. Final confirmation will be recorded after the mobile money gateway confirms success.",
  });
});

// Payment history for logged-in alumni
app.get("/api/payments/my", authMiddleware, (req, res) => {
  const rows = all(
    `SELECT id, paymentType, label, amount, currency, phone, network, description, status, paymentChannel, transactionRef, proofFileName, createdAt
     FROM mobilemoney_payments WHERE alumniId = :alumniId ORDER BY createdAt DESC`,
    { alumniId: req.user.id }
  );
  res.json({ payments: rows });
});

// =========================
// Events — .ics downloads
// =========================
const EVENTS = {
  "2025-league-launch": {
    uid: "2025-league-launch@shosa",
    title: "SHOSA League 2025 – Launch",
    description: "Launch of the SHOSA League 2025 at Equinox.",
    location: "Equinox",
    start: "20251116T140000Z",
    end: "20251116T170000Z",
  },
  "2016-alumni-dinner": {
    uid: "2016-alumni-dinner@shosa",
    title: "SHOSA Alumni Dinner",
    description: "Alumni dinner and reunion.",
    location: "Seeta High (or official venue)",
    start: "20161210T160000Z",
    end: "20161210T200000Z",
  },
  "career-guidance": {
    uid: "career-guidance@shosa",
    title: "SHOSA Career Guidance Session",
    description: "Career guidance session for S.4 and S.6 candidates.",
    location: "Seeta High",
    start: "20250901T090000Z",
    end: "20250901T120000Z",
  },
  "medical-camps": {
    uid: "medical-camps@shosa",
    title: "SHOSA Medical Camp",
    description: "Medical camp organised by SHOSA health professionals.",
    location: "Seeta High",
    start: "20250815T070000Z",
    end: "20250815T150000Z",
  },
};

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
  const evt = EVENTS[req.params.slug];
  if (!evt) return res.status(404).send("Unknown event.");
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${req.params.slug}.ics"`);
  res.send(buildIcs(evt));
});

// =========================
// Gallery — filesystem
// =========================
function readEventFolder(subfolder, label, year) {
  const items = [];
  const folder = path.join(EVENTS_IMAGES_ROOT, subfolder);
  if (!fs.existsSync(folder)) return items;

  fs.readdirSync(folder).forEach((fname) => {
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(path.extname(fname).toLowerCase())) return;
    try {
      const stats = fs.statSync(path.join(folder, fname));
      items.push({
        url: `/assets/images/events/${subfolder}/${fname}`,
        label,
        year,
        createdAt: stats.mtime.toISOString(),
      });
    } catch { /* skip unreadable files */ }
  });
  return items;
}

app.get("/api/gallery/events", (req, res) => {
  try {
    res.json({
      league:      readEventFolder("2025-shosa-league-launch", "SHOSA League", 2025),
      dinners2012: readEventFolder("2012-first-dinner", "First SHOSA Dinner", 2012),
      dinners2016: readEventFolder("2016-alumni-dinner", "Alumni Dinner", 2016),
      career:      readEventFolder("career-guidance", "Career guidance", null),
      medical:     readEventFolder("medical-camps", "Medical camps", null),
    });
  } catch (err) {
    console.error("Error in /api/gallery/events:", err);
    res.status(500).json({ error: "Failed to load gallery events." });
  }
});

app.get("/api/gallery/images", (req, res) => {
  try {
    const all_images = [
      ...readEventFolder("2025-shosa-league-launch", "SHOSA League", 2025),
      ...readEventFolder("2012-first-dinner", "First SHOSA Dinner", 2012),
      ...readEventFolder("2016-alumni-dinner", "Alumni Dinner", 2016),
      ...readEventFolder("career-guidance", "Career guidance", null),
      ...readEventFolder("medical-camps", "Medical camps", null),
    ];
    const top3 = all_images
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
    res.json({ images: top3 });
  } catch (err) {
    console.error("Error in /api/gallery/images:", err);
    res.status(500).json({ error: "Failed to load gallery images." });
  }
});

function getFilesystemGalleryImages() {
  return [
    ...readEventFolder("2025-shosa-league-launch", "SHOSA League", 2025),
    ...readEventFolder("2012-first-dinner", "First SHOSA Dinner", 2012),
    ...readEventFolder("2016-alumni-dinner", "Alumni Dinner", 2016),
    ...readEventFolder("career-guidance", "Career guidance", null),
    ...readEventFolder("medical-camps", "Medical camps", null),
  ];
}

function getUploadedGalleryImages(limit = 100) {
  return all(
    `SELECT id, category, label, description, year, url, createdAt
     FROM gallery_images
     ORDER BY datetime(createdAt) DESC, id DESC
     LIMIT :limit`,
    { limit }
  ).map((img) => ({
    ...img,
    _id: img.id,
    title: img.label || null,
    imageUrl: img.url,
    src: img.url,
  }));
}

function getPublicGalleryImages(limit = 100) {
  const uploaded = getUploadedGalleryImages(limit);
  const filesystem = getFilesystemGalleryImages().map((img, index) => ({
    ...img,
    id: `event-${index + 1}`,
    _id: `event-${index + 1}`,
    title: img.label || null,
    imageUrl: img.url,
    src: img.url,
    source: "events_folder",
  }));

  return uploaded
    .concat(filesystem)
    .filter((img) => img && img.url)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, limit);
}

function sendPublicGallery(req, res) {
  try {
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, rawLimit)) : 100;
    res.json({ images: getPublicGalleryImages(limit) });
  } catch (err) {
    console.error("Error in public gallery endpoint:", err);
    res.status(500).json({ error: "Failed to load public gallery images." });
  }
}

// Public compatibility endpoints used by the frontend dynamic hero/gallery code.
// These intentionally do not require admin auth; they expose only gallery image metadata/URLs.
app.get("/api/gallery/public", sendPublicGallery);
app.get("/api/gallery/approved", sendPublicGallery);
app.get("/api/gallery/all-public", sendPublicGallery);

// All SACCO memberships (admin)
app.get("/api/admin/sacco", adminAuthMiddleware, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
  const offset = (page - 1) * limit;

  const rawRows = all(
    `SELECT
        s.*,
        a.fullName AS alumniName,
        a.email AS alumniEmail,
        a.phone AS alumniPhone,
        COALESCE((
          SELECT SUM(p.amount)
          FROM mobilemoney_payments p
          WHERE p.alumniId = s.alumniId
        ), 0) AS totalPaid
     FROM sacco_memberships s
     LEFT JOIN alumni a ON a.id = s.alumniId
     ORDER BY s.createdAt DESC
     LIMIT :limit OFFSET :offset`,
    { limit, offset }
  );

  const memberships = rawRows;
  const total = one(`SELECT COUNT(*) as n FROM sacco_memberships`)?.n || 0;
  const grandTotalPaid =
    one(`SELECT COALESCE(SUM(amount), 0) as total FROM mobilemoney_payments`)?.total || 0;

  const membershipFeePaidCount =
    one(
      `SELECT COUNT(DISTINCT alumniId) as total
       FROM mobilemoney_payments
       WHERE paymentType = 'sacco_membership_fee'`
    )?.total || 0;

  res.json({
    memberships,
    total,
    page,
    limit,
    grandTotalPaid,
    membershipFeePaidCount,
  });
});

// Gallery — all uploaded images (admin)
// Returns DB-stored uploads. Filesystem event images are public via /api/gallery/events.
app.get("/api/gallery/all", adminAuthMiddleware, (req, res) => {
  const images = all(`SELECT * FROM gallery_images ORDER BY createdAt DESC`);
  // Normalise shape: frontend expects img._id, img.title, img.category, img.createdAt
  const normalised = images.map((img) => ({
    ...img,
    _id: img.id,
    title: img.label || null,
    description: img.description || null,
  }));
  res.json({ images: normalised });
});

// Gallery upload (admin) — matches /api/gallery/upload used by admin-gallery.html
app.post("/api/gallery/upload", adminAuthMiddleware, galleryUpload, (req, res) => {
  const files = [];
  if (req.files?.photo?.length) files.push(...req.files.photo);
  if (req.files?.photos?.length) files.push(...req.files.photos);
  if (!files.length) return res.status(400).json({ error: "image file is required." });

  const { category, title, description } = req.body || {};
  const sharedTitle = title ? String(title).trim() : null;
  const createdAt = nowIso();
  const saved = files.map((file, index) => {
    const label = sharedTitle && files.length > 1 ? `${sharedTitle} ${index + 1}` : sharedTitle;
    const url = "/uploads/" + file.filename;
    const info = run(
      `INSERT INTO gallery_images (category, label, description, year, url, createdAt)
       VALUES (:category, :label, :description, :year, :url, :createdAt)`,
      {
        category: category || null,
        label: label || null,
        description: description || null,
        year: null,
        url,
        createdAt,
      }
    );
    return { id: info.lastInsertRowid, _id: info.lastInsertRowid, url };
  });
  writeAuditLog(req, {
    action: "gallery_upload",
    resourceType: "gallery_image",
    resourceId: saved.map((item) => item.id).join(","),
    status: "success",
    metadata: { filesUploaded: saved.length, category: category || null, title: sharedTitle, description: description || null, endpoint: "/api/gallery/upload" },
  });
  res.json({ images: saved });
});

// Gallery delete (admin) — matches /api/gallery/:id used by admin-gallery.html
app.delete("/api/gallery/:id", adminAuthMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const img = one(`SELECT * FROM gallery_images WHERE id = :id`, { id });
  if (!img) {
    writeAuditLog(req, {
      action: "gallery_delete",
      resourceType: "gallery_image",
      resourceId: req.params.id,
      status: "failure",
      reason: "not_found",
      metadata: { endpoint: "/api/gallery/:id" },
    });
    return res.status(404).json({ error: "Image not found." });
  }
  if (img.url && img.url.startsWith("/uploads/")) {
    try { fs.unlinkSync(path.join(UPLOADS_DIR, path.basename(img.url))); } catch { /* already gone */ }
  }
  run(`DELETE FROM gallery_images WHERE id = :id`, { id });
  writeAuditLog(req, {
    action: "gallery_delete",
    resourceType: "gallery_image",
    resourceId: id,
    status: "success",
    metadata: { endpoint: "/api/gallery/:id", url: img.url || null, label: img.label || null },
  });
  res.json({ ok: true });
});

// =========================
// Error handling
// =========================
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
  }
  if (err.message === "Only image uploads are allowed") {
    return res.status(400).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// =========================
// Start
// =========================
app.listen(PORT, () => {
  console.log(`✅ SHOSA backend running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`);
  console.log(`   DB:      ${DB_FILE}`);
  console.log(`   Uploads: ${UPLOADS_DIR}`);
  console.log(`   Events:  ${EVENTS_IMAGES_ROOT}`);
  console.log(`   CORS:    ${corsOrigins.join(", ")}`);
});
