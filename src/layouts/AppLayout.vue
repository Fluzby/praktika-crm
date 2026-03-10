<template>
  <div class="app-shell">
    <div
      v-if="mobileSidebarOpen"
      class="shell-mobile-backdrop"
      @click="mobileSidebarOpen = false"
    ></div>

    <aside
      class="shell-sidebar"
      :class="[
        effectiveSidebarCollapsed ? 'is-collapsed' : '',
        mobileSidebarOpen ? 'is-mobile-open' : '',
      ]"
      @mouseenter="handleSidebarMouseEnter"
      @mouseleave="handleSidebarMouseLeave"
    >
      <SideRail
        :collapsed="effectiveSidebarCollapsed"
        :show-toggle="!settings.sidebarHoverExpand"
        @toggle-collapse="toggleSidebar"
        @navigate="handleSidebarNavigate"
      />
    </aside>

    <main ref="mainEl" class="shell-main-scroll">
      <div class="shell-main-inner">
        <header class="shell-topbar">
          <div class="flex items-center gap-3 min-w-0">
            <button
              class="shell-icon-btn lg:hidden"
              type="button"
              @click="mobileSidebarOpen = true"
              :aria-label="t.open_navigation"
              :title="t.open_navigation"
            >
              ☰
            </button>

            <div class="min-w-0">
              <div class="shell-breadcrumb">
                <span>CRM</span>
                <span class="shell-breadcrumb-sep">›</span>
                <span>{{ pageMeta.section }}</span>
                <template v-if="pageMeta.detail">
                  <span class="shell-breadcrumb-sep">›</span>
                  <span>{{ pageMeta.detail }}</span>
                </template>
              </div>
              <div class="shell-page-title truncate">
                {{ pageMeta.title }}
              </div>
              <div v-if="pageShortcutHint" class="text-[11px] leading-tight mt-0.5" style="color: var(--shell-text-muted);">
                {{ pageShortcutHint }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 relative">
            <template v-for="action in topbarActions" :key="action.key || action.label">
              <RouterLink
                v-if="action.to"
                :to="action.to"
                class="btn-ghost text-xs px-2.5 py-1.5 hidden sm:inline-flex"
              >
                {{ action.label }}
              </RouterLink>
              <select
                v-else-if="action.type === 'select'"
                class="input text-xs h-8 py-0 px-2.5 hidden sm:block w-auto min-w-[150px]"
                :value="action.value"
                :disabled="!!action.disabled"
                @change="action.onChange?.($event.target.value)"
              >
                <option
                  v-for="opt in (action.options || [])"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
              <button
                v-else
                class="btn-ghost text-xs px-2.5 py-1.5 hidden sm:inline-flex"
                type="button"
                :disabled="!!action.disabled"
                @click="action.onClick?.()"
              >
                {{ action.label }}
              </button>
            </template>
            <button
              ref="searchToggleBtnEl"
              class="shell-icon-btn hidden sm:grid"
              type="button"
              :title="t.search_pages"
              @click="toggleSearch"
            >
              ⌕
            </button>

            <div v-if="searchOpen" ref="searchPopoverEl" class="shell-search-popover">
              <div class="shell-search-input-wrap">
                <span class="shell-search-glyph">⌕</span>
                <input
                  ref="searchInputEl"
                  v-model.trim="searchQuery"
                  type="text"
                  class="shell-search-input"
                  :placeholder="t.find_pages_tabs_settings"
                  @keydown.esc="closeSearch"
                  @keydown.enter.prevent="openFirstSearchResult"
                />
              </div>

              <div class="shell-search-results" v-if="filteredSearchItems.length">
                <button
                  v-for="item in filteredSearchItems"
                  :key="item.key"
                  type="button"
                  class="shell-search-result"
                  @click="goToSearchResult(item)"
                >
                  <span class="shell-search-result-main">
                    <span class="shell-search-result-icon">
                      <img
                        v-if="item.iconSrc"
                        class="shell-search-result-icon-img"
                        :class="{ 'is-force-white': searchUseLightIcons }"
                        :src="item.iconSrc"
                        :alt="item.label"
                      />
                    </span>
                    <span class="min-w-0">
                      <span class="shell-search-result-title">{{ item.label }}</span>
                      <span class="shell-search-result-sub">{{ item.section }}</span>
                    </span>
                  </span>
                  <span class="shell-search-result-path">{{ item.path }}</span>
                </button>
              </div>

              <div v-else-if="entitySearchLoading" class="shell-search-empty">
                {{ t.loading_records }}
              </div>

              <div v-else class="shell-search-empty">
                {{ t.no_matches_for }} "{{ searchQuery }}"
              </div>

              <div v-if="entitySearchError" class="shell-search-empty border-t border-white/10">
                {{ entitySearchError }}
              </div>
            </div>
          </div>
        </header>

        <section class="shell-route-stage">
          <div class="shell-route-stage-inner">
            <RouterView />
          </div>
        </section>
      </div>
    </main>

    <BackToTopButton :target="mainEl" />

    <teleport to="body">
      <div
        v-if="shortcutsHelpOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 modal-backdrop" @click="shortcutsHelpOpen = false"></div>
        <div
          class="relative modal-panel rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-auto p-6"
          role="dialog"
          aria-modal="true"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="text-lg font-semibold">{{ t.keyboard_shortcuts }}</div>
            <button class="btn-ghost text-xs" type="button" @click="shortcutsHelpOpen = false">{{ t.close }}</button>
          </div>

          <div class="space-y-4 text-sm">
            <div class="glass-soft p-3 rounded-xl">
              <div class="font-medium mb-2">{{ t.quick_create_shortcuts }}</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><code>C</code> - {{ t.shortcut_new_contact }}</div>
                <div><code>P</code> - {{ t.shortcut_new_opportunity }}</div>
                <div><code>T</code> - {{ t.shortcut_new_task }}</div>
              </div>
            </div>

            <div class="glass-soft p-3 rounded-xl">
              <div class="font-medium mb-2">{{ t.power_shortcuts }}</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><code>Ctrl/Cmd + K</code> - {{ t.shortcut_command_palette }}</div>
                <div><code>/</code> - {{ t.shortcut_focus_search }}</div>
                <div><code>Cmd/Ctrl + F</code> - {{ t.shortcut_advanced_search }}</div>
                <div><code>Ctrl/Cmd + S</code> - {{ t.shortcut_save }}</div>
                <div><code>Ctrl/Cmd + Enter</code> - {{ t.shortcut_submit }}</div>
                <div><code>Esc</code> - {{ t.shortcut_close_back }}</div>
                <div><code>?</code> - {{ t.shortcut_show_shortcuts }}</div>
              </div>
            </div>

            <div class="glass-soft p-3 rounded-xl">
              <div class="font-medium mb-2">{{ t.list_navigation_shortcuts }}</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><code>↑ / ↓</code> - {{ t.shortcut_move_records }}</div>
                <div><code>Enter</code> - {{ t.shortcut_open_selected }}</div>
                <div><code>Space</code> - {{ t.shortcut_select_record }}</div>
                <div><code>Ctrl/Cmd + A</code> - {{ t.shortcut_select_all }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useRoute, useRouter } from "vue-router";
import SideRail from "../components/SideRail.vue";
import BackToTopButton from "../components/BackToTopButton.vue";
import { supabase } from "../lib/supabase";
import { topbarActions } from "../lib/topbarActions";
import { settings } from "../lib/settings";
import { useT } from "../lib/i18n";

const dashboardWhite = new URL("../../Images/dashboard_white.png", import.meta.url).href;
const dashboardBlack = new URL("../../Images/dashboard_black.png", import.meta.url).href;
const propertyWhite = new URL("../../Images/property_white.png", import.meta.url).href;
const propertyBlack = new URL("../../Images/property_black.png", import.meta.url).href;
const clientsWhite = new URL("../../Images/clients_white.png", import.meta.url).href;
const clientsBlack = new URL("../../Images/clients_black.png", import.meta.url).href;
const calendarWhite = new URL("../../Images/calendar_white.png", import.meta.url).href;
const calendarBlack = new URL("../../Images/calendar_black.png", import.meta.url).href;
const archiveWhite = new URL("../../Images/archive_white.png", import.meta.url).href;
const archiveBlack = new URL("../../Images/archive_black.png", import.meta.url).href;
const settingsBlack = new URL("../../Images/gearsettings.png", import.meta.url).href;

const mainEl = ref(null);
const route = useRoute();
const router = useRouter();
const t = useT();

const sidebarCollapsed = ref(false);
const sidebarHoverExpanded = ref(false);
const sidebarHoverLocked = ref(false);
const mobileSidebarOpen = ref(false);
const searchOpen = ref(false);
const searchQuery = ref("");
const searchInputEl = ref(null);
const searchPopoverEl = ref(null);
const searchToggleBtnEl = ref(null);
const shortcutsHelpOpen = ref(false);
const entitySearchLoaded = ref(false);
const entitySearchLoading = ref(false);
const entitySearchError = ref("");
const entitySearchItems = ref([]);
const SIDEBAR_STORAGE_KEY = "crm_sidebar_collapsed";
const MAIN_TAB_SHORTCUT_PATHS = [
  "/dashboard",
  "/houses",
  "/clients",
  "/calendar",
  "/archive",
  "/settings",
];
const darkSurfaceThemes = new Set(["dark"]);
const searchUseLightIcons = computed(() => darkSurfaceThemes.has(settings.theme || "dark"));
const searchIconMap = {
  dashboard: { light: dashboardBlack, dark: dashboardWhite },
  property: { light: propertyBlack, dark: propertyWhite },
  clients: { light: clientsBlack, dark: clientsWhite },
  calendar: { light: calendarBlack, dark: calendarWhite },
  archive: { light: archiveBlack, dark: archiveWhite },
  settings: { light: settingsBlack, dark: settingsBlack },
};

const iconFor = (name) => {
  const icons = searchIconMap[name];
  if (!icons) return "";
  return searchUseLightIcons.value ? icons.dark : icons.light;
};

const effectiveSidebarCollapsed = computed(() => {
  if (!sidebarCollapsed.value) return false;
  if (!settings.sidebarHoverExpand) return true;
  return !(sidebarHoverExpanded.value && !sidebarHoverLocked.value);
});

const isTypingContext = (target) => {
  if (!(target instanceof Element)) return false;
  if (target.closest("input, textarea, select")) return true;
  if (target.closest("[contenteditable]:not([contenteditable='false'])")) return true;
  return target.getAttribute("role") === "textbox";
};

onMounted(() => {
  try {
    sidebarCollapsed.value = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    sidebarCollapsed.value = false;
  }
});

watch(sidebarCollapsed, (v) => {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, v ? "1" : "0");
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
});

