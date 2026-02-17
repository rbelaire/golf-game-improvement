const STORAGE_KEYS = {
  token: "thegolfbuild_auth_token",
  legacyTokens: ["under_par_lab_auth_token", "golfos_auth_token"]
};
const selectedDrillsStore = window.SelectedDrillsStore || null;

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
const profileFormWrap = document.getElementById("profileFormWrap");
const profileSummary = document.getElementById("profileSummary");
const editProfileBtn = document.getElementById("editProfileBtn");
const summaryGenerateBtn = document.getElementById("summaryGenerateBtn");
const generateRoutineBtn = document.getElementById("generateRoutineBtn");
const clearProfileBtn = document.getElementById("clearProfileBtn");
const loadDemoBtn = document.getElementById("loadDemoBtn");
const showGeneratedRoutineBtn = document.getElementById("showGeneratedRoutineBtn");
const showCustomRoutineBtn = document.getElementById("showCustomRoutineBtn");
const generatedRoutineView = document.getElementById("generatedRoutineView");
const customRoutineView = document.getElementById("customRoutineView");
const planGeneratedView = document.getElementById("planGeneratedView");
const planSegGenerated = document.getElementById("planSegGenerated");
const planSegCustom = document.getElementById("planSegCustom");
const routineLibraryActions = document.getElementById("routineLibraryActions");
const openGenerateFlowBtn = document.getElementById("openGenerateFlowBtn");
const openCustomFlowBtn = document.getElementById("openCustomFlowBtn");
const routineCreateFlowHeader = document.getElementById("routineCreateFlowHeader");
const closeRoutineCreateFlowBtn = document.getElementById("closeRoutineCreateFlowBtn");
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

const drillSearchInput = document.getElementById("drillSearchInput");
const drillResultCount = document.getElementById("drillResultCount");
const selectedDrillsBtn = document.getElementById("selectedDrillsBtn");
const saveRoutineBtn = document.getElementById("saveRoutineBtn");
const routineTitleInput = document.getElementById("routineTitle");
const upgradeBtn = document.getElementById("upgradeBtn");
const usageText = document.getElementById("usageText");

const routineEmptyState = document.getElementById("routineEmptyState");
const routineCard = document.getElementById("routineCard");
const routineMeta = document.getElementById("routineMeta");
const routineWeeks = document.getElementById("routineWeeks");

const routineSwitcherModal = document.getElementById("routineSwitcherModal");
const switcherModalClose = document.getElementById("switcherModalClose");
const switcherEmptyState = document.getElementById("switcherEmptyState");
const switcherList = document.getElementById("switcherList");
const changeRoutineBtn = document.getElementById("changeRoutineBtn");

const showDrillLibraryBtn = document.getElementById("showDrillLibraryBtn");
const showStatsBtn = document.getElementById("showStatsBtn");
const showAdminBtn = document.getElementById("showAdminBtn");
const drillLibraryPanel = document.getElementById("drillLibraryPanel");
const drillLibraryContent = document.getElementById("drillLibraryContent");
const statsPanel = document.getElementById("statsPanel");
const adminPanel = document.getElementById("adminPanel");
const adminUserCount = document.getElementById("adminUserCount");
const adminRefreshBtn = document.getElementById("adminRefreshBtn");
const adminUsersBody = document.getElementById("adminUsersBody");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportIcalBtn = document.getElementById("exportIcalBtn");
const toastContainer = document.getElementById("toastContainer");
const onboardingOverlay = document.getElementById("onboardingOverlay");

const showHomeBtn = document.getElementById("showHomeBtn");
const homePanel = document.getElementById("homePanel");
const homeOnboarding = document.getElementById("homeOnboarding");
const homeDashboard = document.getElementById("homeDashboard");
const homeChecklistSteps = document.getElementById("homeChecklistSteps");
const homeSetupSection = document.getElementById("homeSetupSection");
const homeSetupChecklistSteps = document.getElementById("homeSetupChecklistSteps");
const homeProfileBar = document.getElementById("homeProfileBar");
const homeTodayCard = document.getElementById("homeTodayCard");
const homeProgressGrid = document.getElementById("homeProgressGrid");
const homeQuickActions = document.getElementById("homeQuickActions");
const homeRecentRoutines = document.getElementById("homeRecentRoutines");
const homeSessionRunner = document.getElementById("homeSessionRunner");
const runnerBackBtn = document.getElementById("runnerBackBtn");
const runnerHeader = document.getElementById("runnerHeader");
const runnerDrills = document.getElementById("runnerDrills");
const runnerProgressText = document.getElementById("runnerProgressText");
const runnerProgressPct = document.getElementById("runnerProgressPct");
const runnerProgressBar = document.getElementById("runnerProgressBar");
const runnerCompleteBtn = document.getElementById("runnerCompleteBtn");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const drillModal = document.getElementById("drillModal");
const drillModalClose = document.getElementById("drillModalClose");
const drillModalName = document.getElementById("drillModalName");
const drillModalBadges = document.getElementById("drillModalBadges");
const drillModalDesc = document.getElementById("drillModalDesc");
const drillModalActions = document.getElementById("drillModalActions");
const drillModalSwap = document.getElementById("drillModalSwap");
const drillModalAlternatives = document.getElementById("drillModalAlternatives");
const reflectionModal = document.getElementById("reflectionModal");
const reflectionModalClose = document.getElementById("reflectionModalClose");
const reflectionStars = document.getElementById("reflectionStars");
const reflectionNote = document.getElementById("reflectionNote");
const reflectionTags = document.getElementById("reflectionTags");
const reflectionSaveBtn = document.getElementById("reflectionSaveBtn");
const reflectionSkipBtn = document.getElementById("reflectionSkipBtn");

const authGateModal = document.getElementById("authGateModal");
const authGateClose = document.getElementById("authGateClose");
const authGateForm = document.getElementById("authGateForm");
const authGateNameField = document.getElementById("authGateNameField");
const authGateNameInput = document.getElementById("authGateName");
const authGateEmailInput = document.getElementById("authGateEmail");
const authGatePasswordInput = document.getElementById("authGatePassword");
const authGateSubmitBtn = document.getElementById("authGateSubmitBtn");
const authGateToggleBtn = document.getElementById("authGateToggleBtn");
const authGateTitle = document.getElementById("authGateTitle");
const authGateMessage = document.getElementById("authGateMessage");
const topSignInBtn = document.getElementById("topSignInBtn");
const routineEmptyText = document.getElementById("routineEmptyText");
const exportMenuBtn = document.getElementById("exportMenuBtn");
const exportMenuDropdown = document.getElementById("exportMenuDropdown");

let currentRoutine = null;
let currentUser = null;
let savedRoutines = [];
let isRegisterMode = false;
let isGeneratingRoutine = false;
let activePlanMode = "home";
let activePlanSubmode = "generated"; // "generated" | "custom"
const PLAN_SUBMODE_KEY = "thegolfbuild_plan_submode";
let drillLibraryCache = null;
let pendingReflection = null;
let customBuilderState = null;
// Session runner state — persists while user navigates away and returns
let runnerState = null; // { routine, weekIndex, sessionIndex, key, drillChecked: boolean[] }
let customActiveSessionIndex = 0;
let customDrillFilterType = null;
const FREE_ROUTINE_LIMIT = 5;
const ONBOARDING_ENABLED = false;
let authGateCallback = null;
let authGateRegisterMode = false;
const ROUTINE_BLOCK_HINT_KEY_PREFIX = "thegolfbuild_routine_block_hint_seen_v1";
let expandedRoutineLibraryKey = null;
let routineCreateFlowMode = null; // null | "generated" | "custom"

function setOverlayVisible(el, visible) {
  if (!el) return;
  el.classList.toggle("hidden", !visible);
  el.hidden = !visible;
}

function forceCloseBlockingOverlays() {
  [onboardingOverlay, confirmModal, reflectionModal, drillModal, authGateModal, routineSwitcherModal].forEach((el) => {
    setOverlayVisible(el, false);
  });
  localStorage.setItem("thegolfbuild_onboarded", "1");
}

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
  setOverlayVisible(confirmModal, true);
}

function closeConfirmModal() {
  setOverlayVisible(confirmModal, false);
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
    if (!authGateModal.classList.contains("hidden")) { closeAuthGate(); return; }
    if (!routineSwitcherModal.classList.contains("hidden")) { closeRoutineSwitcher(); return; }
    if (!confirmModal.classList.contains("hidden")) { closeConfirmModal(); return; }
    if (!reflectionModal.classList.contains("hidden")) { closeReflectionModal(); return; }
    if (!drillModal.classList.contains("hidden")) { closeDrillModal(); return; }
    if (!userMenuDropdown.classList.contains("hidden")) {
      userMenuDropdown.classList.add("hidden");
      return;
    }
    if (exportMenuDropdown && !exportMenuDropdown.classList.contains("hidden")) {
      exportMenuDropdown.classList.add("hidden");
      return;
    }
    if (onboardingOverlay && !onboardingOverlay.classList.contains("hidden")) {
      setOverlayVisible(onboardingOverlay, false);
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

// ===== Auth Gate Modal =====
function requireAuth(label, callback) {
  if (currentUser) {
    callback();
    return;
  }
  authGateCallback = callback;
  authGateTitle.textContent = label || "Sign in to continue";
  authGateMessage.textContent = "";
  authGateRegisterMode = false;
  updateAuthGateMode();
  setOverlayVisible(authGateModal, true);
}

function updateAuthGateMode() {
  authGateNameField.classList.toggle("hidden", !authGateRegisterMode);
  authGateNameInput.required = authGateRegisterMode;
  authGateSubmitBtn.textContent = authGateRegisterMode ? "Create Account" : "Login";
  authGateToggleBtn.textContent = authGateRegisterMode ? "Back to Login" : "Register";
}

function closeAuthGate() {
  setOverlayVisible(authGateModal, false);
  authGateCallback = null;
  authGateForm.reset();
  authGateMessage.textContent = "";
}

authGateClose.addEventListener("click", closeAuthGate);
authGateModal.addEventListener("click", (e) => {
  if (e.target === authGateModal) closeAuthGate();
});

authGateToggleBtn.addEventListener("click", () => {
  authGateRegisterMode = !authGateRegisterMode;
  updateAuthGateMode();
});

authGateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = authGateEmailInput.value.trim();
  const password = authGatePasswordInput.value;
  const name = authGateNameInput.value.trim();

  if (!email || !password) {
    authGateMessage.textContent = "Enter email and password.";
    authGateMessage.classList.add("error");
    return;
  }
  if (authGateRegisterMode && !name) {
    authGateMessage.textContent = "Enter your name to register.";
    authGateMessage.classList.add("error");
    return;
  }

  authGateSubmitBtn.disabled = true;
  authGateSubmitBtn.textContent = authGateRegisterMode ? "Creating..." : "Logging in...";
  try {
    const endpoint = authGateRegisterMode ? "/api/auth/register" : "/api/auth/login";
    const body = authGateRegisterMode
      ? JSON.stringify({ name, email, password })
      : JSON.stringify({ email, password });
    const result = await api(endpoint, { method: "POST", body });

    setToken(result.token);
    currentUser = result.user;
    updateAuthUi();
    await loadUserData();
    showToast(authGateRegisterMode ? "Account created." : "Logged in successfully.");

    const cb = authGateCallback;
    closeAuthGate();
    if (cb) cb();
  } catch (err) {
    authGateMessage.textContent = err.message;
    authGateMessage.classList.add("error");
  } finally {
    authGateSubmitBtn.disabled = false;
    updateAuthGateMode();
  }
});

topSignInBtn.addEventListener("click", () => {
  requireAuth("Sign in", () => {});
});

// ===== Export Dropdown =====
exportMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  exportMenuDropdown.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (exportMenuDropdown && !exportMenuDropdown.classList.contains("hidden")) {
    const wrap = exportMenuBtn.parentElement;
    if (!wrap.contains(e.target)) {
      exportMenuDropdown.classList.add("hidden");
    }
  }
});

// ===== Empty State Text =====
function updateEmptyState() {
  if (!routineEmptyText) return;
  if (currentRoutine) return; // empty state hidden when routine exists

  const profile = getProfileFromForm();
  const hasProfile = isProfileComplete(profile);
  const isAuthed = Boolean(currentUser);

  if (!isAuthed || !hasProfile) {
    routineEmptyText.textContent = "Complete your profile above to generate a training routine.";
  } else {
    routineEmptyText.textContent = "Hit \u2018Generate Routine\u2019 above to create your plan.";
  }
}

