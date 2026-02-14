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
const userMenuWrap = document.getElementById("userMenuWrap");
const userMenuBtn = document.getElementById("userMenuBtn");
const userMenuDropdown = document.getElementById("userMenuDropdown");
const userMenuName = document.getElementById("userMenuName");
const welcomeMessage = document.getElementById("welcomeMessage");
const topLogoutBtn = document.getElementById("topLogoutBtn");
const topMessage = document.getElementById("topMessage");

const confirmModal = document.getElementById("confirmModal");
const confirmModalClose = document.getElementById("confirmModalClose");
const confirmModalTitle = document.getElementById("confirmModalTitle");
const confirmModalMessage = document.getElementById("confirmModalMessage");
const confirmModalOk = document.getElementById("confirmModalOk");
const confirmModalCancel = document.getElementById("confirmModalCancel");

const showSavedBtn = document.getElementById("showSavedBtn");
const savedPanel = document.querySelector(".saved-panel");
const drillSearchInput = document.getElementById("drillSearchInput");
const drillResultCount = document.getElementById("drillResultCount");
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
const toastContainer = document.getElementById("toastContainer");
const onboardingOverlay = document.getElementById("onboardingOverlay");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const drillModal = document.getElementById("drillModal");
const drillModalClose = document.getElementById("drillModalClose");
const drillModalName = document.getElementById("drillModalName");
const drillModalBadges = document.getElementById("drillModalBadges");
const drillModalDesc = document.getElementById("drillModalDesc");
const drillModalSwap = document.getElementById("drillModalSwap");
const drillModalAlternatives = document.getElementById("drillModalAlternatives");
const reflectionModal = document.getElementById("reflectionModal");
const reflectionModalClose = document.getElementById("reflectionModalClose");
const reflectionStars = document.getElementById("reflectionStars");
const reflectionNote = document.getElementById("reflectionNote");
const reflectionTags = document.getElementById("reflectionTags");
const reflectionSaveBtn = document.getElementById("reflectionSaveBtn");
const reflectionSkipBtn = document.getElementById("reflectionSkipBtn");

let currentRoutine = null;
let currentUser = null;
let savedRoutines = [];
let isRegisterMode = false;
let isGeneratingRoutine = false;
let activePlanMode = "generated";
let drillLibraryCache = null;
let pendingReflection = null;
const FREE_ROUTINE_LIMIT = 5;

// ===== Theme Toggle =====
function initTheme() {
  const saved = localStorage.getItem("thegolfbuild_theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  themeIcon.textContent = saved === "light" ? "\u263E" : "\u2606";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = saved === "light" ? "#f5f7f5" : "#070707";
}

themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("thegolfbuild_theme", next);
  themeIcon.textContent = next === "light" ? "\u263E" : "\u2606";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = next === "light" ? "#f5f7f5" : "#070707";
});

// ===== Confirm Modal =====
let confirmCallback = null;

function openConfirmModal(title, message, onConfirm) {
  confirmModalTitle.textContent = title;
  confirmModalMessage.textContent = message;
  confirmCallback = onConfirm;
  confirmModal.classList.remove("hidden");
}

function closeConfirmModal() {
  confirmModal.classList.add("hidden");
  confirmCallback = null;
}

confirmModalOk.addEventListener("click", () => {
  if (confirmCallback) confirmCallback();
  closeConfirmModal();
});

confirmModalCancel.addEventListener("click", closeConfirmModal);
confirmModalClose.addEventListener("click", closeConfirmModal);
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) closeConfirmModal();
});

// ===== User Menu =====
userMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  userMenuDropdown.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!userMenuWrap.contains(e.target)) {
    userMenuDropdown.classList.add("hidden");
  }
});

// ===== Escape Key for Modals =====
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!confirmModal.classList.contains("hidden")) { closeConfirmModal(); return; }
    if (!reflectionModal.classList.contains("hidden")) { closeReflectionModal(); return; }
    if (!drillModal.classList.contains("hidden")) { closeDrillModal(); return; }
    if (!userMenuDropdown.classList.contains("hidden")) {
      userMenuDropdown.classList.add("hidden");
      return;
    }
    if (!onboardingOverlay.classList.contains("hidden")) {
      onboardingOverlay.classList.add("hidden");
      localStorage.setItem("thegolfbuild_onboarded", "1");
    }
  }
});

