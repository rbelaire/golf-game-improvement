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
  { id: "base-positive-self-talk", name: "Positive Self-Talk Reps", description: "Before each of 10 shots, say one positive affirmation aloud about your ability. Execute the shot. Builds confidence and quiets negative chatter.", weaknesses: ["Driving accuracy", "Approach consistency", "Short game touch", "Putting confidence", "Course management"], type: "transfer", levels: ["beginner", "intermediate", "advanced"] }
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