// ===== Sample Stats for Logged-Out Users =====
function renderSampleStats() {
  const statsContent = document.getElementById("statsContent");
  statsContent.innerHTML = "";

  const banner = document.createElement("div");
  banner.className = "stats-sample-banner";
  banner.innerHTML = '<span>Sample data shown. Sign in to see your real stats.</span>';
  const signInBtn = document.createElement("button");
  signInBtn.className = "btn btn-primary btn-sm";
  signInBtn.textContent = "Sign In";
  signInBtn.addEventListener("click", () => requireAuth("Sign in to view your stats", () => loadStats()));
  banner.appendChild(signInBtn);
  statsContent.appendChild(banner);

  // Render hardcoded sample data
  statsContent.innerHTML += `
    <div class="stats-grid">
      <div class="stat-card"><p class="stat-value" style="color:var(--green)">3</p><p class="stat-label">Routines Saved</p></div>
      <div class="stat-card"><p class="stat-value" style="color:var(--green)">12</p><p class="stat-label">Sessions Completed</p></div>
      <div class="stat-card"><p class="stat-value" style="color:var(--green)">5d</p><p class="stat-label">Current Streak</p></div>
      <div class="stat-card"><p class="stat-value" style="color:var(--green)">8d</p><p class="stat-label">Longest Streak</p></div>
    </div>
    <div class="stats-detail"><h3>Session Progress</h3><div class="progress-bar-wrap"><div class="progress-bar" style="width:50%"></div></div><p class="stat-progress-text">12 / 24 sessions (50%)</p></div>
  `;
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
function renderDrillModalActions(drill) {
  if (!drillModalActions) return;
  drillModalActions.innerHTML = "";

  const btn = document.createElement("button");
  const selected = selectedDrillsStore?.isDrillSelected(drill.id);
  btn.type = "button";
  btn.className = `btn ${selected ? "btn-danger" : "btn-primary"}`;
  btn.textContent = selected ? "Remove from Custom Routine" : "Add to Custom Routine";
  btn.addEventListener("click", () => {
    if (!selectedDrillsStore || !drill.id) return;
    selectedDrillsStore.toggleSelectedDrill(drill.id);
    renderDrillModalActions(drill);
    updateSelectedDrillsBtn();
  });
  drillModalActions.appendChild(btn);
}

function openDrillModal(drill) {
  drillModalName.textContent = drill.name;
  drillModalDesc.textContent = drill.description;
  renderDrillModalActions(drill);

  drillModalBadges.innerHTML = "";
  const typeBadge = document.createElement("span");
  typeBadge.className = `modal-badge type-${drill.type}`;
  typeBadge.textContent = normalizeBlockLabel(drill.type);
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

  setOverlayVisible(drillModal, true);
}

function closeDrillModal() {
  setOverlayVisible(drillModal, false);
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
  setOverlayVisible(reflectionModal, true);
}

function closeReflectionModal() {
  setOverlayVisible(reflectionModal, false);
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
    setCachedRoutines(currentUser?.id, savedRoutines);
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

function routinesCacheKey(userId) {
  return `thegolfbuild_routines_${userId}`;
}

function routineBlockHintKey(userId) {
  return `${ROUTINE_BLOCK_HINT_KEY_PREFIX}_${userId || "guest"}`;
}

function hasSeenRoutineBlockHint(userId) {
  try {
    return localStorage.getItem(routineBlockHintKey(userId)) === "1";
  } catch (_err) {
    return false;
  }
}

function markRoutineBlockHintSeen(userId) {
  try {
    localStorage.setItem(routineBlockHintKey(userId), "1");
  } catch (_err) {
    // ignore localStorage write failures
  }
}

function maybeRenderRoutineBlockHint() {
  const mobileOnly = typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 900px), (pointer: coarse)").matches
    : false;
  if (!mobileOnly) return null;

  const userId = currentUser?.id;
  if (hasSeenRoutineBlockHint(userId)) return null;

  const hint = document.createElement("div");
  hint.className = "routine-block-hint";
  hint.innerHTML = `
    <span>Tap a block to see details</span>
    <button class="routine-block-hint-dismiss" type="button" aria-label="Dismiss hint">&times;</button>
  `;
  hint.querySelector(".routine-block-hint-dismiss").addEventListener("click", () => {
    markRoutineBlockHintSeen(userId);
    hint.remove();
  });
  routineWeeks.appendChild(hint);
  return hint;
}

function getCachedRoutines(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(routinesCacheKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (_err) {
    return null;
  }
}

function setCachedRoutines(userId, routines) {
  if (!userId) return;
  try {
    localStorage.setItem(routinesCacheKey(userId), JSON.stringify(routines || []));
  } catch (_err) {
    // localStorage quota exceeded — ignore
  }
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

function setPlanSubmode(submode) {
  activePlanSubmode = submode;
  try { localStorage.setItem(PLAN_SUBMODE_KEY, submode); } catch (_) {}

  if (submode === "custom") {
    planGeneratedView.classList.add("hidden");
    customRoutineView.classList.remove("hidden");
    planSegGenerated.classList.remove("active");
    planSegGenerated.setAttribute("aria-selected", "false");
    planSegCustom.classList.add("active");
    planSegCustom.setAttribute("aria-selected", "true");
    if (!customBuilderState) showCustomStep(1);
  } else {
    customRoutineView.classList.add("hidden");
    planGeneratedView.classList.remove("hidden");
    planSegCustom.classList.remove("active");
    planSegCustom.setAttribute("aria-selected", "false");
    planSegGenerated.classList.add("active");
    planSegGenerated.setAttribute("aria-selected", "true");
  }
}

function setRoutineCreateFlow(mode) {
  routineCreateFlowMode = mode || null;
  const inFlow = Boolean(routineCreateFlowMode);

  routineLibraryActions?.classList.toggle("hidden", inFlow);
  routineCreateFlowHeader?.classList.toggle("hidden", !inFlow);

  if (!inFlow) {
    setPlanSubmode("generated");
    planGeneratedView.classList.remove("hidden");
    customRoutineView.classList.add("hidden");
    profileSummary.classList.add("hidden");
    profileFormWrap.classList.add("hidden");
    generatedRoutineView.classList.remove("hidden");
    return;
  }

  if (routineCreateFlowMode === "generated") {
    setPlanSubmode("generated");
    planGeneratedView.classList.remove("hidden");
    customRoutineView.classList.add("hidden");
    profileFormWrap.classList.remove("hidden");
    generatedRoutineView.classList.add("hidden");

    const profile = currentUser ? getCachedProfile(currentUser.id) : null;
    if (isProfileComplete(profile || {})) {
      renderProfileSummary(profile);
    } else {
      profileSummary.classList.add("hidden");
      profileFormWrap.classList.remove("collapsed");
    }
    return;
  }

  setPlanSubmode("custom");
}

function updateSelectedDrillsBtn() {
  if (!selectedDrillsBtn) return;
  const count = selectedDrillsStore?.getSelectedDrillIds()?.length || 0;
  const hasSelected = count > 0;
  selectedDrillsBtn.classList.toggle("hidden", !hasSelected);
  selectedDrillsBtn.classList.toggle("has-selection", hasSelected);
  selectedDrillsBtn.disabled = !hasSelected;
  selectedDrillsBtn.textContent = hasSelected
    ? `Selected (${count}) • Build routine \u2192`
    : "Select drills to build a routine";
  selectedDrillsBtn.title = hasSelected
    ? "Open Plan in Custom mode with your selected drills."
    : "Select drills first to build a custom routine.";
  selectedDrillsBtn.setAttribute(
    "aria-label",
    hasSelected
      ? `Selected ${count} drills. Build routine.`
      : "No drills selected"
  );
}

function setPlanMode(mode) {
  activePlanMode = mode;
  const planPanel = document.querySelector(".plan-panel");

  homePanel.classList.add("hidden");
  drillLibraryPanel.classList.add("hidden");
  statsPanel.classList.add("hidden");
  adminPanel.classList.add("hidden");
  planPanel.classList.add("hidden");

  showHomeBtn.classList.remove("active");
  showGeneratedRoutineBtn.classList.remove("active");
  showCustomRoutineBtn?.classList.remove("active");
  showDrillLibraryBtn.classList.remove("active");
  showStatsBtn.classList.remove("active");
  showAdminBtn?.classList.remove("active");

  if (mode === "home") {
    homePanel.classList.remove("hidden");
    showHomeBtn.classList.add("active");
    renderHomeDashboard();
  } else if (mode === "custom") {
    // Legacy "custom" routes now map to Routine tab and open custom create flow.
    planPanel.classList.remove("hidden");
    showGeneratedRoutineBtn.classList.add("active");
    setRoutineCreateFlow("custom");
  } else if (mode === "drills") {
    drillLibraryPanel.classList.remove("hidden");
    showDrillLibraryBtn.classList.add("active");
    updateSelectedDrillsBtn();
    loadDrillLibrary();
  } else if (mode === "stats") {
    statsPanel.classList.remove("hidden");
    showStatsBtn.classList.add("active");
    loadStats();
  } else if (mode === "admin") {
    if (!currentUser || currentUser.role !== "super") {
      setMessage("Admin access required.", true);
      setPlanMode("home");
      return;
    }
    adminPanel.classList.remove("hidden");
    showAdminBtn?.classList.add("active");
    loadAdminUsers();
  } else {
    // "generated" and any other value → plan panel library view
    planPanel.classList.remove("hidden");
    showGeneratedRoutineBtn.classList.add("active");
    setRoutineCreateFlow(null);
    renderRoutine();
  }
  updateEmptyState();
}

async function loadAdminUsers() {
  if (!adminUsersBody || !adminUserCount) return;
  adminUsersBody.innerHTML = '<tr><td colspan="5" class="admin-empty">Loading users…</td></tr>';
  try {
    const result = await api("/api/admin/users");
    const users = Array.isArray(result.users) ? result.users : [];
    adminUserCount.textContent = `${users.length} registered user${users.length === 1 ? "" : "s"}`;

    if (users.length === 0) {
      adminUsersBody.innerHTML = '<tr><td colspan="5" class="admin-empty">No users found.</td></tr>';
      return;
    }

    adminUsersBody.innerHTML = users.map((u) => `
      <tr>
        <td>${u.name || "-"}</td>
        <td>${u.email || "-"}</td>
        <td>${u.plan || "free"}</td>
        <td>${u.role || "user"}</td>
        <td>${Number(u.routineCount || 0)}</td>
      </tr>
    `).join("");
  } catch (err) {
    adminUserCount.textContent = "Failed to load users";
    adminUsersBody.innerHTML = `<tr><td colspan="5" class="admin-empty">${err.message || "Failed to load users."}</td></tr>`;
  }
}

function getOnboardingState() {
  const signedUp = Boolean(currentUser);
  const profile = signedUp ? getCachedProfile(currentUser.id) : null;
  const profileDone = profile ? isProfileComplete(profile) : false;
  const routineGenerated = savedRoutines.length > 0;
  let sessionCompleted = false;
  for (const r of savedRoutines) {
    if (Object.keys(r.completions || {}).length > 0) { sessionCompleted = true; break; }
  }
  const allDone = signedUp && profileDone && routineGenerated && sessionCompleted;
  return { signedUp, profileDone, routineGenerated, sessionCompleted, allDone, profile };
}

function getNextIncompleteSession(routine) {
  const completions = routine.completions || {};
  for (let wi = 0; wi < (routine.weeks || []).length; wi++) {
    const week = routine.weeks[wi];
    for (let si = 0; si < (week.sessions || []).length; si++) {
      const key = `${wi}-${si}`;
      if (!completions[key]) return { week, weekIndex: wi, session: week.sessions[si], sessionIndex: si, key };
    }
  }
  return null;
}

function countThisWeekSessions() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString();
  let count = 0;
  for (const r of savedRoutines) {
    for (const val of Object.values(r.completions || {})) {
      if (typeof val === "string" && val >= weekStart) count++;
    }
  }
  return count;
}

function renderHomeDashboard() {
  // If a runner session is active, restore it instead of the dashboard
  if (runnerState) {
    homeOnboarding.classList.add("hidden");
    homeDashboard.classList.add("hidden");
    homeSessionRunner.classList.remove("hidden");
    renderRunnerUI();
    return;
  }

  homeSessionRunner.classList.add("hidden");
  const state = getOnboardingState();
  const hasRoutine = Boolean(currentRoutine || savedRoutines.length > 0);

  if (hasRoutine) {
    homeOnboarding.classList.add("hidden");
    homeDashboard.classList.remove("hidden");
    renderDashboardHub(state, true);
  } else {
    homeOnboarding.classList.remove("hidden");
    homeDashboard.classList.add("hidden");
    renderOnboardingChecklist(state);
  }
}

function renderOnboardingChecklist(state, container = homeChecklistSteps) {
  const steps = [
    { label: "Create account",        hint: "Sign up to save your progress",                done: state.signedUp,         action: () => setPlanMode("generated") },
    { label: "Set up golf profile",   hint: "Tell us your handicap and weaknesses",          done: state.profileDone,      action: () => { setPlanMode("generated"); expandProfileForm(); } },
    { label: "Generate first routine",hint: "Get a personalised drill plan",                 done: state.routineGenerated, action: () => setPlanMode("generated") },
    { label: "Complete first session",hint: "Mark your first session done",                  done: state.sessionCompleted, action: () => {
      const active = savedRoutines.find(r => { const p = routineProgress(r); return p.pct < 100 && p.total > 0; });
      if (active) { currentRoutine = active; renderRoutine(active); hydrateForm(active.profileSnapshot); routineTitleInput.value = active.title || ""; setPlanMode("generated"); }
      else setPlanMode("generated");
    }}
  ];

  container.innerHTML = "";
  let currentFound = false;
  steps.forEach((step, i) => {
    const isCurrent = !step.done && !currentFound;
    if (isCurrent) currentFound = true;
    const isLocked = !step.done && !isCurrent;

    const el = document.createElement("button");
    el.type = "button";
    el.className = [
      "checklist-step",
      step.done  ? "done"   : "",
      isCurrent  ? "current": "",
      isLocked   ? "locked" : "",
    ].filter(Boolean).join(" ");

    el.disabled = isLocked;
    el.innerHTML = `
      <span class="checklist-num">${step.done ? "&#10003;" : i + 1}</span>
      <span class="checklist-body">
        <span class="checklist-label">${step.label}</span>
        <span class="checklist-hint">${step.done ? "Done" : step.hint}</span>
      </span>
      ${isCurrent ? '<span class="checklist-arrow">&#8594;</span>' : ""}`;
    el.addEventListener("click", step.action);
    container.appendChild(el);
  });
}

function renderDashboardHub(state, showSetup = false) {
  renderHomeProfileBar(state.profile);
  renderTodayTrainingCard();
  if (homeSetupSection) {
    homeSetupSection.classList.toggle("hidden", !showSetup);
    if (showSetup) {
      // Keep setup checklist available, but deprioritize once a routine exists.
      renderOnboardingChecklist(state, homeSetupChecklistSteps);
    }
  }
  renderHomeProgress();
  renderHomeQuickActions();
  renderHomeRecentRoutines();
}

function renderHomeProfileBar(profile) {
  if (!profile) { homeProfileBar.innerHTML = ""; return; }
  const weaknesses = profile.weaknesses || (profile.weakness ? [profile.weakness] : []);
  const hrs = profile.hoursPerSession || 1.5;
  const hrsWhole = Math.floor(hrs);
  const minsLeft = Math.round((hrs - hrsWhole) * 60);
  const durationLabel = minsLeft > 0 ? `${hrsWhole}h ${minsLeft}m` : `${hrsWhole}h`;
  const schedule = `${profile.daysPerWeek || 3}d/wk \u00B7 ${durationLabel}`;
  homeProfileBar.innerHTML = `
    <div class="profile-bar-greeting">
      <h2>Welcome back, ${getDisplayFirstName()}</h2>
    </div>
    <div class="profile-bar-chips">
      <span class="profile-chip">${(profile.handicap || "").replace(/\s*\(.*\)/, "")}</span>
      ${weaknesses.map(w => `<span class="profile-chip">${w}</span>`).join("")}
      <span class="profile-chip">${schedule}</span>
    </div>
    <button id="homeEditProfileBtn" class="btn btn-sm btn-outline" type="button">Edit Profile</button>`;
  document.getElementById("homeEditProfileBtn").addEventListener("click", () => {
    setPlanMode("generated");
    expandProfileForm();
  });
}

function renderTodayTrainingCard() {
  const activeRoutine = savedRoutines.find(r => {
    const prog = routineProgress(r);
    return prog.pct < 100 && prog.total > 0;
  }) || currentRoutine;

  if (!activeRoutine) {
    homeTodayCard.innerHTML = `
      <div class="today-empty">
        <h3>Today's Training</h3>
        <p class="plan-mode-note">No active routine. Generate one to get started!</p>
        <button class="btn btn-primary today-generate-btn" type="button">Generate Routine</button>
      </div>`;
    homeTodayCard.querySelector(".today-generate-btn").addEventListener("click", () => setPlanMode("generated"));
    return;
  }

  const next = getNextIncompleteSession(activeRoutine);
  if (!next) { homeTodayCard.innerHTML = ""; return; }

  const prog = routineProgress(activeRoutine);
  const bullets = next.session.bullets || [];
  const previewBullets = bullets.slice(0, 5);

  // Sum durations for total time display
  let totalMins = 0;
  const previewRows = previewBullets.map((b, idx) => {
    const durationMatch = b.match(/^(\d+)\s*min/);
    const mins = durationMatch ? parseInt(durationMatch[1], 10) : 0;
    totalMins += mins;
    const duration = parseBulletDuration(b);
    const type = parseBulletType(b);
    const bulletText = b.replace(/^\d+\s*min\s*[–-]?\s*/, "").trim();
    const drillMatch = drillLibraryCache ? drillLibraryCache.find((d) => bulletText.includes(d.name)) : null;
    const rawDrillName = drillMatch ? drillMatch.name : bulletText.split(/[–—:-]/)[0].trim();
    const drillName = drillMatch ? rawDrillName : normalizeBlockLabel(rawDrillName);
    const detailTextRaw = rawDrillName ? bulletText.replace(rawDrillName, "").replace(/^[\s:–—-]+/, "").trim() : bulletText;
    const metaTags = buildDrillMetaTags(`${detailTextRaw}. ${drillMatch?.description || ""}`, type);

    return {
      idx,
      type,
      durationLabel: duration ? duration.toUpperCase() : (mins > 0 ? `${mins} MIN` : normalizeBlockLabel(type)),
      name: drillName || bulletText || "Drill",
      meta: metaTags.join(" • "),
      drill: drillMatch || {
        id: null,
        name: drillName || bulletText || "Drill",
        description: [detailTextRaw, bulletText].filter(Boolean).join(" ").trim() || "No extra details available.",
        type,
        levels: [],
        weaknesses: []
      }
    };
  });

  const drillsHtml = previewRows.map((row) => `
    <div class="today-drill-row routine-drill-row">
      <div class="today-drill-summary">
        <span class="drill-duration-pill ${row.type}">${row.durationLabel}</span>
        <div class="today-drill-main">
          <button class="drill-name-btn today-drill-name-btn" type="button" data-drill-idx="${row.idx}">${row.name}</button>
          <div class="drill-meta-tags today-drill-meta-tags">${row.meta}</div>
        </div>
      </div>
    </div>
  `).join("");

  const totalLabel = totalMins > 0 ? `${totalMins} min` : "";
  const weekNum = next.weekIndex + 1;
  const sessNum = next.sessionIndex + 1;

  homeTodayCard.innerHTML = `
    <div class="today-header">
      <div class="today-header-left">
        <span class="today-eyebrow">Today's Training</span>
        <h3 class="today-session-title">${next.session.title || `Week ${weekNum}, Session ${sessNum}`}</h3>
        <span class="today-meta">Week ${weekNum} &middot; Session ${sessNum}${totalLabel ? " &middot; " + totalLabel : ""}</span>
      </div>
      <span class="today-routine-badge">${activeRoutine.title}</span>
    </div>
    <div class="today-drills">${drillsHtml}</div>
    <div class="today-footer">
      <div class="today-footer-progress">
        <div class="today-progress-label">
          <span>Routine progress</span>
          <span>${prog.done}/${prog.total} sessions</span>
        </div>
        <div class="saved-progress-wrap"><div class="saved-progress-bar" style="width:${prog.pct}%"></div></div>
      </div>
      <button class="btn btn-brand today-start-btn" type="button">
        Start Session${totalLabel ? " &middot; " + totalLabel : ""}
      </button>
    </div>`;
  homeTodayCard.querySelector(".today-start-btn").addEventListener("click", () => {
    enterSessionRunner(activeRoutine, next);
  });
  homeTodayCard.querySelectorAll(".today-drill-name-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-drill-idx"));
      const row = previewRows[idx];
      if (!row || !row.drill) return;
      openDrillModal(row.drill);
    });
  });
}

