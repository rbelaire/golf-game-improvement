const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DB_DIR = process.env.DB_DIR || (process.env.VERCEL ? "/tmp/golf-game-improvement" : path.join(__dirname, "data"));
const DB_PATH = path.join(DB_DIR, "db.json");
const DATABASE_URL = process.env.DATABASE_URL || "";
const SUPER_USER_NAME = String(process.env.SUPER_USER_NAME || "").trim();
const SUPER_USER_EMAIL = String(process.env.SUPER_USER_EMAIL || "").trim().toLowerCase();
const SUPER_USER_PASSWORD = String(process.env.SUPER_USER_PASSWORD || "");

let pgClientPromise = null;

function getEmptyDb() {
  return { users: [], sessions: [] };
}

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(getEmptyDb(), null, 2));
  }
}

async function getPgClient() {
  if (!DATABASE_URL) {
    return null;
  }

  if (!pgClientPromise) {
    const { Client } = require("pg");
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
    });

    pgClientPromise = client.connect().then(async () => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_state (
          id INTEGER PRIMARY KEY,
          data JSONB NOT NULL
        )
      `);
      return client;
    });
  }

  return pgClientPromise;
}

async function readDb() {
  const pgClient = await getPgClient();
  if (pgClient) {
    const result = await pgClient.query("SELECT data FROM app_state WHERE id = $1", [1]);
    if (result.rows.length > 0) {
      return result.rows[0].data;
    }

    const freshDb = getEmptyDb();
    await pgClient.query("INSERT INTO app_state (id, data) VALUES ($1, $2::jsonb)", [1, JSON.stringify(freshDb)]);
    return freshDb;
  }

  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

async function writeDb(db) {
  const pgClient = await getPgClient();
  if (pgClient) {
    await pgClient.query(
      `
      INSERT INTO app_state (id, data)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
      `,
      [1, JSON.stringify(db)]
    );
    return;
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (_err) {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function issueToken(db, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions.push({ token, userId, createdAt: new Date().toISOString() });
  return token;
}

function parseAuthUser(req, db) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.slice(7);
  const session = db.sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  const user = db.users.find((item) => item.id === session.userId);
  if (!user) {
    return null;
  }

  return { user, token };
}

function userRole(user) {
  return user?.role === "super" ? "super" : "user";
}

function isSuperUser(user) {
  return userRole(user) === "super";
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan || "free",
    role: userRole(user)
  };
}

function maybeBootstrapSuperUser(db) {
  if (!SUPER_USER_EMAIL || !SUPER_USER_PASSWORD) {
    return false;
  }

  if (SUPER_USER_PASSWORD.length < 8) {
    return false;
  }

  let changed = false;
  let user = db.users.find((item) => item.email === SUPER_USER_EMAIL);

  if (!user) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(SUPER_USER_PASSWORD, salt);
    user = {
      id: crypto.randomUUID(),
      name: SUPER_USER_NAME || SUPER_USER_EMAIL.split("@")[0],
      email: SUPER_USER_EMAIL,
      plan: "pro",
      role: "super",
      salt,
      passwordHash,
      profile: null,
      routines: []
    };
    db.users.push(user);
    changed = true;
  } else {
    if (SUPER_USER_NAME && user.name !== SUPER_USER_NAME) {
      user.name = SUPER_USER_NAME;
      changed = true;
    }
    if (user.role !== "super") {
      user.role = "super";
      changed = true;
    }
    if ((user.plan || "free") !== "pro") {
      user.plan = "pro";
      changed = true;
    }
    const incomingHash = hashPassword(SUPER_USER_PASSWORD, user.salt);
    if (incomingHash !== user.passwordHash) {
      user.passwordHash = incomingHash;
      changed = true;
    }
  }

  return changed;
}

function isSafeStaticPath(filePath) {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(path.resolve(__dirname));
}

function contentType(fileName) {
  const ext = path.extname(fileName);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function validateProfileShape(profile) {
  if (!profile || typeof profile !== "object") return false;
  const name = asString(profile.name);
  const handicap = asString(profile.handicap);
  const weakness = asString(profile.weakness);
  const daysPerWeek = asNumber(profile.daysPerWeek);
  const hoursPerSession = asNumber(profile.hoursPerSession);
  return Boolean(name && handicap && weakness && daysPerWeek > 0 && hoursPerSession > 0);
}

function normalizeProfile(profile) {
  return {
    name: asString(profile.name),
    handicap: asString(profile.handicap),
    weakness: asString(profile.weakness),
    daysPerWeek: Math.max(1, Math.min(7, Math.round(asNumber(profile.daysPerWeek, 3)))),
    hoursPerSession: Math.max(0.5, Math.min(4, Math.round(asNumber(profile.hoursPerSession, 1.5) * 2) / 2)),
    notes: asString(profile.notes)
  };
}

const DRILL_LIBRARY = [
  { id: "drv-fairway-gates", name: "Fairway Gates Ladder", weaknesses: ["Driving accuracy"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-start-line-spray", name: "Start-Line Spray Audit", weaknesses: ["Driving accuracy"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "drv-tee-pressure", name: "One-Ball Tee Pressure", weaknesses: ["Driving accuracy"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-window-control", name: "Launch Window Control", weaknesses: ["Driving accuracy"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "drv-fairway-9shot", name: "9-Hole Fairway Keeper", weaknesses: ["Driving accuracy"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-wedge-ladder", name: "Wedge Distance Ladder", weaknesses: ["Approach consistency"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-face-strike-grid", name: "Face Strike Grid", weaknesses: ["Approach consistency"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "app-shot-shape-alternating", name: "Alternating Shape Reps", weaknesses: ["Approach consistency"], type: "technical", levels: ["advanced", "intermediate"] },
  { id: "app-proximity-challenge", name: "Proximity Circle Challenge", weaknesses: ["Approach consistency"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-approach-9hole", name: "Approach Simulation 9", weaknesses: ["Approach consistency"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-landing-zones", name: "Landing Zone Towel Matrix", weaknesses: ["Short game touch"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-updown-circuit", name: "Up-and-Down Circuit", weaknesses: ["Short game touch"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-bunker-variability", name: "Bunker Variability Reps", weaknesses: ["Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "sg-random-lie-scramble", name: "Random Lie Scramble", weaknesses: ["Short game touch"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "sg-wedge-clock", name: "Wedge Clock System", weaknesses: ["Short game touch"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "putt-gate-startline", name: "Start Line Gate", weaknesses: ["Putting confidence"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-ladder-369", name: "3-6-9 Pressure Ladder", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-read-compare", name: "Read-and-React Compare", weaknesses: ["Putting confidence"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "putt-make-10-row", name: "Make 10 in a Row", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate"] },
  { id: "putt-par18", name: "Par-18 Putting Game", weaknesses: ["Putting confidence"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-club-selection-tree", name: "Club Selection Decision Tree", weaknesses: ["Course management"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-risk-reward-log", name: "Risk/Reward Decision Log", weaknesses: ["Course management"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cm-miss-map", name: "Miss Map Strategy", weaknesses: ["Course management"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-3ball-choices", name: "3-Ball Choice Test", weaknesses: ["Course management"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "cm-post-round-audit", name: "Post-Round Audit Loop", weaknesses: ["Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-mobility-sequence", name: "Mobility and Tempo Sequence", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-contact-baseline", name: "Contact Baseline Check", weaknesses: ["Driving accuracy", "Approach consistency"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-pre-shot-routine", name: "Pre-Shot Routine Rehearsal", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-score-target", name: "Score Target Challenge", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-recovery-shots", name: "Recovery Shot Scenarios", weaknesses: ["Course management", "Approach consistency"], type: "transfer", levels: ["intermediate", "advanced"] }
];

function randomIndex(max) {
  return max <= 1 ? 0 : crypto.randomInt(0, max);
}

function handicapBand(handicap) {
  if (handicap.includes("Beginner")) return "beginner";
  if (handicap.includes("Intermediate")) return "intermediate";
  return "advanced";
}

function intensityLabel(handicap) {
  if (handicap.includes("Beginner")) return "Fundamentals and confidence";
  if (handicap.includes("Intermediate")) return "Consistency and pressure adaptation";
  return "Scoring optimization and performance";
}

function weekTheme(weakness, week) {
  const themes = {
    "Driving accuracy": ["Dispersion Control", "Start-Line Commitment", "Pressure Tee Shots", "Course Transfer"],
    "Approach consistency": ["Contact and Flight", "Distance Precision", "Shot Decision Speed", "Scoring Transfer"],
    "Short game touch": ["Landing Control", "Trajectory Variety", "Scramble Pressure", "On-Course Conversion"],
    "Putting confidence": ["Start-Line Ownership", "Pace Reliability", "Short-Putt Pressure", "Scoring Transfer"],
    "Course management": ["Decision Framework", "Risk Discipline", "Miss Pattern Planning", "Round Simulation"]
  };
  const bucket = themes[weakness] || ["Foundation", "Consistency", "Pressure", "Transfer"];
  return bucket[(week - 1) % bucket.length];
}

function extractRecentDrillIds(savedRoutines) {
  const recent = new Set();
  const recentRoutines = (savedRoutines || []).slice(0, 6);
  for (const routine of recentRoutines) {
    for (const week of routine.weeks || []) {
      for (const session of week.sessions || []) {
        for (const drillId of session.drillIds || []) {
          if (drillId) recent.add(drillId);
        }
      }
    }
  }
  return recent;
}

function candidateScore(drill, weakness, band, usedInPlan, recentDrills, preferredType) {
  let score = 0;
  if (drill.weaknesses.includes(weakness)) score += 4;
  if (drill.levels.includes(band)) score += 3;
  if (drill.type === preferredType) score += 2.5;
  if (usedInPlan.has(drill.id)) score -= 4;
  if (recentDrills.has(drill.id)) score -= 2;
  score += (randomIndex(100) / 100) * 1.2;
  return score;
}

function pickDrill({ weakness, band, preferredType, usedInPlan, recentDrills, excludedIds }) {
  const candidates = DRILL_LIBRARY.filter(
    (drill) => !excludedIds.has(drill.id) && drill.levels.includes(band) && (drill.weaknesses.includes(weakness) || drill.weaknesses.length > 2)
  );
  if (!candidates.length) return null;

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const drill of candidates) {
    const score = candidateScore(drill, weakness, band, usedInPlan, recentDrills, preferredType);
    if (score > bestScore) {
      best = drill;
      bestScore = score;
    }
  }
  return best;
}

function buildSessionBullets({ profile, week, sessionNumber, chosenDrills }) {
  const totalMinutes = Math.round(profile.hoursPerSession * 60);
  const warmUp = Math.max(10, Math.round(totalMinutes * 0.18));
  const technical = Math.max(18, Math.round(totalMinutes * 0.36));
  const pressure = Math.max(14, Math.round(totalMinutes * 0.24));
  const transfer = Math.max(10, totalMinutes - warmUp - technical - pressure);
  const [drillA, drillB, drillC] = chosenDrills;
  const reflectionPrompts = [
    "write one pattern you corrected and one miss that still shows up",
    "note a decisive swing/putt thought you will keep tomorrow",
    "record score vs target and the adjustment for next session",
    "capture one strategic decision you executed well"
  ];
  return [
    `${warmUp} min warm-up: ${drillA.name}.`,
    `${technical} min technical block: ${drillB.name} with target-based reps and tracked outcomes.`,
    `${pressure} min pressure block: ${drillC.name} under consequence scoring.`,
    `${transfer} min transfer block: simulate real-hole decisions before each shot.`,
    `5 min reflection: ${reflectionPrompts[randomIndex(reflectionPrompts.length)]}.`
  ];
}

function buildRulesRoutine(profileInput, savedRoutines = []) {
  const profile = normalizeProfile(profileInput);
  const band = handicapBand(profile.handicap);
  const intensity = intensityLabel(profile.handicap);
  const recentDrills = extractRecentDrillIds(savedRoutines);
  const usedInPlan = new Set();
  const weeks = [];
  const weekCount = 4;

  for (let week = 1; week <= weekCount; week += 1) {
    const sessions = [];
    for (let day = 1; day <= profile.daysPerWeek; day += 1) {
      const excludedIds = new Set();
      const warmupDrill = pickDrill({
        weakness: profile.weakness,
        band,
        preferredType: "warmup",
        usedInPlan,
        recentDrills,
        excludedIds
      }) || DRILL_LIBRARY[0];
      excludedIds.add(warmupDrill.id);
      const technicalDrill = pickDrill({
        weakness: profile.weakness,
        band,
        preferredType: "technical",
        usedInPlan,
        recentDrills,
        excludedIds
      }) || warmupDrill;
      excludedIds.add(technicalDrill.id);
      const pressureDrill = pickDrill({
        weakness: profile.weakness,
        band,
        preferredType: "pressure",
        usedInPlan,
        recentDrills,
        excludedIds
      }) || technicalDrill;

      usedInPlan.add(warmupDrill.id);
      usedInPlan.add(technicalDrill.id);
      usedInPlan.add(pressureDrill.id);

      sessions.push({
        title: `Session ${day}`,
        bullets: buildSessionBullets({
          profile,
          week,
          sessionNumber: day,
          chosenDrills: [warmupDrill, technicalDrill, pressureDrill]
        }),
        drillIds: [warmupDrill.id, technicalDrill.id, pressureDrill.id]
      });
    }

    weeks.push({
      week,
      headline: `Week ${week}: ${weekTheme(profile.weakness, week)} (${intensity})`,
      sessions
    });
  }

  return {
    profileSnapshot: profile,
    title: `${profile.name}'s 4-Week ${profile.weakness} Plan`,
    meta: `${profile.handicap} • ${profile.daysPerWeek} days/week • ${profile.hoursPerSession} hr/session`,
    weeks
  };
}

