const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TEST_DB_DIR = path.join(__dirname, ".tmp");
const TEST_DB_PATH = path.join(TEST_DB_DIR, "db.json");

// Point DB to temp directory before requiring modules
process.env.DB_DIR = TEST_DB_DIR;
delete process.env.DATABASE_URL;
delete process.env.SUPER_USER_EMAIL;
delete process.env.SUPER_USER_PASSWORD;

const db = require("../lib/db");
const { createServer } = require("../server");

let server;
let port;

function fetch(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "127.0.0.1",
      port,
      path: urlPath,
      method,
      headers: { "Content-Type": "application/json", ...headers }
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers });
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function authFetch(method, urlPath, token, body) {
  return fetch(method, urlPath, body, { Authorization: `Bearer ${token}` });
}

// Create a session directly in the DB (bypasses rate limiter)
async function directLogin(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await db.createSession(token, userId);
  return token;
}

// Create a user directly in the DB
async function directCreateUser(name, email, password, opts = {}) {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return db.createUser({
    name,
    email,
    plan: opts.plan || "free",
    role: opts.role || "user",
    salt,
    passwordHash,
    profile: null
  });
}

describe("API", () => {
  // Shared state: users and tokens created once
  let aliceToken, aliceId;
  let freeToken, freeId;
  let adminToken, adminId;
  let regularToken;

  before(async () => {
    await db.init();
    server = createServer();
    await new Promise((r) => server.listen(0, r));
    port = server.address().port;

    // Create test users directly (bypass rate limiter)
    const alice = await directCreateUser("Alice", "alice@example.com", "password123");
    aliceId = alice.id;
    aliceToken = await directLogin(aliceId);

    const freeUser = await directCreateUser("FreeUser", "free@example.com", "password123");
    freeId = freeUser.id;
    freeToken = await directLogin(freeId);

    const admin = await directCreateUser("Admin", "admin@example.com", "adminpass123", { plan: "pro", role: "super" });
    adminId = admin.id;
    adminToken = await directLogin(adminId);

    regularToken = await directLogin(aliceId);
  });

  after(() => {
    server.close();
    if (fs.existsSync(TEST_DB_DIR)) {
      fs.rmSync(TEST_DB_DIR, { recursive: true });
    }
  });

  describe("Auth", () => {
    it("POST /api/auth/register - creates user", async () => {
      const res = await fetch("POST", "/api/auth/register", {
        name: "NewUser",
        email: "newuser@example.com",
        password: "password123"
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.token);
      assert.equal(res.body.user.name, "NewUser");
      assert.equal(res.body.user.email, "newuser@example.com");
      assert.equal(res.body.user.plan, "free");
      assert.equal(res.body.user.role, "user");
      assert.equal(res.body.user.passwordHash, undefined);
      assert.equal(res.body.user.salt, undefined);
    });

    it("POST /api/auth/register - rejects duplicate email", async () => {
      const res = await fetch("POST", "/api/auth/register", {
        name: "Alice2",
        email: "alice@example.com",
        password: "password123"
      });
      assert.equal(res.status, 409);
    });

    it("POST /api/auth/register - rejects short password", async () => {
      const res = await fetch("POST", "/api/auth/register", {
        name: "Bob",
        email: "bob@example.com",
        password: "short"
      });
      assert.equal(res.status, 400);
    });

    it("POST /api/auth/register - rejects missing fields", async () => {
      const res = await fetch("POST", "/api/auth/register", {
        name: "",
        email: "empty@example.com",
        password: "password123"
      });
      assert.equal(res.status, 400);
    });

    it("POST /api/auth/register - rejects invalid email format", async () => {
      const res = await fetch("POST", "/api/auth/register", {
        name: "Bad",
        email: "not-an-email",
        password: "password123"
      });
      assert.equal(res.status, 400);
      assert.match(res.body.error, /email/i);
    });

    it("POST /api/auth/login - valid credentials", async () => {
      const res = await fetch("POST", "/api/auth/login", {
        email: "alice@example.com",
        password: "password123"
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, "alice@example.com");
    });

    it("POST /api/auth/login - wrong password", async () => {
      const res = await fetch("POST", "/api/auth/login", {
        email: "alice@example.com",
        password: "wrongpassword"
      });
      assert.equal(res.status, 401);
    });

    it("POST /api/auth/login - unknown email", async () => {
      const res = await fetch("POST", "/api/auth/login", {
        email: "nobody@example.com",
        password: "password123"
      });
      assert.equal(res.status, 401);
    });

    it("GET /api/auth/me - returns current user", async () => {
      const res = await authFetch("GET", "/api/auth/me", aliceToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.user.email, "alice@example.com");
    });

    it("GET /api/auth/me - rejects no token", async () => {
      const res = await fetch("GET", "/api/auth/me");
      assert.equal(res.status, 401);
    });

    it("GET /api/auth/me - rejects invalid token", async () => {
      const res = await authFetch("GET", "/api/auth/me", "badtoken");
      assert.equal(res.status, 401);
    });

    it("POST /api/auth/logout - invalidates session", async () => {
      const tempToken = await directLogin(aliceId);

      const res = await authFetch("POST", "/api/auth/logout", tempToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);

      const meRes = await authFetch("GET", "/api/auth/me", tempToken);
      assert.equal(meRes.status, 401);
    });
  });

  describe("Profile", () => {
    it("GET /api/profile - returns null initially", async () => {
      const res = await authFetch("GET", "/api/profile", aliceToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.profile, null);
    });

    it("PUT /api/profile - saves profile", async () => {
      const profile = {
        name: "Alice",
        handicap: "Beginner (36+)",
        weakness: "Putting confidence",
        daysPerWeek: 3,
        hoursPerSession: 1.5,
        notes: "Focus on short putts"
      };
      const res = await authFetch("PUT", "/api/profile", aliceToken, { profile });
      assert.equal(res.status, 200);
      assert.equal(res.body.profile.name, "Alice");
    });

    it("GET /api/profile - returns saved profile", async () => {
      const res = await authFetch("GET", "/api/profile", aliceToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.profile.weakness, "Putting confidence");
    });

    it("PUT /api/profile - rejects unauthenticated", async () => {
      const res = await fetch("PUT", "/api/profile", { profile: {} });
      assert.equal(res.status, 401);
    });
  });

  describe("Routines", () => {
    let savedRoutineId;

    it("POST /api/routines/generate - generates routine", async () => {
      const res = await authFetch("POST", "/api/routines/generate", aliceToken, {
        profile: {
          name: "Alice",
          handicap: "Beginner (36+)",
          weakness: "Putting confidence",
          daysPerWeek: 3,
          hoursPerSession: 1.5
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.source, "rules");
      assert.ok(res.body.routine.title);
      assert.equal(res.body.routine.weeks.length, 4);
      assert.equal(res.body.routine.weeks[0].sessions.length, 3);
    });

    it("POST /api/routines/generate - rejects invalid profile", async () => {
      const res = await authFetch("POST", "/api/routines/generate", aliceToken, {
        profile: { name: "Alice" }
      });
      assert.equal(res.status, 400);
    });

    it("POST /api/routines - saves routine", async () => {
      const genRes = await authFetch("POST", "/api/routines/generate", aliceToken, {
        profile: {
          name: "Alice",
          handicap: "Beginner (36+)",
          weakness: "Putting confidence",
          daysPerWeek: 3,
          hoursPerSession: 1.5
        }
      });
      const res = await authFetch("POST", "/api/routines", aliceToken, {
        routine: genRes.body.routine
      });
      assert.equal(res.status, 201);
      assert.ok(res.body.routine.id);
      savedRoutineId = res.body.routine.id;
    });

    it("POST /api/routines - rejects invalid payload", async () => {
      const res = await authFetch("POST", "/api/routines", aliceToken, { routine: null });
      assert.equal(res.status, 400);
    });

    it("GET /api/routines - lists saved routines", async () => {
      const res = await authFetch("GET", "/api/routines", aliceToken);
      assert.equal(res.status, 200);
      assert.ok(res.body.routines.length >= 1);
      assert.equal(res.body.routines[0].id, savedRoutineId);
    });

    it("DELETE /api/routines/:id - deletes routine", async () => {
      const res = await authFetch("DELETE", `/api/routines/${savedRoutineId}`, aliceToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.ok, true);

      const listRes = await authFetch("GET", "/api/routines", aliceToken);
      const found = listRes.body.routines.find((r) => r.id === savedRoutineId);
      assert.equal(found, undefined);
    });

    it("GET /api/routines - rejects unauthenticated", async () => {
      const res = await fetch("GET", "/api/routines");
      assert.equal(res.status, 401);
    });
  });

  describe("Free plan limit", () => {
    it("enforces 5-routine limit for free users", async () => {
      const profile = {
        name: "FreeUser",
        handicap: "Beginner (36+)",
        weakness: "Driving accuracy",
        daysPerWeek: 2,
        hoursPerSession: 1
      };

      for (let i = 0; i < 5; i++) {
        const gen = await authFetch("POST", "/api/routines/generate", freeToken, { profile });
        const save = await authFetch("POST", "/api/routines", freeToken, { routine: gen.body.routine });
        assert.equal(save.status, 201);
      }

      const gen = await authFetch("POST", "/api/routines/generate", freeToken, { profile });
      const save = await authFetch("POST", "/api/routines", freeToken, { routine: gen.body.routine });
      assert.equal(save.status, 402);
      assert.equal(save.body.code, "UPGRADE_REQUIRED");
    });
  });

  describe("Billing", () => {
    it("POST /api/billing/upgrade-pro - upgrades plan", async () => {
      const res = await authFetch("POST", "/api/billing/upgrade-pro", freeToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.user.plan, "pro");
    });
  });

  describe("Admin", () => {
    it("GET /api/admin/me - returns super status", async () => {
      const res = await authFetch("GET", "/api/admin/me", adminToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.isSuper, true);
      assert.equal(res.body.role, "super");
    });

    it("GET /api/admin/me - non-admin gets user role", async () => {
      const res = await authFetch("GET", "/api/admin/me", regularToken);
      assert.equal(res.status, 200);
      assert.equal(res.body.isSuper, false);
    });

    it("GET /api/admin/users - lists all users", async () => {
      const res = await authFetch("GET", "/api/admin/users", adminToken);
      assert.equal(res.status, 200);
      assert.ok(res.body.users.length >= 3);
      const admin = res.body.users.find((u) => u.email === "admin@example.com");
      assert.ok(admin);
      assert.equal(admin.role, "super");
    });

    it("GET /api/admin/users - forbidden for non-admin", async () => {
      const res = await authFetch("GET", "/api/admin/users", regularToken);
      assert.equal(res.status, 403);
    });

    it("POST /api/admin/users/promote - promotes user", async () => {
      // Create a user to promote
      const user = await directCreateUser("Promotee", "promotee@example.com", "password123");

      const res = await authFetch("POST", "/api/admin/users/promote", adminToken, {
        email: "promotee@example.com"
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.role, "super");
      assert.equal(res.body.user.plan, "pro");

      // Demote back for clean state
      await db.updateUser(user.id, { role: "user", plan: "free" });
    });

    it("POST /api/admin/users/promote - forbidden for non-admin", async () => {
      const res = await authFetch("POST", "/api/admin/users/promote", regularToken, {
        email: "alice@example.com"
      });
      assert.equal(res.status, 403);
    });

    it("PUT /api/admin/users/:id - updates user plan/role", async () => {
      const res = await authFetch("PUT", `/api/admin/users/${aliceId}`, adminToken, {
        plan: "pro",
        role: "user"
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.plan, "pro");
      assert.equal(res.body.user.role, "user");

      // Reset
      await db.updateUser(aliceId, { plan: "free", role: "user" });
    });

    it("PUT /api/admin/users/:id - rejects invalid plan", async () => {
      const res = await authFetch("PUT", `/api/admin/users/${aliceId}`, adminToken, {
        plan: "enterprise"
      });
      assert.equal(res.status, 400);
    });
  });

  describe("Security headers", () => {
    it("includes security headers on API responses", async () => {
      const res = await fetch("GET", "/api/auth/me");
      assert.equal(res.headers["x-content-type-options"], "nosniff");
      assert.equal(res.headers["x-frame-options"], "DENY");
      assert.ok(res.headers["content-security-policy"]);
      assert.ok(res.headers["strict-transport-security"]);
      assert.ok(res.headers["referrer-policy"]);
      assert.ok(res.headers["permissions-policy"]);
    });
  });

  describe("Rate limiting", () => {
    it("returns 429 after too many auth requests from same IP", async () => {
      // Fire rapid login requests until rate limited
      let got429 = false;
      for (let i = 0; i < 20; i++) {
        const res = await fetch("POST", "/api/auth/login", {
          email: "alice@example.com",
          password: "password123"
        });
        if (res.status === 429) {
          got429 = true;
          assert.ok(res.headers["retry-after"]);
          break;
        }
      }
      assert.ok(got429, "Expected at least one 429 response");
    });
  });

  describe("404", () => {
    it("returns 404 for unknown API routes", async () => {
      const res = await fetch("GET", "/api/nonexistent");
      assert.equal(res.status, 404);
    });
  });
});