// ===== Inline Session Runner =====

function enterSessionRunner(routine, next) {
  // Initialise (or resume) runner state
  const bullets = next.session.bullets || [];
  if (
    !runnerState ||
    runnerState.routine.id !== routine.id ||
    runnerState.key !== next.key
  ) {
    runnerState = {
      routine,
      weekIndex: next.weekIndex,
      sessionIndex: next.sessionIndex,
      key: next.key,
      drillChecked: bullets.map(() => false),
    };
  }

  // Swap views: hide dashboard, show runner
  homeOnboarding.classList.add("hidden");
  homeDashboard.classList.add("hidden");
  homeSessionRunner.classList.remove("hidden");

  renderRunnerUI();
}

function exitSessionRunner() {
  runnerState = null;
  homeSessionRunner.classList.add("hidden");
  renderHomeDashboard();
}

function renderRunnerUI() {
  if (!runnerState) return;

  const { routine, weekIndex, sessionIndex, key, drillChecked } = runnerState;
  const session = routine.weeks[weekIndex].sessions[sessionIndex];
  const bullets = session.bullets || [];
  const weekNum = weekIndex + 1;
  const sessNum = sessionIndex + 1;

  // Compute total time
  let totalMins = 0;
  bullets.forEach(b => {
    const m = b.match(/^(\d+)\s*min/);
    if (m) totalMins += parseInt(m[1], 10);
  });
  const totalLabel = totalMins > 0 ? ` · ${totalMins} min` : "";

  // Header
  runnerHeader.innerHTML = `
    <span class="runner-eyebrow">Week ${weekNum} &middot; Session ${sessNum}${totalLabel}</span>
    <h2 class="runner-title">${session.title || `Session ${sessNum}`}</h2>
    <span class="runner-routine-badge">${routine.title}</span>`;

  // Drill rows
  runnerDrills.innerHTML = "";
  bullets.forEach((bullet, i) => {
    const durationMatch = bullet.match(/^(\d+)\s*min/);
    const mins = durationMatch ? parseInt(durationMatch[1], 10) : 0;
    const drillText = bullet.replace(/^\d+\s*min\s*[–-]?\s*/, "");
    const checked = drillChecked[i];

    const row = document.createElement("label");
    row.className = "runner-drill-row" + (checked ? " checked" : "");
    row.htmlFor = `runner-drill-${i}`;

    // Try to match drill in cache for "View" link
    const drillMatch = drillLibraryCache
      ? drillLibraryCache.find(d => drillText.includes(d.name))
      : null;
    const leadLabel = drillText.split(/[–—:]/)[0].trim();
    const normalizedLead = normalizeBlockLabel(leadLabel);
    const displayDrillText = !drillMatch && normalizedLead && leadLabel
      ? drillText.replace(leadLabel, normalizedLead)
      : drillText;

    row.innerHTML = `
      <input class="runner-drill-cb" type="checkbox" id="runner-drill-${i}" ${checked ? "checked" : ""}>
      <span class="runner-drill-info">
        <span class="runner-drill-name">${displayDrillText}</span>
        ${drillMatch ? `<button class="btn btn-ghost runner-view-btn" type="button" data-drill-i="${i}">View drill</button>` : ""}
      </span>
      <span class="runner-drill-dur">${mins > 0 ? mins + "m" : ""}</span>`;

    row.querySelector(".runner-drill-cb").addEventListener("change", (e) => {
      runnerState.drillChecked[i] = e.target.checked;
      row.classList.toggle("checked", e.target.checked);
      updateRunnerProgress();
    });

    if (drillMatch) {
      row.querySelector(".runner-view-btn").addEventListener("click", (e) => {
        e.preventDefault();
        openDrillModal(drillMatch);
      });
    }

    runnerDrills.appendChild(row);
  });

  updateRunnerProgress();
}

function updateRunnerProgress() {
  if (!runnerState) return;
  const { drillChecked } = runnerState;
  const total = drillChecked.length;
  const done = drillChecked.filter(Boolean).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  runnerProgressText.textContent = `${done} / ${total} drill${total !== 1 ? "s" : ""}`;
  runnerProgressPct.textContent = `${pct}%`;
  runnerProgressBar.style.width = `${pct}%`;
  runnerCompleteBtn.disabled = done < total;
}

