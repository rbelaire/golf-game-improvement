const crypto = require("crypto");

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
    name: asString(profile.name).slice(0, 100),
    handicap: asString(profile.handicap).slice(0, 50),
    weakness: asString(profile.weakness).slice(0, 50),
    daysPerWeek: Math.max(1, Math.min(7, Math.round(asNumber(profile.daysPerWeek, 3)))),
    hoursPerSession: Math.max(0.5, Math.min(4, Math.round(asNumber(profile.hoursPerSession, 1.5) * 2) / 2)),
    notes: asString(profile.notes).slice(0, 2000)
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

module.exports = {
  DRILL_LIBRARY,
  buildRulesRoutine,
  validateProfileShape,
  normalizeProfile
};
