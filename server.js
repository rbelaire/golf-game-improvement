const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Load .env file if present (no external dependency)
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const db = require("./lib/db");
const { buildRulesRoutine, validateProfileShape, normalizeProfile, DRILL_LIBRARY } = require("./lib/drills");
const { createRateLimiter } = require("./lib/rate-limit");

const PORT = process.env.PORT || 3000;
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const authLimiter = createRateLimiter(10, 60000);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
const SITE_URL = process.env.PUBLIC_SITE_URL || "https://thegolfbuild.com";
const PUBLIC_SEO_ROUTES = {
  "/": {
    title: "Golf Practice Plan Generator | thegolfbuild",
    description: "Generate personalized golf practice plans from your handicap, weaknesses, and time. Run sessions, track progress, and improve faster.",
    canonical: "https://thegolfbuild.com/",
    marketingHeading: "Build Better Golf Practice, Faster",
    marketingSubheading: "Generate personalized plans and track consistent improvement.",
    marketingBody: "thegolfbuild helps golfers turn limited practice time into structured sessions built around skill level, weaknesses, and schedule."
  },
  "/drills": {
    title: "Golf Drill Library (330+ Drills) | thegolfbuild",
    description: "Browse golf drills by skill and focus area. Build routines from warm-up, technical, pressure, and transfer blocks.",
    canonical: "https://thegolfbuild.com/drills",
    marketingHeading: "Explore the Drill Library",
    marketingSubheading: "Find drills by focus area, difficulty, and training intent.",
    marketingBody: "Review warm-up, technical, pressure, and transfer drills to assemble focused sessions without guesswork."
  },
  "/routine": {
    title: "Golf Practice Routines | thegolfbuild",
    description: "Create generated or custom golf practice routines. Sessions are structured for measurable improvement.",
    canonical: "https://thegolfbuild.com/routine",
    marketingHeading: "Create Structured Practice Routines",
    marketingSubheading: "Generate plans or build custom sessions with clear progression.",
    marketingBody: "Use routine templates and custom session building to create measurable practice blocks that map to your goals."
  },
  "/stats": {
    title: "Practice Progress & Streaks | thegolfbuild",
    description: "Track sessions, streaks, and skill coverage over time to stay consistent and improve.",
    canonical: "https://thegolfbuild.com/stats",
    marketingHeading: "Track Progress That Matters",
    marketingSubheading: "Monitor completion, streaks, and long-term consistency.",
    marketingBody: "See practice volume, progress percentage, and activity trends to keep momentum and improve over time."
  }
};

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

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

async function parseAuthUser(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  const session = await db.findSessionByToken(token);
  if (!session) return null;

  const age = Date.now() - new Date(session.createdAt).getTime();
  if (age > SESSION_MAX_AGE_MS) {
    await db.deleteSessionsByToken(token);
    return null;
  }

  const user = await db.findUserById(session.userId);
  if (!user) return null;

  return { user, token };
}

function isSafeStaticPath(filePath) {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(path.resolve(__dirname)) || resolved.startsWith(path.resolve(__dirname, "public"));
}

function contentType(fileName) {
  const ext = path.extname(fileName);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".xml") return "application/xml; charset=utf-8";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  if (ext === ".webmanifest") return "application/manifest+json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  return "text/plain; charset=utf-8";
}

function normalizeRoutePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function withAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, SITE_URL).toString();
}

function upsertMetaByName(html, name, content) {
  const tag = `<meta name="${name}" content="${escapeHtml(content)}">`;
  const regex = new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, "i");
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace("</head>", `  ${tag}\n</head>`);
}

function upsertMetaByProperty(html, property, content) {
  const tag = `<meta property="${property}" content="${escapeHtml(content)}">`;
  const regex = new RegExp(`<meta\\s+property=["']${property}["'][^>]*>`, "i");
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace("</head>", `  ${tag}\n</head>`);
}

function upsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}">`;
  const regex = /<link\s+rel=["']canonical["'][^>]*>/i;
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace("</head>", `  ${tag}\n</head>`);
}