// Wire up back button and complete button (once, not per render)
runnerBackBtn.addEventListener("click", exitSessionRunner);

runnerCompleteBtn.addEventListener("click", async () => {
  if (!runnerState) return;
  const { routine, key, weekIndex } = runnerState;
  const weekTotal = routine.weeks[weekIndex]?.sessions?.length || 0;
  runnerCompleteBtn.disabled = true;
  runnerCompleteBtn.textContent = "Saving…";

  await toggleCompletion(routine.id, key, weekIndex, weekTotal);

  // toggleCompletion updates savedRoutines and may open the reflection modal.
  // Exit runner after — reflection modal sits on top and closes independently.
  exitSessionRunner();
});

function renderHomeProgress() {
  let completedSessions = 0;
  for (const r of savedRoutines) {
    completedSessions += Object.keys(r.completions || {}).length;
  }
  const thisWeek = countThisWeekSessions();

  const activeRoutine = savedRoutines.find(r => {
    const p = routineProgress(r);
    return p.pct < 100 && p.total > 0;
  });
  const prog = activeRoutine ? routineProgress(activeRoutine) : { done: 0, total: 0, pct: 0 };

  homeProgressGrid.innerHTML = `
    <div class="stat-card">
      <p class="stat-value" id="homeStatStreak">-</p>
      <p class="stat-label">Day Streak</p>
    </div>
    <div class="stat-card">
      <p class="stat-value">${thisWeek}</p>
      <p class="stat-label">This Week</p>
    </div>
    <div class="stat-card">
      <p class="stat-value">${prog.pct}%</p>
      <p class="stat-label">Routine Progress</p>
      <div class="saved-progress-wrap progress-sm"><div class="saved-progress-bar" style="width:${prog.pct}%"></div></div>
    </div>`;

  api("/api/stats").then((result) => {
    const el = document.getElementById("homeStatStreak");
    if (el) el.textContent = formatDayCount(result.stats.currentStreak ?? 0);
  }).catch(() => {});
}

function renderHomeQuickActions() {
  const hasActive = savedRoutines.some(r => {
    const p = routineProgress(r);
    return p.pct < 100 && p.total > 0;
  });
  const allDoneRoutines = savedRoutines.length > 0 && !hasActive;

  let buttons = "";
  if (savedRoutines.length === 0) {
    buttons = `
      <button class="btn btn-primary home-qa-btn" data-action="generate">Generate Routine</button>
      <button class="btn btn-outline home-qa-btn" data-action="drills">Browse Drills</button>`;
  } else if (allDoneRoutines) {
    buttons = `
      <button class="btn btn-primary home-qa-btn" data-action="generate">Generate New</button>
      <button class="btn btn-outline home-qa-btn" data-action="stats">View Stats</button>
      <button class="btn btn-outline home-qa-btn" data-action="drills">Browse Drills</button>`;
  } else {
    buttons = `
      <button class="btn btn-outline home-qa-btn" data-action="custom">Build Custom</button>
      <button class="btn btn-outline home-qa-btn" data-action="drills">Browse Drills</button>`;
  }

  homeQuickActions.innerHTML = buttons;
  homeQuickActions.querySelectorAll(".home-qa-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "generate") setPlanMode("generated");
      else if (action === "custom") setPlanMode("custom");
      else if (action === "drills") setPlanMode("drills");
      else if (action === "stats") setPlanMode("stats");
    });
  });
}

function renderHomeRecentRoutines() {
  if (savedRoutines.length === 0) { homeRecentRoutines.innerHTML = ""; return; }

  const recent = savedRoutines.slice(-3).reverse();
  let html = "<h3>Recent Routines</h3>";
  recent.forEach(r => {
    const prog = routineProgress(r);
    html += `
      <div class="home-recent-card" data-id="${r.id}">
        <div class="home-recent-info">
          <p class="saved-title">${r.title}</p>
          <p class="saved-meta">${r.meta || ""}</p>
          <div class="saved-progress-wrap"><div class="saved-progress-bar" style="width:${prog.pct}%"></div></div>
          <p class="saved-progress-text">${prog.done}/${prog.total} sessions (${prog.pct}%)</p>
        </div>
        <button class="btn btn-sm btn-outline home-recent-open" type="button">Open</button>
      </div>`;
  });
  homeRecentRoutines.innerHTML = html;

  homeRecentRoutines.querySelectorAll(".home-recent-open").forEach(btn => {
    const card = btn.closest(".home-recent-card");
    const routine = savedRoutines.find(r => r.id === card.dataset.id);
    if (routine) {
      btn.addEventListener("click", () => {
        currentRoutine = routine;
        renderRoutine(routine);
        hydrateForm(routine.profileSnapshot);
        routineTitleInput.value = routine.title || "";
        setPlanMode("generated");
      });
    }
  });
}

function getProfileFromForm() {
  const weaknesses = Array.from(document.querySelectorAll("#weaknessGrid .chip.selected"))
    .map(btn => btn.dataset.value);
  return {
    name: document.getElementById("name").value.trim(),
    handicap: document.getElementById("handicap").value,
    weakness: weaknesses[0] || "",
    weaknesses,
    daysPerWeek: Number(document.getElementById("daysPerWeek").value),
    hoursPerSession: Number(document.getElementById("hoursPerSession").value),
    notes: document.getElementById("notes").value.trim()
  };
}

function hydrateForm(profile) {
  document.getElementById("name").value = profile?.name || "";
  document.getElementById("notes").value = profile?.notes || "";

  // Hydrate days per week button group
  const daysVal = String(profile?.daysPerWeek || 3);
  document.getElementById("daysPerWeek").value = daysVal;
  document.querySelectorAll("#daysPerWeekGroup .btn-toggle").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.value === daysVal);
  });

  // Hydrate duration picker
  const hours = profile?.hoursPerSession || 1.5;
  const wholeHours = Math.floor(hours);
  const mins = Math.round((hours - wholeHours) * 60);
  const roundedMins = Math.round(mins / 15) * 15;
  document.getElementById("hoursPerSession").value = hours;
  const durationHours = document.getElementById("durationHours");
  const durationMinutes = document.getElementById("durationMinutes");
  durationHours.dataset.value = wholeHours;
  durationHours.textContent = wholeHours;
  durationMinutes.dataset.value = roundedMins;
  durationMinutes.textContent = String(roundedMins).padStart(2, "0");

  // Hydrate handicap buttons
  const handicapVal = profile?.handicap || "";
  document.getElementById("handicap").value = handicapVal;
  document.querySelectorAll("#handicapGroup .btn-toggle").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.value === handicapVal);
  });

  // Hydrate weakness chips
  const weaknesses = profile?.weaknesses || (profile?.weakness ? [profile.weakness] : []);
  document.getElementById("weakness").value = weaknesses[0] || "";
  document.querySelectorAll("#weaknessGrid .chip").forEach(btn => {
    btn.classList.toggle("selected", weaknesses.includes(btn.dataset.value));
  });
}

function isProfileComplete(profile) {
  const hasWeakness = (profile.weaknesses && profile.weaknesses.length > 0) || profile.weakness;
  return profile && profile.name && profile.handicap && hasWeakness;
}

function renderProfileSummary(profile) {
  if (!isProfileComplete(profile)) {
    profileSummary.classList.add("hidden");
    profileFormWrap.classList.remove("collapsed");
    return;
  }
  document.getElementById("summaryName").textContent = profile.name;
  document.getElementById("summaryHandicap").textContent = profile.handicap.replace(/\s*\(.*\)/, "");
  const weaknesses = profile.weaknesses || (profile.weakness ? [profile.weakness] : []);
  document.getElementById("summaryWeakness").textContent = weaknesses.join(" & ");
  const hrs = profile.hoursPerSession || 1.5;
  const hrsWhole = Math.floor(hrs);
  const minsLeft = Math.round((hrs - hrsWhole) * 60);
  const durationLabel = minsLeft > 0 ? `${hrsWhole}h ${minsLeft}m` : `${hrsWhole}h`;
  document.getElementById("summarySchedule").textContent =
    (profile.daysPerWeek || 3) + "d/wk \u00B7 " + durationLabel;
  profileSummary.classList.remove("hidden");
  profileFormWrap.classList.add("collapsed");
  updateEmptyState();
}

function expandProfileForm() {
  profileFormWrap.classList.remove("collapsed");
  profileSummary.classList.add("hidden");
}

