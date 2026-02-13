const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DB_DIR = process.env.DB_DIR || (process.env.VERCEL ? "/tmp/golf-game-improvement" : path.join(__dirname, "data"));
const DB_PATH = path.join(DB_DIR, "db.json");
const DATABASE_URL = process.env.DATABASE_URL || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
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
      name: SUPER_USER_EMAIL.split("@")[0],
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

function focusMapByWeakness(weakness) {
  const mapping = {
    "Driving accuracy": ["fairway finder drill", "launch window control", "pressure tee shots"],
    "Approach consistency": ["distance ladder work", "shot-shape rehearsal", "target proximity challenge"],
    "Short game touch": ["landing zone precision", "up-and-down circuits", "bunker variability"],
    "Putting confidence": ["start-line gate drill", "3-6-9 pressure ladder", "green reading reps"],
    "Course management": ["club selection simulation", "risk/reward decision reps", "post-round strategy review"]
  };
  return mapping[weakness] || ["full swing calibration", "short game fundamentals", "mental reset routine"];
}

function intensityForHandicap(handicap) {
  if (handicap.includes("Beginner")) return "Fundamentals first";
  if (handicap.includes("Intermediate")) return "Skill consolidation";
  return "Performance sharpening";
}

function buildSessionBlock(dayIndex, profile, focusAreas) {
  const totalMinutes = Math.round(profile.hoursPerSession * 60);
  const warmUp = Math.max(10, Math.round(totalMinutes * 0.15));
  const core = Math.max(20, Math.round(totalMinutes * 0.6));
  const performance = Math.max(10, totalMinutes - warmUp - core);
  const focus = focusAreas[dayIndex % focusAreas.length];
  return [
    `${warmUp} min warm-up: mobility + tempo swings + putting pace check.`,
    `${core} min core skill focus: ${focus}.`,
    `${performance} min transfer segment: on-course simulation and score target challenge.`,
    "5 min reflection: journal one win, one weakness, one adjustment for next session."
  ];
}

function buildDeterministicRoutine(profileInput) {
  const profile = normalizeProfile(profileInput);
  const focusAreas = focusMapByWeakness(profile.weakness);
  const intensity = intensityForHandicap(profile.handicap);
  const weeks = [];

  for (let week = 1; week <= 4; week += 1) {
    const sessions = [];
    for (let day = 1; day <= profile.daysPerWeek; day += 1) {
      sessions.push({
        title: `Session ${day}`,
        bullets: buildSessionBlock(day + week, profile, focusAreas)
      });
    }

    weeks.push({
      week,
      headline: `Week ${week}: ${intensity}`,
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

function isValidRoutine(routine) {
  if (!routine || typeof routine !== "object") return false;
  if (!asString(routine.title) || !asString(routine.meta)) return false;
  if (!Array.isArray(routine.weeks) || routine.weeks.length === 0) return false;

  for (const week of routine.weeks) {
    if (!week || typeof week !== "object") return false;
    if (!Number.isInteger(week.week) || week.week < 1) return false;
    if (!asString(week.headline)) return false;
    if (!Array.isArray(week.sessions) || week.sessions.length === 0) return false;
    for (const session of week.sessions) {
      if (!session || typeof session !== "object") return false;
      if (!asString(session.title)) return false;
      if (!Array.isArray(session.bullets) || session.bullets.length === 0) return false;
      if (session.bullets.some((bullet) => !asString(bullet))) return false;
    }
  }

  return true;
}

function normalizeRoutine(profile, routine) {
  return {
    profileSnapshot: profile,
    title: asString(routine.title),
    meta: asString(routine.meta),
    weeks: routine.weeks.map((week, index) => ({
      week: Number.isInteger(week.week) && week.week > 0 ? week.week : index + 1,
      headline: asString(week.headline),
      sessions: week.sessions.map((session, sessionIndex) => ({
        title: asString(session.title) || `Session ${sessionIndex + 1}`,
        bullets: session.bullets.map((bullet) => asString(bullet))
      }))
    }))
  };
}

async function generateRoutineWithAi(profile) {
  const systemPrompt = [
    "You are a golf performance coach. Return strict JSON only.",
    "Design a practical routine based on the golfer profile.",
    "No markdown, no code fences, no extra keys."
  ].join(" ");
  const userPrompt = JSON.stringify({
    task: "Generate a routine",
    outputShape: {
      title: "string",
      meta: "string",
      weeks: [
        {
          week: "number",
          headline: "string",
          sessions: [{ title: "string", bullets: ["string"] }]
        }
      ]
    },
    constraints: [
      "Plan should match requested daysPerWeek and hoursPerSession",
      "4 to 6 weeks total",
      "Each session should include 3 to 5 concise bullets",
      "Tailor drills to stated weakness and handicap",
      "Keep language actionable"
    ],
    profile
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`AI provider error (${response.status}): ${message.slice(0, 300)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("AI provider returned no content.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (_err) {
    throw new Error("AI response was not valid JSON.");
  }

  if (!isValidRoutine(parsed)) {
    throw new Error("AI response did not match routine schema.");
  }

  return normalizeRoutine(profile, parsed);
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
      let routine = null;
      let source = "fallback";

      if (OPENAI_API_KEY) {
        try {
          routine = await generateRoutineWithAi(profile);
          source = "ai";
        } catch (err) {
          console.error("AI routine generation failed, using fallback:", err.message);
        }
      }

      if (!routine) {
        routine = buildDeterministicRoutine(profile);
      }

      sendJson(res, 200, { routine, source });
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