// ===== Password Visibility Toggle =====
document.querySelectorAll(".password-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.textContent = isPassword ? "\u25C9" : "\u25CE";
    btn.title = isPassword ? "Hide password" : "Show password";
  });
});

// ===== Saved Routines Sort =====
let savedSortMode = "newest";

document.querySelectorAll(".sort-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sort-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    savedSortMode = btn.dataset.sort;
    renderSavedRoutines();
  });
});

function getSortedRoutines() {
  const sorted = [...savedRoutines];
  switch (savedSortMode) {
    case "oldest":
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case "name":
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      break;
    case "progress":
      sorted.sort((a, b) => routineProgress(b).pct - routineProgress(a).pct);
      break;
    default:
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return sorted;
}

// ===== Drill Search & Filter =====
let activeDrillFilters = { type: null, level: null };

drillSearchInput.addEventListener("input", filterDrills);

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const filterType = chip.dataset.filterType;
    const filterValue = chip.dataset.filterValue;
    if (activeDrillFilters[filterType] === filterValue) {
      activeDrillFilters[filterType] = null;
      chip.classList.remove("active");
    } else {
      document.querySelectorAll(`.filter-chip[data-filter-type="${filterType}"]`).forEach((c) => c.classList.remove("active"));
      activeDrillFilters[filterType] = filterValue;
      chip.classList.add("active");
    }
    filterDrills();
  });
});

function filterDrills() {
  if (!drillLibraryCache) return;
  const search = drillSearchInput.value.trim().toLowerCase();
  const filtered = drillLibraryCache.filter((drill) => {
    if (search && !drill.name.toLowerCase().includes(search) && !drill.description.toLowerCase().includes(search)) return false;
    if (activeDrillFilters.type && drill.type !== activeDrillFilters.type) return false;
    if (activeDrillFilters.level && !drill.levels.some((l) => l.toLowerCase() === activeDrillFilters.level)) return false;
    return true;
  });
  drillResultCount.textContent = `${filtered.length} of ${drillLibraryCache.length} drills`;
  renderDrillLibrary(filtered);
}

// ===== Skeleton Helpers =====
function showSkeleton(container, type) {
  container.innerHTML = "";
  if (type === "drills") {
    for (let i = 0; i < 5; i++) {
      const card = document.createElement("div");
      card.className = "skeleton-card skeleton";
      card.innerHTML = '<div class="skeleton-line long skeleton"></div><div class="skeleton-line short skeleton"></div>';
      container.appendChild(card);
    }
  } else if (type === "stats") {
    const grid = document.createElement("div");
    grid.className = "stats-grid";
    for (let i = 0; i < 4; i++) {
      const s = document.createElement("div");
      s.className = "skeleton-stat skeleton";
      grid.appendChild(s);
    }
    container.appendChild(grid);
    const detail = document.createElement("div");
    detail.className = "skeleton-card skeleton";
    detail.style.height = "80px";
    detail.style.marginTop = "0.8rem";
    container.appendChild(detail);
  } else {
    for (let i = 0; i < 3; i++) {
      const card = document.createElement("div");
      card.className = "skeleton-card skeleton";
      card.innerHTML = '<div class="skeleton-line medium skeleton"></div><div class="skeleton-line short skeleton"></div>';
      container.appendChild(card);
    }
  }
}

