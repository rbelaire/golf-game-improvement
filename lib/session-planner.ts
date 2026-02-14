import { LEGACY_WEAKNESS_MAP } from "./weakness-taxonomy";

type DrillLocation = "range" | "short_game_area" | "putting_green" | "on_course" | "home";
type Fatigue = "low" | "medium" | "high";
type Scoring = "binary" | "strokes" | "percentage" | "dispersion_radius";
type Category = "warmup" | "skill" | "random" | "pressure";

export interface PlannerDrill {
  drill_id: string;
  name: string;
  category: Category;
  weakness_target: string;
  skill_min: number;
  skill_max: number;
  duration_min: number;
  difficulty: number;
  equipment: string[];
  location: DrillLocation;
  fatigue_level: Fatigue;
  scoring_type: Scoring;
  focus_tags: string[];
  setup: string;
  execution: string;
  scoring: string;
  progression_hint: string;
  constraints: string[];
}

export interface PlannerInput {
  weakness: string;
  skill: number;
  time_budget_min: number;
  drills: PlannerDrill[];
  used_drill_ids?: string[];
}

const STAGE_ORDER: Category[] = ["warmup", "skill", "random", "pressure"];

const normalizeWeaknessId = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s-]+/g, "_");

function resolveWeaknessTags(weakness: string): Set<string> {
  const raw = weakness.trim();
  const key = normalizeWeaknessId(raw);
  const direct = LEGACY_WEAKNESS_MAP[raw] ?? LEGACY_WEAKNESS_MAP[key] ?? LEGACY_WEAKNESS_MAP[raw.toLowerCase()];
  const targets = direct && direct.length ? direct : [raw];
  const tags = new Set<string>();
  for (const t of targets) tags.add(normalizeWeaknessId(t));
  return tags;
}

function matchesWeakness(drill: PlannerDrill, weaknessTags: Set<string>): boolean {
  const primary = normalizeWeaknessId(drill.weakness_target);
  if (weaknessTags.has(primary)) return true;
  return drill.focus_tags.some((tag) => weaknessTags.has(normalizeWeaknessId(tag)));
}

function pickStageDrill(
  stage: Category,
  pool: PlannerDrill[],
  weaknessTags: Set<string>,
  remainingMin: number,
  used: Set<string>
): PlannerDrill | null {
  const candidates = pool.filter((d) => !used.has(d.drill_id) && d.duration_min <= remainingMin);
  if (!candidates.length) return null;

  const stagePool = stage === "random" ? candidates : candidates.filter((d) => d.category === stage);
  const fallbackStagePool = stagePool.length ? stagePool : candidates;

  const weaknessMatched = fallbackStagePool.filter((d) => matchesWeakness(d, weaknessTags));
  const finalPool = weaknessMatched.length ? weaknessMatched : fallbackStagePool;

  finalPool.sort((a, b) => {
    const categoryBonusA = a.category === stage ? 2 : 0;
    const categoryBonusB = b.category === stage ? 2 : 0;
    const weaknessBonusA = matchesWeakness(a, weaknessTags) ? 4 : 0;
    const weaknessBonusB = matchesWeakness(b, weaknessTags) ? 4 : 0;
    const efficiencyA = a.duration_min > 0 ? 1 / a.duration_min : 0;
    const efficiencyB = b.duration_min > 0 ? 1 / b.duration_min : 0;
    const scoreA = weaknessBonusA + categoryBonusA + efficiencyA;
    const scoreB = weaknessBonusB + categoryBonusB + efficiencyB;
    return scoreB - scoreA;
  });

  return finalPool[0] ?? null;
}

export function buildSessionPlan(input: PlannerInput): PlannerDrill[] {
  const used = new Set<string>(input.used_drill_ids ?? []);
  const weaknessTags = resolveWeaknessTags(input.weakness);

  const skillEligible = input.drills.filter(
    (d) => input.skill >= d.skill_min && input.skill <= d.skill_max
  );

  let remainingMin = Math.max(0, Math.floor(input.time_budget_min));
  const selected: PlannerDrill[] = [];

  for (const stage of STAGE_ORDER) {
    if (remainingMin <= 0) break;
    const picked = pickStageDrill(stage, skillEligible, weaknessTags, remainingMin, used);
    if (!picked) continue;
    selected.push(picked);
    used.add(picked.drill_id);
    remainingMin -= picked.duration_min;
  }

  return selected;
}
