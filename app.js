const STORAGE_KEYS = {
  token: "thegolfbuild_auth_token",
  legacyTokens: ["under_par_lab_auth_token", "golfos_auth_token"]
};

const authStatus = document.getElementById("authStatus");
const appMessage = document.getElementById("appMessage");
const authPanel = document.getElementById("authPanel");
const authForm = document.getElementById("authForm");
const accountNameInput = document.getElementById("accountName");
const accountEmailInput = document.getElementById("accountEmail");
const accountPasswordInput = document.getElementById("accountPassword");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");
const registerNameField = document.getElementById("registerNameField");

const profileForm = document.getElementById("profileForm");
const clearProfileBtn = document.getElementById("clearProfileBtn");
const loadDemoBtn = document.getElementById("loadDemoBtn");
const welcomePanel = document.getElementById("welcomePanel");
const welcomeName = document.getElementById("welcomeName");
const welcomeMessage = document.getElementById("welcomeMessage");
const topLogoutBtn = document.getElementById("topLogoutBtn");
const topMessage = document.getElementById("topMessage");
const saveRoutineBtn = document.getElementById("saveRoutineBtn");
const customRoutineForm = document.getElementById("customRoutineForm");
const upgradeBtn = document.getElementById("upgradeBtn");
const usageText = document.getElementById("usageText");

const routineEmptyState = document.getElementById("routineEmptyState");
const routineCard = document.getElementById("routineCard");
const routineTitle = document.getElementById("routineTitle");
const routineMeta = document.getElementById("routineMeta");
const routineWeeks = document.getElementById("routineWeeks");

const savedEmptyState = document.getElementById("savedEmptyState");
const savedList = document.getElementById("savedList");
const savedRoutineTemplate = document.getElementById("savedRoutineTemplate");

let currentRoutine = null;
let currentUser = null;
let savedRoutines = [];
let isRegisterMode = false;
const FREE_ROUTINE_LIMIT = 5;

function getToken() {
  return (
    localStorage.getItem(STORAGE_KEYS.token) ||
    STORAGE_KEYS.legacyTokens.map((key) => localStorage.getItem(key)).find(Boolean) ||
    ""
  );
}

function setToken(token) {
  localStorage.setItem(STORAGE_KEYS.token, token);
  STORAGE_KEYS.legacyTokens.forEach((key) => localStorage.removeItem(key));
}

function clearToken() {
  localStorage.removeItem(STORAGE_KEYS.token);
  STORAGE_KEYS.legacyTokens.forEach((key) => localStorage.removeItem(key));
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.code = payload.code || null;
    throw error;
  }

  return payload;
}

function setMessage(message, isError = false) {
  appMessage.textContent = message;
  appMessage.classList.toggle("error", isError);
  topMessage.textContent = message;
  topMessage.classList.toggle("error", isError);
  topMessage.classList.toggle("hidden", !currentUser || !message);
}

function getProfileFromForm() {
  return {
    name: document.getElementById("name").value.trim(),
    handicap: document.getElementById("handicap").value,
    weakness: document.getElementById("weakness").value,
    daysPerWeek: Number(document.getElementById("daysPerWeek").value),
    hoursPerSession: Number(document.getElementById("hoursPerSession").value),
    notes: document.getElementById("notes").value.trim()
  };
}

function hydrateForm(profile) {
  document.getElementById("name").value = profile?.name || "";
  document.getElementById("handicap").value = profile?.handicap || "";
  document.getElementById("weakness").value = profile?.weakness || "";
  document.getElementById("daysPerWeek").value = profile?.daysPerWeek || 3;
  document.getElementById("hoursPerSession").value = profile?.hoursPerSession || 1.5;
  document.getElementById("notes").value = profile?.notes || "";
}