// ===== Drill Detail Modal =====
function openDrillModal(drill) {
  drillModalName.textContent = drill.name;
  drillModalDesc.textContent = drill.description;

  drillModalBadges.innerHTML = "";
  const typeBadge = document.createElement("span");
  typeBadge.className = `modal-badge type-${drill.type}`;
  typeBadge.textContent = drill.type;
  drillModalBadges.appendChild(typeBadge);

  drill.levels.forEach((lvl) => {
    const b = document.createElement("span");
    b.className = "modal-badge";
    b.textContent = lvl;
    drillModalBadges.appendChild(b);
  });

  drill.weaknesses.forEach((w) => {
    const b = document.createElement("span");
    b.className = "modal-badge";
    b.textContent = w;
    drillModalBadges.appendChild(b);
  });

  // Populate swap alternatives
  if (drillLibraryCache) {
    const alts = drillLibraryCache.filter(
      (d) => d.id !== drill.id && d.weaknesses.some((w) => drill.weaknesses.includes(w)) && d.type === drill.type
    ).slice(0, 4);
    if (alts.length > 0) {
      drillModalSwap.classList.remove("hidden");
      drillModalAlternatives.innerHTML = "";
      alts.forEach((alt) => {
        const btn = document.createElement("button");
        btn.className = "modal-alt-btn";
        btn.textContent = `${alt.name} (${alt.levels.join(", ")})`;
        btn.addEventListener("click", () => openDrillModal(alt));
        drillModalAlternatives.appendChild(btn);
      });
    } else {
      drillModalSwap.classList.add("hidden");
    }
  } else {
    drillModalSwap.classList.add("hidden");
  }

  drillModal.classList.remove("hidden");
}

function closeDrillModal() {
  drillModal.classList.add("hidden");
}

drillModalClose.addEventListener("click", closeDrillModal);
drillModal.addEventListener("click", (e) => {
  if (e.target === drillModal) closeDrillModal();
});

// ===== Reflection Modal =====
let reflectionRating = 0;
let reflectionSelectedTags = new Set();

reflectionStars.addEventListener("click", (e) => {
  const star = e.target.closest(".star");
  if (!star) return;
  reflectionRating = Number(star.dataset.val);
  reflectionStars.querySelectorAll(".star").forEach((s) => {
    s.classList.toggle("active", Number(s.dataset.val) <= reflectionRating);
  });
});

reflectionTags.addEventListener("click", (e) => {
  const btn = e.target.closest(".tag-btn");
  if (!btn) return;
  const tag = btn.dataset.tag;
  if (reflectionSelectedTags.has(tag)) {
    reflectionSelectedTags.delete(tag);
    btn.classList.remove("selected");
  } else {
    reflectionSelectedTags.add(tag);
    btn.classList.add("selected");
  }
});

function openReflectionModal(routineId, key) {
  reflectionRating = 0;
  reflectionSelectedTags.clear();
  reflectionNote.value = "";
  reflectionStars.querySelectorAll(".star").forEach((s) => s.classList.remove("active"));
  reflectionTags.querySelectorAll(".tag-btn").forEach((b) => b.classList.remove("selected"));
  pendingReflection = { routineId, key };
  reflectionModal.classList.remove("hidden");
}

function closeReflectionModal() {
  reflectionModal.classList.add("hidden");
  pendingReflection = null;
}

reflectionModalClose.addEventListener("click", closeReflectionModal);
reflectionModal.addEventListener("click", (e) => {
  if (e.target === reflectionModal) closeReflectionModal();
});

reflectionSkipBtn.addEventListener("click", closeReflectionModal);

reflectionSaveBtn.addEventListener("click", async () => {
  if (!pendingReflection) return;
  const { routineId, key } = pendingReflection;
  const reflection = {
    rating: reflectionRating,
    note: reflectionNote.value.trim(),
    tags: Array.from(reflectionSelectedTags),
    date: new Date().toISOString()
  };

  try {
    await api(`/api/routines/${routineId}`, {
      method: "PUT",
      body: JSON.stringify({ reflections: { [key]: reflection } })
    });

    const idx = savedRoutines.findIndex((r) => r.id === routineId);
    if (idx !== -1) {
      if (!savedRoutines[idx].reflections) savedRoutines[idx].reflections = {};
      savedRoutines[idx].reflections[key] = reflection;
    }
    if (currentRoutine?.id === routineId) {
      if (!currentRoutine.reflections) currentRoutine.reflections = {};
      currentRoutine.reflections[key] = reflection;
    }
    showToast("Reflection saved.");
  } catch (err) {
    setMessage(err.message, true);
  }
  closeReflectionModal();
});