function upsertJsonLd(html, id, payload) {
  const tag = `<script id="${id}" type="application/ld+json">${JSON.stringify(payload)}</script>`;
  const regex = new RegExp(`<script\\s+id=["']${id}["'][\\s\\S]*?<\\/script>`, "i");
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace("</head>", `  ${tag}\n</head>`);
}

function forceSectionHidden(html, sectionId) {
  const regex = new RegExp(`(<section\\s+id=["']${sectionId}["'][^>]*class=["'])([^"']*)(["'][^>]*>)`, "i");
  return html.replace(regex, (_m, start, classes, end) => {
    const nextClasses = classes.includes("hidden") ? classes : `${classes} hidden`.trim();
    return `${start}${nextClasses}${end}`;
  }).replace(
    new RegExp(`(<section\\s+id=["']${sectionId}["'][^>]*)(>)`, "i"),
    "$1 hidden$2"
  );
}

function forceButtonHidden(html, buttonId) {
  const regex = new RegExp(`(<button\\s+id=["']${buttonId}["'][^>]*class=["'])([^"']*)(["'][^>]*>)`, "i");
  return html.replace(regex, (_m, start, classes, end) => {
    const nextClasses = classes.includes("hidden") ? classes : `${classes} hidden`.trim();
    return `${start}${nextClasses}${end}`;
  });
}

function buildSeoPayload(pathname) {
  const normalized = normalizeRoutePath(pathname);
  const routeSeo = PUBLIC_SEO_ROUTES[normalized];
  const isPublic = Boolean(routeSeo);
  const title = routeSeo?.title || "thegolfbuild App";
  const description = routeSeo?.description || "Golf training app. Sign in to access your routines and account-specific data.";
  const canonical = routeSeo?.canonical || withAbsoluteUrl(normalized);
  const ogImage = withAbsoluteUrl("/og/thegolfbuild-og.png");
  const robots = isPublic ? "index,follow,max-image-preview:large" : "noindex,nofollow";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "thegolfbuild",
        url: SITE_URL
      },
      {
        "@type": "WebApplication",
        name: "thegolfbuild",
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        description,
        url: canonical
      },
      {
        "@type": "Organization",
        name: "thegolfbuild",
        url: SITE_URL,
        logo: withAbsoluteUrl("/favicon.svg")
      }
    ]
  };

  const intro = routeSeo
    ? `
    <section id="seo-public-intro" style="max-width:1200px;margin:0 auto;padding:16px 16px 8px;border-bottom:1px solid rgba(127,127,127,.22);">
      <h2 style="margin:0 0 6px;font-family:Rajdhani,sans-serif;font-size:1.65rem;line-height:1.2;">${escapeHtml(routeSeo.marketingHeading)}</h2>
      <p style="margin:0 0 6px;color:#8f969f;font-size:1rem;">${escapeHtml(routeSeo.marketingSubheading)}</p>
      <p style="margin:0;color:#9aa2ab;font-size:.95rem;">${escapeHtml(routeSeo.marketingBody)}</p>
    </section>`
    : "";

  return { title, description, canonical, ogImage, robots, jsonLd, intro };
}