function lockPlanner(locked) {
  const fields = document.querySelectorAll(
    "#profileForm input, #profileForm select, #profileForm textarea, #profileForm button, #profileForm .btn-toggle, #profileForm .chip"
  );
  fields.forEach((field) => {
    field.disabled = locked;
  });

  saveRoutineBtn.disabled = locked;
  routineTitleInput.disabled = locked;
  upgradeBtn.disabled = locked;

  if (locked) {
    renderRoutine(null);
  }

  if (locked) {
    isGeneratingRoutine = false;
    generateRoutineBtn.textContent = "Generate Routine";
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

function focusMapByWeakness(weaknessInput) {
  const mapping = {
    "Driving accuracy": ["fairway finder drill", "launch window control", "pressure tee shots"],
    "Approach consistency": ["distance ladder work", "shot-shape rehearsal", "target proximity challenge"],
    "Ball striking": ["impact quality audit", "low point control", "compression drill"],
    "Short game touch": ["landing zone precision", "up-and-down circuits", "bunker variability"],
    "Chipping & pitching": ["landing spot drill", "trajectory selection", "scramble chip practice"],
    "Putting confidence": ["start-line gate drill", "3-6-9 pressure ladder", "green reading reps"],
    "Lag putting": ["speed calibration drill", "30-foot zone work", "three-putt eliminator"],
    "Distance control": ["yardage ladder", "partial swing chart", "scoring zone blitz"],
    "Course management": ["club selection simulation", "risk/reward decision reps", "post-round strategy review"],
    "Mental game": ["pre-shot commitment", "emotional reset protocol", "pressure composure drill"],
    "Fairway woods & hybrids": ["sweep contact drill", "off-the-deck progression", "fairway wood strategy"],
    "Scoring under pressure": ["par saver challenge", "must-make putts", "close-out drill"]
  };

  const weaknesses = Array.isArray(weaknessInput) ? weaknessInput : [weaknessInput];
  const areas = [];
  for (const w of weaknesses) {
    const mapped = mapping[w] || [];
    for (const a of mapped) {
      if (!areas.includes(a)) areas.push(a);
    }
  }
  return areas.length ? areas : ["full swing calibration", "short game fundamentals", "mental reset routine"];
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
  const weaknesses = profile.weaknesses || (profile.weakness ? [profile.weakness] : []);
  const focusAreas = focusMapByWeakness(weaknesses);
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

  const weaknessLabel = weaknesses.join(" & ") || "General";
  return {
    profileSnapshot: profile,
    title: `4-Week ${weaknessLabel} Plan`,
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

function normalizeBlockLabel(raw) {
  const cleaned = String(raw || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!cleaned) return "";

  const canonicalMap = {
    "warmup": "Warm-Up",
    "warm up": "Warm-Up",
    "warm up block": "Warm-Up",
    "technical": "Technical Block",
    "technical block": "Technical Block",
    "pressure": "Pressure Block",
    "pressure block": "Pressure Block",
    "transfer": "Transfer Block",
    "transfer block": "Transfer Block",
    "reflection": "Reflection",
    "reflection block": "Reflection"
  };

  if (canonicalMap[cleaned]) return canonicalMap[cleaned];

  return cleaned
    .split(" ")
    .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(" ");
}

function parseBulletDuration(bullet) {
  const match = bullet.match(/^(\d+)\s*min/);
  return match ? match[1] + " min" : "";
}

function defaultMetaForType(type) {
  if (type === "warmup") return "prep flow";
  if (type === "pressure") return "consequence scoring";
  if (type === "transfer") return "on-course transfer";
  if (type === "reflection") return "review notes";
  return "technique focus";
}

function summarizeDrillMeta(detailText, type) {
  const detail = String(detailText || "").trim();
  if (!detail) return defaultMetaForType(type);

  const lower = detail.toLowerCase();
  const tags = [];
  if (/(rep|reps|sets|rounds|ladders|cycles)/.test(lower)) tags.push("target reps");
  if (/(track|tracked|measure|outcome|dispersion|make %|strokes|fairway|up-and-down|distance control)/.test(lower)) tags.push("tracked outcomes");
  if (/(consequence|score|scoring|points|penalty|challenge|pressure)/.test(lower)) tags.push("consequence scoring");
  if (tags.length) return tags.slice(0, 2).join(" • ");

  const firstClause = detail.split(/[.;]/)[0].trim();
  return firstClause || defaultMetaForType(type);
}

function buildDrillMetaTags(detailText, type) {
  const detail = String(detailText || "").trim().toLowerCase();
  const tags = [];

  const pushTag = (value) => {
    if (!value) return;
    if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) return;
    tags.push(value);
  };

  const phraseMap = [
    {
      match: /(target-based reps and tracked outcomes|target reps?.*tracked outcomes|tracked outcomes?.*target reps?)/,
      add: ["Target reps", "Tracked outcomes"]
    },
    {
      match: /under consequence scoring/,
      add: ["Consequence scoring"]
    },
    {
      match: /simulate real-hole decisions/,
      add: ["On-course simulation"]
    },
    {
      match: /random lie/,
      add: ["Random lies"]
    }
  ];
  phraseMap.forEach((entry) => {
    if (!entry.match.test(detail)) return;
    entry.add.forEach(pushTag);
  });

  if (type === "warmup") pushTag("Warm-up flow");
  if (type === "technical") pushTag("Technique");
  if (type === "pressure") pushTag("Pressure");
  if (type === "transfer") pushTag("On-course transfer");
  if (type === "reflection") pushTag("Session review");

  if (/(rep|reps|set|sets|round|rounds|ladder|cycle|target-based)/.test(detail)) pushTag("Target reps");
  if (/(track|tracked|measure|log|outcome|dispersion|percentage|count|score|points|strokes)/.test(detail)) pushTag("Tracked outcomes");
  if (/(consequence|penalty|restart|fail|pressure|challenge|one ball|pass)/.test(detail)) pushTag("Consequence scoring");
  if (/(routine|pre-shot|commit|visualize|reset)/.test(detail)) pushTag("Routine discipline");
  if (/(simulate|real-hole|on-course simulation)/.test(detail)) pushTag("On-course simulation");
  if (/(random lie|random lies|different lies)/.test(detail)) pushTag("Random lies");
  if (/(course|decision|strategy|vary|on-course)/.test(detail)) pushTag("Decision training");

  if (tags.length < 2) {
    if (type === "pressure") pushTag("Consequence scoring");
    else if (type === "transfer") pushTag("Scoring simulation");
    else pushTag("Target reps");
  }
  if (tags.length < 3) pushTag("Tracked outcomes");

  return tags.slice(0, 4);
}

function buildDrillDetailsSections(detailText, drillDescription, type, duration, drillName) {
  const source = [detailText, drillDescription].filter(Boolean).join(". ");
  const sentences = source
    .split(/[.;]\s+|\n+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const used = new Set();

  const take = (regex, limit = 2) => {
    const picks = [];
    for (let i = 0; i < sentences.length; i += 1) {
      if (used.has(i)) continue;
      const sentence = sentences[i];
      if (!regex.test(sentence.toLowerCase())) continue;
      picks.push(sentence);
      used.add(i);
      if (picks.length >= limit) break;
    }
    return picks;
  };

  const setup = take(/\b(set|setup|place|pick|choose|align|station|target|drop|mark|use)\b/, 2);
  const execution = take(/\b(hit|swing|roll|play|run|alternate|repeat|execute|complete|practice)\b/, 2);
  const scoring = take(/\b(score|count|track|measure|pass|target|points?|strokes?|percent|average|dispersion)\b/, 2);
  const progression = take(/\b(progression|progress|increase|reduce|narrow|tighten|advance|add|next|harder)\b/, 2);

  if (!setup.length) {
    setup.push(`Set a clear target and station for ${drillName || "this drill"} before starting.`);
  }
  if (!execution.length) {
    execution.push(`Complete the block${duration ? ` for ${duration.toLowerCase()}` : ""} with full pre-shot routine discipline.`);
  }
  if (!scoring.length) {
    scoring.push(type === "pressure" ? "Track pass/fail outcomes with consequence scoring each rep." : "Track outcomes by reps completed and quality of strike.");
  }
  if (!progression.length) {
    progression.push("Increase difficulty only after two clean rounds at the current target.");
  }

  return {
    setup: setup.slice(0, 3),
    execution: execution.slice(0, 3),
    scoring: scoring.slice(0, 3),
    progression: progression.slice(0, 3)
  };
}

function routineLibraryKey(routine) {
  return routine?.id || "__draft";
}

function getRoutineLibraryItems() {
  const items = [...savedRoutines];
  if (currentRoutine && !currentRoutine.id) {
    items.unshift(currentRoutine);
  }
  return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function getRoutineLibraryChips(routine) {
  const profile = routine?.profileSnapshot || {};
  const chips = [];

  const level = String(profile.handicap || "").trim().replace(/\s*\(.*\)/, "");
  if (level) chips.push(level);

  const weaknesses = Array.isArray(profile.weaknesses) ? profile.weaknesses : (profile.weakness ? [profile.weakness] : []);
  if (weaknesses.length) chips.push(weaknesses.slice(0, 2).join(" + "));

  const days = Number(profile.daysPerWeek);
  if (Number.isFinite(days) && days > 0) chips.push(`${days}d/wk`);

  const hours = Number(profile.hoursPerSession);
  if (Number.isFinite(hours) && hours > 0) chips.push(`${Math.round(hours * 60)} min/session`);

  return chips.slice(0, 4);
}

function renderRoutineWeeksInto(container, routine, onDrillDetailExpand) {
  const completions = routine.completions || {};
  const isSaved = Boolean(routine.id);
  const nextIncomplete = isSaved ? getNextIncompleteSession(routine) : null;
  const nextKey = nextIncomplete ? nextIncomplete.key : null;

  container.innerHTML = "";
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

      const isNext = key === nextKey;
      const card = document.createElement("div");
      card.className = "session-card" + (done ? " completed" : "") + (isNext ? " next-session" : "");
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

      // "Start Session" CTA on the next incomplete session
      if (isNext) {
        const startBtn = document.createElement("button");
        startBtn.type = "button";
        startBtn.className = "btn btn-brand btn-sm session-start-btn";
        startBtn.textContent = "Start";
        startBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          // Enter the inline runner if available, else stay on plan tab
          if (typeof enterSessionRunner === "function") {
            enterSessionRunner(routine, nextIncomplete);
            setPlanMode("home");
          }
        });
        header.appendChild(startBtn);
      }

      card.appendChild(header);

      // Body with structured drill blocks
      const body = document.createElement("div");
      body.className = "session-card-body";

      let expandedDrillBlock = null;
      session.bullets.forEach((bullet, bi) => {
        const drillBlock = document.createElement("div");
        drillBlock.className = "drill-block routine-drill-row";

        const type = parseBulletType(bullet);
        const duration = parseBulletDuration(bullet);
        const durationPill = document.createElement("span");
        durationPill.className = `drill-duration-pill ${type}`;
        durationPill.textContent = duration ? duration.toUpperCase() : normalizeBlockLabel(type);

        const bulletText = bullet.replace(/^\d+\s*min\s*[–—-]?\s*/, "").trim();
        const drillMatch = drillLibraryCache ? drillLibraryCache.find((d) => bulletText.includes(d.name)) : null;
        const rawDrillName = drillMatch ? drillMatch.name : bulletText.split(/[–—:-]/)[0].trim();
        const drillName = drillMatch ? rawDrillName : normalizeBlockLabel(rawDrillName);
        const detailTextRaw = rawDrillName ? bulletText.replace(rawDrillName, "").replace(/^[\s:–—-]+/, "").trim() : bulletText;
        const drillDescription = drillMatch?.description || "";
        const detailSections = buildDrillDetailsSections(detailTextRaw, drillDescription, type, duration, drillName);
        const metaTags = buildDrillMetaTags(`${detailTextRaw}. ${drillDescription}`, type);
        const fullDetailsText = [detailTextRaw, drillDescription]
          .map((text) => String(text || "").trim())
          .filter((text, idx, arr) => text && arr.findIndex((candidate) => candidate.toLowerCase() === text.toLowerCase()) === idx)
          .join(" ");

        const summary = document.createElement("div");
        summary.className = "drill-summary-row";
        summary.appendChild(durationPill);

        const main = document.createElement("div");
        main.className = "drill-main";

        const detailId = `drill-details-${wi}-${si}-${bi}`;
        const blockLabelToggle = document.createElement("button");
        blockLabelToggle.type = "button";
        blockLabelToggle.className = "drill-block-label-toggle";
        blockLabelToggle.setAttribute("aria-expanded", "false");
        blockLabelToggle.setAttribute("aria-controls", detailId);
        blockLabelToggle.innerHTML = `<span class="label">${normalizeBlockLabel(type)}</span><span class="chev" aria-hidden="true">&#9662;</span>`;
        main.appendChild(blockLabelToggle);

        const nameBtn = document.createElement("button");
        nameBtn.type = "button";
        nameBtn.className = "drill-name-btn";
        nameBtn.textContent = drillName || bulletText || "Drill";
        main.appendChild(nameBtn);

        const meta = document.createElement("div");
        meta.className = "drill-meta-tags";
        meta.textContent = metaTags.join(" • ");
        main.appendChild(meta);
        summary.appendChild(main);

        const detailsToggle = document.createElement("button");
        detailsToggle.type = "button";
        detailsToggle.className = "drill-details-toggle";
        detailsToggle.setAttribute("aria-expanded", "false");
        detailsToggle.setAttribute("aria-controls", detailId);
        detailsToggle.innerHTML = '<span class="label">Details</span><span class="chev" aria-hidden="true">&#9662;</span>';
        summary.appendChild(detailsToggle);

        const details = document.createElement("div");
        details.className = "drill-details";
        details.id = detailId;

        const sections = [
          { title: "Setup", items: detailSections.setup },
          { title: "Execution", items: detailSections.execution },
          { title: "Scoring", items: detailSections.scoring },
          { title: "Progression", items: detailSections.progression }
        ];
        sections.forEach((section) => {
          const sectionEl = document.createElement("section");
          sectionEl.className = "drill-details-section";

          const headingEl = document.createElement("h5");
          headingEl.textContent = section.title;
          sectionEl.appendChild(headingEl);

          const listEl = document.createElement("ul");
          section.items.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item;
            listEl.appendChild(li);
          });
          sectionEl.appendChild(listEl);
          details.appendChild(sectionEl);
        });

        if (fullDetailsText) {
          const fullDetails = document.createElement("p");
          fullDetails.className = "drill-details-full";
          fullDetails.textContent = fullDetailsText;
          details.appendChild(fullDetails);
        }

        const setExpanded = (expanded) => {
          blockLabelToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
          detailsToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
          drillBlock.classList.toggle("expanded", expanded);
          details.classList.toggle("open", expanded);
          if (expanded) expandedDrillBlock = drillBlock;
          else if (expandedDrillBlock === drillBlock) expandedDrillBlock = null;
        };
        drillBlock._setExpanded = setExpanded;

        const toggleDetails = () => {
          const willExpand = detailsToggle.getAttribute("aria-expanded") !== "true";
          if (willExpand && expandedDrillBlock && expandedDrillBlock !== drillBlock && typeof expandedDrillBlock._setExpanded === "function") {
            expandedDrillBlock._setExpanded(false);
          }
          if (willExpand && typeof onDrillDetailExpand === "function") onDrillDetailExpand();
          setExpanded(willExpand);
        };

        blockLabelToggle.addEventListener("click", toggleDetails);
        detailsToggle.addEventListener("click", toggleDetails);
        detailsToggle.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleDetails();
          }
        });
        nameBtn.addEventListener("click", () => {
          if (drillMatch) {
            openDrillModal(drillMatch);
            return;
          }
          toggleDetails();
        });

        drillBlock.appendChild(summary);
        drillBlock.appendChild(details);
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

    container.appendChild(block);
  });

  // Auto-collapse completed weeks: expand only the first incomplete week
  if (isSaved) {
    const weekBlocks = container.querySelectorAll(".week-block");
    let expandedOne = false;
    weekBlocks.forEach((block, wi) => {
      const week = routine.weeks[wi];
      const weekTotal = (week.sessions || []).length;
      let weekDone = 0;
      for (let si = 0; si < weekTotal; si++) {
        if (completions[`${wi}-${si}`]) weekDone += 1;
      }
      if (!expandedOne && weekDone < weekTotal) {
        // First incomplete week — keep expanded
        expandedOne = true;
      } else {
        block.classList.add("collapsed");
      }
    });
    // If all weeks are complete, expand the last week
    if (!expandedOne && weekBlocks.length > 0) {
      weekBlocks[weekBlocks.length - 1].classList.remove("collapsed");
    }
  }
}