// ===== Drag and Drop =====
let dragSrcEl = null;
let dragSrcContainer = null;

function initDragDrop(container, onReorder) {
  const items = container.querySelectorAll("[data-drag-idx]");
  items.forEach((item) => {
    item.setAttribute("draggable", "true");

    item.addEventListener("dragstart", (e) => {
      dragSrcEl = item;
      dragSrcContainer = container;
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", item.dataset.dragIdx);
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      container.querySelectorAll("[data-drag-idx]").forEach((el) => el.classList.remove("drag-over"));
      dragSrcEl = null;
      dragSrcContainer = null;
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragSrcEl !== item && dragSrcContainer === container) {
        container.querySelectorAll("[data-drag-idx]").forEach((el) => el.classList.remove("drag-over"));
        item.classList.add("drag-over");
      }
    });

    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over");
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over");
      if (dragSrcEl && dragSrcEl !== item && dragSrcContainer === container) {
        const fromIdx = Number(dragSrcEl.dataset.dragIdx);
        const toIdx = Number(item.dataset.dragIdx);
        onReorder(fromIdx, toIdx);
      }
    });
  });
}

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

function showToast(message, isError = false) {
  if (!message) return;
  const toast = document.createElement("div");
  toast.className = `toast ${isError ? "error" : "success"}`;
  const text = document.createElement("span");
  text.textContent = message;
  const dismiss = document.createElement("button");
  dismiss.className = "toast-dismiss";
  dismiss.textContent = "\u00d7";
  dismiss.addEventListener("click", () => removeToast(toast));
  toast.appendChild(text);
  toast.appendChild(dismiss);
  toastContainer.appendChild(toast);
  setTimeout(() => removeToast(toast), 4000);
}

function removeToast(toast) {
  if (!toast.parentNode) return;
  toast.classList.add("removing");
  setTimeout(() => toast.remove(), 250);
}