watch(
  () => route.fullPath,
  () => {
    mobileSidebarOpen.value = false;
    searchOpen.value = false;
  }
);

watch(
  () => settings.sidebarHoverExpand,
  (enabled) => {
    sidebarHoverExpanded.value = false;
    sidebarHoverLocked.value = false;
    if (enabled) sidebarCollapsed.value = true;
  },
  { immediate: true }
);

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const handleSidebarMouseEnter = () => {
  if (!settings.sidebarHoverExpand) return;
  if (!sidebarCollapsed.value) return;
  sidebarHoverExpanded.value = true;
};

const handleSidebarMouseLeave = () => {
  sidebarHoverExpanded.value = false;
  sidebarHoverLocked.value = false;
};

const handleSidebarNavigate = () => {
  mobileSidebarOpen.value = false;
  if (!settings.sidebarHoverExpand) return;
  sidebarCollapsed.value = true;
  sidebarHoverExpanded.value = false;
  sidebarHoverLocked.value = true;
};

const dispatchShortcutEvent = (name, detail = {}) => {
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const runQuickCreate = async (kind) => {
  const targetByKind = {
    "new-contact": "/clients",
    "new-opportunity": "/houses",
    "new-task": "/calendar",
    "new-meeting": "/calendar",
  };
  const eventByKind = {
    "new-contact": "crm:shortcut:new-contact",
    "new-opportunity": "crm:shortcut:new-opportunity",
    "new-task": "crm:shortcut:new-task",
    "new-meeting": "crm:shortcut:new-meeting",
  };
  const path = targetByKind[kind];
  const eventName = eventByKind[kind];
  if (!path || !eventName) return;
  if (route.path !== path) {
    await router.push(path);
    await nextTick();
  }
  dispatchShortcutEvent(eventName);
};

const searchItems = computed(() => [
  { key: "dashboard", label: t.value.dashboard, section: t.value.main, path: "/dashboard", iconSrc: iconFor("dashboard"), terms: "dashboard home overview stats widgets" },
  { key: "houses", label: t.value.houses, section: t.value.main, path: "/houses", iconSrc: iconFor("property"), terms: "houses homes properties listings inventory objects" },
  { key: "clients", label: t.value.clients, section: t.value.main, path: "/clients", iconSrc: iconFor("clients"), terms: "clients contacts people leads buyers sellers" },
  { key: "settings", label: t.value.settings, section: t.value.main, path: "/settings", iconSrc: iconFor("settings"), terms: "settings preferences theme language workspace config" },
  { key: "calendar", label: t.value.calendar, section: t.value.main, path: "/calendar", iconSrc: iconFor("calendar"), terms: "calendar schedule notes planner session" },
  { key: "archive", label: t.value.archive, section: t.value.main, path: "/archive", iconSrc: iconFor("archive"), terms: "archive archived restore deleted old records" },
  { key: "theme", label: t.value.theme_settings, section: t.value.settings, path: "/settings", iconSrc: iconFor("settings"), terms: "theme dark light plain colors mode" },
  { key: "language", label: t.value.language_settings, section: t.value.settings, path: "/settings", iconSrc: iconFor("settings"), terms: "language locale translation english estonian" },
]);

const commandItems = computed(() => [
  {
    key: "cmd-new-contact",
    label: t.value.shortcut_new_contact,
    section: t.value.actions,
    path: "/clients",
    iconSrc: iconFor("clients"),
    terms: "create contact new contact lead customer",
    action: () => runQuickCreate("new-contact"),
  },
  {
    key: "cmd-new-opportunity",
    label: t.value.shortcut_new_opportunity,
    section: t.value.actions,
    path: "/houses",
    iconSrc: iconFor("property"),
    terms: "create opportunity new deal new property listing",
    action: () => runQuickCreate("new-opportunity"),
  },
  {
    key: "cmd-new-task",
    label: t.value.shortcut_new_task,
    section: t.value.actions,
    path: "/calendar",
    iconSrc: iconFor("calendar"),
    terms: "create task follow-up todo",
    action: () => runQuickCreate("new-task"),
  },
]);

const loadEntitySearchItems = async () => {
  if (entitySearchLoaded.value || entitySearchLoading.value) return;
  entitySearchLoading.value = true;
  entitySearchError.value = "";
  try {
    const [clientsRes, housesRes] = await Promise.all([
      supabase.from("clients").select("id, full_name, email, phone").order("created_at", { ascending: false }).limit(30),
      supabase.from("houses").select("id, address, city").order("created_at", { ascending: false }).limit(30),
    ]);

    const rows = [];
    if (!clientsRes.error) {
      for (const c of clientsRes.data || []) {
        rows.push({
          key: `client-${c.id}`,
          label: c.full_name || t.value.client,
          section: t.value.client_record,
          path: `/clients/${c.id}`,
          iconSrc: iconFor("clients"),
          terms: `client ${c.full_name || ""} ${c.email || ""} ${c.phone || ""}`,
        });
      }
    }
    if (!housesRes.error) {
      for (const h of housesRes.data || []) {
        rows.push({
          key: `house-${h.id}`,
          label: h.address || t.value.house,
          section: h.city ? `${t.value.house} • ${h.city}` : t.value.property_record,
          path: `/houses/${h.id}`,
          iconSrc: iconFor("property"),
          terms: `house property listing ${h.address || ""} ${h.city || ""}`,
        });
      }
    }

    entitySearchItems.value = rows;
    entitySearchLoaded.value = true;
  } catch (e) {
    entitySearchError.value = e?.message || String(e);
  } finally {
    entitySearchLoading.value = false;
  }
};

const filteredSearchItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const source = [...commandItems.value, ...searchItems.value, ...entitySearchItems.value];
  if (!q) return source;

  return source.filter((item) => {
    const hay = `${item.label} ${item.section} ${item.path} ${item.terms}`.toLowerCase();
    return hay.includes(q);
  });
});