function lockPlanner(locked) {
  const fields = document.querySelectorAll(
    "#profileForm input, #profileForm select, #profileForm textarea, #profileForm button, #customRoutineForm input, #customRoutineForm textarea, #customRoutineForm button"
  );
  fields.forEach((field) => {
    field.disabled = locked;
  });

  saveRoutineBtn.disabled = locked;
  loadDemoBtn.disabled = locked;
  upgradeBtn.disabled = locked;

  if (locked) {
    renderRoutine(null);
    savedList.innerHTML = "";
    savedEmptyState.classList.remove("hidden");
    savedEmptyState.textContent = "Sign in to view and save routines.";
    routineEmptyState.textContent = "Sign in, then fill out your profile to generate a training routine.";
  } else {
    savedEmptyState.textContent = "No routines saved yet.";
    routineEmptyState.textContent = "Fill out your profile to generate a training routine.";
  }
}

function getPlanLimit() {
  return currentUser?.plan === "pro" ? null : FREE_ROUTINE_LIMIT;
}

function renderUsage() {
  const limit = getPlanLimit();
  const count = savedRoutines.length;
  if (!currentUser) {
    usageText.textContent = "Sign in to track saved routine usage.";
    upgradeBtn.classList.add("hidden");
    return;
  }

  if (limit === null) {
    usageText.textContent = `${count} saved routines • Pro plan (unlimited).`;
    upgradeBtn.classList.add("hidden");
  } else {
    usageText.textContent = `${count}/${limit} saved routines used (generated + custom combined).`;
    upgradeBtn.classList.remove("hidden");
  }
}