function setMessage(message, isError = false) {
  appMessage.textContent = message;
  appMessage.classList.toggle("error", isError);
  if (message) showToast(message, isError);
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
  const profilePanel = document.querySelector(".profile-panel");

  generatedRoutineView.classList.add("hidden");
  customRoutineView.classList.add("hidden");
  drillLibraryPanel.classList.add("hidden");
  statsPanel.classList.add("hidden");
  savedPanel.classList.add("hidden");
  planPanel.classList.add("hidden");
  profilePanel.classList.add("hidden");

  showGeneratedRoutineBtn.classList.remove("active");
  showCustomRoutineBtn.classList.remove("active");
  showDrillLibraryBtn.classList.remove("active");
  showStatsBtn.classList.remove("active");
  showSavedBtn.classList.remove("active");

  if (mode === "custom") {
    planPanel.classList.remove("hidden");
    profilePanel.classList.remove("hidden");
    customRoutineView.classList.remove("hidden");
    showCustomRoutineBtn.classList.add("active");
    planPanelTitle.textContent = "Custom Practice Routine";
  } else if (mode === "drills") {
    drillLibraryPanel.classList.remove("hidden");
    showDrillLibraryBtn.classList.add("active");
    loadDrillLibrary();
  } else if (mode === "stats") {
    statsPanel.classList.remove("hidden");
    showStatsBtn.classList.add("active");
    loadStats();
  } else if (mode === "saved") {
    savedPanel.classList.remove("hidden");
    showSavedBtn.classList.add("active");
  } else {
    planPanel.classList.remove("hidden");
    profilePanel.classList.remove("hidden");
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
  showSavedBtn.disabled = locked;
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

function parseBulletType(bullet) {
  const lower = bullet.toLowerCase();
  if (lower.includes("warm-up") || lower.includes("warm up")) return "warmup";
  if (lower.includes("technical")) return "technical";
  if (lower.includes("pressure")) return "pressure";
  if (lower.includes("transfer")) return "transfer";
  if (lower.includes("reflection")) return "reflection";
  return "technical";
}

function parseBulletDuration(bullet) {
  const match = bullet.match(/^(\d+)\s*min/);
  return match ? match[1] + " min" : "";
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

    const weekHeader = document.createElement("div");
    weekHeader.className = "week-header";
    const heading = document.createElement("h3");
    heading.textContent = week.headline;
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "week-toggle";
    toggleBtn.type = "button";
    toggleBtn.textContent = "\u25BC";
    toggleBtn.title = "Collapse/expand week";
    weekHeader.appendChild(heading);
    weekHeader.appendChild(toggleBtn);
    weekHeader.addEventListener("click", () => block.classList.toggle("collapsed"));
    block.appendChild(weekHeader);

    const sessionsContainer = document.createElement("div");
    sessionsContainer.className = "week-sessions";

    let weekDone = 0;
    const weekTotal = (week.sessions || []).length;

    week.sessions.forEach((session, si) => {
      const key = `${wi}-${si}`;
      const done = Boolean(completions[key]);
      if (done) weekDone += 1;

      const card = document.createElement("div");
      card.className = "session-card" + (done ? " completed" : "");
      if (isSaved) card.setAttribute("data-drag-idx", si);

      // Header with drag handle, checkbox, and title
      const header = document.createElement("div");
      header.className = "session-card-header";

      if (isSaved) {
        const handle = document.createElement("span");
        handle.className = "drag-handle";
        handle.textContent = "\u2261";
        handle.title = "Drag to reorder";
        header.appendChild(handle);

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = done;
        cb.id = `sc-${wi}-${si}`;
        cb.addEventListener("change", () => toggleCompletion(routine.id, key, wi, weekTotal));
        header.appendChild(cb);
      }

      const titleWrap = document.createElement("div");
      titleWrap.className = "session-card-title";
      const titleLabel = document.createElement("label");
      if (isSaved) titleLabel.setAttribute("for", `sc-${wi}-${si}`);
      titleLabel.textContent = session.title;
      titleWrap.appendChild(titleLabel);
      header.appendChild(titleWrap);

      // Reflection badge
      const reflections = routine.reflections || {};
      const ref = reflections[key];
      if (ref && ref.rating > 0) {
        const badge = document.createElement("span");
        badge.className = "session-reflection-badge";
        badge.innerHTML = `<span class="badge-stars">${"\u2605".repeat(ref.rating)}</span>`;
        header.appendChild(badge);
      }

      card.appendChild(header);

      // Body with structured drill blocks
      const body = document.createElement("div");
      body.className = "session-card-body";

      session.bullets.forEach((bullet) => {
        const drillBlock = document.createElement("div");
        drillBlock.className = "drill-block";

        const type = parseBulletType(bullet);
        const duration = parseBulletDuration(bullet);

        const chip = document.createElement("span");
        chip.className = `drill-chip ${type}`;
        chip.textContent = duration || type;
        drillBlock.appendChild(chip);

        const text = document.createElement("span");
        text.className = "drill-text";
        const bulletText = bullet.replace(/^\d+\s*min\s*/, "");
        // Try to find drill name in the bullet and make it clickable
        const drillMatch = drillLibraryCache ? drillLibraryCache.find((d) => bulletText.includes(d.name)) : null;
        if (drillMatch) {
          const parts = bulletText.split(drillMatch.name);
          if (parts[0]) text.appendChild(document.createTextNode(parts[0]));
          const link = document.createElement("a");
          link.className = "drill-link";
          link.textContent = drillMatch.name;
          link.href = "#";
          link.addEventListener("click", (e) => { e.preventDefault(); openDrillModal(drillMatch); });
          text.appendChild(link);
          if (parts[1]) text.appendChild(document.createTextNode(parts[1]));
        } else {
          text.textContent = bulletText;
        }
        drillBlock.appendChild(text);

        body.appendChild(drillBlock);
      });

      card.appendChild(body);

      // Reflection note below session card body
      const reflections2 = routine.reflections || {};
      const ref2 = reflections2[key];
      if (ref2 && ref2.note) {
        const noteEl = document.createElement("div");
        noteEl.className = "session-reflection-note";
        noteEl.textContent = ref2.note;
        card.appendChild(noteEl);
      }

      sessionsContainer.appendChild(card);
    });

    block.appendChild(sessionsContainer);

    if (isSaved && weekTotal > 0) {
      const pct = Math.round((weekDone / weekTotal) * 100);
      const prog = document.createElement("div");
      prog.className = "week-progress";
      prog.innerHTML = `<div class="progress-bar-wrap"><div class="progress-bar" style="width:${pct}%"></div></div>` +
        `<p class="week-progress-text">${weekDone}/${weekTotal} sessions complete</p>`;
      block.appendChild(prog);

      // Init drag-drop for session reordering
      initDragDrop(sessionsContainer, async (fromIdx, toIdx) => {
        const sessions = routine.weeks[wi].sessions;
        const [moved] = sessions.splice(fromIdx, 1);
        sessions.splice(toIdx, 0, moved);
        renderRoutine(routine);
        if (routine.id) {
          try {
            await api(`/api/routines/${routine.id}`, {
              method: "PUT",
              body: JSON.stringify({ weeks: routine.weeks })
            });
          } catch (_err) { /* silent */ }
        }
      });
    }

    routineWeeks.appendChild(block);
  });

  routineCard.classList.remove("hidden");
  routineEmptyState.classList.add("hidden");
  saveRoutineNameInput.value = routine.title || "";
  saveRoutineNameInput.placeholder = `Save as (optional title) • ${routine.title}`;
}