function renderRoutine(routine) {
  if (routine) {
    currentRoutine = routine;
    expandedRoutineLibraryKey = routineLibraryKey(routine);
  }

  const routines = getRoutineLibraryItems();
  if (routines.length === 0) {
    routineCard.classList.add("hidden");
    routineEmptyState.classList.remove("hidden");
    routineWeeks.innerHTML = "";
    routineTitleInput.value = "";
    expandedRoutineLibraryKey = null;
    return;
  }

  routineCard.classList.remove("hidden");
  routineEmptyState.classList.add("hidden");
  routineCard.classList.add("library-mode");
  routineWeeks.innerHTML = "";

  if (!routines.some((r) => routineLibraryKey(r) === expandedRoutineLibraryKey)) {
    expandedRoutineLibraryKey = null;
  }

  let routineHintEl = maybeRenderRoutineBlockHint();

  routines.forEach((r) => {
    const key = routineLibraryKey(r);
    const prog = routineProgress(r);
    const weekCount = (r.weeks || []).length;
    const sessionCount = (r.weeks || []).reduce((sum, week) => sum + ((week.sessions || []).length), 0);
    const createdLabel = new Date(r.createdAt || Date.now()).toLocaleDateString();
    const metaChips = getRoutineLibraryChips(r);
    const isExpanded = expandedRoutineLibraryKey === key;
    const isDraft = !r.id;

    const card = document.createElement("article");
    card.className = "routine-library-item" + (isExpanded ? " expanded" : "");

    const header = document.createElement("div");
    header.className = "routine-library-head";
    header.innerHTML = `
      <div class="routine-library-title-wrap">
        <h3 class="routine-library-title">${r.title || "Untitled Routine"}</h3>
        <div class="routine-library-chip-row">
          ${metaChips.map((chip) => `<span class="routine-library-chip">${chip}</span>`).join("")}
        </div>
        <div class="routine-library-stats">
          <span class="routine-library-stat">${prog.done}/${prog.total} sessions</span>
          <span class="routine-library-stat">${prog.pct}% complete</span>
          <span class="routine-library-stat">${weekCount} weeks</span>
          <span class="routine-library-stat">Created ${createdLabel}</span>
        </div>
      </div>
      <div class="routine-library-actions">
        <button class="btn btn-outline btn-sm view-btn" type="button">${isExpanded ? "Hide" : "View"}</button>
        ${isDraft ? '<button class="btn btn-primary btn-sm save-btn" type="button">Save to Profile</button>' : ""}
        ${r.id ? '<button class="btn btn-outline btn-sm export-btn" type="button">Export</button>' : ""}
        ${r.id ? '<button class="btn btn-danger btn-sm delete-btn" type="button">Delete</button>' : ""}
      </div>
    `;

    const viewBtn = header.querySelector(".view-btn");
    viewBtn.addEventListener("click", () => {
      expandedRoutineLibraryKey = isExpanded ? null : key;
      currentRoutine = r;
      routineTitleInput.value = r.title || "";
      routineMeta.textContent = `${r.meta || ""} • Created ${createdLabel}`;
      renderRoutine();
    });

    const saveBtn = header.querySelector(".save-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        currentRoutine = r;
        routineTitleInput.value = r.title || "";
        saveRoutineBtn.click();
      });
    }

    const exportBtn = header.querySelector(".export-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        currentRoutine = r;
        routineTitleInput.value = r.title || "";
        exportPdfBtn?.click();
      });
    }

    const deleteBtn = header.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        openConfirmModal("Delete Routine", `Are you sure you want to delete "${r.title}"? This cannot be undone.`, async () => {
          try {
            await api(`/api/routines/${r.id}`, { method: "DELETE" });
            savedRoutines = savedRoutines.filter((item) => item.id !== r.id);
            setCachedRoutines(currentUser?.id, savedRoutines);
            if (currentRoutine?.id === r.id) currentRoutine = null;
            if (expandedRoutineLibraryKey === key) expandedRoutineLibraryKey = null;
            renderRoutine();
            if (activePlanMode === "home") renderHomeDashboard();
          } catch (err) {
            setMessage(err.message, true);
          }
        });
      });
    }

    card.appendChild(header);

    if (isExpanded) {
      const body = document.createElement("div");
      body.className = "routine-library-body";
      renderRoutineWeeksInto(body, r, () => {
        if (routineHintEl) {
          markRoutineBlockHintSeen(currentUser?.id);
          routineHintEl.remove();
          routineHintEl = null;
        }
      });
      card.appendChild(body);
    }

    routineWeeks.appendChild(card);
  });

  updateEmptyState();
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
    setCachedRoutines(currentUser?.id, savedRoutines);
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
  // No-op: saved routines are now rendered inside the switcher modal
  renderUsage();
}

// ===== Routine Switcher Modal =====
function openRoutineSwitcher() {
  renderSwitcherList();
  renderUsage();
  setOverlayVisible(routineSwitcherModal, true);
}

function closeRoutineSwitcher() {
  setOverlayVisible(routineSwitcherModal, false);
}

switcherModalClose.addEventListener("click", closeRoutineSwitcher);
routineSwitcherModal.addEventListener("click", (e) => {
  if (e.target === routineSwitcherModal) closeRoutineSwitcher();
});

function renderSwitcherList() {
  switcherList.innerHTML = "";
  switcherEmptyState.classList.toggle("hidden", savedRoutines.length > 0);

  const sorted = [...savedRoutines].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  sorted.forEach((routine) => {
    const item = document.createElement("article");
    item.className = "switcher-item" + (currentRoutine?.id === routine.id ? " active" : "");

    const prog = routineProgress(routine);

    item.innerHTML = `
      <div class="switcher-info">
        <p class="saved-title">${routine.title}</p>
        <p class="saved-meta">${routine.meta} &bull; ${new Date(routine.createdAt).toLocaleDateString()}</p>
        <div class="saved-progress-wrap"><div class="saved-progress-bar" style="width:${prog.pct}%"></div></div>
        <p class="saved-progress-text">${prog.done}/${prog.total} sessions (${prog.pct}%)</p>
      </div>
      <div class="switcher-actions">
        <button class="btn btn-primary btn-sm load-btn" type="button">${currentRoutine?.id === routine.id ? "Active" : "Load"}</button>
        <button class="btn btn-danger btn-sm delete-btn" type="button">Delete</button>
      </div>
    `;

    const loadBtn = item.querySelector(".load-btn");
    if (currentRoutine?.id === routine.id) {
      loadBtn.disabled = true;
    }
    loadBtn.addEventListener("click", () => {
      currentRoutine = routine;
      renderRoutine(currentRoutine);
      hydrateForm(routine.profileSnapshot);
      routineTitleInput.value = routine.title || "";
      closeRoutineSwitcher();
      setPlanMode("generated");
    });

    item.querySelector(".delete-btn").addEventListener("click", () => {
      openConfirmModal("Delete Routine", `Are you sure you want to delete "${routine.title}"? This cannot be undone.`, async () => {
        try {
          await api(`/api/routines/${routine.id}`, { method: "DELETE" });
          savedRoutines = savedRoutines.filter((r) => r.id !== routine.id);
          setCachedRoutines(currentUser?.id, savedRoutines);
          renderSwitcherList();
          renderUsage();

          if (currentRoutine?.id === routine.id) {
            currentRoutine = null;
            renderRoutine(null);
          }
          if (activePlanMode === "home") renderHomeDashboard();
        } catch (err) {
          setMessage(err.message, true);
        }
      });
    });

    switcherList.appendChild(item);
  });
}

async function loadUserData() {
  const [profileRes, routineRes] = await Promise.all([api("/api/profile"), api("/api/routines")]);
  const profile = profileRes.profile || getCachedProfile(currentUser.id) || { name: currentUser.name };
  hydrateForm(profile);
  renderProfileSummary(profile);
  setCachedProfile(currentUser.id, profile);
  const serverRoutines = routineRes.routines || [];
  // If server lost routines (e.g. ephemeral storage cold start), restore from local cache
  if (serverRoutines.length === 0) {
    savedRoutines = getCachedRoutines(currentUser.id) || [];
  } else {
    savedRoutines = serverRoutines;
    setCachedRoutines(currentUser.id, serverRoutines);
  }
  renderSavedRoutines();
  currentRoutine = null;
  renderRoutine(null);
  updateEmptyState();
  if (activePlanMode === "home") renderHomeDashboard();
}

function updateAuthUi() {
  const isAuthed = Boolean(currentUser);
  authStatus.textContent = isAuthed ? `Signed in as ${currentUser.name}` : "Not signed in";
  setAuthMode(isAuthed ? false : isRegisterMode);
  authPanel.classList.add("hidden");
  userMenuWrap.classList.toggle("hidden", !isAuthed);
  showAdminBtn?.classList.toggle("hidden", !(isAuthed && currentUser.role === "super"));
  topSignInBtn.classList.toggle("hidden", isAuthed);
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
  updateEmptyState();
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
  updateEmptyState();
  setMessage("Logged out.");
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

showHomeBtn.addEventListener("click", () => setPlanMode("home"));
showGeneratedRoutineBtn.addEventListener("click", () => {
  setPlanMode("generated");
  expandedRoutineLibraryKey = null;
});
showCustomRoutineBtn?.addEventListener("click", () => setPlanMode("custom"));
showDrillLibraryBtn.addEventListener("click", () => setPlanMode("drills"));
showStatsBtn.addEventListener("click", () => setPlanMode("stats"));
showAdminBtn?.addEventListener("click", () => setPlanMode("admin"));
openGenerateFlowBtn?.addEventListener("click", () => setRoutineCreateFlow("generated"));
openCustomFlowBtn?.addEventListener("click", () => setRoutineCreateFlow("custom"));
closeRoutineCreateFlowBtn?.addEventListener("click", () => {
  setRoutineCreateFlow(null);
  renderRoutine();
});
adminRefreshBtn?.addEventListener("click", loadAdminUsers);
selectedDrillsBtn?.addEventListener("click", () => {
  if (selectedDrillsBtn.disabled) return;
  setPlanMode("generated");
  setRoutineCreateFlow("custom");
  setTimeout(() => {
    customRoutineView?.scrollIntoView({ behavior: "smooth", block: "start" });
    const focusTarget = document.getElementById("customTitle") || document.getElementById("customDrillSearch");
    focusTarget?.focus({ preventScroll: true });
  }, 0);
});

// Plan tab segmented control
planSegGenerated.addEventListener("click", () => setPlanSubmode("generated"));
planSegCustom.addEventListener("click", () => setPlanSubmode("custom"));

// Home dashboard event listeners are attached dynamically in render functions

// Handicap button group — single select
document.querySelectorAll("#handicapGroup .btn-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#handicapGroup .btn-toggle").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("handicap").value = btn.dataset.value;
  });
});

// Weakness chip grid — multi-select, max 2
document.querySelectorAll("#weaknessGrid .chip").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("selected")) {
      btn.classList.remove("selected");
    } else {
      const selected = document.querySelectorAll("#weaknessGrid .chip.selected");
      if (selected.length >= 2) return;
      btn.classList.add("selected");
    }
    const vals = Array.from(document.querySelectorAll("#weaknessGrid .chip.selected")).map(b => b.dataset.value);
    document.getElementById("weakness").value = vals[0] || "";
  });
});

// Days per week button group — single select
document.querySelectorAll("#daysPerWeekGroup .btn-toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#daysPerWeekGroup .btn-toggle").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    document.getElementById("daysPerWeek").value = btn.dataset.value;
  });
});

// Duration picker — hours & minutes with 15-min intervals
function updateHoursPerSession() {
  const h = Number(document.getElementById("durationHours").dataset.value);
  const m = Number(document.getElementById("durationMinutes").dataset.value);
  const total = h + m / 60;
  document.getElementById("hoursPerSession").value = total;
}