async function handleApi(req, res, url) {
  const db = await readDb();
  if (maybeBootstrapSuperUser(db)) {
    await writeDb(db);
  }

  if (url.pathname === "/api/auth/register" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!name || !email || !password) {
        sendJson(res, 400, { error: "Name, email, and password are required." });
        return;
      }

      if (password.length < 8) {
        sendJson(res, 400, { error: "Password must be at least 8 characters." });
        return;
      }

      if (db.users.some((item) => item.email === email)) {
        sendJson(res, 409, { error: "Account already exists for that email." });
        return;
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(password, salt);
      const user = {
        id: crypto.randomUUID(),
        name,
        email,
        plan: "free",
        role: "user",
        salt,
        passwordHash,
        profile: null,
        routines: []
      };
      db.users.push(user);
      const token = issueToken(db, user.id);
      await writeDb(db);

      sendJson(res, 201, {
        token,
        user: publicUser(user)
      });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const user = db.users.find((item) => item.email === email);

      if (!user) {
        sendJson(res, 401, { error: "Invalid credentials." });
        return;
      }

      const incomingHash = hashPassword(password, user.salt);
      if (incomingHash !== user.passwordHash) {
        sendJson(res, 401, { error: "Invalid credentials." });
        return;
      }

      const token = issueToken(db, user.id);
      await writeDb(db);
      sendJson(res, 200, {
        token,
        user: publicUser(user)
      });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    sendJson(res, 200, {
      user: publicUser(auth.user)
    });
    return;
  }

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 200, { ok: true });
      return;
    }

    db.sessions = db.sessions.filter((item) => item.token !== auth.token);
    await writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/profile" && req.method === "GET") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    sendJson(res, 200, { profile: auth.user.profile });
    return;
  }

  if (url.pathname === "/api/profile" && req.method === "PUT") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = await readBody(req);
      const user = db.users.find((item) => item.id === auth.user.id);
      user.profile = body.profile || null;
      await writeDb(db);
      sendJson(res, 200, { profile: user.profile });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/routines" && req.method === "GET") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    sendJson(res, 200, { routines: auth.user.routines || [] });
    return;
  }

  if (url.pathname === "/api/routines/generate" && req.method === "POST") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = await readBody(req);
      if (!validateProfileShape(body.profile)) {
        sendJson(res, 400, { error: "A valid profile payload is required." });
        return;
      }

      const profile = normalizeProfile(body.profile);
      const routine = buildRulesRoutine(profile, auth.user.routines || []);
      sendJson(res, 200, { routine, source: "rules" });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/routines" && req.method === "POST") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = await readBody(req);
      const routine = body.routine;
      if (!routine || typeof routine !== "object") {
        sendJson(res, 400, { error: "Routine payload is required." });
        return;
      }

      const user = db.users.find((item) => item.id === auth.user.id);
      const currentPlan = user.plan || "free";
      const isFreePlan = currentPlan !== "pro" && !isSuperUser(user);
      const currentCount = (user.routines || []).length;
      if (isFreePlan && currentCount >= 5) {
        sendJson(res, 402, {
          error: "Free plan limit reached (5 routines). Upgrade to Pro for unlimited routines.",
          code: "UPGRADE_REQUIRED"
        });
        return;
      }

      const newRoutine = {
        ...routine,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };

      user.routines = [newRoutine, ...(user.routines || [])];
      await writeDb(db);
      sendJson(res, 201, { routine: newRoutine, plan: currentPlan });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  const routineMatch = url.pathname.match(/^\/api\/routines\/([a-zA-Z0-9-]+)$/);
  if (routineMatch && req.method === "DELETE") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const routineId = routineMatch[1];
    const user = db.users.find((item) => item.id === auth.user.id);
    user.routines = (user.routines || []).filter((routine) => routine.id !== routineId);
    await writeDb(db);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/billing/upgrade-pro" && req.method === "POST") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const user = db.users.find((item) => item.id === auth.user.id);
    user.plan = "pro";
    await writeDb(db);
    sendJson(res, 200, {
      user: publicUser(user)
    });
    return;
  }

  if (url.pathname === "/api/admin/users" && req.method === "GET") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    if (!isSuperUser(auth.user)) {
      sendJson(res, 403, { error: "Forbidden" });
      return;
    }

    sendJson(res, 200, {
      users: db.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan || "free",
        role: userRole(user),
        routineCount: (user.routines || []).length
      }))
    });
    return;
  }

  if (url.pathname === "/api/admin/users/promote" && req.method === "POST") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    if (!isSuperUser(auth.user)) {
      sendJson(res, 403, { error: "Forbidden" });
      return;
    }

    try {
      const body = await readBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) {
        sendJson(res, 400, { error: "Email is required." });
        return;
      }

      const targetUser = db.users.find((item) => item.email === email);
      if (!targetUser) {
        sendJson(res, 404, { error: "User not found." });
        return;
      }

      targetUser.role = "super";
      targetUser.plan = "pro";
      await writeDb(db);
      sendJson(res, 200, { user: publicUser(targetUser) });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  const adminUserMatch = url.pathname.match(/^\/api\/admin\/users\/([a-zA-Z0-9-]+)$/);
  if (adminUserMatch && req.method === "PUT") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    if (!isSuperUser(auth.user)) {
      sendJson(res, 403, { error: "Forbidden" });
      return;
    }

    try {
      const body = await readBody(req);
      const targetUser = db.users.find((item) => item.id === adminUserMatch[1]);
      if (!targetUser) {
        sendJson(res, 404, { error: "User not found." });
        return;
      }

      if (body.plan !== undefined) {
        const nextPlan = String(body.plan).trim().toLowerCase();
        if (!["free", "pro"].includes(nextPlan)) {
          sendJson(res, 400, { error: "plan must be 'free' or 'pro'." });
          return;
        }
        targetUser.plan = nextPlan;
      }

      if (body.role !== undefined) {
        const nextRole = String(body.role).trim().toLowerCase();
        if (!["user", "super"].includes(nextRole)) {
          sendJson(res, 400, { error: "role must be 'user' or 'super'." });
          return;
        }
        targetUser.role = nextRole;
      }

      await writeDb(db);
      sendJson(res, 200, { user: publicUser(targetUser) });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/admin/me" && req.method === "GET") {
    const auth = parseAuthUser(req, db);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    sendJson(res, 200, {
      isSuper: isSuperUser(auth.user),
      role: userRole(auth.user),
      user: publicUser(auth.user)
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

function handleStatic(req, res, url) {
  const routePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(__dirname, decodeURIComponent(routePath));

  if (!isSafeStaticPath(filePath) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, { "Content-Type": contentType(filePath) });
  fs.createReadStream(filePath).pipe(res);
}

async function requestHandler(req, res, options = {}) {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);

  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }

  if (options.apiOnly) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  handleStatic(req, res, url);
}

function createServer() {
  return http.createServer((req, res) => {
    requestHandler(req, res).catch((err) => {
      console.error(err);
      sendJson(res, 500, { error: "Internal server error" });
    });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    ensureDb();
    console.log(`thegolfbuild server running on http://localhost:${PORT}`);
  });
}

module.exports = {
  createServer,
  requestHandler
};
