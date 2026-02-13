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
const generateRoutineBtn = document.getElementById("generateRoutineBtn");
const clearProfileBtn = document.getElementById("clearProfileBtn");
const loadDemoBtn = document.getElementById("loadDemoBtn");
const showGeneratedRoutineBtn = document.getElementById("showGeneratedRoutineBtn");
const showCustomRoutineBtn = document.getElementById("showCustomRoutineBtn");
const generatedRoutineView = document.getElementById("generatedRoutineView");
const customRoutineView = document.getElementById("customRoutineView");
const planPanelTitle = document.getElementById("planPanelTitle");
const welcomePanel = document.getElementById("welcomePanel");
const welcomeName = document.getElementById("welcomeName");
const welcomeMessage = document.getElementById("welcomeMessage");
const topLogoutBtn = document.getElementById("topLogoutBtn");
const topMessage = document.getElementById("topMessage");
const saveRoutineBtn = document.getElementById("saveRoutineBtn");
const saveRoutineNameInput = document.getElementById("saveRoutineNameInput");
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

const showDrillLibraryBtn = document.getElementById("showDrillLibraryBtn");
const showStatsBtn = document.getElementById("showStatsBtn");
const drillLibraryPanel = document.getElementById("drillLibraryPanel");
const drillLibraryContent = document.getElementById("drillLibraryContent");
const statsPanel = document.getElementById("statsPanel");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportIcalBtn = document.getElementById("exportIcalBtn");

let currentRoutine = null;
let currentUser = null;
let savedRoutines = [];
let isRegisterMode = false;
let isGeneratingRoutine = false;
let activePlanMode = "generated";
let drillLibraryCache = null;
const FREE_ROUTINE_LIMIT = 5;

function profileCacheKey(userId) {
  return `thegolfbuild_profile_${userId}`;
}

function getCachedProfile(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(profileCacheKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function setCachedProfile(userId, profile) {
  if (!userId) return;
  localStorage.setItem(profileCacheKey(userId), JSON.stringify(profile || null));
}

function clearCachedProfile(userId) {
  if (!userId) return;
  localStorage.removeItem(profileCacheKey(userId));
}

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
    if (
      response.status === 401 &&
      token &&
      path !== "/api/auth/login" &&
      path !== "/api/auth/register"
    ) {
      handleUnauthorizedSession();
    }
    const error = new Error(payload.error || "Request failed");
    error.code = payload.code || null;
    throw error;
  }

  return payload;
}

function handleUnauthorizedSession() {
  clearToken();
  currentUser = null;
  currentRoutine = null;
  savedRoutines = [];
  renderRoutine(null);
  renderSavedRoutines();
  updateAuthUi();
  setMessage("Session expired. Please log in again.", true);
}

function setMessage(message, isError = false) {
  appMessage.textContent = message;
  appMessage.classList.toggle("error", isError);
  topMessage.textContent = message;
  topMessage.classList.toggle("error", isError);
  topMessage.classList.toggle("hidden", !currentUser || !message);
}

