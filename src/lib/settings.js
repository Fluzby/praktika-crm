import { reactive, watch } from "vue";

const DEFAULTS = {
  lang: "en",
  theme: "dark",
  aiModalStrong: true,
  aiTopN: 5,
  shortcuts: true,
  proKeyboardMode: false,
  sidebarHoverExpand: true,
  dashboardWidgets: {
    overview: true,
    house_availability: true,
    latest_listings: true,
    calendar: true,
    follow_ups: true,
    recent_clients: true,
    recent_activity: true,
  },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem("app_settings");
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      dashboardWidgets: {
        ...DEFAULTS.dashboardWidgets,
        ...(parsed.dashboardWidgets || {}),
      },
    };
  } catch {
    return DEFAULTS;
  }
}

export const settings = reactive(loadSettings());

watch(
  settings,
  (v) => localStorage.setItem("app_settings", JSON.stringify(v)),
  { deep: true }
);

export function applyTheme() {
  const root = document.documentElement;
  const theme = settings.theme || "dark";
  const allThemes = [
    "dark",
    "light",
    "glass",
    "warm",
    "brutalist",
    "plain",
  ];

  allThemes.forEach((t) => {
    root.classList.remove(t);
    root.classList.remove(`theme-${t}`);
  });

  root.classList.add(`theme-${theme}`);
  root.classList.toggle(
    "dark",
    theme === "dark" || theme === "glass" || theme === "warm" || theme === "brutalist"
  );
  root.classList.toggle("light", theme === "light");
}