function renderPublicShell(pathname) {
  const indexPath = path.join(__dirname, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const seo = buildSeoPayload(pathname);

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  html = upsertMetaByName(html, "description", seo.description);
  html = upsertCanonical(html, seo.canonical);
  html = upsertMetaByName(html, "robots", seo.robots);
  html = upsertMetaByProperty(html, "og:title", seo.title);
  html = upsertMetaByProperty(html, "og:description", seo.description);
  html = upsertMetaByProperty(html, "og:url", seo.canonical);
  html = upsertMetaByProperty(html, "og:type", "website");
  html = upsertMetaByProperty(html, "og:image", seo.ogImage);
  html = upsertMetaByName(html, "twitter:card", "summary_large_image");
  html = upsertMetaByName(html, "twitter:title", seo.title);
  html = upsertMetaByName(html, "twitter:description", seo.description);
  html = upsertMetaByName(html, "twitter:image", seo.ogImage);
  html = upsertJsonLd(html, "seo-jsonld", seo.jsonLd);

  // Public shells should never present account/admin panels before app auth state loads.
  html = forceSectionHidden(html, "authPanel");
  html = forceSectionHidden(html, "adminPanel");
  html = forceButtonHidden(html, "showAdminBtn");

  if (seo.intro) {
    html = html.replace("<body>", `<body>\n${seo.intro}`);
  }

  return html;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateString(value, maxLen) {
  const s = String(value || "").trim();
  return s.length <= maxLen ? s : s.slice(0, maxLen);
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { status: "ok", timestamp: new Date().toISOString() });
    return;
  }

  if (url.pathname === "/api/auth/register" && req.method === "POST") {
    const ip = clientIp(req);
    const limit = authLimiter.check(ip);
    if (!limit.allowed) {
      res.writeHead(429, { "Retry-After": String(limit.retryAfter), "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Too many requests. Try again later." }));
      return;
    }

    try {
      const body = await readBody(req);
      const name = validateString(body.name, 100);
      const email = validateString(body.email, 254).toLowerCase();
      const password = String(body.password || "");

      if (!name || !email || !password) {
        sendJson(res, 400, { error: "Name, email, and password are required." });
        return;
      }

      if (!EMAIL_RE.test(email)) {
        sendJson(res, 400, { error: "Invalid email format." });
        return;
      }

      if (password.length < 8 || password.length > 128) {
        sendJson(res, 400, { error: "Password must be between 8 and 128 characters." });
        return;
      }

      const existing = await db.findUserByEmail(email);
      if (existing) {
        sendJson(res, 409, { error: "Account already exists for that email." });
        return;
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(password, salt);
      const user = await db.createUser({ name, email, plan: "free", role: "user", salt, passwordHash, profile: null });

      const token = crypto.randomBytes(32).toString("hex");
      await db.createSession(token, user.id);

      sendJson(res, 201, { token, user: publicUser(user) });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    const ip = clientIp(req);
    const limit = authLimiter.check(ip);
    if (!limit.allowed) {
      res.writeHead(429, { "Retry-After": String(limit.retryAfter), "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Too many requests. Try again later." }));
      return;
    }

    try {
      const body = await readBody(req);
      const email = validateString(body.email, 254).toLowerCase();
      const password = String(body.password || "");

      if (!email || !password) {
        sendJson(res, 401, { error: "Invalid credentials." });
        return;
      }

      const user = await db.findUserByEmail(email);

      if (!user) {
        sendJson(res, 401, { error: "Invalid credentials." });
        return;
      }

      const incomingHash = hashPassword(password, user.salt);
      if (incomingHash !== user.passwordHash) {
        sendJson(res, 401, { error: "Invalid credentials." });
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      await db.createSession(token, user.id);
      sendJson(res, 200, { token, user: publicUser(user) });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    sendJson(res, 200, { user: publicUser(auth.user) });
    return;
  }

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 200, { ok: true });
      return;
    }

    await db.deleteSessionsByToken(auth.token);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/auth/password" && req.method === "PUT") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = await readBody(req);
      const currentPassword = String(body.currentPassword || "");
      const newPassword = String(body.newPassword || "");

      if (!currentPassword || !newPassword) {
        sendJson(res, 400, { error: "Current password and new password are required." });
        return;
      }

      if (newPassword.length < 8 || newPassword.length > 128) {
        sendJson(res, 400, { error: "New password must be between 8 and 128 characters." });
        return;
      }

      const incomingHash = hashPassword(currentPassword, auth.user.salt);
      if (incomingHash !== auth.user.passwordHash) {
        sendJson(res, 403, { error: "Current password is incorrect." });
        return;
      }

      const newHash = hashPassword(newPassword, auth.user.salt);
      await db.updateUser(auth.user.id, { passwordHash: newHash });
      sendJson(res, 200, { ok: true });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/profile" && req.method === "GET") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    sendJson(res, 200, { profile: auth.user.profile });
    return;
  }

  if (url.pathname === "/api/profile" && req.method === "PUT") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = await readBody(req);
      const profile = body.profile || null;
      await db.updateUser(auth.user.id, { profile });
      sendJson(res, 200, { profile });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/routines" && req.method === "GET") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const routines = await db.getUserRoutines(auth.user.id);
    sendJson(res, 200, { routines });
    return;
  }

  if (url.pathname === "/api/routines/generate" && req.method === "POST") {
    const auth = await parseAuthUser(req);
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
      const savedRoutines = await db.getUserRoutines(auth.user.id);
      const routine = buildRulesRoutine(profile, savedRoutines);
      sendJson(res, 200, { routine, source: "rules" });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/routines" && req.method === "POST") {
    const auth = await parseAuthUser(req);
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

      if (routine.title) routine.title = validateString(routine.title, 200);
      if (routine.meta) routine.meta = validateString(routine.meta, 500);

      const currentPlan = auth.user.plan || "free";
      const isFreePlan = currentPlan !== "pro" && !isSuperUser(auth.user);
      const currentCount = await db.getRoutineCount(auth.user.id);
      if (isFreePlan && currentCount >= 5) {
        sendJson(res, 402, {
          error: "Free plan limit reached (5 routines). Upgrade to Pro for unlimited routines.",
          code: "UPGRADE_REQUIRED"
        });
        return;
      }

      const newRoutine = await db.createRoutine(auth.user.id, routine);
      sendJson(res, 201, { routine: newRoutine, plan: currentPlan });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  const routineMatch = url.pathname.match(/^\/api\/routines\/([a-zA-Z0-9-]+)$/);
  if (routineMatch && req.method === "PUT") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = await readBody(req);
      const updates = {};
      if (body.title !== undefined) updates.title = validateString(body.title, 200);
      if (body.meta !== undefined) updates.meta = validateString(body.meta, 500);
      if (body.weeks !== undefined) updates.weeks = body.weeks;

      if (Object.keys(updates).length === 0) {
        sendJson(res, 400, { error: "No fields to update." });
        return;
      }

      const updated = await db.updateRoutine(auth.user.id, routineMatch[1], updates);
      if (!updated) {
        sendJson(res, 404, { error: "Routine not found." });
        return;
      }

      sendJson(res, 200, { routine: updated });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (routineMatch && req.method === "DELETE") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const routineId = routineMatch[1];
    await db.deleteRoutine(auth.user.id, routineId);
    sendJson(res, 200, { ok: true });
    return;
  }

  // Session completion toggle
  const completionMatch = url.pathname.match(/^\/api\/routines\/([a-zA-Z0-9-]+)\/complete$/);
  if (completionMatch && req.method === "POST") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    try {
      const body = await readBody(req);
      const key = String(body.key || "");
      if (!/^\d+-\d+$/.test(key)) {
        sendJson(res, 400, { error: "Invalid session key. Expected format: weekIndex-sessionIndex." });
        return;
      }
      const updated = await db.toggleSessionCompletion(auth.user.id, completionMatch[1], key);
      if (!updated) {
        sendJson(res, 404, { error: "Routine not found." });
        return;
      }
      sendJson(res, 200, { routine: updated });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/drills" && req.method === "GET") {
    sendJson(res, 200, { drills: DRILL_LIBRARY });
    return;
  }

  if (url.pathname === "/api/stats" && req.method === "GET") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const stats = await db.getUserStats(auth.user.id);
    sendJson(res, 200, { stats });
    return;
  }

  if (url.pathname === "/api/billing/upgrade-pro" && req.method === "POST") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    await db.updateUser(auth.user.id, { plan: "pro" });
    const updated = await db.findUserById(auth.user.id);
    sendJson(res, 200, { user: publicUser(updated) });
    return;
  }

  if (url.pathname === "/api/admin/users" && req.method === "GET") {
    const auth = await parseAuthUser(req);
    if (!auth) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }
    if (!isSuperUser(auth.user)) {
      sendJson(res, 403, { error: "Forbidden" });
      return;
    }

    const users = await db.getAllUsersAdmin();
    sendJson(res, 200, { users });
    return;
  }

  if (url.pathname === "/api/admin/users/promote" && req.method === "POST") {
    const auth = await parseAuthUser(req);
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
      const email = validateString(body.email, 254).toLowerCase();
      if (!email || !EMAIL_RE.test(email)) {
        sendJson(res, 400, { error: "A valid email is required." });
        return;
      }

      const targetUser = await db.findUserByEmail(email);
      if (!targetUser) {
        sendJson(res, 404, { error: "User not found." });
        return;
      }

      await db.updateUser(targetUser.id, { role: "super", plan: "pro" });
      const updated = await db.findUserById(targetUser.id);
      sendJson(res, 200, { user: publicUser(updated) });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  const adminUserMatch = url.pathname.match(/^\/api\/admin\/users\/([a-zA-Z0-9-]+)$/);
  if (adminUserMatch && req.method === "PUT") {
    const auth = await parseAuthUser(req);
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
      const targetUser = await db.findUserById(adminUserMatch[1]);
      if (!targetUser) {
        sendJson(res, 404, { error: "User not found." });
        return;
      }

      const updates = {};
      if (body.plan !== undefined) {
        const nextPlan = String(body.plan).trim().toLowerCase();
        if (!["free", "pro"].includes(nextPlan)) {
          sendJson(res, 400, { error: "plan must be 'free' or 'pro'." });
          return;
        }
        updates.plan = nextPlan;
      }

      if (body.role !== undefined) {
        const nextRole = String(body.role).trim().toLowerCase();
        if (!["user", "super"].includes(nextRole)) {
          sendJson(res, 400, { error: "role must be 'user' or 'super'." });
          return;
        }
        updates.role = nextRole;
      }

      if (Object.keys(updates).length > 0) {
        await db.updateUser(targetUser.id, updates);
      }
      const updated = await db.findUserById(targetUser.id);
      sendJson(res, 200, { user: publicUser(updated) });
      return;
    } catch (err) {
      sendJson(res, 400, { error: err.message });
      return;
    }
  }

  if (url.pathname === "/api/admin/me" && req.method === "GET") {
    const auth = await parseAuthUser(req);
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
  const decodedPath = decodeURIComponent(routePath);
  const candidates = [
    path.join(__dirname, decodedPath),
    path.join(__dirname, "public", decodedPath)
  ];
  const fileName = path.basename(decodedPath);
  const looksLikeAsset = /\.(css|js|svg|png|webmanifest|txt|xml|json)$/i.test(fileName);
  if (looksLikeAsset) {
    candidates.push(path.join(__dirname, fileName));
    candidates.push(path.join(__dirname, "public", fileName));
  }
  const filePath = candidates.find((candidate) => isSafeStaticPath(candidate) && fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory());

  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, { "Content-Type": contentType(filePath) });
  fs.createReadStream(filePath).pipe(res);
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function setCorsHeaders(req, res) {
  if (ALLOWED_ORIGINS.length === 0) return false;
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
  return true;
}

