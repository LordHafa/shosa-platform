PRAGMA foreign_keys = ON;

-- ===============================
-- 1) ALUMNI (users)
-- ===============================
CREATE TABLE IF NOT EXISTS alumni (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName          TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    phone             TEXT,
    gradYear          INTEGER,
    campus            TEXT,
    house             TEXT,
    occupation        TEXT,
    city              TEXT,
    country           TEXT,
    bio               TEXT,
    profilePhoto      TEXT,      -- path like /uploads/...
    passwordHash      TEXT NOT NULL,
    lastProfileUpdate TEXT,      -- ISO date string; for once-per-year edits
    createdAt         TEXT NOT NULL,
    updatedAt         TEXT NOT NULL
);

-- Helpful index for login lookups
CREATE INDEX IF NOT EXISTS idx_alumni_email ON alumni(email);


-- ===============================
-- 2) SACCO MEMBERSHIPS
-- mirrors db.sacco_memberships
-- ===============================
CREATE TABLE IF NOT EXISTS sacco_memberships (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    alumniId            INTEGER NOT NULL,
    membershipType      TEXT NOT NULL,   -- e.g. "ordinary", "founder"
    monthlyContribution INTEGER NOT NULL,
    startDate           TEXT NOT NULL,   -- ISO date string "YYYY-MM-DD"
    status              TEXT NOT NULL,   -- "active", "pending", "suspended"
    notes               TEXT,
    createdAt           TEXT NOT NULL,
    FOREIGN KEY (alumniId) REFERENCES alumni(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sacco_alumni ON sacco_memberships(alumniId);


-- ===============================
-- 3) MOBILE MONEY PAYMENTS
-- mirrors db.mobilemoney_payments
-- ===============================
CREATE TABLE IF NOT EXISTS mobilemoney_payments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    alumniId    INTEGER NOT NULL,
    paymentType TEXT NOT NULL,          -- sacco_membership_fee, sacco_savings_monthly, donation, etc.
    label       TEXT NOT NULL,          -- human label
    amount      INTEGER NOT NULL,       -- UGX integer
    currency    TEXT NOT NULL,          -- "UGX"
    phone       TEXT NOT NULL,
    network     TEXT NOT NULL,          -- MTN / Airtel / Other
    description TEXT,
    rawPayload  TEXT,                   -- JSON string of original request
    createdAt   TEXT NOT NULL,
    FOREIGN KEY (alumniId) REFERENCES alumni(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_alumni ON mobilemoney_payments(alumniId);
CREATE INDEX IF NOT EXISTS idx_payments_type ON mobilemoney_payments(paymentType);


-- ===============================
-- 4) ADMINS
-- for /api/admin/login (future)
-- ===============================
CREATE TABLE IF NOT EXISTS admins (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role         TEXT NOT NULL DEFAULT 'admin',
    createdAt    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);


-- ===============================
-- 5) EVENTS
-- for slider + ICS downloads
-- ===============================
CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    eventKey  TEXT NOT NULL UNIQUE,   -- "2025-league-launch", "2016-alumni-dinner"
    title     TEXT NOT NULL,
    description TEXT,
    eventDate TEXT,                   -- ISO date string or datetime
    venue     TEXT,
    createdAt TEXT NOT NULL
);


-- ===============================
-- 6) GALLERY IMAGES
-- used by /api/gallery/events and /api/gallery/images
-- ===============================
CREATE TABLE IF NOT EXISTS gallery_images (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    eventKey   TEXT,                 -- optional: link to events.eventKey
    folderName TEXT NOT NULL,        -- "2025-shosa-league-launch", "2016-alumni-dinner"
    fileName   TEXT NOT NULL,        -- e.g. "img001.jpg"
    label      TEXT,                 -- caption text
    year       INTEGER,
    createdAt  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gallery_folder ON gallery_images(folderName);
CREATE INDEX IF NOT EXISTS idx_gallery_event_key ON gallery_images(eventKey);


-- ===============================
-- 7) CAMPUSES & GOVERNANCE
-- ===============================
CREATE TABLE IF NOT EXISTS campuses (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    code           TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL,
    committeeLabel TEXT,
    sortOrder      INTEGER NOT NULL DEFAULT 0,
    isActive       INTEGER NOT NULL DEFAULT 1,
    createdAt      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    module      TEXT NOT NULL,
    scopeType   TEXT NOT NULL,
    functionKey TEXT NOT NULL,
    description TEXT,
    createdAt   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_assignments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName   TEXT NOT NULL,
    email      TEXT,
    roleCode   TEXT NOT NULL,
    scopeType  TEXT NOT NULL,
    scopeValue TEXT NOT NULL,
    isActive   INTEGER NOT NULL DEFAULT 1,
    createdAt  TEXT NOT NULL,
    UNIQUE(roleCode, scopeType, scopeValue)
);
