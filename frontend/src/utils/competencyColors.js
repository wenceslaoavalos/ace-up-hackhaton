const COMPETENCY_COLOR_MAP = {
  "Improving Time Management, Organization, and Productivity": "#008af8",
  "Developing Leadership Presence": "#004266",
  "Transitioning from Subject Matter Expert to Leadership": "#f57800",
  "Communicating Effectively and Influencing Stakeholders": "#2ab34b",
  "Growing Emotional Intelligence": "#ffb800",
  "Managing Conflicts and Difficult Conversations": "#de2c2c",
  "Regulating Stress and Building Resilience": "#5d778d",
  "Leading with a Growth Mindset": "#00d4ff",
  "Facilitating Effective Change Management": "#9b59b6",
  "Collaborating Across The Organization": "#e67e22",
  "Developing a Coaching Approach to Management": "#1abc9c",
  "Building and Leading Inclusive Teams": "#e74c3c",
};

const FALLBACK_COLORS = [
  "#008af8",
  "#004266",
  "#f57800",
  "#2ab34b",
  "#ffb800",
  "#de2c2c",
  "#5d778d",
  "#00d4ff",
  "#9b59b6",
  "#e67e22",
  "#1abc9c",
  "#e74c3c",
];

export function getCompetencyColor(name) {
  if (COMPETENCY_COLOR_MAP[name]) {
    return COMPETENCY_COLOR_MAP[name];
  }

  const text = String(name || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export { COMPETENCY_COLOR_MAP };
