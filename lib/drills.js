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
  { id: "drv-fairway-gates", name: "Fairway Gates Ladder", description: "Set alignment sticks as gates at increasing distances. Work through each gate hitting fairway-width targets, tracking hit percentage.", weaknesses: ["Driving accuracy"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-start-line-spray", name: "Start-Line Spray Audit", description: "Hit 20 drives tracking start line vs intended line. Map your dispersion pattern to identify bias (push, pull, or centered).", weaknesses: ["Driving accuracy"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "drv-tee-pressure", name: "One-Ball Tee Pressure", description: "Simulate first-tee pressure: one ball, one target, full pre-shot routine. Score pass/fail on each rep with a consequence for misses.", weaknesses: ["Driving accuracy"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-window-control", name: "Launch Window Control", description: "Practice hitting drives within a specific launch angle window. Alternate between low-punch and high-draw to build flight control.", weaknesses: ["Driving accuracy"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "drv-fairway-9shot", name: "9-Hole Fairway Keeper", description: "Play 9 imaginary holes off the tee, each with a different shape and target. Score fairways hit out of 9.", weaknesses: ["Driving accuracy"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-wedge-ladder", name: "Wedge Distance Ladder", description: "Hit each wedge at 50%, 75%, and 100% distances. Track carry vs target for each club to build your personal distance chart.", weaknesses: ["Approach consistency"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-face-strike-grid", name: "Face Strike Grid", description: "Use foot spray or impact tape to track strike location on the face. Hit 10 shots aiming for center contact, then review the pattern.", weaknesses: ["Approach consistency"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "app-shot-shape-alternating", name: "Alternating Shape Reps", description: "Hit alternating draw-fade pairs to the same target. Builds shot versatility and clubface awareness under demand.", weaknesses: ["Approach consistency"], type: "technical", levels: ["advanced", "intermediate"] },
  { id: "app-proximity-challenge", name: "Proximity Circle Challenge", description: "Pick a pin and hit 10 approach shots. Score points for landing inside 30ft, bonus inside 15ft. Track your proximity average.", weaknesses: ["Approach consistency"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-approach-9hole", name: "Approach Simulation 9", description: "Simulate 9 approach shots from varying distances and lies. Change clubs and targets each time to mimic on-course conditions.", weaknesses: ["Approach consistency"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-landing-zones", name: "Landing Zone Towel Matrix", description: "Place towels at 3 landing zones around the green. Chip/pitch to each zone in rotation, scoring 1 point per successful landing.", weaknesses: ["Short game touch"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-updown-circuit", name: "Up-and-Down Circuit", description: "Drop balls at 6 spots around the green with different lies. Get up-and-down from each. Track your save percentage.", weaknesses: ["Short game touch"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-bunker-variability", name: "Bunker Variability Reps", description: "Hit bunker shots from plugged, uphill, downhill, and flat lies. Focus on consistent exit and distance control.", weaknesses: ["Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "sg-random-lie-scramble", name: "Random Lie Scramble", description: "Toss a ball randomly around the green 10 times. Play each lie as it sits — rough, fringe, bare — and try to save par.", weaknesses: ["Short game touch"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "sg-wedge-clock", name: "Wedge Clock System", description: "Use 9 o'clock, 10:30, and full swings with each wedge. Record carry distances to build a reliable partial-swing chart.", weaknesses: ["Short game touch"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "putt-gate-startline", name: "Start Line Gate", description: "Set two tees as a gate 2 feet in front of the ball. Roll 20 putts through the gate to train start-line accuracy.", weaknesses: ["Putting confidence"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-ladder-369", name: "3-6-9 Pressure Ladder", description: "Make a putt from 3ft, then 6ft, then 9ft. If you miss, restart. Builds clutch putting under escalating pressure.", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-read-compare", name: "Read-and-React Compare", description: "Read the break before each putt, commit to the line, then compare result to your read. Trains green-reading accuracy.", weaknesses: ["Putting confidence"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "putt-make-10-row", name: "Make 10 in a Row", description: "From 3 feet, make 10 consecutive putts. If you miss, restart the count. Builds short-putt confidence and routine.", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate"] },
  { id: "putt-par18", name: "Par-18 Putting Game", description: "Play 9 holes on the putting green, par 2 each. Track your score vs 18. Simulates real scoring pressure on the greens.", weaknesses: ["Putting confidence"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-club-selection-tree", name: "Club Selection Decision Tree", description: "For each approach, list 3 club options with risk/reward. Choose the highest-percentage play and log your reasoning.", weaknesses: ["Course management"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-risk-reward-log", name: "Risk/Reward Decision Log", description: "On every par-5 and driveable par-4, write your decision (go/layup) and outcome. Review patterns after the round.", weaknesses: ["Course management"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cm-miss-map", name: "Miss Map Strategy", description: "Before each shot, identify the safe miss side. Aim so your miss still leaves a playable next shot. Log misses vs plan.", weaknesses: ["Course management"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-3ball-choices", name: "3-Ball Choice Test", description: "Hit 3 balls from the same spot with 3 different strategies (aggressive, safe, creative). Compare outcomes to train shot selection.", weaknesses: ["Course management"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "cm-post-round-audit", name: "Post-Round Audit Loop", description: "After a round, review 3 best and 3 worst decisions. Note what you would change and carry one adjustment into next round.", weaknesses: ["Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-mobility-sequence", name: "Mobility and Tempo Sequence", description: "5-minute dynamic stretch plus 10 half-speed swings. Primes the body, sets tempo, and builds a repeatable warm-up ritual.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-contact-baseline", name: "Contact Baseline Check", description: "Hit 10 easy 7-irons focusing purely on center contact. Rate each strike 1-5 to establish your baseline for the session.", weaknesses: ["Driving accuracy", "Approach consistency"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-pre-shot-routine", name: "Pre-Shot Routine Rehearsal", description: "Run your full pre-shot routine on every rep: read, visualize, commit, execute. Time each routine to build consistency.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-score-target", name: "Score Target Challenge", description: "Set a target score for a practice game (e.g. 7/10 fairways). Play the game with full routine and track vs target.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-recovery-shots", name: "Recovery Shot Scenarios", description: "Practice punch-outs, low hooks under trees, and flop shots over obstacles. Builds the creative shot-making you need on course.", weaknesses: ["Course management", "Approach consistency"], type: "transfer", levels: ["intermediate", "advanced"] },

  // --- Driving accuracy (6-10) ---
  { id: "drv-tempo-trainer", name: "Tempo Ratio Trainer", description: "Hit drives at 60%, 75%, and 90% effort, recording distance and accuracy for each. Find the effort level that maximizes fairways hit.", weaknesses: ["Driving accuracy"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-alignment-reset", name: "Alignment Station Reset", description: "Set up a full alignment station (feet, hips, shoulders) with sticks. Hit 5 drives, remove sticks, hit 5 more. Compare dispersion to train body memory.", weaknesses: ["Driving accuracy"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "drv-windy-9", name: "Windy 9 Simulation", description: "Simulate 9 holes with crosswind, headwind, and downwind conditions. Adjust ball flight shape for each and score fairways hit.", weaknesses: ["Driving accuracy"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "drv-3club-challenge", name: "3-Club Tee Challenge", description: "Play 9 tee shots using only driver, 3-wood, and a long iron. Pick the best club for each hole shape to build strategic tee-shot thinking.", weaknesses: ["Driving accuracy"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "drv-rhythm-breath", name: "Rhythm and Breath Sync", description: "Inhale during backswing, exhale through impact. Hit 15 drives focusing only on breath timing. Builds a calm, repeatable tempo.", weaknesses: ["Driving accuracy"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },

  // --- Approach consistency (6-10) ---
  { id: "app-stock-yardage", name: "Stock Yardage Builder", description: "Pick one iron and hit 20 shots with your stock swing. Record carry distances to find your true average and dispersion for that club.", weaknesses: ["Approach consistency"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-uphill-downhill", name: "Uphill/Downhill Lie Reps", description: "Find or simulate uphill and downhill lies. Hit 10 shots from each, adjusting aim and club selection. Tracks how lie affects distance.", weaknesses: ["Approach consistency"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "app-pin-hunter", name: "Pin Hunter 10-Shot Test", description: "Pick 10 different pins at varying distances. One shot per pin with full routine. Score based on proximity: inside 20ft = 2pts, inside 10ft = 5pts.", weaknesses: ["Approach consistency"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "app-3quarter-mastery", name: "Three-Quarter Swing Mastery", description: "Hit every iron in your bag at three-quarter effort. Record each carry to build a knockdown distance chart for windy or control situations.", weaknesses: ["Approach consistency"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "app-round-replay", name: "Approach Round Replay", description: "Recreate 9 approach shots from your last round. Same clubs, same distances. See if you can beat your actual proximity results.", weaknesses: ["Approach consistency"], type: "transfer", levels: ["intermediate", "advanced"] },

  // --- Short game touch (6-10) ---
  { id: "sg-flop-commit", name: "Flop Shot Commitment Drill", description: "Open the face fully and commit to 10 high-lofted flop shots over a towel. Focus on acceleration through impact — no deceleration allowed.", weaknesses: ["Short game touch"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sg-chip-putt-match", name: "Chip vs Putt Match Play", description: "From the fringe, alternate chipping and putting to the same hole. Score match play style to learn when each technique wins.", weaknesses: ["Short game touch"], type: "transfer", levels: ["beginner", "intermediate"] },
  { id: "sg-distance-ladder", name: "Short Game Distance Ladder", description: "Chip to targets at 10, 20, 30, and 40 feet. Complete 3 successful reps at each distance before moving to the next.", weaknesses: ["Short game touch"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-worst-ball-scramble", name: "Worst Ball Scramble", description: "Drop 2 balls around the green. Always play the worse lie. Get up-and-down from 6 locations. Builds resilience in tough situations.", weaknesses: ["Short game touch"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sg-trajectory-trio", name: "Trajectory Trio Drill", description: "From the same spot, hit a low runner, a medium pitch, and a high lob. Repeat from 5 spots to build trajectory control around greens.", weaknesses: ["Short game touch"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },

  // --- Putting confidence (6-10) ---
  { id: "putt-speed-only", name: "Eyes-Closed Speed Drill", description: "Putt with your eyes closed from 20, 30, and 40 feet. Focus purely on feel and distance control. Score by proximity, not makes.", weaknesses: ["Putting confidence"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-clock-game", name: "Clock Putting Game", description: "Place 12 balls in a clock pattern around the hole at 4 feet. Make all 12 to complete the clock. Restart from the miss if you fail.", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-lag-zone", name: "Lag Putt Safe Zone", description: "From 30-50 feet, putt to a 3-foot circle around the hole. Score how many of 10 putts finish inside the zone. Eliminates three-putts.", weaknesses: ["Putting confidence"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-break-mapping", name: "Break Mapping Station", description: "Pick a sloped putt and roll balls from different speeds. Map how break changes with pace. Trains you to match speed to read.", weaknesses: ["Putting confidence"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "putt-round-sim", name: "18-Hole Putting Simulation", description: "Play 18 putts of varying length and break on the practice green. Par is 36. Track your score over multiple sessions to measure improvement.", weaknesses: ["Putting confidence"], type: "transfer", levels: ["intermediate", "advanced"] },

  // --- Course management (6-10) ---
  { id: "cm-bogey-avoidance", name: "Bogey Avoidance Drill", description: "Play 9 practice holes with one rule: no doubles. Choose the safest play on every shot. Track how conservative strategy affects score.", weaknesses: ["Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-par3-strategy", name: "Par-3 Strategy Session", description: "For 6 par-3 distances, choose club and target aiming for the fat part of the green. Score based on green hits, not pin proximity.", weaknesses: ["Course management"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "cm-mental-scorecard", name: "Mental Scorecard Drill", description: "Play 9 imaginary holes, announcing club, target, and strategy aloud before each shot. Builds the habit of deliberate decision-making.", weaknesses: ["Course management"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-penalty-avoidance", name: "Penalty Avoidance Game", description: "Set OB and hazard lines on the range. Play 9 tee shots where any ball past the line is a penalty stroke. Score your total.", weaknesses: ["Course management"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "cm-shot-budget", name: "Shot Budget Challenge", description: "Give yourself a shot budget per hole (e.g. 4 for a par 4). Plan each shot to stay within budget, prioritizing position over distance.", weaknesses: ["Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },

  // --- Foundation (6-10) ---
  { id: "base-grip-pressure-check", name: "Grip Pressure Awareness", description: "Hit 10 shots rating grip pressure 1-10 on each. Find the pressure level that produces best contact. Most golfers grip too tight.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-balance-finish", name: "Balance Finish Hold", description: "Hit full shots and hold your finish for 3 seconds on every rep. If you can't hold it, the swing was out of balance. 10 reps, score holds.", weaknesses: ["Driving accuracy", "Approach consistency"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-visualization-reps", name: "Visualization Rehearsal", description: "Before each shot, close your eyes and visualize the ball flight for 5 seconds. Then execute. Trains the see-it-then-do-it habit.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-random-club-roulette", name: "Random Club Roulette", description: "Pull a random club from your bag for each shot. Adapt your target and shot shape to the club. Builds versatility and creativity.", weaknesses: ["Approach consistency", "Course management"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "base-cooldown-focus", name: "Cooldown Focus Sequence", description: "End practice with 5 easy wedge shots, 5 chips, and 5 short putts. All at 50% effort. Sends your brain home with success and calm.", weaknesses: ["Short game touch", "Putting confidence", "Approach consistency"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] }
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
