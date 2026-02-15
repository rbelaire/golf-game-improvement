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
  const weaknesses = Array.isArray(profile.weaknesses) ? profile.weaknesses : [];
  const hasWeakness = weakness || weaknesses.length > 0;
  const daysPerWeek = asNumber(profile.daysPerWeek);
  const hoursPerSession = asNumber(profile.hoursPerSession);
  return Boolean(name && handicap && hasWeakness && daysPerWeek > 0 && hoursPerSession > 0);
}

function normalizeProfile(profile) {
  const rawWeaknesses = Array.isArray(profile.weaknesses) ? profile.weaknesses : [];
  const weaknesses = rawWeaknesses
    .map(w => asString(w).slice(0, 50))
    .filter(Boolean)
    .slice(0, 2);
  const weakness = weaknesses[0] || asString(profile.weakness).slice(0, 50);
  if (weakness && !weaknesses.includes(weakness)) weaknesses.unshift(weakness);
  return {
    name: asString(profile.name).slice(0, 100),
    handicap: asString(profile.handicap).slice(0, 50),
    weakness,
    weaknesses,
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
  { id: "base-cooldown-focus", name: "Cooldown Focus Sequence", description: "End practice with 5 easy wedge shots, 5 chips, and 5 short putts. All at 50% effort. Sends your brain home with success and calm.", weaknesses: ["Short game touch", "Putting confidence", "Approach consistency"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },

  // --- Driving accuracy (11-20) ---
  { id: "drv-tee-height-lab", name: "Tee Height Laboratory", description: "Hit 5 drives at low tee, 5 at medium, and 5 at high. Track launch angle and dispersion for each to find your optimal tee height.", weaknesses: ["Driving accuracy"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-progressive-target", name: "Progressive Target Narrows", description: "Start with a 60-yard wide target and narrow by 10 yards every 3 drives. See how tight you can go while maintaining 2-of-3 accuracy.", weaknesses: ["Driving accuracy"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "drv-course-replay", name: "Tee Shot Course Replay", description: "Replay 9 tee shots from your last round with the same club choices. Compare dispersion to your actual results and note improvements.", weaknesses: ["Driving accuracy"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "drv-one-club-shape", name: "One Club Three Shapes", description: "Using only your driver, hit a fade, a draw, and a straight ball to the same target. Repeat 5 rounds of 3 to build shot-shaping confidence.", weaknesses: ["Driving accuracy"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "drv-no-driver", name: "No-Driver Par-4 Sim", description: "Play 9 imaginary par-4s teeing off with 3-wood or hybrid only. Score fairways hit and GIR to learn when driver isn't needed.", weaknesses: ["Driving accuracy"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-dispersion-map", name: "20-Ball Dispersion Map", description: "Hit 20 drivers to the same target and chart where each lands on a grid. Identify your miss pattern — is it a pull, push, or random scatter?", weaknesses: ["Driving accuracy"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-aim-point-shift", name: "Aim Point Shift Drill", description: "Hit 5 drives aiming left edge, 5 at center, and 5 at right edge. See how aim affects start line and curvature to calibrate alignment.", weaknesses: ["Driving accuracy"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "drv-clutch-fairway", name: "Clutch Fairway Finisher", description: "End your range session with 3 must-hit fairway drives. Full pre-shot routine, real consequences. Simulates closing holes under fatigue.", weaknesses: ["Driving accuracy"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "drv-ball-position-test", name: "Ball Position Experiment", description: "Hit 5 drives with the ball forward, 5 centered, and 5 slightly back in your stance. Track flight and contact to optimize ball position.", weaknesses: ["Driving accuracy"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "drv-alternate-targets", name: "Alternate Target Lines", description: "Switch target lines every shot — left side of fairway, then right side. Builds the ability to adjust alignment under real-course demands.", weaknesses: ["Driving accuracy"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },

  // --- Approach consistency (11-20) ---
  { id: "app-between-clubs", name: "Between Clubs Decision Drill", description: "Set targets at yardages that fall between two clubs. Choose whether to hit a hard short club or easy long club. Track proximity for each strategy.", weaknesses: ["Approach consistency"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "app-wind-adjustment", name: "Wind Adjustment Reps", description: "Simulate headwind (+1 club), tailwind (-1 club), and crosswind (aim offset) for 9 approach shots. Score on landing accuracy after adjustment.", weaknesses: ["Approach consistency"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "app-first-shot-cold", name: "Cold First Shot Challenge", description: "Without warming up that specific club, hit one approach shot to a target. Score pass/fail. Trains the ability to execute on the first swing.", weaknesses: ["Approach consistency"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "app-ladder-down", name: "Iron Ladder Down", description: "Start with your longest iron and work down to your shortest wedge, hitting one shot with each. Score total proximity across all clubs.", weaknesses: ["Approach consistency"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-green-quadrant", name: "Green Quadrant Targeting", description: "Divide the target into 4 quadrants. Caller announces a quadrant before each shot. Hit 12 shots (3 per quadrant) and score accuracy.", weaknesses: ["Approach consistency"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "app-trajectory-control", name: "Trajectory Control Pairs", description: "Hit alternating high-low pairs with the same club to the same target. Develops the ability to control ball flight height on command.", weaknesses: ["Approach consistency"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "app-worst-lie-approach", name: "Worst Lie Approach Reps", description: "Place balls in divots, bare lies, and thick grass. Hit approach shots from each. Builds confidence for imperfect fairway lies on course.", weaknesses: ["Approach consistency"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "app-scoring-zone", name: "Scoring Zone Blitz", description: "Hit 20 shots from 100-130 yards — your scoring zone. Track how many finish inside 20 feet. This is where strokes are gained.", weaknesses: ["Approach consistency"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-par3-sim", name: "Par-3 Simulation Round", description: "Simulate 9 par-3 holes at different yardages and elevations. One ball per hole, full routine. Score greens in regulation.", weaknesses: ["Approach consistency"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "app-club-gapping", name: "Club Gapping Audit", description: "Hit 5 shots with each iron recording average carry. Plot distances to find gaps or overlaps in your set. Adjust lofts or technique accordingly.", weaknesses: ["Approach consistency"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },

  // --- Short game touch (11-20) ---
  { id: "sg-one-club-around", name: "One Club Around the Green", description: "Use only your 56-degree wedge for 10 different short game shots varying lie, distance, and trajectory. Builds creative adaptability.", weaknesses: ["Short game touch"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-par-2-game", name: "Par-2 Short Game Course", description: "Set up 9 short game holes around the practice green, each par 2. Play the course tracking your score. Target is even par (18).", weaknesses: ["Short game touch"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-bump-and-run", name: "Bump and Run Mastery", description: "Hit 15 bump-and-run shots with a 7-iron or 8-iron from just off the green. Focus on landing spot and roll-out control.", weaknesses: ["Short game touch"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "sg-spin-control", name: "Spin Control Ladder", description: "From 30 yards, hit low-spin runners, medium-spin pitches, and high-spin check shots. 5 of each. Track how each stops on the green.", weaknesses: ["Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "sg-blind-distance", name: "Blind Distance Feel Drill", description: "Close your eyes after setup and chip to a target, relying on feel only. Open eyes to check. 10 reps to train touch without visual dependence.", weaknesses: ["Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "sg-bunker-ladder", name: "Bunker Distance Ladder", description: "Hit bunker shots to targets at 10, 20, and 30 feet from the bunker edge. 5 shots per distance. Trains sand distance control.", weaknesses: ["Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "sg-3putt-saver", name: "Chip-to-Tap-In Challenge", description: "From 10 spots around the green, chip and try to leave every ball inside 3 feet (tap-in range). Score how many you save.", weaknesses: ["Short game touch"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-greenside-match", name: "Greenside Match Play", description: "Compete against a partner or your own score: alternate short game shots to the same hole. Closest wins the point. First to 7 wins.", weaknesses: ["Short game touch"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sg-rough-recovery", name: "Deep Rough Recovery", description: "Drop balls in thick rough around the green. Practice getting the ball out and onto the green in one shot. Focus on acceleration and face angle.", weaknesses: ["Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "sg-lob-distance-match", name: "Lob Wedge Distance Matching", description: "Hit lob wedge shots at 15, 25, 35, and 45 yards. Land within 5 feet of each target. Trains partial lob wedge distances.", weaknesses: ["Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },

  // --- Putting confidence (11-20) ---
  { id: "putt-feel-distance", name: "Feel Distance Calibration", description: "Putt to 10, 20, 30, and 40 feet targets. After each putt, guess the distance before looking. Trains internal distance feel.", weaknesses: ["Putting confidence"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-5-foot-circle", name: "5-Foot Circle Challenge", description: "Place 8 balls in a circle at 5 feet. Make all 8 without missing. Reset on a miss. Builds automatic confidence at the money distance.", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-one-hand", name: "One-Hand Putting Drill", description: "Putt 10 balls with trail hand only, then 10 with lead hand only. Develops feel and identifies which hand controls your stroke.", weaknesses: ["Putting confidence"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "putt-leapfrog", name: "Leapfrog Distance Drill", description: "Putt the first ball to 10 feet, then each successive putt must stop past the previous ball but within 3 feet. 10 putts in a row.", weaknesses: ["Putting confidence"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-pressure-bank", name: "Pressure Putt Bank", description: "Start with 10 points. Make a putt, earn 1 point. Miss, lose 2 points. Hit zero, you lose. See how long you can keep your bank alive.", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-2putt-zone", name: "Two-Putt Zone Trainer", description: "From 35+ feet, measure how many of 10 putts you can two-putt. The goal is 10/10. Eliminates three-putts from your game.", weaknesses: ["Putting confidence"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-routine-timer", name: "Putting Routine Timer", description: "Time your putting routine from read to stroke. Hit 15 putts keeping each routine between 20-30 seconds. Builds pace consistency.", weaknesses: ["Putting confidence"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "putt-downhill-control", name: "Downhill Speed Control", description: "Find the steepest slope on the practice green. Putt 10 downhillers trying to stop within 2 feet past the hole. Trains touch on fast putts.", weaknesses: ["Putting confidence"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "putt-comeback-drill", name: "Comeback Putt Drill", description: "Intentionally putt 3 feet past the hole, then make the comeback putt. 10 reps. Removes fear of running putts past the hole.", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "putt-scoring-streak", name: "Scoring Streak Putting", description: "Start at 3 feet. Make it, move back 1 foot. Miss, return to 3 feet. See how far back you can get. Track your record distance.", weaknesses: ["Putting confidence"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },

  // --- Course management (11-20) ---
  { id: "cm-trouble-shot-plan", name: "Trouble Shot Planning", description: "From 5 trouble spots (trees, water, bunkers), plan your escape route before hitting. Score on whether outcome matches the plan.", weaknesses: ["Course management"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-par-4-blueprint", name: "Par-4 Blueprint Drill", description: "For 6 different par-4 yardages, map out your exact club sequence and landing zones. Then execute the tee shot for each.", weaknesses: ["Course management"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cm-first-tee-sim", name: "First Tee Simulation", description: "Simulate the first tee experience: announce your name, pick a conservative target, and hit one drive. Practice the mental reset if it's bad.", weaknesses: ["Course management"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-scoring-holes", name: "Scoring Hole Maximizer", description: "Identify birdie-able holes on your course. Practice the exact tee shot and approach for each. Train to capitalize on easy holes.", weaknesses: ["Course management"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "cm-worst-score-fix", name: "Worst Hole Strategy Fix", description: "Identify your 3 worst-scoring holes. Plan a new strategy for each (different club, target, or approach). Practice the new plan.", weaknesses: ["Course management"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "cm-wind-strategy", name: "Wind Strategy Session", description: "For 9 holes, assign random wind directions. Adjust club, target, and shot shape for each. Score on landing position vs plan.", weaknesses: ["Course management"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "cm-go-no-go", name: "Go/No-Go Decision Trainer", description: "Set up 10 scenarios with risk-reward choices (water carry, tight pin, etc). Decide go or layup for each, then execute. Review decision quality.", weaknesses: ["Course management"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "cm-closing-holes", name: "Closing Holes Pressure", description: "Simulate holes 16, 17, 18 with a score to protect. Make club and strategy choices under pressure. Practice finishing strong.", weaknesses: ["Course management"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "cm-elevation-calc", name: "Elevation Change Calculator", description: "Practice adding/subtracting yardage for uphill and downhill shots. Hit 10 approach shots with elevation adjustments and score proximity.", weaknesses: ["Course management"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cm-pre-round-plan", name: "Pre-Round Game Plan", description: "Before a round, write your strategy for every hole: club off tee, miss side, and scoring zone target. Review after the round.", weaknesses: ["Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },

  // --- Foundation (11-20) ---
  { id: "base-tempo-count", name: "Tempo Count Drill", description: "Count 1-2 on backswing, 3 on downswing for every shot. Hit 15 shots with this cadence. Builds consistent tempo across all clubs.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-alignment-check", name: "Alignment Self-Check", description: "Set up to a target, then lay a club across your toes. Step back and see where it points. Repeat 10 times to calibrate your setup.", weaknesses: ["Driving accuracy", "Approach consistency"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-footwork-drill", name: "Footwork Foundation Drill", description: "Hit 10 shots focusing only on weight transfer: feel pressure move from trail foot to lead foot. Builds power and consistency from the ground up.", weaknesses: ["Driving accuracy", "Approach consistency"], type: "warmup", levels: ["beginner", "intermediate"] },
  { id: "base-one-arm-swing", name: "One-Arm Swing Drill", description: "Hit 5 easy wedge shots with trail arm only, then 5 with lead arm only. Develops connection and identifies swing imbalances.", weaknesses: ["Approach consistency", "Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "base-process-focus", name: "Process Over Outcome", description: "Hit 15 shots scoring only your pre-shot routine and commitment (1-5 each), ignoring where the ball goes. Trains mental process.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-breath-reset", name: "Breath Reset Protocol", description: "Between every shot, take 3 deep breaths and reset your focus. Hit 10 shots with this protocol. Builds the habit of staying present.", weaknesses: ["Driving accuracy", "Approach consistency", "Putting confidence", "Course management"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-weak-hand-chip", name: "Weak Hand Chipping", description: "Chip 10 balls using only your non-dominant hand on the club. Trains feel and soft hands for delicate short game shots.", weaknesses: ["Short game touch"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "base-mirror-check", name: "Mirror Position Check", description: "Using a mirror or phone video, check your setup, top of backswing, and impact position. Make 5 corrections and hit 10 shots after.", weaknesses: ["Driving accuracy", "Approach consistency"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "base-fatigue-finish", name: "Fatigue Finish Test", description: "After a full practice session, hit 5 critical shots (drive, approach, chip, pitch, putt). Score quality to test performance under fatigue.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "base-positive-self-talk", name: "Positive Self-Talk Reps", description: "Before each of 10 shots, say one positive affirmation aloud about your ability. Execute the shot. Builds confidence and quiets negative chatter.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },

  // ===== Ball striking =====
  { id: "bs-smash-factor-test", name: "Smash Factor Test", description: "Hit 10 shots with a 7-iron tracking ball speed vs club speed. Center strikes produce higher smash factor. Chart your consistency.", weaknesses: ["Ball striking"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "bs-impact-tape-audit", name: "Impact Tape Audit", description: "Apply impact tape to 3 different irons. Hit 5 shots each and map where you strike the face. Identify toe, heel, or thin patterns.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-towel-behind-ball", name: "Towel Behind Ball Drill", description: "Place a towel 3 inches behind the ball. Hit irons without catching the towel. Trains a descending strike and eliminates fat shots.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-half-swing-contact", name: "Half Swing Contact Focus", description: "Hit 20 half-swing 7-irons focusing purely on center-face contact. Score each 1-5 for quality. Builds the feel of pure strikes.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "bs-divot-pattern-read", name: "Divot Pattern Reading", description: "Hit 10 iron shots off grass and examine each divot: depth, direction, and start point. Map patterns to diagnose low point issues.", weaknesses: ["Ball striking"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "bs-feet-together-swings", name: "Feet Together Swings", description: "Hit 15 shots with feet touching. Forces balance and arm-body connection. If you fall over, the swing is too arm-dominant.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-penny-drill", name: "Penny Strike Drill", description: "Place a penny 2 inches in front of the ball. Strike the ball and collect the penny with your divot. Trains forward shaft lean at impact.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "bs-slow-motion-reps", name: "Slow Motion Impact Reps", description: "Swing at 30% speed, pausing at impact to check shaft lean, face angle, and body position. 10 reps then 5 full-speed shots.", weaknesses: ["Ball striking"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-thin-fat-diagnosis", name: "Thin/Fat Diagnosis Session", description: "Hit 20 iron shots, categorizing each as thin, fat, or flush. Track the ratio. If thin or fat exceeds 30%, adjust ball position or posture.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-lead-arm-only", name: "Lead Arm Only Strikes", description: "Hit 10 wedge shots using only your lead arm. Trains the lead side to guide the club to a consistent low point.", weaknesses: ["Ball striking"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "bs-compression-sound", name: "Compression Sound Check", description: "Hit shots listening for the crisp compression sound vs a click or thud. Train your ear to recognize quality contact. 15 reps scored by sound.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-board-drill", name: "Board Behind Ball Drill", description: "Place a thin board flush behind the ball. Any fat strike hits the board. Hit 10 irons — the board gives instant feedback on low point.", weaknesses: ["Ball striking"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "bs-variable-lie-striking", name: "Variable Lie Striking", description: "Hit from tight lie, thick rough, uphill, and downhill. 5 shots each. Tracks how lie changes your strike quality and teaches adaptability.", weaknesses: ["Ball striking"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "bs-one-club-ladder", name: "One Club Striking Ladder", description: "Hit a 7-iron at 50%, 65%, 80%, and 95% effort. Rate contact quality at each level. Find the effort threshold where contact degrades.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-tee-peg-irons", name: "Tee Peg Iron Drill", description: "Tee up iron shots on a low peg. Hit 10 without taking a divot — sweep the ball off the tee. Trains shallow, centered contact.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "bs-pressure-flush-count", name: "Pressure Flush Count", description: "Hit 10 iron shots where only flush strikes count as a point. Set a target (7/10). If you miss the target, restart. Builds quality under pressure.", weaknesses: ["Ball striking"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "bs-club-switch-test", name: "Club Switch Strike Test", description: "Alternate between a wedge and a long iron every shot for 12 reps. Score contact quality. Tests whether you adjust for different club lengths.", weaknesses: ["Ball striking"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "bs-9hole-strike-sim", name: "9-Hole Strike Simulation", description: "Play 9 imaginary holes, hitting the approach shot for each. Score each strike 1-5. Target a total of 35+. Simulates on-course ball striking.", weaknesses: ["Ball striking"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-grip-adjustment-test", name: "Grip Adjustment Test", description: "Hit 5 shots with strong grip, 5 neutral, 5 weak. Track strike quality and ball flight for each to find your optimal grip for solid contact.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-fatigue-strike-check", name: "Fatigue Strike Quality Check", description: "After 30 minutes of practice, hit 10 iron shots and score contact. Compare to your fresh-session scores. Identifies when fatigue ruins your striking.", weaknesses: ["Ball striking"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "bs-alignment-stick-path", name: "Alignment Stick Path Guide", description: "Place a stick on the ground along your target line. Swing along the stick path for 15 reps. Trains an in-to-out or on-plane path for better contact.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-punch-shot-mastery", name: "Punch Shot Mastery", description: "Hit 15 punch shots with a 6-iron: hands ahead, abbreviated follow-through. Develops the forward-press impact feel that creates compression.", weaknesses: ["Ball striking"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-face-control-gate", name: "Face Control Gate Drill", description: "Set two tees just wider than the clubhead at impact. Swing through without hitting the tees. 10 reps to train path and face control.", weaknesses: ["Ball striking"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "bs-eyes-closed-contact", name: "Eyes Closed Contact", description: "Set up normally, close your eyes, and hit 10 easy wedge shots. Rate contact purely by feel. Trains kinesthetic awareness of the strike.", weaknesses: ["Ball striking"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "bs-downswing-pause", name: "Downswing Pause Drill", description: "Take the club to the top, pause for 2 seconds, then swing down. 10 reps. The pause eliminates rushing and improves sequencing for better contact.", weaknesses: ["Ball striking"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-nine-shot-grid", name: "9-Shot Ball Flight Grid", description: "Hit low-draw, low-straight, low-fade, mid-draw, mid-straight, mid-fade, high-draw, high-straight, high-fade. Score completions out of 9.", weaknesses: ["Ball striking"], type: "transfer", levels: ["advanced"] },
  { id: "bs-hip-turn-focus", name: "Hip Turn Contact Focus", description: "Hit 15 shots focusing on initiating the downswing with hip rotation. Rate each shot on hip-first feel and contact quality.", weaknesses: ["Ball striking"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "bs-wrist-angle-hold", name: "Wrist Angle Hold Drill", description: "Practice maintaining wrist hinge through impact with slow-motion swings. Then hit 10 full shots focusing on late release. Builds lag and compression.", weaknesses: ["Ball striking"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "bs-turf-brush-warmup", name: "Turf Brush Warm-Up", description: "Without a ball, make 20 swings brushing the turf at a consistent spot. Find your natural low point, then place the ball there for 10 shots.", weaknesses: ["Ball striking"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "bs-course-replay-strikes", name: "Course Replay Strike Focus", description: "Recreate 9 iron shots from your last round. Score each purely on strike quality (1-5), ignoring result. Compare to your on-course feel.", weaknesses: ["Ball striking"], type: "transfer", levels: ["intermediate", "advanced"] },

  // ===== Distance control =====
  { id: "dc-10yard-ladder", name: "10-Yard Ladder", description: "Hit shots to targets at 50, 60, 70, 80, 90, and 100 yards. 3 shots per distance. Score balls landing within 5 yards of each target.", weaknesses: ["Distance control"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-clock-swing-chart", name: "Clock Swing Distance Chart", description: "Hit each wedge at 9 o'clock, 10:30, and full positions. Record carry for each. Build a personal distance chart you can use on the course.", weaknesses: ["Distance control"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-feel-vs-actual", name: "Feel vs Actual Distance Test", description: "Hit a shot, guess the carry distance, then verify with a rangefinder or marker. 15 reps. Tracks how accurate your internal yardage sense is.", weaknesses: ["Distance control"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-same-club-3distances", name: "Same Club Three Distances", description: "Using one wedge, hit it to 3 different distances by varying swing length only (not speed). 5 reps each. Builds finesse within a single club.", weaknesses: ["Distance control"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "dc-random-yardage-call", name: "Random Yardage Callout", description: "Have a partner (or random number generator) call out a yardage between 40-120. You pick the club and swing to match. 12 reps scored on proximity.", weaknesses: ["Distance control"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "dc-uphill-downhill-adjust", name: "Uphill/Downhill Adjustment Drill", description: "Calculate adjusted yardage for uphill (+10%) and downhill (-10%) targets. Hit 5 shots each way and score how accurately you adjust.", weaknesses: ["Distance control"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "dc-wind-yardage-sim", name: "Wind Yardage Simulation", description: "Assign headwind (+1 club), tailwind (-1 club), or crosswind to 9 shots. Execute the adjustment and score landing accuracy vs target.", weaknesses: ["Distance control"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "dc-lag-wedge-zone", name: "Lag Wedge Landing Zone", description: "From 80-100 yards, try to land every ball in a 10-yard-deep zone. 15 reps. Trains the scoring-range distance control that saves strokes.", weaknesses: ["Distance control"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-half-wedge-mastery", name: "Half Wedge Mastery", description: "Hit 20 half-swing wedge shots to a specific target. Track carry dispersion. The half wedge is the most used scoring shot — own it.", weaknesses: ["Distance control"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-between-yardage-solve", name: "Between Yardage Problem Solving", description: "Set targets at 67, 83, 97, and 113 yards — awkward numbers between clubs. Choose your strategy (choke down, soften swing, etc.) and execute.", weaknesses: ["Distance control"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "dc-carry-vs-total", name: "Carry vs Total Distance Mapping", description: "For each wedge and short iron, hit 5 shots tracking both carry and total distance. Map the rollout to improve landing-spot planning.", weaknesses: ["Distance control"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-elevation-yardage", name: "Elevation Yardage Calculator", description: "Practice hitting to targets with simulated elevation changes. Add 1 yard per foot of rise, subtract for drops. 10 shots scored on proximity.", weaknesses: ["Distance control"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "dc-scoring-zone-blitz", name: "60-100 Yard Blitz", description: "Hit 20 shots from random distances between 60-100 yards. One ball per target. Track average proximity to the pin.", weaknesses: ["Distance control"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-temperature-adjust", name: "Temperature Adjustment Drill", description: "Learn that cold air reduces distance ~2 yards per 10°F drop. Simulate cold-weather rounds by adding yardage and practicing the adjustment.", weaknesses: ["Distance control"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "dc-soft-landing-challenge", name: "Soft Landing Challenge", description: "Hit 10 wedge shots trying to stop the ball within 5 feet of landing. Trains spin control and trajectory for precise distance stopping.", weaknesses: ["Distance control"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "dc-approach-elimination", name: "Approach Distance Elimination", description: "Hit approach shots at 80, 100, 120, 140 yards. Must land within 10% of target to eliminate that distance. Clear all 4 to win.", weaknesses: ["Distance control"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "dc-no-range-finder", name: "No Rangefinder Challenge", description: "Hit 9 approach shots estimating distance by eye only. Compare your guess to actual yardage after each shot. Trains on-course self-reliance.", weaknesses: ["Distance control"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-choke-down-control", name: "Choke Down Distance Control", description: "Hit your full-swing club, then choke down 1 inch and 2 inches. Record the distance reduction for each. Adds 2 extra distances per club.", weaknesses: ["Distance control"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-par3-distance-sim", name: "Par-3 Distance Simulation", description: "Simulate 9 par-3 holes at exact yardages from your home course. Hit one ball per hole with the goal of GIR through perfect distance control.", weaknesses: ["Distance control"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "dc-finesse-flop-distance", name: "Finesse Lob Distance Ladder", description: "Hit lob wedge shots at 10, 15, 20, 25, and 30 yards. 3 reps per distance. Score balls finishing within 3 feet of each target.", weaknesses: ["Distance control"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "dc-warmup-calibration", name: "Distance Calibration Warm-Up", description: "Start each session with 3 shots per wedge at your stock distance. Record carry. Calibrates your feel for the day's conditions.", weaknesses: ["Distance control"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-back-pin-attack", name: "Back Pin Attack Drill", description: "Hit 10 approach shots to a back pin position. Must carry the front of the green but not fly over. Trains the narrow distance window.", weaknesses: ["Distance control"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "dc-front-pin-precision", name: "Front Pin Precision", description: "Hit 10 approach shots to a front pin. Must carry the hazard or bunker but land softly. Trains the high-spin, precise carry control.", weaknesses: ["Distance control"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "dc-one-bounce-stop", name: "One Bounce and Stop", description: "Hit wedge shots that take one bounce and stop. 10 reps. Develops the spin and trajectory combo needed for precise distance control.", weaknesses: ["Distance control"], type: "technical", levels: ["advanced"] },
  { id: "dc-course-yardage-book", name: "Course Yardage Book Drill", description: "Write out exact distances for your home course approach shots. Practice the 5 most common distances (10 shots each). Build course-specific confidence.", weaknesses: ["Distance control"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-altitude-adjust", name: "Altitude Adjustment Practice", description: "Learn that ball flies ~2% farther per 1000ft elevation. Simulate altitude rounds by adjusting club selection. 9 shots scored on accuracy.", weaknesses: ["Distance control"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "dc-progressive-target", name: "Progressive Distance Shrink", description: "Start hitting to a 20-yard landing zone. Every 3 successful shots, shrink the zone by 5 yards. See how tight you can get.", weaknesses: ["Distance control"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "dc-scramble-yardage", name: "Scramble Yardage Challenge", description: "Drop balls at random distances 40-130 yards. Play each as a scoring opportunity. Track up-and-down percentage. Real scoring depends on wedge distance control.", weaknesses: ["Distance control"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "dc-stock-vs-knockdown", name: "Stock vs Knockdown Distance", description: "For each iron, hit 5 stock shots and 5 knockdowns. Chart the distance difference. Gives you a built-in half-club adjustment for wind.", weaknesses: ["Distance control"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "dc-green-depth-game", name: "Green Depth Awareness Game", description: "Estimate green depth (front to back) for 9 imaginary holes. Hit approach shots landing on the correct tier. Trains awareness of the target zone depth.", weaknesses: ["Distance control"], type: "transfer", levels: ["intermediate", "advanced"] },

  // ===== Mental game =====
  { id: "mg-pre-shot-commitment", name: "Pre-Shot Commitment Drill", description: "Rate your commitment level 1-10 before each of 15 shots. Only swing when you feel 8+. Walk away and restart if below 8. Trains full commitment.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-bad-shot-recovery", name: "Bad Shot Recovery Protocol", description: "Intentionally hit a bad shot, then execute a specific 3-step reset: deep breath, positive thought, aggressive next shot. 10 reps of the cycle.", weaknesses: ["Mental game"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-first-tee-anxiety", name: "First Tee Anxiety Simulation", description: "Simulate a first tee: announce your name and shot shape aloud to imaginary gallery. Hit one drive. Practice the routine 5 times.", weaknesses: ["Mental game"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-acceptance-practice", name: "Outcome Acceptance Practice", description: "Hit 15 shots and accept every result without reaction — no club toss, no muttering, no visible frustration. Score yourself on emotional neutrality.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-focus-word-anchor", name: "Focus Word Anchor", description: "Choose one focus word (smooth, commit, trust). Say it before every shot for 20 reps. After the session, note how it affected your swing.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-10-shot-mindfulness", name: "10-Shot Mindfulness Block", description: "Hit 10 shots focusing entirely on sensory experience: grip feel, wind on skin, sound of contact. Zero swing thoughts. Trains present-moment focus.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-consequence-scoring", name: "Consequence Scoring Game", description: "Play a 9-hole practice game where every double bogey requires 10 push-ups. Creates real consequences that simulate on-course pressure.", weaknesses: ["Mental game"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "mg-body-scan-reset", name: "Body Scan Reset", description: "Between every shot, do a 30-second body scan: release jaw, drop shoulders, soften hands. Hit 15 shots with this protocol to train tension awareness.", weaknesses: ["Mental game"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-comeback-scenario", name: "Comeback Scenario Practice", description: "Simulate being 3 over after 9 holes. Play the back 9 needing to recover. Practice the mental discipline of grinding back to a good score.", weaknesses: ["Mental game"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "mg-routine-consistency", name: "Routine Consistency Timer", description: "Time your pre-shot routine for 15 shots. Keep every routine within a 5-second window (e.g., 25-30 seconds). Builds rhythmic consistency.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-visualization-reel", name: "Visualization Highlight Reel", description: "Before practice, spend 5 minutes visualizing your 5 best-ever shots in vivid detail. Then hit 10 shots carrying that confident feeling.", weaknesses: ["Mental game"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-distraction-drill", name: "Distraction Immunity Drill", description: "Have a partner create noise or movement during your routine. Execute 10 shots maintaining full commitment despite distractions.", weaknesses: ["Mental game"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "mg-scoring-journal", name: "Scoring Zone Journal", description: "After each practice session, write 3 things: what worked mentally, what triggered frustration, and one mental adjustment for next time.", weaknesses: ["Mental game"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-pressure-putt-breath", name: "Pressure Putt Breathing", description: "Hit 10 must-make 5-foot putts. Before each, take 3 slow breaths and visualize the ball dropping. Score makes and note when breathing helped.", weaknesses: ["Mental game"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-bogey-bounce-back", name: "Bogey Bounce-Back Drill", description: "Simulate making a bogey, then immediately play the next hole trying for birdie. Practice 6 bogey-birdie pairs. Builds resilience.", weaknesses: ["Mental game"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "mg-confidence-builder", name: "Confidence Builder Session", description: "Start with easy shots you know you'll hit well. Gradually increase difficulty. End with your most challenging shot. Build confidence through success stacking.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-target-lock-in", name: "Target Lock-In Protocol", description: "Before each shot, stare at your specific target for 5 seconds. Never swing without a precise target. 15 reps scoring target specificity.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-one-shot-at-time", name: "One Shot at a Time", description: "Play 9 practice holes with zero scorekeeping. Focus only on executing the current shot. After the round, reflect on how it felt vs keeping score.", weaknesses: ["Mental game"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-fear-shot-exposure", name: "Fear Shot Exposure", description: "Identify your most feared shot (water carry, tight fairway, etc). Hit 20 reps of that exact shot. Familiarity reduces fear through exposure.", weaknesses: ["Mental game"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "mg-gratitude-warmup", name: "Gratitude Warm-Up", description: "Start practice by naming 3 things you're grateful for in your golf game. Then hit 10 easy shots with a relaxed mindset. Sets positive tone.", weaknesses: ["Mental game"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-post-round-debrief", name: "Post-Round Mental Debrief", description: "After a round, rate each hole's mental performance 1-5 (separate from score). Identify the 3 holes where mental lapses cost strokes.", weaknesses: ["Mental game"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-emotional-reset-box", name: "Emotional Reset Box", description: "Visualize putting each bad shot into a box and closing the lid. Practice the reset between shots for 15 reps. Trains emotional compartmentalization.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-competitive-sim", name: "Competitive Simulation", description: "Play against a partner or set a tournament-style score to beat. Full pre-shot routine, real consequences. Trains competitive composure.", weaknesses: ["Mental game"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "mg-self-coaching-talk", name: "Self-Coaching Talk Drill", description: "After each of 10 shots, coach yourself aloud with constructive feedback (not criticism). Builds the habit of helpful internal dialogue.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-patience-par-game", name: "Patience Par Game", description: "Play 9 holes making only safe plays — aim for the fat of every green, lag every putt. Score vs par to see how patience affects scoring.", weaknesses: ["Mental game"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-last-3-holes", name: "Last 3 Holes Pressure Sim", description: "Simulate holes 16-18 with a specific score to protect. Practice finishing under pressure without choking. 3 rounds of the simulation.", weaknesses: ["Mental game"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "mg-between-shots-plan", name: "Between Shots Mental Plan", description: "During practice rounds, use the walk between shots for a specific purpose: first 30 seconds process last shot, then fully switch to planning next shot.", weaknesses: ["Mental game"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-tension-scale", name: "Tension Scale Awareness", description: "Rate your physical tension 1-10 before each of 15 shots. If above 5, do a physical reset (shake hands, roll shoulders) before swinging.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-positive-self-image", name: "Positive Self-Image Reps", description: "Before 10 shots, tell yourself 'I am a good [driver/putter/chipper]'. Execute with confidence. Builds identity-level belief in your skills.", weaknesses: ["Mental game"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "mg-process-scorecard", name: "Process Scorecard Round", description: "Play 9 holes scoring only your process: 1 point for good routine, 1 for commitment, 1 for acceptance. Max 27. Detaches outcome from performance.", weaknesses: ["Mental game"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },

  // ===== Fairway woods & hybrids =====
  { id: "fw-tee-confidence", name: "Tee Shot Confidence Builder", description: "Tee up 15 fairway wood shots at comfortable height. Focus on sweeping contact and center-face strikes. Score flush hits out of 15.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-off-deck-progression", name: "Off the Deck Progression", description: "Start with hybrid off the ground, then 5-wood, then 3-wood. 5 shots each. Progress only when you hit 3/5 solid. Builds ground-strike confidence.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "fw-par5-second-shot", name: "Par-5 Second Shot Sim", description: "Simulate 6 par-5 second shots at varying distances. Choose fairway wood or hybrid for each, execute with full routine. Score on contact and proximity.", weaknesses: ["Fairway woods & hybrids"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "fw-hybrid-distance-chart", name: "Hybrid Distance Chart", description: "Hit 10 shots with each hybrid in your bag. Record carry distance for each. Build a reliable hybrid distance chart for on-course decisions.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-sweep-vs-hit", name: "Sweep vs Hit Down Drill", description: "Hit 5 fairway woods with a sweeping motion, then 5 hitting slightly down. Compare contact and flight. Find which approach works for you.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-tight-lie-challenge", name: "Tight Lie Fairway Wood", description: "Hit 10 fairway wood shots off tight lies (bare ground or closely mown turf). Builds confidence for firm fairway conditions on course.", weaknesses: ["Fairway woods & hybrids"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "fw-rescue-from-rough", name: "Hybrid Rescue from Rough", description: "Drop balls in light and medium rough. Hit 10 hybrid shots from each. Tracks how rough depth affects distance and helps you pick the right club.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "fw-alignment-station", name: "Fairway Wood Alignment Station", description: "Set up alignment sticks and hit 15 fairway wood shots. Check alignment on every 5th shot. Fairway woods amplify alignment errors — precision matters.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-shape-control", name: "Fairway Wood Shape Control", description: "Hit 5 draws, 5 fades, and 5 straight shots with your fairway wood. Score successful shapes. Builds versatility off the deck.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "fw-long-par4-tee", name: "Long Par-4 Tee Strategy", description: "Simulate 6 narrow par-4s where fairway wood off the tee is smarter than driver. Execute each with full routine. Score fairways hit.", weaknesses: ["Fairway woods & hybrids"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-trajectory-variety", name: "Trajectory Variety with Woods", description: "Hit low-running, standard, and high-landing shots with the same fairway wood. 5 of each. Builds the ability to adjust trajectory to course demands.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "fw-hybrid-vs-iron", name: "Hybrid vs Long Iron Compare", description: "Hit 10 shots with your hybrid and 10 with the equivalent long iron to the same target. Compare dispersion and proximity. Data-driven club selection.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "fw-ball-position-test", name: "Fairway Wood Ball Position Test", description: "Hit 5 shots with ball forward, 5 centered, and 5 back of center. Track launch, contact, and distance for each to optimize ball position.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "fw-3wood-vs-driver", name: "3-Wood vs Driver Accuracy", description: "Hit 10 drivers and 10 3-woods to the same target. Compare fairway hit percentage. Learn when 3-wood off the tee is the smarter play.", weaknesses: ["Fairway woods & hybrids"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "fw-half-swing-hybrid", name: "Half Swing Hybrid Control", description: "Hit 15 half-swing hybrid shots to a target. This is a versatile shot for recovery, layup, and punch situations. Build the feel.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-pressure-carry", name: "Pressure Carry Challenge", description: "Set a water hazard distance you need to carry with a fairway wood. Hit 10 shots. Score carries. Builds confidence in must-carry situations.", weaknesses: ["Fairway woods & hybrids"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "fw-layup-precision", name: "Layup Precision Drill", description: "Pick 5 specific layup yardages for your course. Hit your fairway wood or hybrid to each exact distance. Layups should be precise, not casual.", weaknesses: ["Fairway woods & hybrids"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "fw-warmup-sweep", name: "Fairway Wood Sweep Warm-Up", description: "Start with 5 easy teed-up 5-wood shots, then 5 off the ground. Low effort, focus on rhythm. Warms up the longer-club motion safely.", weaknesses: ["Fairway woods & hybrids"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-uphill-lie", name: "Uphill Lie Fairway Wood", description: "Find or simulate an uphill lie and hit 10 fairway wood shots. Learn how the slope adds loft and shortens distance. Adjust club selection accordingly.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "fw-downhill-lie", name: "Downhill Lie Hybrid", description: "Hit 10 hybrid shots from a downhill lie. Focus on matching shoulder tilt to slope. Learn how the delofted face increases distance and lowers flight.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "fw-tempo-match", name: "Fairway Wood Tempo Match", description: "Hit 5 easy wedges, then immediately hit 5 fairway woods at the same tempo. The swing should feel identical in rhythm despite the longer club.", weaknesses: ["Fairway woods & hybrids"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-punch-hybrid", name: "Punch Hybrid Under Trees", description: "Practice low punch shots with your hybrid under an imaginary tree line. 10 reps. The hybrid's low CG makes it ideal for this recovery shot.", weaknesses: ["Fairway woods & hybrids"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "fw-landing-angle", name: "Landing Angle Control", description: "Hit fairway wood shots trying to land steep (high approach) vs running (low approach). 5 of each. Trains you to match landing conditions to course demands.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["advanced"] },
  { id: "fw-course-specific-sim", name: "Course-Specific Wood Sim", description: "Identify 5 holes on your course where you hit fairway wood. Practice the exact shot for each hole. Course-specific practice beats generic reps.", weaknesses: ["Fairway woods & hybrids"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "fw-9hole-no-driver", name: "9-Hole No Driver Round", description: "Play 9 holes using only fairway woods and hybrids off the tee. Score fairways and GIR. Proves you don't need driver to score.", weaknesses: ["Fairway woods & hybrids"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-dispersion-map", name: "Fairway Wood Dispersion Map", description: "Hit 15 fairway wood shots to the same target. Map every landing point. Identify your pattern — are you missing left, right, short, or long?", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-alternating-clubs", name: "Alternating Club Challenge", description: "Alternate between fairway wood and hybrid every shot for 12 reps. Score contact quality. Tests your ability to adjust setup between clubs.", weaknesses: ["Fairway woods & hybrids"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "fw-cold-first-swing", name: "Cold First Swing Fairway Wood", description: "Without warm-up swings, hit one fairway wood to a target. Score pass/fail. Simulates the first tee or a key shot mid-round. 5 rounds.", weaknesses: ["Fairway woods & hybrids"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "fw-set-gapping", name: "Wood/Hybrid Set Gapping", description: "Hit 5 shots with each wood and hybrid. Chart distances to verify 10-15 yard gaps between clubs. Adjust if gaps are too small or too large.", weaknesses: ["Fairway woods & hybrids"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "fw-clutch-approach", name: "Clutch Long Approach", description: "End your session with 3 must-hit long approach shots using fairway wood or hybrid. Full routine, real targets. Finishes practice under pressure.", weaknesses: ["Fairway woods & hybrids"], type: "pressure", levels: ["intermediate", "advanced"] },

  // ===== Lag putting =====
  { id: "lp-30ft-zone", name: "30-Foot Zone Drill", description: "From 30 feet, putt 10 balls trying to stop each within a 3-foot circle around the hole. Score makes into the zone. Eliminates three-putts.", weaknesses: ["Lag putting"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-40ft-ladder", name: "40-Foot Ladder", description: "Putt from 40 feet to 3 targets at 35, 40, and 45 feet. 5 putts per target. Score balls stopping within 3 feet. Trains long-range touch.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-eyes-closed-lag", name: "Eyes Closed Lag Putting", description: "From 30+ feet, close your eyes after setup and putt. Judge distance purely by feel. 10 reps. Trains internal speed calibration.", weaknesses: ["Lag putting"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-uphill-lag", name: "Uphill Lag Control", description: "Find a steep uphill putt of 25+ feet. Hit 10 putts. The challenge is getting the ball to the hole without smashing it past on the downhill comeback.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-downhill-lag", name: "Downhill Lag Touch", description: "Find a steep downhill putt of 25+ feet. Hit 10 putts. Focus on barely getting the ball moving — gravity does the work. Score balls within 3 feet.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-3putt-eliminator", name: "Three-Putt Eliminator", description: "From 5 spots at 30+ feet, lag putt and then make the second putt. If you three-putt, restart. Complete all 5 without a three-putt to win.", weaknesses: ["Lag putting"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-cross-slope-lag", name: "Cross Slope Lag Drill", description: "Putt across a slope from 30 feet. Hit 10 putts reading the break and controlling speed. Score balls finishing within a 3-foot circle.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-tiered-green", name: "Tiered Green Lag", description: "Putt to a hole on a different tier of the green from 30+ feet. 10 putts. Navigating tiers requires precise speed judgment.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-feel-calibration", name: "Lag Putt Feel Calibration", description: "Putt 3 balls from 20 feet, 30 feet, 40 feet, and 50 feet. Before each, rehearse the stroke length. Score how well rehearsal matches execution.", weaknesses: ["Lag putting"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-leapfrog-lag", name: "Lag Leapfrog", description: "Putt the first ball to 20 feet. Each successive putt must pass the previous ball but stay within 3 feet of it. Chain 8 putts in a row.", weaknesses: ["Lag putting"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-distance-ladder", name: "Lag Distance Ladder", description: "Set targets at 15, 25, 35, and 45 feet. 5 putts per distance. Must two-putt all 5 before advancing. Tests lag skill at increasing distances.", weaknesses: ["Lag putting"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-one-putt-from-30", name: "One Putt from 30 Drill", description: "From 30 feet, try to make the putt (not just lag). 10 attempts. Even 1-2 makes is great. Trains aggressive lag that gives putts a chance.", weaknesses: ["Lag putting"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "lp-green-speed-test", name: "Green Speed Calibration", description: "Hit 5 putts from 20 feet on a flat section. Measure how far past the hole each stops. Calibrates your stroke to today's green speed.", weaknesses: ["Lag putting"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-worst-spot-lag", name: "Worst Spot Lag Putting", description: "Find the 5 trickiest lag putts on the practice green (max break, max slope). Hit 3 from each spot. Simulates the hardest putts you'll face on course.", weaknesses: ["Lag putting"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "lp-backstroke-control", name: "Backstroke Length Control", description: "Use 3 backstroke lengths for 3 distances: hip-high for 20ft, belt for 30ft, chest for 40ft. 5 reps per length. Builds a mechanical speed system.", weaknesses: ["Lag putting"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-random-distance-lag", name: "Random Distance Lag", description: "A partner calls out distances (15-50 feet) randomly. Lag putt to that distance. 12 reps scored on proximity. Trains on-demand distance control.", weaknesses: ["Lag putting"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "lp-pin-high-practice", name: "Pin High Practice", description: "From 30+ feet, putt to a hole focusing on getting pin-high (right distance) rather than right line. 10 reps. Most lag errors are distance, not direction.", weaknesses: ["Lag putting"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-18hole-lag-sim", name: "18-Hole Lag Simulation", description: "On the practice green, simulate 18 first putts from realistic distances (20-50 feet). Track three-putt count. Target zero three-putts.", weaknesses: ["Lag putting"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-fast-slow-green", name: "Fast vs Slow Green Adjust", description: "Putt 10 lags on the fastest part of the green, then 10 on the slowest. Note the stroke adjustment needed. Trains adaptability to varying speeds.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-two-putt-streak", name: "Two-Putt Streak Challenge", description: "From 30+ feet, see how many consecutive two-putts you can make. Track your record streak. A streak of 10+ means your lag is tour-caliber.", weaknesses: ["Lag putting"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-long-putt-read", name: "Long Putt Read Practice", description: "From 30+ feet with break, read the putt from 3 angles before stroking. Score read accuracy (correct break direction) separately from distance control.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-gate-at-apex", name: "Gate at the Apex", description: "On a breaking lag putt, place two tees at the apex of the break. Roll the ball through the gate. 10 reps. Trains apex targeting on long breakers.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-pace-match-partner", name: "Pace Match with Partner", description: "One person putts from 30 feet, the other tries to match the exact pace. 10 rounds. Builds awareness of what good lag speed looks like.", weaknesses: ["Lag putting"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-first-putt-focus", name: "First Putt Focus Session", description: "Spend an entire 20-minute session on just first putts from 20-40 feet. No short putts at all. Simulates what matters most on the course.", weaknesses: ["Lag putting"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-comeback-after-lag", name: "Lag Then Make Drill", description: "Lag putt from 35 feet. Wherever it stops, you must make the second putt. 10 rounds. Trains both lag precision and clutch short putting.", weaknesses: ["Lag putting"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-edge-to-edge", name: "Edge to Edge Drill", description: "Putt from one edge of the practice green to the other (longest possible putt). 5 attempts. Score balls that stay on the green and stop within 5 feet of the far edge.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-warmup-lag-calibration", name: "Lag Calibration Warm-Up", description: "Start every practice session with 5 lag putts from 30 feet. Calibrate your speed before doing anything else. Sets the foundation for the day.", weaknesses: ["Lag putting"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "lp-surround-the-hole", name: "Surround the Hole Lag", description: "From 30 feet, putt 4 balls trying to stop them like compass points around the hole (north, south, east, west), each within 3 feet. Score completions.", weaknesses: ["Lag putting"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "lp-pressure-two-putt", name: "Pressure Two-Putt or Restart", description: "Putt from 5 locations at 30+ feet. Must two-putt each one. Three-putt at any location and restart from the beginning. Complete all 5 to win.", weaknesses: ["Lag putting"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "lp-closing-lag", name: "Closing Lag Putt Drill", description: "Simulate the final 3 holes of a round. Each has a 30+ foot first putt. Two-putt all 3 to close out the round. Practice the clutch lag.", weaknesses: ["Lag putting"], type: "transfer", levels: ["intermediate", "advanced"] },

  // ===== Scoring under pressure =====
  { id: "sp-par-saver-challenge", name: "Par Saver Challenge", description: "Drop balls in 10 trouble spots around the green. Get up-and-down from each to save par. Track your save percentage and target 60%+.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-must-make-putts", name: "Must-Make Putt Gauntlet", description: "Hit 10 putts from 4-8 feet that you must make. If you miss 3, restart. Simulates the crucial par and birdie putts that define a score.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-birdie-hole-attack", name: "Birdie Hole Attack Plan", description: "Identify 4 birdie-able holes on your course. Practice the exact tee shot, approach, and putt for each. Capitalize on your opportunities.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "sp-3hole-playoff", name: "3-Hole Playoff Simulation", description: "Simulate a 3-hole playoff: one par 3, one par 4, one par 5. Full pre-shot routine, one ball, real scoring. Practice winning when it matters.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sp-one-ball-round", name: "One Ball Practice Round", description: "Play 9 holes with one ball. Lose it and your round is over. Creates genuine consequence that raises focus and decision quality.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sp-close-out-drill", name: "Close Out the Round", description: "Simulate holes 16-18 needing to shoot 1-under to win. Pick clubs, hit shots, and putt out. Practice the art of finishing strong.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "sp-scramble-percentage", name: "Scramble Percentage Builder", description: "Drop balls in 15 around-the-green situations. Get up-and-down from each. Track your scramble percentage — tour average is 60%.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-sand-save-sim", name: "Sand Save Simulation", description: "Hit 10 bunker shots to different pin locations. Complete the hole each time. Track your sand save percentage. Target 40%+.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sp-scoring-zone-test", name: "Scoring Zone Proximity Test", description: "Hit 15 wedge shots from 80-120 yards. Track average proximity to the pin. Under 25 feet means you're ready to score.", weaknesses: ["Scoring under pressure"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-comeback-nine", name: "Comeback Nine Drill", description: "Simulate being 4-over after 9 holes. Play the back 9 with aggressive-but-smart strategy to recover. Track whether you can post a respectable number.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "sp-target-score-round", name: "Target Score Practice Round", description: "Set a specific score target (e.g., 38 for 9 holes). Play with full routine and strategy. The target creates natural pressure to perform.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-worst-ball-9", name: "Worst Ball 9 Holes", description: "Hit 2 balls every shot and play the worse one. If you can break 45 playing worst ball, your game is solid under any conditions.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sp-up-and-down-circuit", name: "Scoring Up-and-Down Circuit", description: "Set up a circuit of 6 short game stations. Must get up-and-down from 4 of 6 to pass. Fail and restart. Builds clutch short game.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-penalty-recovery", name: "Penalty Recovery Plan", description: "Simulate hitting into a penalty area. Practice the drop, club selection, and recovery shot. Score how often you save bogey. Limit the damage.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-double-bogey-fix", name: "Double Bogey Avoidance", description: "Play 9 holes where any double bogey adds 5 penalty strokes. Forces smart, conservative plays to avoid blow-up holes.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-match-play-sim", name: "Match Play Simulation", description: "Play against a partner or imaginary opponent in match play. Every hole matters independently. Trains the hole-by-hole focus match play demands.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "sp-birdie-putt-drill", name: "Birdie Putt Pressure Drill", description: "Set up 10 birdie putts from 10-20 feet. Score how many you make. Tour average is about 30% — track your percentage over sessions.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sp-greenside-save-or-fail", name: "Greenside Save or Fail", description: "From 10 greenside spots, you have one shot to get it inside 5 feet. Pass/fail scoring only. No second chances. 7/10 is the target.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-par-3-scoring", name: "Par-3 Scoring Session", description: "Play 6 par-3 holes at different distances. Score each hole fully (tee shot to putt out). Par-3 scoring is pure skill — no driving bailout.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-streak-builder", name: "Par Streak Builder", description: "Play holes trying to build the longest streak of pars or better. Track your record streak. Mental strength grows as the streak extends.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-betting-game-sim", name: "Betting Game Simulation", description: "Simulate a nassau or skins game with imaginary stakes. Every shot has financial consequence. Trains composure when something is on the line.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sp-scramble-with-wedge", name: "Wedge Scramble Challenge", description: "From 60-100 yards, hit a wedge and then putt out. 9 holes. Score total strokes. This is where scoring happens — wedge + putt combinations.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-late-round-fatigue", name: "Late Round Fatigue Sim", description: "After a long practice session, play 3 holes with full focus. Score them. Tests whether you can perform quality golf when physically and mentally tired.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "sp-hole-location-adjust", name: "Pin Location Strategy Drill", description: "For the same green, practice approaches to front-left, back-right, and center pins. Score based on leaving a makeable putt. Smart pin strategy scores.", weaknesses: ["Scoring under pressure"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "sp-gir-percentage-game", name: "GIR Percentage Game", description: "Hit 18 approach shots at different distances. Track greens in regulation percentage. Tour average is 65% — how close can you get?", weaknesses: ["Scoring under pressure"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-warmup-scoring-prep", name: "Scoring Mindset Warm-Up", description: "Before a round, hit 5 wedges to targets, 5 chips, and 5 putts. Score each session. Only go to the first tee when you've scored 10+ out of 15.", weaknesses: ["Scoring under pressure"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-tournament-sim", name: "Tournament Round Simulation", description: "Play 9 holes as if it's a tournament: one ball, full routine, real score posted. No mulligans, no breakfast balls. Pure competitive play.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "sp-bogey-golf-master", name: "Bogey Golf Mastery", description: "Play 9 holes where your target is bogey on every hole. Smart, conservative play. When bogey is the plan, pars become bonus and doubles disappear.", weaknesses: ["Scoring under pressure"], type: "transfer", levels: ["beginner", "intermediate"] },
  { id: "sp-short-game-save-pct", name: "Short Game Save Percentage", description: "Track your up-and-down percentage from 20 greenside lies over a week. Graph the trend. This single stat correlates most with scoring improvement.", weaknesses: ["Scoring under pressure"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "sp-final-putt-drill", name: "Final Putt of the Day", description: "End every practice session with one pressure putt from 6 feet. You must make it before you leave. Builds the habit of finishing with a make.", weaknesses: ["Scoring under pressure"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },

  // ===== Chipping & pitching =====
  { id: "cp-landing-spot-focus", name: "Landing Spot Marker Drill", description: "Place a towel at your chosen landing spot. Hit 15 chips trying to land on the towel. Score direct hits. Landing spot is everything in chipping.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-one-club-variety", name: "One Club Chip Variety", description: "Using only a 56-degree wedge, hit 5 low runners, 5 medium pitches, and 5 high lobs from the same spot. Builds versatility with a single club.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-3club-compare", name: "3 Club Chip Comparison", description: "From the same spot, chip with a 9-iron, PW, and 56-degree. 5 shots each. Compare results to learn when each club is the best choice.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "cp-updown-10spot", name: "Up-and-Down from 10 Spots", description: "Drop balls at 10 locations around the green with different lies. Get up-and-down from each. Track your save percentage. Target 50%+.", weaknesses: ["Chipping & pitching"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-bump-run-ladder", name: "Bump and Run Distance Ladder", description: "Hit bump-and-run shots with a 7-iron to targets at 15, 25, and 35 feet. 5 per distance. Score balls finishing within 3 feet of each target.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-flop-shot-practice", name: "Flop Shot Practice", description: "Open the face of your lob wedge fully. Hit 10 high, soft flop shots over a towel or obstacle. Focus on acceleration through impact — never decelerate.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cp-pitch-distance-control", name: "Pitch Distance Control Drill", description: "Hit pitch shots to targets at 20, 30, 40, and 50 yards. 5 per distance. Score balls within 10 feet of each target. Builds the in-between distances.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-rough-chip-adjust", name: "Rough Lie Chip Adjustment", description: "Chip from thick rough, medium rough, and fairway. 5 shots from each. Learn how lie affects spin, trajectory, and rollout for each surface.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cp-fringe-putt-vs-chip", name: "Fringe: Putt vs Chip Decision", description: "From 10 fringe positions, alternate putting and chipping. Score which technique gets closer. Builds decision-making for the fringe zone.", weaknesses: ["Chipping & pitching"], type: "transfer", levels: ["beginner", "intermediate"] },
  { id: "cp-spin-control-trio", name: "Spin Control Trio", description: "From 25 yards, hit low-spin, medium-spin, and high-spin pitches. 5 of each. Track how each stops on the green. Master all three trajectories.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cp-par2-chipping-course", name: "Par-2 Chipping Course", description: "Set up 9 holes around the practice green, each par 2 (chip + putt). Play the course and track your score vs 18. Even par is excellent.", weaknesses: ["Chipping & pitching"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-worst-lie-scramble", name: "Worst Lie Chip Scramble", description: "Find the 5 worst lies around the green (buried, bare, downhill). Chip and putt from each. Track how many you save. Builds tough-lie confidence.", weaknesses: ["Chipping & pitching"], type: "pressure", levels: ["intermediate", "advanced"] },
  { id: "cp-clock-chip-system", name: "Clock Position Chip System", description: "Chip with 8 o'clock, 9 o'clock, and 10 o'clock backswing lengths. 5 shots per length. Record distances to build a repeatable chip distance chart.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-downhill-chip", name: "Downhill Chip Mastery", description: "Find a downhill chip position. Hit 10 shots. The ball runs out fast on downhill chips — learn to adjust trajectory and landing spot.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cp-uphill-chip", name: "Uphill Chip Control", description: "Chip from an uphill lie to a flat green. 10 reps. Uphill lies add loft — learn to take extra run into account when picking your landing spot.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-blind-feel-chip", name: "Blind Feel Chip Drill", description: "Set up your chip, close your eyes, and execute. Judge the quality by feel before looking. 10 reps. Trains kinesthetic feel around the greens.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cp-greenside-match-play", name: "Greenside Match Play", description: "Compete against a partner: alternate chips to the same hole. Closest to the pin wins the point. First to 7 wins. Adds competitive pressure.", weaknesses: ["Chipping & pitching"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-tap-in-chipper", name: "Chip to Tap-In Range", description: "From 10 spots around the green, chip trying to leave every ball inside 3 feet. Score tap-ins out of 10. Tour pros average 7+.", weaknesses: ["Chipping & pitching"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-pitch-lob-compare", name: "Pitch vs Lob Decision Drill", description: "From 30 yards with a front bunker, decide: pitch over or lob over? Hit 5 of each. Compare proximity. Build data for on-course decisions.", weaknesses: ["Chipping & pitching"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "cp-bunker-lip-escape", name: "Bunker Lip Escape Drill", description: "Practice chips from just over the bunker lip — ball below your feet on a slope. 10 reps. One of the hardest lies in golf.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cp-hybrid-chip-option", name: "Hybrid Chip from Fringe", description: "Practice using your hybrid as a chipper from the fringe. 10 reps. The hybrid rolls like a putt and is very forgiving for tight lies.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate"] },
  { id: "cp-backhand-chip", name: "Backhand/Lefty Chip Drill", description: "Practice chipping with the back of your wedge or in opposite-hand stance. 10 reps. Builds a creative option for when you're against a fence or wall.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cp-9hole-scramble-sim", name: "9-Hole Scramble Simulation", description: "Play 9 holes where every approach misses the green. Chip and putt from each miss spot. Track score to measure your scramble-only performance.", weaknesses: ["Chipping & pitching"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-trajectory-ladder", name: "Chip Trajectory Ladder", description: "From one spot, hit a low bump, medium pitch, and high lob to the same hole. Repeat from 5 different positions. Builds shot-selection instinct.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-hinge-hold-pitch", name: "Hinge and Hold Pitch Drill", description: "Practice the hinge-and-hold technique: hinge wrists early, hold the angle through impact. 15 reps. Creates consistent, spinny pitch shots.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-random-lie-roulette", name: "Random Lie Chip Roulette", description: "Toss 10 balls randomly around the green. Play each as it lies — no improving. Score up-and-down percentage. Mimics real-course unpredictability.", weaknesses: ["Chipping & pitching"], type: "transfer", levels: ["intermediate", "advanced"] },
  { id: "cp-warmup-touch-chips", name: "Touch Chip Warm-Up", description: "Start practice with 10 easy chips at 50% effort to close targets. Builds feel and calibrates your touch before full-effort practice begins.", weaknesses: ["Chipping & pitching"], type: "warmup", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-pressure-save-streak", name: "Pressure Save Streak", description: "Chip and putt from around the green. See how many consecutive up-and-downs you can make. Track your streak record across sessions.", weaknesses: ["Chipping & pitching"], type: "pressure", levels: ["beginner", "intermediate", "advanced"] },
  { id: "cp-pitch-to-tiers", name: "Pitch to Different Tiers", description: "Find a tiered green. Pitch to the front tier, middle tier, and back tier from 30 yards. 5 per tier. Trains trajectory and distance for multi-level greens.", weaknesses: ["Chipping & pitching"], type: "technical", levels: ["intermediate", "advanced"] },
  { id: "cp-course-replay-chips", name: "Course Chip Replay", description: "Recreate 9 chip/pitch situations from your last round. Execute each with full routine. Compare results to your on-course performance.", weaknesses: ["Chipping & pitching"], type: "transfer", levels: ["intermediate", "advanced"] }
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
    "Course management": ["Decision Framework", "Risk Discipline", "Miss Pattern Planning", "Round Simulation"],
    "Ball striking": ["Contact Quality", "Low Point Control", "Compression and Flight", "On-Course Transfer"],
    "Distance control": ["Yardage Calibration", "Partial Swing Precision", "Scoring Zone Mastery", "Course Conditions"],
    "Mental game": ["Focus and Commitment", "Emotional Resilience", "Pressure Composure", "Competitive Transfer"],
    "Fairway woods & hybrids": ["Sweep Contact", "Trajectory Control", "Course Strategy", "Scoring Versatility"],
    "Lag putting": ["Speed Calibration", "Distance Feel", "Slope Reading", "Three-Putt Elimination"],
    "Scoring under pressure": ["Scramble Skills", "Clutch Execution", "Strategic Scoring", "Tournament Readiness"],
    "Chipping & pitching": ["Landing Spot Control", "Trajectory Selection", "Scramble Execution", "Around-Green Mastery"]
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
  const weaknessArr = Array.isArray(weakness) ? weakness : [weakness];
  let score = 0;
  if (weaknessArr.some(w => drill.weaknesses.includes(w))) score += 4;
  if (drill.levels.includes(band)) score += 3;
  if (drill.type === preferredType) score += 2.5;
  if (usedInPlan.has(drill.id)) score -= 4;
  if (recentDrills.has(drill.id)) score -= 2;
  score += (randomIndex(100) / 100) * 1.2;
  return score;
}

function pickDrill({ weakness, band, preferredType, usedInPlan, recentDrills, excludedIds }) {
  const weaknessArr = Array.isArray(weakness) ? weakness : [weakness];
  const candidates = DRILL_LIBRARY.filter(
    (drill) => !excludedIds.has(drill.id) && drill.levels.includes(band) && (weaknessArr.some(w => drill.weaknesses.includes(w)) || drill.weaknesses.length > 2)
  );
  if (!candidates.length) return null;

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const drill of candidates) {
    const score = candidateScore(drill, weaknessArr, band, usedInPlan, recentDrills, preferredType);
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
  const weaknesses = profile.weaknesses && profile.weaknesses.length > 0
    ? profile.weaknesses : [profile.weakness];

  for (let week = 1; week <= weekCount; week += 1) {
    const sessions = [];
    for (let day = 1; day <= profile.daysPerWeek; day += 1) {
      // Alternate primary weakness per session for variety
      const sessionWeakness = weaknesses[(day - 1) % weaknesses.length];
      const excludedIds = new Set();
      const warmupDrill = pickDrill({
        weakness: weaknesses,
        band,
        preferredType: "warmup",
        usedInPlan,
        recentDrills,
        excludedIds
      }) || DRILL_LIBRARY[0];
      excludedIds.add(warmupDrill.id);
      const technicalDrill = pickDrill({
        weakness: sessionWeakness,
        band,
        preferredType: "technical",
        usedInPlan,
        recentDrills,
        excludedIds
      }) || warmupDrill;
      excludedIds.add(technicalDrill.id);
      const pressureDrill = pickDrill({
        weakness: sessionWeakness,
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
      headline: `Week ${week}: ${weekTheme(weaknesses[0], week)} (${intensity})`,
      sessions
    });
  }

  const weaknessLabel = weaknesses.join(" & ");
  return {
    profileSnapshot: profile,
    title: `${profile.name}'s 4-Week ${weaknessLabel} Plan`,
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