const closeSearch = () => {
  searchOpen.value = false;
};

const toggleSearch = async () => {
  searchOpen.value = !searchOpen.value;
  if (!searchOpen.value) return;
  loadEntitySearchItems();
  await nextTick();
  searchInputEl.value?.focus();
  searchInputEl.value?.select?.();
};

const goToSearchResult = async (item) => {
  searchOpen.value = false;
  searchQuery.value = "";
  if (typeof item.action === "function") {
    await item.action();
    return;
  }
  if (route.path !== item.path) {
    await router.push(item.path);
  }
};

const openFirstSearchResult = () => {
  const first = filteredSearchItems.value[0];
  if (!first) return;
  goToSearchResult(first);
};

const requestSubmitBestEffort = () => {
  const activeForm = document.activeElement?.closest?.("form");
  if (activeForm) {
    activeForm.requestSubmit?.();
    return true;
  }
  const modalForm = document.querySelector(".modal-panel form");
  if (modalForm) {
    modalForm.requestSubmit?.();
    return true;
  }
  const routeForm = document.querySelector(".shell-route-stage form");
  if (routeForm) {
    routeForm.requestSubmit?.();
    return true;
  }
  return false;
};

const closeTopModalIfAny = () => {
  const backdrops = Array.from(document.querySelectorAll(".modal-backdrop"));
  if (!backdrops.length) return false;
  const topmost = backdrops[backdrops.length - 1];
  topmost.click();
  return true;
};