async function toggleCompletion(routineId, key, weekIndex, weekTotal) {
  try {
    // Check if we're completing (not uncompleting)
    const routine = savedRoutines.find((r) => r.id === routineId) || currentRoutine;
    const wasCompleted = routine?.completions?.[key];

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

    // Show reflection modal when completing (not uncompleting)
    if (!wasCompleted && updated.completions?.[key]) {
      openReflectionModal(routineId, key);
    }

    // Check if entire week is now complete for confetti
    if (weekIndex !== undefined && weekTotal) {
      const completions = updated.completions || {};
      let weekDone = 0;
      for (let si = 0; si < weekTotal; si++) {
        if (completions[`${weekIndex}-${si}`]) weekDone += 1;
      }
      if (weekDone === weekTotal) {
        spawnConfetti();
        showToast("Week complete! Great work.");
      }
    }
  } catch (err) {
    setMessage(err.message, true);
  }
}

function spawnConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  const colors = ["#4caf50", "#ffb74d", "#42a5f5", "#ef5350", "#ab47bc", "#fff"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${20 + Math.random() * 30}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${0.8 + Math.random() * 0.8}s`;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 2000);
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

  getSortedRoutines().forEach((routine) => {
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

    wrapper.querySelector(".delete-btn").addEventListener("click", () => {
      openConfirmModal("Delete Routine", `Are you sure you want to delete "${routine.title}"? This cannot be undone.`, async () => {
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
  userMenuWrap.classList.toggle("hidden", !isAuthed);
  loadDemoBtn.classList.toggle("hidden", isAuthed);
  if (isAuthed) {
    userMenuName.textContent = getDisplayFirstName();
    welcomeMessage.textContent = `Let's get better today, ${getDisplayFirstName()}`;
  } else {
    userMenuName.textContent = "";
    welcomeMessage.textContent = "";
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
showSavedBtn.addEventListener("click", () => setPlanMode("saved"));

document.getElementById("loadDemoBtnInline").addEventListener("click", () => {
  loadDemoBtn.click();
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

clearProfileBtn.addEventListener("click", () => {
  if (!currentUser) return;

  openConfirmModal("Clear Profile", "Are you sure you want to clear your profile? Your saved routines will not be affected.", async () => {
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
  showSkeleton(drillLibraryContent, "drills");
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
      li.className = "drill-item drag-source";
      li.setAttribute("draggable", "true");
      li.dataset.drillId = drill.id;
      li.innerHTML = `<p class="drill-item-name">${drill.name}</p>` +
        `<p class="drill-item-tags">${drill.type} • ${drill.levels.join(", ")}</p>` +
        `<p class="drill-item-desc">${drill.description}</p>`;
      li.addEventListener("click", (e) => {
        if (e.target.closest(".drill-item-name")) {
          openDrillModal(drill);
        } else {
          li.classList.toggle("expanded");
        }
      });
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", drill.name);
        e.dataTransfer.setData("application/x-drill", JSON.stringify(drill));
        e.dataTransfer.effectAllowed = "copy";
      });
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
      li.className = "drill-item drag-source";
      li.setAttribute("draggable", "true");
      li.dataset.drillId = drill.id;
      li.innerHTML = `<p class="drill-item-name">${drill.name}</p>` +
        `<p class="drill-item-tags">${drill.type} • ${drill.levels.join(", ")}</p>` +
        `<p class="drill-item-desc">${drill.description}</p>`;
      li.addEventListener("click", (e) => {
        if (e.target.closest(".drill-item-name")) {
          openDrillModal(drill);
        } else {
          li.classList.toggle("expanded");
        }
      });
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", drill.name);
        e.dataTransfer.setData("application/x-drill", JSON.stringify(drill));
        e.dataTransfer.effectAllowed = "copy";
      });
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
  const statsContent = document.getElementById("statsContent");
  showSkeleton(statsContent, "stats");
  try {
    const result = await api("/api/stats");
    // Restore stats HTML structure before rendering
    statsContent.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card"><p class="stat-value" id="statRoutines">-</p><p class="stat-label">Routines Saved</p></div>
        <div class="stat-card"><p class="stat-value" id="statCompleted">-</p><p class="stat-label">Sessions Completed</p></div>
        <div class="stat-card"><p class="stat-value" id="statStreak">-</p><p class="stat-label">Current Streak</p></div>
        <div class="stat-card"><p class="stat-value" id="statLongest">-</p><p class="stat-label">Longest Streak</p></div>
      </div>
      <div class="stats-detail"><h3>Session Progress</h3><div class="progress-bar-wrap"><div id="statProgressBar" class="progress-bar" style="width:0%"></div></div><p id="statProgressText" class="stat-progress-text">0 / 0 sessions</p></div>
      <div class="stats-detail"><h3>Weakness Coverage</h3><div id="statWeakness" class="weakness-chart"></div></div>
    `;
    renderStats(result.stats);
    renderEnhancedStats(result.stats);
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

function renderEnhancedStats(stats) {
  const statsContent = document.getElementById("statsContent");

  // Streak Context
  const streak = stats.currentStreak || 0;
  let streakMsg = "Start practicing to build a streak!";
  if (streak >= 14) streakMsg = `${streak} day streak - unstoppable!`;
  else if (streak >= 7) streakMsg = `${streak} day streak - incredible consistency!`;
  else if (streak >= 5) streakMsg = `${streak} day streak - you're on fire!`;
  else if (streak >= 3) streakMsg = `${streak} day streak - building momentum!`;
  else if (streak >= 1) streakMsg = `${streak} day streak - keep it going!`;

  const streakEl = document.createElement("div");
  streakEl.className = "streak-context";
  streakEl.innerHTML = `<p class="streak-label">${streakMsg}</p>`;
  statsContent.appendChild(streakEl);

  // Average Reflection Rating
  const allReflections = [];
  for (const routine of savedRoutines) {
    if (routine.reflections) {
      for (const key of Object.keys(routine.reflections)) {
        allReflections.push(routine.reflections[key]);
      }
    }
  }

  const ratingsWithValue = allReflections.filter((r) => r.rating > 0);
  const avgRating = ratingsWithValue.length > 0
    ? ratingsWithValue.reduce((sum, r) => sum + r.rating, 0) / ratingsWithValue.length
    : 0;

  const avgSection = document.createElement("div");
  avgSection.className = "avg-rating-section";
  const fullStars = Math.floor(avgRating);
  const hasHalf = avgRating - fullStars >= 0.5;
  let starStr = "\u2605".repeat(fullStars) + (hasHalf ? "\u00BD" : "") + "\u2606".repeat(5 - fullStars - (hasHalf ? 1 : 0));
  avgSection.innerHTML = `<h3>Average Reflection Rating</h3>` +
    `<div class="avg-rating-display">` +
    `<span class="avg-rating-stars">${starStr}</span>` +
    `<span class="avg-rating-value">${avgRating > 0 ? avgRating.toFixed(1) : "-"} / 5</span>` +
    `<span style="color:var(--muted);font-size:0.82rem">(${ratingsWithValue.length} reflections)</span>` +
    `</div>`;
  statsContent.appendChild(avgSection);

  // Practice Log - last 10 reflections
  if (allReflections.length > 0) {
    const sorted = [...allReflections].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    const logEl = document.createElement("div");
    logEl.className = "practice-log";
    let logHtml = "<h3>Practice Log</h3><div class='practice-log-list'>";
    for (const ref of sorted) {
      const date = new Date(ref.date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const stars = "\u2605".repeat(ref.rating || 0) + "\u2606".repeat(5 - (ref.rating || 0));
      const tags = (ref.tags || []).map((t) => `<span class="practice-log-tag">${t}</span>`).join("");
      logHtml += `<div class="practice-log-entry">` +
        `<span class="practice-log-date">${date}</span>` +
        `<span class="practice-log-stars">${stars}</span>` +
        `<div class="practice-log-tags">${tags}</div>` +
        `<span class="practice-log-note">${ref.note || ""}</span>` +
        `</div>`;
    }
    logHtml += "</div>";
    logEl.innerHTML = logHtml;
    statsContent.appendChild(logEl);
  }

  // Calendar Heatmap - current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const activityDays = new Set();
  for (const ref of allReflections) {
    const d = new Date(ref.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      activityDays.add(d.getDate());
    }
  }

  const calEl = document.createElement("div");
  calEl.className = "calendar-heatmap";
  const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  let calHtml = `<h3>${monthName}</h3><div class="cal-grid">`;
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (const label of dayLabels) {
    calHtml += `<div class="cal-day-label">${label}</div>`;
  }
  for (let i = 0; i < firstDayOfWeek; i++) {
    calHtml += `<div class="cal-day empty"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate();
    const hasActivity = activityDays.has(d);
    const cls = ["cal-day"];
    if (isToday) cls.push("today");
    if (hasActivity) cls.push("has-activity");
    calHtml += `<div class="${cls.join(" ")}">${d}</div>`;
  }
  calHtml += "</div>";
  calEl.innerHTML = calHtml;
  statsContent.appendChild(calEl);
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

// Onboarding
function initOnboarding() {
  const key = "thegolfbuild_onboarded";
  if (localStorage.getItem(key)) return;

  onboardingOverlay.classList.remove("hidden");
  function closeOnboarding() {
    onboardingOverlay.classList.add("hidden");
    localStorage.setItem(key, "1");
  }

  let step = 0;
  const steps = onboardingOverlay.querySelectorAll(".onboarding-step");
  const dots = onboardingOverlay.querySelectorAll(".onboarding-dot");
  const nextBtn = document.getElementById("onboardingNext");
  const skipBtn = document.getElementById("onboardingSkip");
  const closeBtn = document.getElementById("onboardingClose");

  if (!nextBtn || !skipBtn || !closeBtn || !steps.length || !dots.length) {
    closeOnboarding();
    return;
  }

  function showStep(n) {
    steps.forEach((s, i) => s.classList.toggle("active", i === n));
    dots.forEach((d, i) => d.classList.toggle("active", i === n));
    nextBtn.textContent = n === steps.length - 1 ? "Get Started" : "Next";
  }

  nextBtn.addEventListener("click", () => {
    step += 1;
    if (step >= steps.length) {
      closeOnboarding();
    } else {
      showStep(step);
    }
  });

  skipBtn.addEventListener("click", closeOnboarding);
  closeBtn.addEventListener("click", closeOnboarding);
  onboardingOverlay.addEventListener("click", (event) => {
    if (event.target === onboardingOverlay) closeOnboarding();
  });
}

(async function init() {
  initOnboarding();
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
