const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "db.json");

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], sessions: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
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

async function handleApi(req, res, url) {
  const db = readDb();

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
        salt,
        passwordHash,
        profile: null,
        routines: []
      };
      db.users.push(user);
      const token = issueToken(db, user.id);
      writeDb(db);

      sendJson(res, 201, {
        token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan }
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
      writeDb(db);
      sendJson(res, 200, {
        token,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan || "free" }
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
      user: {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        plan: auth.user.plan || "free"
      }
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
    writeDb(db);
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
      writeDb(db);
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
      const isFreePlan = currentPlan !== "pro";
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
      writeDb(db);
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
    writeDb(db);
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
    writeDb(db);
    sendJson(res, 200, {
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan }
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

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);

  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }

  handleStatic(req, res, url);
});

server.listen(PORT, () => {
  ensureDb();
  console.log(`thegolfbuild server running on http://localhost:${PORT}`);
});
