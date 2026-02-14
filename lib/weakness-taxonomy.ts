export const WEAKNESS_GROUPS = [
  {
    group_id: "legacy",
    group_label: "Legacy",
    options: [
      { id: "driving_accuracy", label: "Driving accuracy", legacy: true },
      { id: "approach_consistency", label: "Approach consistency", legacy: true },
      { id: "short_game_touch", label: "Short game touch", legacy: true },
      { id: "putting_confidence", label: "Putting confidence", legacy: true },
      { id: "course_management", label: "Course management", legacy: true }
    ]
  },
  {
    group_id: "tee_game",
    group_label: "Tee Game",
    options: [
      { id: "tee_shot_start_line", label: "Tee Shot Start Line", legacy: false },
      { id: "tee_shot_contact", label: "Tee Shot Contact", legacy: false }
    ]
  },
  {
    group_id: "approach_play",
    group_label: "Approach Play",
    options: [
      { id: "approach_distance_control", label: "Approach Distance Control", legacy: false },
      { id: "approach_start_line", label: "Approach Start Line", legacy: false },
      { id: "wedge_distance_control", label: "Wedge Distance Control", legacy: false }
    ]
  },
  {
    group_id: "short_game",
    group_label: "Short Game",
    options: [
      { id: "greenside_contact", label: "Greenside Contact", legacy: false },
      { id: "bunker_play", label: "Bunker Play", legacy: false }
    ]
  },
  {
    group_id: "putting",
    group_label: "Putting",
    options: [
      { id: "lag_putting", label: "Lag Putting", legacy: false },
      { id: "short_putt_conversion", label: "Short Putt Conversion", legacy: false }
    ]
  },
  {
    group_id: "strategy",
    group_label: "Strategy",
    options: [
      { id: "on_course_decisions", label: "On-Course Decisions", legacy: false }
    ]
  }
] as const;

export const LEGACY_WEAKNESS_MAP: Record<string, string[]> = {
  driving_accuracy: ["tee_shot_start_line", "tee_shot_contact"],
  approach_consistency: ["approach_distance_control", "approach_start_line", "wedge_distance_control"],
  short_game_touch: ["wedge_distance_control", "greenside_contact", "bunker_play"],
  putting_confidence: ["lag_putting", "short_putt_conversion"],
  course_management: ["on_course_decisions"],
  "driving accuracy": ["tee_shot_start_line", "tee_shot_contact"],
  "approach consistency": ["approach_distance_control", "approach_start_line", "wedge_distance_control"],
  "short game touch": ["wedge_distance_control", "greenside_contact", "bunker_play"],
  "putting confidence": ["lag_putting", "short_putt_conversion"],
  "course management": ["on_course_decisions"]
} as const;