const handleProKeyboardShortcut = (e) => {
  if (!settings.proKeyboardMode) return false;

  const key = e.key.toLowerCase();
  const withCmdOrCtrl = e.metaKey || e.ctrlKey;
  const typing = isTypingContext(e.target);

  if (key === "?" && !typing && !withCmdOrCtrl && !e.altKey) {
    e.preventDefault();
    shortcutsHelpOpen.value = !shortcutsHelpOpen.value;
    return true;
  }
  if (key === "/" && !typing && !withCmdOrCtrl && !e.altKey && !e.shiftKey) {
    e.preventDefault();
    toggleSearch();
    return true;
  }
  if (key === "escape") {
    if (shortcutsHelpOpen.value) {
      e.preventDefault();
      shortcutsHelpOpen.value = false;
      return true;
    }
    if (searchOpen.value) {
      e.preventDefault();
      closeSearch();
      return true;
    }
  }

  if (withCmdOrCtrl && !e.altKey && key === "k") {
    e.preventDefault();
    toggleSearch();
    return true;
  }
  if (withCmdOrCtrl && !e.altKey && !e.shiftKey && key === "f") {
    e.preventDefault();
    toggleSearch();
    return true;
  }
  if (withCmdOrCtrl && !e.altKey && !e.shiftKey && key === "s") {
    e.preventDefault();
    requestSubmitBestEffort();
    return true;
  }
  if (withCmdOrCtrl && !e.altKey && !e.shiftKey && key === "enter") {
    e.preventDefault();
    requestSubmitBestEffort();
    return true;
  }

  if (typing || withCmdOrCtrl || e.altKey || e.shiftKey) return false;

  if (key === "c") {
    e.preventDefault();
    runQuickCreate("new-contact");
    return true;
  }
  if (key === "p") {
    e.preventDefault();
    runQuickCreate("new-opportunity");
    return true;
  }
  if (key === "t") {
    e.preventDefault();
    runQuickCreate("new-task");
    return true;
  }
  if (key === "m") {
    e.preventDefault();
    runQuickCreate("new-meeting");
    return true;
  }

  return false;
};

