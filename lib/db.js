const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATABASE_URL = process.env.DATABASE_URL || "";
const DB_DIR = process.env.DB_DIR || (process.env.VERCEL ? "/tmp/golf-game-improvement" : path.join(__dirname, "..", "data"));
const DB_PATH = path.join(DB_DIR, "db.json");
const SUPER_USER_NAME = String(process.env.SUPER_USER_NAME || "").trim();
const SUPER_USER_EMAIL = String(process.env.SUPER_USER_EMAIL || "").trim().toLowerCase();
const SUPER_USER_PASSWORD = String(process.env.SUPER_USER_PASSWORD || "");

let pool = null;

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

// ---------------------------------------------------------------------------
// Postgres helpers
// ---------------------------------------------------------------------------

function getPool() {
  if (!pool && DATABASE_URL) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
      max: 10
    });
  }
  return pool;
}

function userFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    plan: row.plan,
    role: row.role,
    salt: row.salt,
    passwordHash: row.password_hash,
    profile: row.profile || null
  };
}

function sessionFromRow(row) {
  if (!row) return null;
  return { token: row.token, userId: row.user_id, createdAt: row.created_at };
}

function routineFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || "",
    meta: row.meta || "",
    profileSnapshot: row.profile_snapshot || null,
    weeks: row.weeks || [],
    createdAt: row.created_at
  };
}

// ---------------------------------------------------------------------------
// JSON file helpers
// ---------------------------------------------------------------------------

function ensureFile() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], sessions: [] }, null, 2));
  }
}

