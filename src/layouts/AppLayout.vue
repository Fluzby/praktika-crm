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
              class="shell-icon-btn hidden sm:grid"
              type="button"
              :title="t.search_pages"
              @click="toggleSearch"
            >
              ⌕
            </button>

            <div v-if="searchOpen" class="shell-search-popover">
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
                    <span class="shell-search-result-icon">{{ item.icon }}</span>
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

const searchItems = computed(() => [
  { key: "dashboard", label: t.value.dashboard, section: t.value.main, path: "/dashboard", icon: "▦", terms: "dashboard home overview stats widgets" },
  { key: "houses", label: t.value.houses, section: t.value.main, path: "/houses", icon: "⌂", terms: "houses homes properties listings inventory objects" },
  { key: "clients", label: t.value.clients, section: t.value.main, path: "/clients", icon: "◍", terms: "clients contacts people leads buyers sellers" },
  { key: "settings", label: t.value.settings, section: t.value.main, path: "/settings", icon: "⚙", terms: "settings preferences theme language workspace config" },
  { key: "calendar", label: t.value.calendar, section: t.value.main, path: "/calendar", icon: "◷", terms: "calendar schedule notes planner session" },
  { key: "archive", label: t.value.archive, section: t.value.main, path: "/archive", icon: "🗄", terms: "archive archived restore deleted old records" },
  { key: "theme", label: t.value.theme_settings, section: t.value.settings, path: "/settings", icon: "◐", terms: "theme dark light glass warm brutalist plain colors mode" },
  { key: "language", label: t.value.language_settings, section: t.value.settings, path: "/settings", icon: "⎈", terms: "language locale translation english estonian" },
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
          icon: "◍",
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
          icon: "⌂",
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
  const source = [...searchItems.value, ...entitySearchItems.value];
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
  if (route.path !== item.path) {
    await router.push(item.path);
  }
};

const openFirstSearchResult = () => {
  const first = filteredSearchItems.value[0];
  if (!first) return;
  goToSearchResult(first);
};

const onWindowKeydown = (e) => {
  if (settings.shortcuts && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
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

onMounted(() => {
  window.addEventListener("keydown", onWindowKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onWindowKeydown);
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
</script>