function getDisplayFirstName() {
  const raw = String(currentUser?.name || "").trim();
  if (!raw) return "Player";
  const cleaned = raw.includes("@") ? raw.split("@")[0] : raw;
  const first = cleaned.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function setPlanMode(mode) {
  activePlanMode = mode;
  const planPanel = document.querySelector(".plan-panel");

  generatedRoutineView.classList.add("hidden");
  customRoutineView.classList.add("hidden");
  drillLibraryPanel.classList.add("hidden");
  statsPanel.classList.add("hidden");
  planPanel.classList.remove("hidden");

  showGeneratedRoutineBtn.classList.remove("active");
  showCustomRoutineBtn.classList.remove("active");
  showDrillLibraryBtn.classList.remove("active");
  showStatsBtn.classList.remove("active");

  if (mode === "custom") {
    customRoutineView.classList.remove("hidden");
    showCustomRoutineBtn.classList.add("active");
    planPanelTitle.textContent = "Custom Practice Routine";
  } else if (mode === "drills") {
    planPanel.classList.add("hidden");
    drillLibraryPanel.classList.remove("hidden");
    showDrillLibraryBtn.classList.add("active");
    loadDrillLibrary();
  } else if (mode === "stats") {
    planPanel.classList.add("hidden");
    statsPanel.classList.remove("hidden");
    showStatsBtn.classList.add("active");
    loadStats();
  } else {
    generatedRoutineView.classList.remove("hidden");
    showGeneratedRoutineBtn.classList.add("active");
    planPanelTitle.textContent = "Generated Practice Routine";
  }
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
  saveRoutineNameInput.disabled = locked;
  loadDemoBtn.disabled = locked;
  showGeneratedRoutineBtn.disabled = locked;
  showCustomRoutineBtn.disabled = locked;
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

  if (locked) {
    isGeneratingRoutine = false;
    generateRoutineBtn.textContent = "Generate Routine";
    setPlanMode("generated");
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
    saveRoutineNameInput.value = "";
    return;
  }

  routineTitle.textContent = routine.title;
  routineMeta.textContent = `${routine.meta} • Created ${new Date(routine.createdAt || Date.now()).toLocaleDateString()}`;

  const completions = routine.completions || {};
  const isSaved = Boolean(routine.id);

  routineWeeks.innerHTML = "";
  routine.weeks.forEach((week, wi) => {
    const block = document.createElement("section");
    block.className = "week-block";

    const heading = document.createElement("h3");
    heading.textContent = week.headline;
    block.appendChild(heading);

    let weekDone = 0;
    const weekTotal = (week.sessions || []).length;

    week.sessions.forEach((session, si) => {
      const key = `${wi}-${si}`;
      const done = Boolean(completions[key]);
      if (done) weekDone += 1;

      const row = document.createElement("div");
      row.className = "session-check" + (done ? " completed" : "");

      if (isSaved) {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = done;
        cb.id = `sc-${wi}-${si}`;
        cb.addEventListener("change", () => toggleCompletion(routine.id, key));
        row.appendChild(cb);
      }

      const lbl = document.createElement("label");
      if (isSaved) lbl.setAttribute("for", `sc-${wi}-${si}`);
      lbl.textContent = `${session.title}: ${session.bullets.join(" ")}`;
      row.appendChild(lbl);
      block.appendChild(row);
    });

    if (isSaved && weekTotal > 0) {
      const pct = Math.round((weekDone / weekTotal) * 100);
      const prog = document.createElement("div");
      prog.className = "week-progress";
      prog.innerHTML = `<div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>` +
        `<p class="week-progress-text">${weekDone}/${weekTotal} sessions complete</p>`;
      block.appendChild(prog);
    }

    routineWeeks.appendChild(block);
  });

  routineCard.classList.remove("hidden");
  routineEmptyState.classList.add("hidden");
  saveRoutineNameInput.value = routine.title || "";
  saveRoutineNameInput.placeholder = `Save as (optional title) • ${routine.title}`;
}

async function toggleCompletion(routineId, key) {
  try {
    const result = await api(`/api/routines/${routineId}/complete`, {
      method: "POST",
      body: JSON.stringify({ key })
    });
    const updated = result.routine;
    const idx = savedRoutines.findIndex((r) => r.id === routineId);
    if (idx !== -1) savedRoutines[idx] = updated;
    if (currentRoutine?.id === routineId) {
      currentRoutine = updated;
      renderRoutine(currentRoutine);
    }
    renderSavedRoutines();
  } catch (err) {
    setMessage(err.message, true);
  }
}

function routineProgress(routine) {
  let total = 0;
  let done = 0;
  const completions = routine.completions || {};
  for (const week of routine.weeks || []) {
    total += (week.sessions || []).length;
  }
  done = Object.keys(completions).length;
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
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

    const prog = routineProgress(routine);
    wrapper.querySelector(".saved-progress-bar").style.width = `${prog.pct}%`;
    wrapper.querySelector(".saved-progress-text").textContent = `${prog.done}/${prog.total} sessions (${prog.pct}%)`;

    wrapper.querySelector(".load-btn").addEventListener("click", () => {
      currentRoutine = routine;
      renderRoutine(currentRoutine);
      hydrateForm(routine.profileSnapshot);
      setPlanMode("generated");
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
  const profile = profileRes.profile || getCachedProfile(currentUser.id) || { name: currentUser.name };
  hydrateForm(profile);
  setCachedProfile(currentUser.id, profile);
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
    welcomeName.textContent = "";
    welcomeMessage.textContent = `Let's get better today ${getDisplayFirstName()}`;
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

  registerBtn.disabled = true;
  registerBtn.textContent = "Creating...";
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
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Create Account";
  }
}

async function login() {
  const email = accountEmailInput.value.trim();
  const password = accountPasswordInput.value;

  if (!email || !password) {
    setMessage("Enter email and password to login.", true);
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";
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
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
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

const changePasswordBtn = document.getElementById("changePasswordBtn");
const changePasswordPanel = document.getElementById("changePasswordPanel");
const currentPasswordInput = document.getElementById("currentPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const submitPasswordChangeBtn = document.getElementById("submitPasswordChangeBtn");
const cancelPasswordChangeBtn = document.getElementById("cancelPasswordChangeBtn");

changePasswordBtn.addEventListener("click", () => {
  changePasswordPanel.classList.toggle("hidden");
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
});

cancelPasswordChangeBtn.addEventListener("click", () => {
  changePasswordPanel.classList.add("hidden");
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
});

submitPasswordChangeBtn.addEventListener("click", async () => {
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;

  if (!currentPassword || !newPassword) {
    setMessage("Both current and new password are required.", true);
    return;
  }

  if (newPassword.length < 8) {
    setMessage("New password must be at least 8 characters.", true);
    return;
  }

  submitPasswordChangeBtn.disabled = true;
  submitPasswordChangeBtn.textContent = "Updating...";
  try {
    await api("/api/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    changePasswordPanel.classList.add("hidden");
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    setMessage("Password updated successfully.");
  } catch (err) {
    setMessage(err.message, true);
  } finally {
    submitPasswordChangeBtn.disabled = false;
    submitPasswordChangeBtn.textContent = "Update Password";
  }
});

showGeneratedRoutineBtn.addEventListener("click", () => setPlanMode("generated"));
showCustomRoutineBtn.addEventListener("click", () => setPlanMode("custom"));
showDrillLibraryBtn.addEventListener("click", () => setPlanMode("drills"));
showStatsBtn.addEventListener("click", () => setPlanMode("stats"));
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
  if (isGeneratingRoutine) return;

  if (!profileForm.checkValidity()) {
    profileForm.reportValidity();
    setMessage("Complete all required profile fields before generating a routine.", true);
    return;
  }

  try {
    isGeneratingRoutine = true;
    generateRoutineBtn.disabled = true;
    generateRoutineBtn.textContent = "Generating...";
    setMessage("Generating your routine...");

    const profile = getProfileFromForm();
    await api("/api/profile", {
      method: "PUT",
      body: JSON.stringify({ profile })
    });
    setCachedProfile(currentUser?.id, profile);

    const generation = await api("/api/routines/generate", {
      method: "POST",
      body: JSON.stringify({ profile })
    });
    currentRoutine = generation.routine;
    renderRoutine(currentRoutine);
    setMessage("Routine generated with smart rules engine. Save it when ready.");
  } catch (err) {
    setMessage(err.message, true);
  } finally {
    isGeneratingRoutine = false;
    generateRoutineBtn.disabled = false;
    generateRoutineBtn.textContent = "Generate Routine";
  }
});

saveRoutineBtn.addEventListener("click", async () => {
  if (!currentRoutine) return;

  try {
    const customSaveName = saveRoutineNameInput.value.trim();
    const routineToSave = customSaveName
      ? { ...currentRoutine, title: customSaveName }
      : currentRoutine;

    const result = await api("/api/routines", {
      method: "POST",
      body: JSON.stringify({ routine: routineToSave })
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
    clearCachedProfile(currentUser?.id);
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
  saveRoutineNameInput.value = currentRoutine.title;
  setMessage("Demo routine loaded. Save it to your profile if you want.");
});

// Drill Library
async function loadDrillLibrary() {
  if (drillLibraryCache) {
    renderDrillLibrary(drillLibraryCache);
    return;
  }
  try {
    const result = await api("/api/drills");
    drillLibraryCache = result.drills;
    renderDrillLibrary(drillLibraryCache);
  } catch (err) {
    drillLibraryContent.innerHTML = '<p class="empty-state">Could not load drills.</p>';
  }
}

function renderDrillLibrary(drills) {
  const groups = {};
  const weaknessOrder = ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"];
  for (const drill of drills) {
    const primary = drill.weaknesses[0] || "General";
    if (!groups[primary]) groups[primary] = [];
    groups[primary].push(drill);
  }

  drillLibraryContent.innerHTML = "";
  for (const weakness of weaknessOrder) {
    const list = groups[weakness];
    if (!list) continue;

    const cat = document.createElement("div");
    cat.className = "drill-category";

    const header = document.createElement("button");
    header.className = "drill-category-header";
    header.innerHTML = `<span>${weakness}</span><span class="count">${list.length} drills</span>`;
    header.addEventListener("click", () => cat.classList.toggle("open"));

    const ul = document.createElement("ul");
    ul.className = "drill-category-list";

    for (const drill of list) {
      const li = document.createElement("li");
      li.className = "drill-item";
      li.innerHTML = `<p class="drill-item-name">${drill.name}</p>` +
        `<p class="drill-item-tags">${drill.type} • ${drill.levels.join(", ")}</p>` +
        `<p class="drill-item-desc">${drill.description}</p>`;
      li.addEventListener("click", () => li.classList.toggle("expanded"));
      ul.appendChild(li);
    }

    cat.appendChild(header);
    cat.appendChild(ul);
    drillLibraryContent.appendChild(cat);
  }

  // Add general/multi-weakness drills
  const general = drills.filter((d) => d.weaknesses.length > 2);
  if (general.length > 0) {
    const cat = document.createElement("div");
    cat.className = "drill-category";
    const header = document.createElement("button");
    header.className = "drill-category-header";
    header.innerHTML = `<span>Foundation & Cross-Cutting</span><span class="count">${general.length} drills</span>`;
    header.addEventListener("click", () => cat.classList.toggle("open"));
    const ul = document.createElement("ul");
    ul.className = "drill-category-list";
    for (const drill of general) {
      const li = document.createElement("li");
      li.className = "drill-item";
      li.innerHTML = `<p class="drill-item-name">${drill.name}</p>` +
        `<p class="drill-item-tags">${drill.type} • ${drill.levels.join(", ")}</p>` +
        `<p class="drill-item-desc">${drill.description}</p>`;
      li.addEventListener("click", () => li.classList.toggle("expanded"));
      ul.appendChild(li);
    }
    cat.appendChild(header);
    cat.appendChild(ul);
    drillLibraryContent.appendChild(cat);
  }
}

// Performance Dashboard
async function loadStats() {
  if (!currentUser) {
    document.getElementById("statsContent").innerHTML = '<p class="empty-state">Sign in to view your stats.</p>';
    return;
  }
  try {
    const result = await api("/api/stats");
    renderStats(result.stats);
  } catch (err) {
    setMessage(err.message, true);
  }
}

function renderStats(stats) {
  document.getElementById("statRoutines").textContent = stats.totalRoutines;
  document.getElementById("statCompleted").textContent = stats.completedSessions;
  document.getElementById("statStreak").textContent = stats.currentStreak + "d";
  document.getElementById("statLongest").textContent = stats.longestStreak + "d";

  const pct = stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0;
  document.getElementById("statProgressBar").style.width = `${pct}%`;
  document.getElementById("statProgressText").textContent = `${stats.completedSessions} / ${stats.totalSessions} sessions (${pct}%)`;

  const weaknessEl = document.getElementById("statWeakness");
  weaknessEl.innerHTML = "";
  const coverage = stats.weaknessCoverage || {};
  const allWeaknesses = ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"];
  const maxCount = Math.max(1, ...Object.values(coverage));

  for (const w of allWeaknesses) {
    const count = coverage[w] || 0;
    const barPct = Math.round((count / maxCount) * 100);
    const row = document.createElement("div");
    row.className = "weakness-row";
    row.innerHTML = `<span>${w}</span>` +
      `<div class="bar-bg"><div class="bar-fill" style="width:${barPct}%"></div></div>` +
      `<span class="bar-count">${count}</span>`;
    weaknessEl.appendChild(row);
  }
}

// PDF Export
exportPdfBtn.addEventListener("click", () => {
  if (!currentRoutine) return;
  const w = window.open("", "_blank");
  const r = currentRoutine;
  let html = `<!DOCTYPE html><html><head><title>${r.title}</title>` +
    `<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}` +
    `h1{font-size:1.4rem}h2{font-size:1.1rem;margin-top:1.5rem;border-bottom:2px solid #4caf50;padding-bottom:4px}` +
    `.meta{color:#666;font-size:0.9rem}ul{padding-left:1.2rem}li{margin-bottom:6px;font-size:0.9rem}` +
    `.check{color:#4caf50;font-weight:bold}</style></head><body>`;
  html += `<h1>${r.title}</h1><p class="meta">${r.meta}</p>`;
  const completions = r.completions || {};
  r.weeks.forEach((week, wi) => {
    html += `<h2>${week.headline}</h2><ul>`;
    week.sessions.forEach((session, si) => {
      const done = completions[`${wi}-${si}`];
      const mark = done ? '<span class="check"> [done]</span>' : "";
      html += `<li><strong>${session.title}</strong>${mark}: ${session.bullets.join(" ")}</li>`;
    });
    html += "</ul>";
  });
  html += `<script>window.print();<\/script></body></html>`;
  w.document.write(html);
  w.document.close();
});

// iCal Export
exportIcalBtn.addEventListener("click", () => {
  if (!currentRoutine) return;
  const r = currentRoutine;
  const now = new Date();
  let ical = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//thegolfbuild//EN\r\nCALSCALE:GREGORIAN\r\n";

  r.weeks.forEach((week, wi) => {
    week.sessions.forEach((session, si) => {
      const dayOffset = wi * 7 + si;
      const start = new Date(now);
      start.setDate(start.getDate() + dayOffset);
      const dateStr = start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const endDate = new Date(start.getTime() + (r.profileSnapshot?.hoursPerSession || 1.5) * 3600000);
      const endStr = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const desc = session.bullets.join("\\n").replace(/,/g, "\\,");
      ical += "BEGIN:VEVENT\r\n";
      ical += `DTSTART:${dateStr}\r\n`;
      ical += `DTEND:${endStr}\r\n`;
      ical += `SUMMARY:${r.title} - ${week.headline} ${session.title}\r\n`;
      ical += `DESCRIPTION:${desc}\r\n`;
      ical += `UID:${r.id || "demo"}-${wi}-${si}@thegolfbuild\r\n`;
      ical += "END:VEVENT\r\n";
    });
  });

  ical += "END:VCALENDAR\r\n";
  const blob = new Blob([ical], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(r.title || "routine").replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
});

customRoutineForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    currentRoutine = buildCustomRoutine();
    renderRoutine(currentRoutine);
    saveRoutineNameInput.value = currentRoutine.title;
    setMessage("Custom routine created. Save it to your profile.");
  } catch (err) {
    setMessage(err.message, true);
  }
});

(async function init() {
  setPlanMode("generated");
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
