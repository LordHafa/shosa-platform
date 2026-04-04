// verifySchema.js
const { all } = require("./db");

async function verifySchema() {
  const required = [
    "alumni",
    "admins",
    "sacco_memberships",
    "mobilemoney_payments",
    "events",
    "gallery_images",
  ];

  const tables = await all(
    "SELECT name FROM sqlite_master WHERE type='table';"
  );
  const existing = new Set(tables.map((t) => t.name));

  const missing = required.filter((t) => !existing.has(t));
  if (missing.length) {
    throw new Error(
      `Missing SQLite tables: ${missing.join(", ")}. Ensure shosa.db has these tables.`
    );
  }
}

module.exports = { verifySchema };