function readFile() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeFile(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// init — create tables / migrate / bootstrap super user
// ---------------------------------------------------------------------------

async function init() {
  if (DATABASE_URL) {
    const pg = getPool();
    await pg.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        role TEXT NOT NULL DEFAULT 'user',
        salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        profile JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pg.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pg.query(`
      CREATE TABLE IF NOT EXISTS routines (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT '',
        meta TEXT DEFAULT '',
        profile_snapshot JSONB,
        weeks JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Migrate from app_state if it exists
    const tableCheck = await pg.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'app_state'
      ) AS exists
    `);
    if (tableCheck.rows[0].exists) {
      const stateResult = await pg.query("SELECT data FROM app_state WHERE id = 1");
      if (stateResult.rows.length > 0) {
        const old = stateResult.rows[0].data;
        for (const user of old.users || []) {
          const exists = await pg.query("SELECT 1 FROM users WHERE id = $1", [user.id]);
          if (exists.rows.length === 0) {
            await pg.query(
              `INSERT INTO users (id, name, email, plan, role, salt, password_hash, profile)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [user.id, user.name, user.email, user.plan || "free", user.role || "user", user.salt, user.passwordHash, user.profile ? JSON.stringify(user.profile) : null]
            );
            for (const routine of user.routines || []) {
              await pg.query(
                `INSERT INTO routines (id, user_id, title, meta, profile_snapshot, weeks, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [routine.id, user.id, routine.title || "", routine.meta || "", routine.profileSnapshot ? JSON.stringify(routine.profileSnapshot) : null, JSON.stringify(routine.weeks || []), routine.createdAt || new Date().toISOString()]
              );
            }
          }
        }
        for (const session of old.sessions || []) {
          const exists = await pg.query("SELECT 1 FROM sessions WHERE token = $1", [session.token]);
          if (exists.rows.length === 0) {
            const userExists = await pg.query("SELECT 1 FROM users WHERE id = $1", [session.userId]);
            if (userExists.rows.length > 0) {
              await pg.query(
                "INSERT INTO sessions (token, user_id, created_at) VALUES ($1, $2, $3)",
                [session.token, session.userId, session.createdAt || new Date().toISOString()]
              );
            }
          }
        }
      }
      await pg.query("DROP TABLE app_state");
    }
  } else {
    ensureFile();
  }

  await maybeBootstrapSuperUser();
}

// ---------------------------------------------------------------------------
// Super user bootstrap (runs once at init)
// ---------------------------------------------------------------------------

async function maybeBootstrapSuperUser() {
  if (!SUPER_USER_EMAIL || !SUPER_USER_PASSWORD || SUPER_USER_PASSWORD.length < 8) {
    return;
  }

  const existing = await findUserByEmail(SUPER_USER_EMAIL);
  if (!existing) {
    const salt = crypto.randomBytes(16).toString("hex");
    const pw = hashPassword(SUPER_USER_PASSWORD, salt);
    await createUser({
      name: SUPER_USER_NAME || SUPER_USER_EMAIL.split("@")[0],
      email: SUPER_USER_EMAIL,
      plan: "pro",
      role: "super",
      salt,
      passwordHash: pw,
      profile: null
    });
  } else {
    const updates = {};
    if (SUPER_USER_NAME && existing.name !== SUPER_USER_NAME) updates.name = SUPER_USER_NAME;
    if (existing.role !== "super") updates.role = "super";
    if ((existing.plan || "free") !== "pro") updates.plan = "pro";
    const incomingHash = hashPassword(SUPER_USER_PASSWORD, existing.salt);
    if (incomingHash !== existing.passwordHash) updates.passwordHash = incomingHash;
    if (Object.keys(updates).length > 0) {
      await updateUser(existing.id, updates);
    }
  }
}

// ---------------------------------------------------------------------------
// User operations
// ---------------------------------------------------------------------------

async function findUserByEmail(email) {
  if (DATABASE_URL) {
    const pg = getPool();
    const result = await pg.query("SELECT * FROM users WHERE email = $1", [email]);
    return userFromRow(result.rows[0]);
  }
  const data = readFile();
  const user = data.users.find((u) => u.email === email);
  return user || null;
}

async function findUserById(id) {
  if (DATABASE_URL) {
    const pg = getPool();
    const result = await pg.query("SELECT * FROM users WHERE id = $1", [id]);
    return userFromRow(result.rows[0]);
  }
  const data = readFile();
  const user = data.users.find((u) => u.id === id);
  return user || null;
}

async function createUser(userData) {
  const id = userData.id || crypto.randomUUID();
  if (DATABASE_URL) {
    const pg = getPool();
    const result = await pg.query(
      `INSERT INTO users (id, name, email, plan, role, salt, password_hash, profile)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, userData.name, userData.email, userData.plan || "free", userData.role || "user", userData.salt, userData.passwordHash, userData.profile ? JSON.stringify(userData.profile) : null]
    );
    return userFromRow(result.rows[0]);
  }
  const data = readFile();
  const user = {
    id,
    name: userData.name,
    email: userData.email,
    plan: userData.plan || "free",
    role: userData.role || "user",
    salt: userData.salt,
    passwordHash: userData.passwordHash,
    profile: userData.profile || null,
    routines: []
  };
  data.users.push(user);
  writeFile(data);
  return user;
}

async function updateUser(id, fields) {
  if (DATABASE_URL) {
    const pg = getPool();
    const sets = [];
    const vals = [];
    let idx = 1;
    const fieldMap = { name: "name", email: "email", plan: "plan", role: "role", passwordHash: "password_hash", profile: "profile" };
    for (const [jsKey, sqlCol] of Object.entries(fieldMap)) {
      if (fields[jsKey] !== undefined) {
        const val = jsKey === "profile" ? JSON.stringify(fields[jsKey]) : fields[jsKey];
        sets.push(`${sqlCol} = $${idx}`);
        vals.push(val);
        idx += 1;
      }
    }
    if (sets.length === 0) return;
    vals.push(id);
    await pg.query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${idx}`, vals);
    return;
  }
  const data = readFile();
  const user = data.users.find((u) => u.id === id);
  if (!user) return;
  for (const [key, value] of Object.entries(fields)) {
    user[key] = value;
  }
  writeFile(data);
}

// ---------------------------------------------------------------------------
// Session operations
// ---------------------------------------------------------------------------

async function findSessionByToken(token) {
  if (DATABASE_URL) {
    const pg = getPool();
    const result = await pg.query("SELECT * FROM sessions WHERE token = $1", [token]);
    return sessionFromRow(result.rows[0]);
  }
  const data = readFile();
  const session = data.sessions.find((s) => s.token === token);
  return session || null;
}

async function createSession(token, userId) {
  if (DATABASE_URL) {
    const pg = getPool();
    await pg.query(
      "INSERT INTO sessions (token, user_id, created_at) VALUES ($1, $2, NOW())",
      [token, userId]
    );
    return;
  }
  const data = readFile();
  data.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  writeFile(data);
}

async function deleteSessionsByToken(token) {
  if (DATABASE_URL) {
    const pg = getPool();
    await pg.query("DELETE FROM sessions WHERE token = $1", [token]);
    return;
  }
  const data = readFile();
  data.sessions = data.sessions.filter((s) => s.token !== token);
  writeFile(data);
}

async function deleteExpiredSessions(maxAgeMs) {
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
  if (DATABASE_URL) {
    const pg = getPool();
    await pg.query("DELETE FROM sessions WHERE created_at < $1", [cutoff]);
    return;
  }
  const data = readFile();
  const before = data.sessions.length;
  data.sessions = data.sessions.filter((s) => s.createdAt >= cutoff);
  if (data.sessions.length !== before) writeFile(data);
}

// ---------------------------------------------------------------------------
// Routine operations
// ---------------------------------------------------------------------------

async function getUserRoutines(userId) {
  if (DATABASE_URL) {
    const pg = getPool();
    const result = await pg.query(
      "SELECT * FROM routines WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows.map(routineFromRow);
  }
  const data = readFile();
  const user = data.users.find((u) => u.id === userId);
  return user ? (user.routines || []) : [];
}

async function getRoutineCount(userId) {
  if (DATABASE_URL) {
    const pg = getPool();
    const result = await pg.query(
      "SELECT COUNT(*)::int AS count FROM routines WHERE user_id = $1",
      [userId]
    );
    return result.rows[0].count;
  }
  const data = readFile();
  const user = data.users.find((u) => u.id === userId);
  return user ? (user.routines || []).length : 0;
}

async function createRoutine(userId, routineData) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  if (DATABASE_URL) {
    const pg = getPool();
    const result = await pg.query(
      `INSERT INTO routines (id, user_id, title, meta, profile_snapshot, weeks, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, userId, routineData.title || "", routineData.meta || "", routineData.profileSnapshot ? JSON.stringify(routineData.profileSnapshot) : null, JSON.stringify(routineData.weeks || []), now]
    );
    return routineFromRow(result.rows[0]);
  }
  const data = readFile();
  const user = data.users.find((u) => u.id === userId);
  if (!user) return null;
  const newRoutine = {
    id,
    title: routineData.title || "",
    meta: routineData.meta || "",
    profileSnapshot: routineData.profileSnapshot || null,
    weeks: routineData.weeks || [],
    createdAt: now
  };
  user.routines = [newRoutine, ...(user.routines || [])];
  writeFile(data);
  return newRoutine;
}

async function deleteRoutine(userId, routineId) {
  if (DATABASE_URL) {
    const pg = getPool();
    await pg.query("DELETE FROM routines WHERE id = $1 AND user_id = $2", [routineId, userId]);
    return;
  }
  const data = readFile();
  const user = data.users.find((u) => u.id === userId);
  if (!user) return;
  user.routines = (user.routines || []).filter((r) => r.id !== routineId);
  writeFile(data);
}

// ---------------------------------------------------------------------------
// Admin operations
// ---------------------------------------------------------------------------

async function getAllUsersAdmin() {
  if (DATABASE_URL) {
    const pg = getPool();
    const result = await pg.query(`
      SELECT u.id, u.name, u.email, u.plan, u.role,
             COUNT(r.id)::int AS routine_count
      FROM users u
      LEFT JOIN routines r ON r.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at
    `);
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      plan: row.plan,
      role: row.role,
      routineCount: row.routine_count
    }));
  }
  const data = readFile();
  return data.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan || "free",
    role: user.role || "user",
    routineCount: (user.routines || []).length
  }));
}

async function updateUserAdmin(id, fields) {
  await updateUser(id, fields);
  const user = await findUserById(id);
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    role: user.role
  };
}

module.exports = {
  init,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  findSessionByToken,
  createSession,
  deleteSessionsByToken,
  deleteExpiredSessions,
  getUserRoutines,
  getRoutineCount,
  createRoutine,
  deleteRoutine,
  getAllUsersAdmin,
  updateUserAdmin
};