const onWindowKeydown = (e) => {
  if (e.key === "Escape" && closeTopModalIfAny()) {
    e.preventDefault();
    return;
  }

  if (handleProKeyboardShortcut(e)) return;

  if (settings.shortcuts && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    if (!isTypingContext(e.target) && e.key === "Escape") {
      if (shortcutsHelpOpen.value) {
        e.preventDefault();
        shortcutsHelpOpen.value = false;
        return;
      }
      if (searchOpen.value) {
        e.preventDefault();
        closeSearch();
        return;
      }
      e.preventDefault();
      router.back();
      return;
    }

    if (!isTypingContext(e.target) && /^[1-6]$/.test(e.key)) {
      const tabIndex = Number(e.key) - 1;
      const nextPath = MAIN_TAB_SHORTCUT_PATHS[tabIndex];
      if (nextPath && route.path !== nextPath) {
        e.preventDefault();
        router.push(nextPath);
        return;
      }
    }
  }

  const isMetaK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
  if (!isMetaK) return;
  e.preventDefault();
  toggleSearch();
};

const onGlobalPointerDown = (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  if (!searchOpen.value) return;
  if (searchPopoverEl.value?.contains(target)) return;
  if (searchToggleBtnEl.value?.contains(target)) return;
  closeSearch();
};