document.querySelectorAll(".duration-arrow").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = document.getElementById(btn.dataset.target);
    const dir = btn.dataset.dir;
    let val = Number(target.dataset.value);

    if (target.id === "durationHours") {
      val = dir === "up" ? Math.min(val + 1, 8) : Math.max(val - 1, 0);
      target.dataset.value = val;
      target.textContent = val;
    } else {
      const steps = [0, 15, 30, 45];
      let idx = steps.indexOf(val);
      if (idx === -1) idx = 0;
      idx = dir === "up" ? Math.min(idx + 1, steps.length - 1) : Math.max(idx - 1, 0);
      target.dataset.value = steps[idx];
      target.textContent = String(steps[idx]).padStart(2, "0");
    }
    updateHoursPerSession();
  });
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
upgradeBtn.addEventListener("click", () => {
  requireAuth("Sign in to upgrade", async () => {
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
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isGeneratingRoutine) return;

  const handicapVal = document.getElementById("handicap").value;
  const weaknessSelected = document.querySelectorAll("#weaknessGrid .chip.selected").length > 0;
  if (!handicapVal || !weaknessSelected || !profileForm.checkValidity()) {
    if (!handicapVal) setMessage("Select a handicap level.", true);
    else if (!weaknessSelected) setMessage("Select at least one weakness.", true);
    else { profileForm.reportValidity(); setMessage("Complete all required profile fields before generating a routine.", true); }
    return;
  }

  requireAuth("Sign in to generate a routine", async () => {
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
      setRoutineCreateFlow(null);
      updateEmptyState();
      setMessage("Routine generated. Tap Save to add it to My Routines.");
    } catch (err) {
      setMessage(err.message, true);
    } finally {
      isGeneratingRoutine = false;
      generateRoutineBtn.disabled = false;
      generateRoutineBtn.textContent = "Generate Routine";
    }
  });
});

saveRoutineBtn.addEventListener("click", () => {
  if (!currentRoutine) return;

  requireAuth("Sign in to save routines", async () => {
    try {
      const customSaveName = routineTitleInput.value.trim();
      const isUpdate = Boolean(currentRoutine.id);

      if (isUpdate) {
        // Update existing routine
        const updates = {};
        if (customSaveName && customSaveName !== currentRoutine.title) updates.title = customSaveName;
        if (currentRoutine.meta) updates.meta = currentRoutine.meta;
        if (currentRoutine.weeks) updates.weeks = currentRoutine.weeks;

        if (Object.keys(updates).length === 0) {
          setMessage("No changes to save.");
          return;
        }

        const result = await api(`/api/routines/${currentRoutine.id}`, {
          method: "PUT",
          body: JSON.stringify(updates)
        });

        const idx = savedRoutines.findIndex((r) => r.id === currentRoutine.id);
        if (idx !== -1) savedRoutines[idx] = result.routine;
        currentRoutine = result.routine;
        setCachedRoutines(currentUser?.id, savedRoutines);
        renderSavedRoutines();
        setRoutineCreateFlow(null);
        expandedRoutineLibraryKey = null;
        renderRoutine();
        setMessage("Routine saved.");
      } else {
        // Create new routine
        const routineToSave = customSaveName
          ? { ...currentRoutine, title: customSaveName }
          : currentRoutine;

        const result = await api("/api/routines", {
          method: "POST",
          body: JSON.stringify({ routine: routineToSave })
        });

        savedRoutines = [result.routine, ...savedRoutines];
        currentRoutine = result.routine;
        setCachedRoutines(currentUser?.id, savedRoutines);
        renderSavedRoutines();
        setRoutineCreateFlow(null);
        expandedRoutineLibraryKey = null;
        renderRoutine();
        setMessage("Routine saved.");
      }
    } catch (err) {
      if (err.code === "UPGRADE_REQUIRED") {
        setMessage("You reached 5 total saved routines (generated + custom). Upgrade to Pro for unlimited.", true);
        return;
      }

      setMessage(err.message, true);
    }
  });
});

changeRoutineBtn.addEventListener("click", () => {
  requireAuth("Sign in to view routines", () => openRoutineSwitcher());
});

editProfileBtn.addEventListener("click", () => {
  expandProfileForm();
});

summaryGenerateBtn.addEventListener("click", () => {
  profileForm.requestSubmit();
});