function setAuthMode(registerMode) {
  isRegisterMode = registerMode;
  const isAuthed = Boolean(currentUser);

  registerNameField.classList.toggle("hidden", !registerMode || isAuthed);
  registerBtn.classList.toggle("hidden", !registerMode || isAuthed);
  showLoginBtn.classList.toggle("hidden", !registerMode || isAuthed);

  loginBtn.classList.toggle("hidden", registerMode || isAuthed);
  showRegisterBtn.classList.toggle("hidden", registerMode || isAuthed);
  logoutBtn.classList.toggle("hidden", !isAuthed);

  accountNameInput.required = registerMode && !isAuthed;
  accountNameInput.disabled = !registerMode || isAuthed;
  accountEmailInput.disabled = isAuthed;
  accountPasswordInput.disabled = isAuthed;

  if (!registerMode) {
    accountNameInput.value = "";
  }
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

function generateRoutine(profile) {
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

function renderRoutine(routine) {
  if (!routine) {
    routineCard.classList.add("hidden");
    routineEmptyState.classList.remove("hidden");
    routineWeeks.innerHTML = "";
    return;
  }

  routineTitle.textContent = routine.title;
  routineMeta.textContent = `${routine.meta} • Created ${new Date(routine.createdAt || Date.now()).toLocaleDateString()}`;

  routineWeeks.innerHTML = "";
  routine.weeks.forEach((week) => {
    const block = document.createElement("section");
    block.className = "week-block";

    const heading = document.createElement("h3");
    heading.textContent = week.headline;

    const list = document.createElement("ul");
    week.sessions.forEach((session) => {
      const item = document.createElement("li");
      item.textContent = `${session.title}: ${session.bullets.join(" ")}`;
      list.appendChild(item);
    });

    block.appendChild(heading);
    block.appendChild(list);
    routineWeeks.appendChild(block);
  });

  routineCard.classList.remove("hidden");
  routineEmptyState.classList.add("hidden");
}

function renderSavedRoutines() {
  savedList.innerHTML = "";
  savedEmptyState.classList.toggle("hidden", savedRoutines.length > 0);
  renderUsage();

  savedRoutines.forEach((routine) => {
    const node = savedRoutineTemplate.content.cloneNode(true);
    const wrapper = node.querySelector(".saved-item");

    wrapper.querySelector(".saved-title").textContent = routine.title;
    wrapper.querySelector(".saved-meta").textContent = `${routine.meta} • ${new Date(routine.createdAt).toLocaleDateString()}`;

    wrapper.querySelector(".load-btn").addEventListener("click", () => {
      currentRoutine = routine;
      renderRoutine(currentRoutine);
      hydrateForm(routine.profileSnapshot);
    });

    wrapper.querySelector(".delete-btn").addEventListener("click", async () => {
      try {
        await api(`/api/routines/${routine.id}`, { method: "DELETE" });
        savedRoutines = savedRoutines.filter((item) => item.id !== routine.id);
        renderSavedRoutines();

        if (currentRoutine?.id === routine.id) {
          currentRoutine = null;
          renderRoutine(null);
        }
      } catch (err) {
        setMessage(err.message, true);
      }
    });

    savedList.appendChild(node);
  });
}

async function loadUserData() {
  const [profileRes, routineRes] = await Promise.all([api("/api/profile"), api("/api/routines")]);
  hydrateForm(profileRes.profile || { name: currentUser.name });
  savedRoutines = routineRes.routines || [];
  renderSavedRoutines();
  currentRoutine = null;
  renderRoutine(null);
}

function updateAuthUi() {
  const isAuthed = Boolean(currentUser);
  authStatus.textContent = isAuthed ? `Signed in as ${currentUser.name}` : "Not signed in";
  setAuthMode(isAuthed ? false : isRegisterMode);
  authPanel.classList.toggle("hidden", isAuthed);
  welcomePanel.classList.toggle("hidden", !isAuthed);
  loadDemoBtn.classList.toggle("hidden", isAuthed);
  if (isAuthed) {
    welcomeName.textContent = currentUser.name;
    welcomeMessage.textContent = `Let's get better today ${currentUser.name}`;
    topMessage.classList.toggle("hidden", !topMessage.textContent);
  } else {
    welcomeName.textContent = "";
    welcomeMessage.textContent = "";
    topMessage.classList.add("hidden");
  }
  lockPlanner(!isAuthed);
  renderUsage();
}

async function register() {
  const name = accountNameInput.value.trim();
  const email = accountEmailInput.value.trim();
  const password = accountPasswordInput.value;

  if (!name || !email || !password) {
    setMessage("Enter name, email, and password to register.", true);
    return;
  }

  try {
    const result = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    setToken(result.token);
    currentUser = result.user;
    updateAuthUi();
    await loadUserData();
    setMessage("Account created. You can now generate and save routines.");
  } catch (err) {
    setMessage(err.message, true);
  }
}

async function login() {
  const email = accountEmailInput.value.trim();
  const password = accountPasswordInput.value;

  if (!email || !password) {
    setMessage("Enter email and password to login.", true);
    return;
  }

  try {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    setToken(result.token);
    currentUser = result.user;
    updateAuthUi();
    await loadUserData();
    setMessage("Logged in successfully.");
  } catch (err) {
    setMessage(err.message, true);
  }
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch (_err) {
    // Ignore logout errors and clear local state anyway.
  }

  clearToken();
  isRegisterMode = false;
  currentUser = null;
  savedRoutines = [];
  hydrateForm(null);
  renderRoutine(null);
  renderSavedRoutines();
  updateAuthUi();
  setMessage("Logged out.");
}

function buildCustomRoutine() {
  const title = document.getElementById("customTitle").value.trim();
  const weeks = Number(document.getElementById("customWeeks").value);
  const sessionsPerWeek = Number(document.getElementById("customSessions").value);
  const tasks = document
    .getElementById("customTasks")
    .value.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!title || !weeks || !sessionsPerWeek || tasks.length === 0) {
    throw new Error("Complete all custom routine fields.");
  }

  const weekBlocks = [];
  for (let week = 1; week <= weeks; week += 1) {
    const sessions = [];
    for (let session = 1; session <= sessionsPerWeek; session += 1) {
      sessions.push({
        title: `Session ${session}`,
        bullets: tasks
      });
    }

    weekBlocks.push({
      week,
      headline: `Week ${week}: Custom Plan`,
      sessions
    });
  }

  return {
    profileSnapshot: getProfileFromForm(),
    title,
    meta: `Custom routine • ${weeks} weeks • ${sessionsPerWeek} sessions/week`,
    weeks: weekBlocks
  };
}

registerBtn.addEventListener("click", register);
loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
topLogoutBtn.addEventListener("click", logout);
showRegisterBtn.addEventListener("click", () => {
  setAuthMode(true);
  setMessage("Enter your name, email, and password to create an account.");
});
showLoginBtn.addEventListener("click", () => {
  setAuthMode(false);
  setMessage("Enter your email and password to log in.");
});
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (currentUser) return;

  if (isRegisterMode) {
    await register();
    return;
  }

  await login();
});
upgradeBtn.addEventListener("click", async () => {
  try {
    const res = await api("/api/billing/upgrade-pro", { method: "POST" });
    currentUser = res.user;
    updateAuthUi();
    renderSavedRoutines();
    setMessage("Upgrade complete. You now have unlimited routine saves.");
  } catch (err) {
    setMessage(err.message, true);
  }
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const profile = getProfileFromForm();
    await api("/api/profile", {
      method: "PUT",
      body: JSON.stringify({ profile })
    });

    const generation = await api("/api/routines/generate", {
      method: "POST",
      body: JSON.stringify({ profile })
    });
    currentRoutine = generation.routine;
    renderRoutine(currentRoutine);
    setMessage("Routine generated with smart rules engine. Save it when ready.");
  } catch (err) {
    setMessage(err.message, true);
  }
});