async function requestHandler(req, res, options = {}) {
  const start = Date.now();
  setSecurityHeaders(res);
  setCorsHeaders(req, res);

  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);

  if (req.method === "OPTIONS" && ALLOWED_ORIGINS.length > 0) {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    const ms = Date.now() - start;
    console.log(`${req.method} ${url.pathname} ${res.statusCode} ${ms}ms`);
    return;
  }

  if (options.apiOnly) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const hasFileExtension = path.extname(url.pathname) !== "";
  if (req.method === "GET" && !hasFileExtension) {
    const html = renderPublicShell(url.pathname);
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    });
    res.end(html);
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
  db.init().then(() => {
    const server = createServer();
    server.listen(PORT, () => {
      console.log(`thegolfbuild server running on http://localhost:${PORT}`);
    });
    // Clean expired sessions every 6 hours
    const cleanup = setInterval(() => {
      db.deleteExpiredSessions(SESSION_MAX_AGE_MS).catch((err) => {
        console.error("Session cleanup error:", err);
      });
    }, 6 * 60 * 60 * 1000);
    if (cleanup.unref) cleanup.unref();

    function shutdown(signal) {
      console.log(`\n${signal} received, shutting down...`);
      clearInterval(cleanup);
      server.close(() => {
        db.close().then(() => process.exit(0)).catch(() => process.exit(1));
      });
      setTimeout(() => process.exit(1), 5000);
    }
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }).catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
}

module.exports = {
  createServer,
  requestHandler
};