clearProfileBtn.addEventListener("click", () => {
  if (!currentUser) return;

  openConfirmModal("Clear Profile", "Are you sure you want to clear your profile? Your saved routines will not be affected.", async () => {
    hydrateForm({ name: currentUser.name });
    renderProfileSummary(null);
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
    weaknesses: ["Putting confidence", "Short game touch"],
    daysPerWeek: 4,
    hoursPerSession: 1.5,
    notes: "Weekend practice should include 9-hole simulation"
  };

  hydrateForm(demoProfile);
  currentRoutine = generateRoutine(demoProfile);
  renderRoutine(currentRoutine);
  routineTitleInput.value = currentRoutine.title;
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
  const weaknessOrder = ["Driving accuracy", "Approach consistency", "Ball striking", "Short game touch", "Chipping & pitching", "Putting confidence", "Lag putting", "Distance control", "Course management", "Mental game", "Fairway woods & hybrids", "Scoring under pressure"];
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
        `<p class="drill-item-tags">${normalizeBlockLabel(drill.type)} • ${drill.levels.join(", ")}</p>` +
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
        `<p class="drill-item-tags">${normalizeBlockLabel(drill.type)} • ${drill.levels.join(", ")}</p>` +
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
    renderSampleStats();
    return;
  }
  const statsContent = document.getElementById("statsContent");
  showSkeleton(statsContent, "stats");
  try {
    if (!drillLibraryCache) {
      try {
        const drillsResult = await api("/api/drills");
        drillLibraryCache = drillsResult.drills || null;
      } catch (_) {}
    }
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
  document.getElementById("statStreak").textContent = formatDayCount(stats.currentStreak);
  document.getElementById("statLongest").textContent = formatDayCount(stats.longestStreak);

  const pct = stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0;
  document.getElementById("statProgressBar").style.width = `${pct}%`;
  document.getElementById("statProgressText").textContent = `${stats.completedSessions} / ${stats.totalSessions} sessions (${pct}%)`;

  const weaknessEl = document.getElementById("statWeakness");
  weaknessEl.innerHTML = "";
  const coverageRows = buildWeaknessCoverageRows();
  if (coverageRows.total === 0) {
    weaknessEl.innerHTML = '<p class="stat-progress-text">No completion data yet.</p>';
    return;
  }

  for (const rowData of coverageRows.rows) {
    const row = document.createElement("div");
    row.className = "weakness-row";
    row.innerHTML = `<span>${rowData.label}</span>` +
      `<div class="bar-bg"><div class="bar-fill" style="width:${rowData.percent}%"></div></div>` +
      `<span class="bar-count coverage-percent">${rowData.percent}%</span>`;
    weaknessEl.appendChild(row);
  }
}

const COVERAGE_CATEGORIES = [
  { id: "driving", label: "Driving" },
  { id: "approach", label: "Approach" },
  { id: "short_game", label: "Short Game" },
  { id: "putting", label: "Putting" },
  { id: "course_management", label: "Course Management" }
];

function mapWeaknessToCoverageId(raw) {
  const weakness = String(raw || "").toLowerCase();
  if (!weakness) return null;
  if (weakness.includes("putt")) return "putting";
  if (weakness.includes("short game") || weakness.includes("chip") || weakness.includes("pitch") || weakness.includes("bunker")) return "short_game";
  if (weakness.includes("driv") || weakness.includes("fairway wood") || weakness.includes("hybrid")) return "driving";
  if (weakness.includes("approach") || weakness.includes("ball striking") || weakness.includes("distance control")) return "approach";
  if (weakness.includes("course management") || weakness.includes("mental game") || weakness.includes("scoring under pressure")) return "course_management";
  return null;
}

function getCompletedSessionsForCoverage(limit = 14) {
  const entries = [];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);

  for (const routine of savedRoutines) {
    const completions = routine.completions || {};
    for (const [key, completion] of Object.entries(completions)) {
      if (!completion) continue;
      const match = key.match(/^(\d+)-(\d+)$/);
      if (!match) continue;
      const wi = Number(match[1]);
      const si = Number(match[2]);
      const session = routine.weeks?.[wi]?.sessions?.[si];
      if (!session) continue;
      const completedAt = parseCompletionTimestamp(completion) || parseCompletionTimestamp(routine.reflections?.[key]?.date);
      entries.push({ routine, session, completedAt });
    }
  }

  const withDates = entries.filter((e) => e.completedAt);
  if (withDates.length > 0) {
    return withDates.filter((e) => e.completedAt >= start);
  }
  return entries.slice(-limit);
}

function getSessionCoverageCategories(entry, drillById) {
  const categories = new Set();
  const session = entry.session || {};
  const routine = entry.routine || {};

  const directWeaknesses = [];
  if (typeof session.weakness === "string") directWeaknesses.push(session.weakness);
  if (typeof session.focus === "string") directWeaknesses.push(session.focus);
  if (typeof session.category === "string") directWeaknesses.push(session.category);
  if (typeof routine.profileSnapshot?.weakness === "string") directWeaknesses.push(routine.profileSnapshot.weakness);
  if (Array.isArray(routine.profileSnapshot?.weaknesses)) directWeaknesses.push(...routine.profileSnapshot.weaknesses);

  for (const weakness of directWeaknesses) {
    const categoryId = mapWeaknessToCoverageId(weakness);
    if (categoryId) categories.add(categoryId);
  }

  if (Array.isArray(session.drillIds) && session.drillIds.length > 0) {
    for (const drillId of session.drillIds) {
      const drill = drillById.get(drillId);
      for (const weakness of drill?.weaknesses || []) {
        const categoryId = mapWeaknessToCoverageId(weakness);
        if (categoryId) categories.add(categoryId);
      }
    }
  } else if (Array.isArray(session.bullets) && drillLibraryCache) {
    for (const bullet of session.bullets) {
      const text = String(bullet || "");
      const drill = drillLibraryCache.find((d) => text.includes(d.name));
      for (const weakness of drill?.weaknesses || []) {
        const categoryId = mapWeaknessToCoverageId(weakness);
        if (categoryId) categories.add(categoryId);
      }
    }
  }

  return categories;
}

function buildWeaknessCoverageRows() {
  const drillById = new Map((drillLibraryCache || []).map((d) => [d.id, d]));
  const counts = Object.fromEntries(COVERAGE_CATEGORIES.map((c) => [c.id, 0]));
  const sessions = getCompletedSessionsForCoverage(14);

  for (const entry of sessions) {
    const categories = getSessionCoverageCategories(entry, drillById);
    for (const id of categories) {
      counts[id] += 1;
    }
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const rows = COVERAGE_CATEGORIES.map((cat) => {
    const value = counts[cat.id] || 0;
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    return { id: cat.id, label: cat.label, percent };
  });

  return { rows, total };
}

function getLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseCompletionTimestamp(value) {
  if (!value) return null;

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "object") {
    const ts = value.completedAt || value.completed_at || value.date || value.timestamp;
    if (!ts) return null;
    const parsed = new Date(ts);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function buildLast7DayActivity() {
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const days = [];
  const counts = {};

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = getLocalDateKey(d);
    days.push({ key, label: dayLabels[d.getDay()] });
    counts[key] = 0;
  }

  for (const routine of savedRoutines) {
    const completions = routine.completions || {};
    for (const [sessionKey, completion] of Object.entries(completions)) {
      // Match existing completion semantics: truthy entry means completed.
      if (!completion) continue;

      let completedAt = parseCompletionTimestamp(completion);
      if (!completedAt) {
        const refDate = routine.reflections?.[sessionKey]?.date;
        completedAt = refDate ? parseCompletionTimestamp(refDate) : null;
      }
      if (!completedAt) continue;

      const localKey = getLocalDateKey(completedAt);
      if (Object.prototype.hasOwnProperty.call(counts, localKey)) {
        counts[localKey] += 1;
      }
    }
  }

  return days.map((d) => ({ ...d, count: counts[d.key] || 0 }));
}

function formatDayCount(value) {
  if (value == null) return "\u2014";
  const num = Number(value);
  if (!Number.isFinite(num)) return "\u2014";
  return `${num} days`;
}

function renderLast7DayActivity(statsContent) {
  const data = buildLast7DayActivity().sort((a, b) => a.key.localeCompare(b.key));
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const section = document.createElement("div");
  section.className = "stats-detail activity-chart-section";
  section.innerHTML = "<h3>Activity (Last 7 days)</h3>";

  const chart = document.createElement("div");
  chart.className = "activity-chart";
  if (total === 0) chart.classList.add("is-empty");

  data.forEach((day) => {
    const col = document.createElement("div");
    col.className = "activity-col";
    const barHeight = day.count === 0 ? 14 : Math.max(24, Math.round((day.count / maxCount) * 100));
    col.innerHTML = `
      <span class="activity-count">${day.count}</span>
      <div class="activity-bar-area"><div class="activity-bar" style="height:${barHeight}%"></div></div>
      <span class="activity-day">${day.label}</span>
    `;
    chart.appendChild(col);
  });

  section.appendChild(chart);

  if (total === 0) {
    const empty = document.createElement("p");
    empty.className = "stat-progress-text";
    empty.textContent = "No completions yet. Your next session starts the streak.";
    section.appendChild(empty);
  }

  statsContent.appendChild(section);
}

function renderEnhancedStats(stats) {
  const statsContent = document.getElementById("statsContent");
  renderLast7DayActivity(statsContent);

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

// Custom routine builder - Step 1: Setup
document.getElementById("customSetupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("customTitle").value.trim();
  const weeks = Number(document.getElementById("customWeeks").value);
  const sessionsPerWeek = Number(document.getElementById("customSessions").value);
  if (!title || !weeks || !sessionsPerWeek) return;

  const totalSessions = sessionsPerWeek;
  if (!customBuilderState || customBuilderState.title !== title) {
    customBuilderState = { title, weeks, sessionsPerWeek, sessions: [] };
  } else {
    customBuilderState.title = title;
    customBuilderState.weeks = weeks;
    customBuilderState.sessionsPerWeek = sessionsPerWeek;
  }
  while (customBuilderState.sessions.length < totalSessions) {
    customBuilderState.sessions.push({ title: `Session ${customBuilderState.sessions.length + 1}`, items: [] });
  }
  customBuilderState.sessions.length = totalSessions;

  if (!drillLibraryCache) {
    api("/api/drills").then((r) => { drillLibraryCache = r.drills; }).catch(() => {});
  }
  showCustomStep(2);
});

function showCustomStep(step) {
  document.getElementById("customStep1").classList.toggle("hidden", step !== 1);
  document.getElementById("customStep2").classList.toggle("hidden", step !== 2);
  document.getElementById("customStep3").classList.toggle("hidden", step !== 3);
  if (step === 2) {
    renderCustomSessionTabs();
    renderCustomSessionEditor();
  } else if (step === 3) {
    renderCustomPreview();
  }
}

function renderCustomSessionTabs() {
  const tabs = document.getElementById("customSessionTabs");
  tabs.innerHTML = "";
  customBuilderState.sessions.forEach((session, i) => {
    const btn = document.createElement("button");
    btn.className = "custom-session-tab" + (i === customActiveSessionIndex ? " active" : "");
    btn.type = "button";
    const count = session.items.length;
    btn.textContent = session.title + (count ? ` (${count})` : "");
    btn.addEventListener("click", () => {
      customActiveSessionIndex = i;
      renderCustomSessionTabs();
      renderCustomSessionEditor();
    });
    tabs.appendChild(btn);
  });
}

function renderCustomSessionEditor() {
  const session = customBuilderState.sessions[customActiveSessionIndex];
  document.getElementById("customSessionTitle").textContent = session.title;
  renderCustomSessionItems();
}

function renderCustomSessionItems() {
  const container = document.getElementById("customSessionItems");
  const session = customBuilderState.sessions[customActiveSessionIndex];
  container.innerHTML = "";

  if (session.items.length === 0) {
    container.innerHTML = '<p class="custom-empty-hint">No items yet. Search drills above or add a custom task.</p>';
    return;
  }

  session.items.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "custom-session-item";
    el.setAttribute("draggable", "true");
    el.dataset.dragIdx = idx;

    const chipClass = item.type === "drill" ? (item.drillType || "technical") : "reflection";
    const chipLabel = item.type === "drill" ? normalizeBlockLabel(item.drillType || "drill") : "Custom";

    el.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">&#8801;</span>
      <span class="drill-chip ${chipClass}">${chipLabel}</span>
      <div class="custom-item-info">
        <p class="custom-item-name">${item.name}</p>
      </div>
      <div class="custom-item-duration">
        <input type="number" min="1" max="120" value="${item.duration || 15}" data-item-idx="${idx}" />
        <span style="font-size:0.75rem;color:var(--muted)">min</span>
      </div>
      <button class="custom-item-remove" data-remove-idx="${idx}" type="button">&times;</button>
    `;
    container.appendChild(el);
  });

  container.querySelectorAll(".custom-item-duration input").forEach((inp) => {
    inp.addEventListener("change", () => {
      session.items[Number(inp.dataset.itemIdx)].duration = Number(inp.value) || 15;
    });
  });

  container.querySelectorAll(".custom-item-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      const removeIdx = Number(btn.dataset.removeIdx);
      const removed = session.items[removeIdx];
      session.items.splice(removeIdx, 1);
      if (removed && removed.type === "drill" && removed.drillId) {
        selectedDrillsStore?.removeSelectedDrill(removed.drillId);
        updateSelectedDrillsBtn();
      }
      renderCustomSessionItems();
      renderCustomSessionTabs();
    });
  });

  // Drag-drop reorder
  let dragFrom = null;
  container.querySelectorAll(".custom-session-item").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      dragFrom = Number(el.dataset.dragIdx);
      el.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      container.querySelectorAll(".custom-session-item").forEach((x) => x.classList.remove("drag-over"));
    });
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      container.querySelectorAll(".custom-session-item").forEach((x) => x.classList.remove("drag-over"));
      el.classList.add("drag-over");
    });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      const dragTo = Number(el.dataset.dragIdx);
      if (dragFrom !== null && dragFrom !== dragTo) {
        const [moved] = session.items.splice(dragFrom, 1);
        session.items.splice(dragTo, 0, moved);
        renderCustomSessionItems();
      }
    });
  });
}

// Drill search within custom builder
document.getElementById("customDrillSearch").addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();
  const resultsEl = document.getElementById("customDrillResults");

  if (!query || query.length < 2 || !drillLibraryCache) {
    resultsEl.classList.add("hidden");
    return;
  }

  const filtered = drillLibraryCache.filter((drill) => {
    if (!drill.name.toLowerCase().includes(query) && !drill.description.toLowerCase().includes(query)) return false;
    if (customDrillFilterType && drill.type !== customDrillFilterType) return false;
    return true;
  }).slice(0, 10);

  resultsEl.classList.remove("hidden");
  resultsEl.innerHTML = "";

  if (filtered.length === 0) {
    resultsEl.innerHTML = '<p class="custom-empty-hint">No matching drills.</p>';
    return;
  }

  filtered.forEach((drill) => {
    const row = document.createElement("div");
    row.className = "custom-drill-result";
    row.innerHTML = `
      <div class="custom-drill-result-info">
        <p class="custom-drill-result-name">${drill.name}</p>
        <p class="custom-drill-result-meta">${normalizeBlockLabel(drill.type)} &middot; ${drill.levels.join(", ")}</p>
      </div>
      <button class="btn btn-outline btn-sm" type="button">+ Add</button>
    `;
    row.querySelector(".btn").addEventListener("click", (ev) => {
      ev.stopPropagation();
      addDrillToCustomSession(drill);
    });
    row.querySelector(".custom-drill-result-info").addEventListener("click", () => {
      openDrillModal(drill);
    });
    resultsEl.appendChild(row);
  });
});

document.querySelectorAll(".custom-filter").forEach((chip) => {
  chip.addEventListener("click", () => {
    const val = chip.dataset.filterValue;
    if (customDrillFilterType === val) {
      customDrillFilterType = null;
      chip.classList.remove("active");
    } else {
      document.querySelectorAll(".custom-filter").forEach((c) => c.classList.remove("active"));
      customDrillFilterType = val;
      chip.classList.add("active");
    }
    document.getElementById("customDrillSearch").dispatchEvent(new Event("input"));
  });
});

function addDrillToCustomSession(drill) {
  const session = customBuilderState.sessions[customActiveSessionIndex];
  session.items.push({
    type: "drill",
    drillId: drill.id,
    drillType: drill.type,
    name: drill.name,
    description: drill.description,
    duration: 15
  });
  selectedDrillsStore?.addSelectedDrill(drill.id);
  updateSelectedDrillsBtn();
  renderCustomSessionItems();
  renderCustomSessionTabs();
  showToast(`Added "${drill.name}"`);
}

document.getElementById("customAddTaskBtn").addEventListener("click", () => {
  const nameInput = document.getElementById("customTaskInput");
  const durInput = document.getElementById("customTaskDuration");
  const name = nameInput.value.trim();
  const duration = Number(durInput.value) || 15;

  if (!name) { showToast("Enter a task name.", true); return; }

  const session = customBuilderState.sessions[customActiveSessionIndex];
  session.items.push({ type: "custom", name, description: "", duration });
  nameInput.value = "";
  renderCustomSessionItems();
  renderCustomSessionTabs();
});

document.getElementById("customBackToSetupBtn").addEventListener("click", () => showCustomStep(1));
document.getElementById("customToPreviewBtn").addEventListener("click", () => {
  const hasItems = customBuilderState.sessions.some((s) => s.items.length > 0);
  if (!hasItems) { showToast("Add at least one drill or task to a session.", true); return; }
  showCustomStep(3);
});
document.getElementById("customBackToEditorBtn").addEventListener("click", () => showCustomStep(2));

function renderCustomPreview() {
  const container = document.getElementById("customPreviewContent");
  const state = customBuilderState;
  container.innerHTML = "";

  const header = document.createElement("div");
  header.className = "routine-header";
  header.innerHTML = `<div class="routine-header-info">
    <p class="routine-title">${state.title}</p>
    <p class="routine-meta">Custom routine \u2022 ${state.weeks} weeks \u2022 ${state.sessionsPerWeek} sessions/week</p>
  </div>`;
  container.appendChild(header);

  for (let w = 0; w < state.weeks; w++) {
    const weekEl = document.createElement("section");
    weekEl.className = "week-block";
    weekEl.innerHTML = `<div class="week-header"><h3>Week ${w + 1}: Custom Plan</h3></div>`;
    const sessionsEl = document.createElement("div");
    sessionsEl.className = "week-sessions";

    state.sessions.forEach((session) => {
      const card = document.createElement("div");
      card.className = "session-card";
      const totalMin = session.items.reduce((sum, item) => sum + (item.duration || 0), 0);
      card.innerHTML = `
        <div class="session-card-header">
          <div class="session-card-title"><label>${session.title}</label></div>
          <span style="font-size:0.78rem;color:var(--muted)">${totalMin} min</span>
        </div>
        <div class="session-card-body">
          ${session.items.map((item) => `
            <div class="drill-block">
              <span class="drill-chip ${item.type === "drill" ? (item.drillType || "technical") : "reflection"}">${item.duration} min</span>
              <span class="drill-text">${item.name}</span>
            </div>`).join("")}
        </div>`;
      sessionsEl.appendChild(card);
    });

    weekEl.appendChild(sessionsEl);
    container.appendChild(weekEl);
  }
}

document.getElementById("customCreateBtn").addEventListener("click", () => {
  requireAuth("Sign in to create custom routines", () => {
    const state = customBuilderState;
    const weekBlocks = [];
    for (let w = 0; w < state.weeks; w++) {
      const sessions = state.sessions.map((session) => ({
        title: session.title,
        bullets: session.items.map((item) => `${item.duration} min ${item.name}`),
        drillIds: session.items.filter((item) => item.drillId).map((item) => item.drillId)
      }));
      weekBlocks.push({ week: w + 1, headline: `Week ${w + 1}: Custom Plan`, sessions });
    }

    currentRoutine = {
      profileSnapshot: getProfileFromForm(),
      title: state.title,
      meta: `Custom routine \u2022 ${state.weeks} weeks \u2022 ${state.sessionsPerWeek} sessions/week`,
      weeks: weekBlocks
    };

    renderRoutine(currentRoutine);
    routineTitleInput.value = currentRoutine.title;
    customBuilderState = null;
    customActiveSessionIndex = 0;
    setPlanMode("generated");
    showToast("Custom routine created. Tap Save to add it to My Routines.");
  });
});

// Onboarding
function initOnboarding() {
  const key = "thegolfbuild_onboarded";
  if (!ONBOARDING_ENABLED || !onboardingOverlay) {
    localStorage.setItem(key, "1");
    return;
  }
  if (localStorage.getItem(key)) return;

  setOverlayVisible(onboardingOverlay, true);
  function closeOnboarding() {
    setOverlayVisible(onboardingOverlay, false);
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
  updateSelectedDrillsBtn();
  setPlanMode("home");
  updateAuthUi();

  const token = getToken();
  if (!token) return;

  try {
    const me = await api("/api/auth/me");
    currentUser = me.user;
    updateAuthUi();
    await loadUserData();
    setMessage("Session restored.");
  } catch (err) {
    // Only clear session on genuine auth failure (handled by api() 401 logic).
    // Network errors or server errors should not log the user out — keep
    // the token so the next navigation/action can retry.
    if (!currentUser) {
      updateAuthUi();
    }
  }
})();