saveRoutineBtn.addEventListener("click", async () => {
  if (!currentRoutine) return;

  try {
    const result = await api("/api/routines", {
      method: "POST",
      body: JSON.stringify({ routine: currentRoutine })
    });

    savedRoutines = [result.routine, ...savedRoutines];
    currentRoutine = result.routine;
    renderSavedRoutines();
    renderRoutine(currentRoutine);
    setMessage("Routine saved to your profile.");
  } catch (err) {
    if (err.code === "UPGRADE_REQUIRED") {
      setMessage("You reached 5 total saved routines (generated + custom). Upgrade to Pro for unlimited.", true);
      return;
    }

    setMessage(err.message, true);
  }
});

clearProfileBtn.addEventListener("click", async () => {
  if (!currentUser) return;

  hydrateForm({ name: currentUser.name });
  currentRoutine = null;
  renderRoutine(null);

  try {
    await api("/api/profile", {
      method: "PUT",
      body: JSON.stringify({ profile: null })
    });
    setMessage("Profile inputs cleared.");
  } catch (err) {
    setMessage(err.message, true);
  }
});

loadDemoBtn.addEventListener("click", () => {
  const demoProfile = {
    name: currentUser?.name || "Alex Morgan",
    handicap: "Intermediate (10-19)",
    weakness: "Putting confidence",
    daysPerWeek: 4,
    hoursPerSession: 1.5,
    notes: "Weekend practice should include 9-hole simulation"
  };

  hydrateForm(demoProfile);
  currentRoutine = generateRoutine(demoProfile);
  renderRoutine(currentRoutine);
  setMessage("Demo routine loaded. Save it to your profile if you want.");
});

customRoutineForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    currentRoutine = buildCustomRoutine();
    renderRoutine(currentRoutine);
    setMessage("Custom routine created. Save it to your profile.");
  } catch (err) {
    setMessage(err.message, true);
  }
});

(async function init() {
  updateAuthUi();

  const token = getToken();
  if (!token) return;

  try {
    const me = await api("/api/auth/me");
    currentUser = me.user;
    updateAuthUi();
    await loadUserData();
    setMessage("Session restored.");
  } catch (_err) {
    clearToken();
    currentUser = null;
    updateAuthUi();
  }
})();
