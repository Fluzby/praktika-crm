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
        sidebarCollapsed ? 'is-collapsed' : '',
        mobileSidebarOpen ? 'is-mobile-open' : '',
      ]"
    >
      <SideRail
        :collapsed="sidebarCollapsed"
        @toggle-collapse="toggleSidebar"
        @navigate="mobileSidebarOpen = false"
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
              aria-label="Open navigation"
              title="Open navigation"
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
              title="Search pages"
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
                  placeholder="Find pages, tabs, settings..."
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
                Loading records...
              </div>

              <div v-else class="shell-search-empty">
                No matches for "{{ searchQuery }}"
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

const mainEl = ref(null);
const route = useRoute();
const router = useRouter();

const sidebarCollapsed = ref(false);
const mobileSidebarOpen = ref(false);
const searchOpen = ref(false);
const searchQuery = ref("");
const searchInputEl = ref(null);
const entitySearchLoaded = ref(false);
const entitySearchLoading = ref(false);
const entitySearchError = ref("");
const entitySearchItems = ref([]);
const SIDEBAR_STORAGE_KEY = "crm_sidebar_collapsed";

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

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const searchItems = [
  { key: "dashboard", label: "Dashboard", section: "Main", path: "/dashboard", icon: "▦", terms: "dashboard home overview stats widgets" },
  { key: "houses", label: "Properties", section: "Main", path: "/houses", icon: "⌂", terms: "houses homes properties listings inventory objects" },
  { key: "clients", label: "Clients", section: "Main", path: "/clients", icon: "◍", terms: "clients contacts people leads buyers sellers" },
  { key: "settings", label: "Settings", section: "Main", path: "/settings", icon: "⚙", terms: "settings preferences theme language workspace config" },
  { key: "calendar", label: "Calendar", section: "Main", path: "/calendar", icon: "◷", terms: "calendar schedule notes planner session" },
  { key: "archive", label: "Archive", section: "Main", path: "/archive", icon: "🗄", terms: "archive archived restore deleted old records" },
  { key: "theme", label: "Theme Settings", section: "Settings", path: "/settings", icon: "◐", terms: "theme dark light glass warm brutalist plain colors mode" },
  { key: "language", label: "Language Settings", section: "Settings", path: "/settings", icon: "⎈", terms: "language locale translation english estonian" },
];

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
          label: c.full_name || "Client",
          section: "Client Record",
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
          label: h.address || "Property",
          section: h.city ? `Property • ${h.city}` : "Property Record",
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
  const source = [...searchItems, ...entitySearchItems.value];
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
    return { section: "Clients", title: "Client Detail", detail: route.params.id };
  }
  if (path.startsWith("/houses/")) {
    return { section: "Properties", title: "Property Detail", detail: route.params.id };
  }
  if (path === "/dashboard") {
    return { section: "Dashboard", title: "Overview", detail: "" };
  }
  if (path === "/clients") {
    return { section: "Clients", title: "Client Database", detail: "" };
  }
  if (path === "/houses") {
    return { section: "Properties", title: "Property Inventory", detail: "" };
  }
  if (path === "/settings") {
    return { section: "Settings", title: "Workspace Preferences", detail: "" };
  }
  if (path === "/calendar") {
    return { section: "Calendar", title: "Planner", detail: "" };
  }
  if (path === "/archive") {
    return { section: "Archive", title: "Archived Records", detail: "" };
  }

  return { section: "Workspace", title: "CRM", detail: "" };
});
</script>