onMounted(() => {
  window.addEventListener("keydown", onWindowKeydown);
  window.addEventListener("pointerdown", onGlobalPointerDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onWindowKeydown);
  window.removeEventListener("pointerdown", onGlobalPointerDown);
});

const pageMeta = computed(() => {
  const path = route.path;

  if (path.startsWith("/clients/")) {
    return { section: t.value.clients, title: t.value.client_detail, detail: route.params.id };
  }
  if (path.startsWith("/houses/")) {
    return { section: t.value.houses, title: t.value.property_detail, detail: route.params.id };
  }
  if (path === "/dashboard") {
    return { section: t.value.dashboard, title: t.value.overview, detail: "" };
  }
  if (path === "/clients") {
    return { section: t.value.clients, title: t.value.client_database, detail: "" };
  }
  if (path === "/houses") {
    return { section: t.value.houses, title: t.value.property_inventory, detail: "" };
  }
  if (path === "/settings") {
    return { section: t.value.settings, title: t.value.workspace_preferences, detail: "" };
  }
  if (path === "/calendar") {
    return { section: t.value.calendar, title: t.value.planner, detail: "" };
  }
  if (path === "/archive") {
    return { section: t.value.archive, title: t.value.archived_records, detail: "" };
  }

  return { section: t.value.workspace, title: "CRM", detail: "" };
});

const pageShortcutHint = computed(() => {
  const path = route.path;
  if (path === "/houses" || path === "/clients") {
    return "E: Select • Enter: Exit select";
  }
  if (path.startsWith("/houses/")) {
    return "E: Edit • Enter: Save • R: Refresh";
  }
  if (path.startsWith("/clients/")) {
    return "Enter: Save";
  }
  return "";
});
</script>
