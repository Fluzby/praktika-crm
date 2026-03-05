<template>
  <div class="shell-nav-panel" :class="collapsed ? 'is-collapsed' : ''">
    <div class="shell-nav-header">
      <div class="shell-workspace-badge">R</div>
      <div v-if="!collapsed" class="min-w-0">
        <div class="shell-workspace-name truncate">Realestate CRM</div>
        <div class="shell-workspace-subtle truncate">{{ t.workspace }}</div>
      </div>
    </div>

    <div v-if="!collapsed" class="shell-nav-group-label">{{ t.views }}</div>
    <nav class="shell-nav-list" aria-label="Primary">
      <NavIcon
        to="/dashboard"
        :icon-src="iconFor('dashboard')"
        :force-white="useLightIcons"
        icon="▦"
        :label="t.dashboard"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/houses"
        :icon-src="iconFor('property')"
        :force-white="useLightIcons"
        icon="⌂"
        :label="t.houses"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/clients"
        :icon-src="iconFor('clients')"
        :force-white="useLightIcons"
        icon="◍"
        :label="t.clients"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/calendar"
        :icon-src="iconFor('calendar')"
        :force-white="useLightIcons"
        icon="◷"
        :label="t.calendar"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/archive"
        :icon-src="iconFor('archive')"
        :force-white="useLightIcons"
        icon="🗄"
        :label="t.archive"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/settings"
        :icon-src="iconFor('settings')"
        :force-white="useLightIcons"
        :zoom="true"
        icon="⚙"
        :label="t.settings"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
    </nav>

    <div class="flex-1"></div>

    <div class="shell-nav-footer">
      <button
        v-if="showToggle"
        class="shell-sidebar-toggle"
        type="button"
        @click="$emit('toggle-collapse')"
        :title="collapsed ? t.expand_sidebar : t.collapse_sidebar"
        :aria-label="collapsed ? t.expand_sidebar : t.collapse_sidebar"
      >
        <span class="text-base leading-none">{{ collapsed ? "»" : "«" }}</span>
        <span v-if="!collapsed">{{ t.collapse_sidebar }}</span>
      </button>

      <div class="shell-user-chip" :class="collapsed ? 'is-collapsed' : ''">
        <div class="shell-user-avatar">{{ userInitial }}</div>
        <div v-if="!collapsed" class="min-w-0">
          <div class="shell-user-name truncate">{{ userDisplayName }}</div>
          <div v-if="userSubtitle" class="shell-user-role truncate">{{ userSubtitle }}</div>
        </div>
      </div>

      <button
        class="shell-logout-btn"
        type="button"
        @click="logout"
        :title="t.logout"
      >
        <span class="text-base leading-none">↪</span>
        <span v-if="!collapsed">{{ t.logout }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import NavIcon from "./SideRailIcon.vue";
import { useT } from "../lib/i18n";
import { settings } from "../lib/settings";

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

defineProps({
  collapsed: { type: Boolean, default: false },
  showToggle: { type: Boolean, default: true },
});

const emit = defineEmits(["toggle-collapse", "navigate"]);
const router = useRouter();
const t = useT();
const userName = ref("");
const userEmail = ref("");
let authSubscription = null;
const darkSurfaceThemes = new Set(["dark", "glass", "warm", "brutalist"]);
const useLightIcons = computed(() => darkSurfaceThemes.has(settings.theme || "dark"));

const iconMap = {
  dashboard: { light: dashboardBlack, dark: dashboardWhite },
  property: { light: propertyBlack, dark: propertyWhite },
  clients: { light: clientsBlack, dark: clientsWhite },
  calendar: { light: calendarBlack, dark: calendarWhite },
  archive: { light: archiveBlack, dark: archiveWhite },
  settings: { light: settingsBlack, dark: settingsBlack },
};

const userDisplayName = computed(() => {
  if (userName.value) return userName.value;
  if (userEmail.value) return userEmail.value;
  return t.value.account;
});

const userSubtitle = computed(() => {
  if (!userEmail.value) return "";
  if (userName.value && userName.value !== userEmail.value) return userEmail.value;
  return "";
});
const userInitial = computed(() => (userDisplayName.value || "A").charAt(0).toUpperCase());

const handleNavigate = () => {
  emit("navigate");
};

const iconFor = (name) => {
  const icons = iconMap[name];
  if (!icons) return "";
  return useLightIcons.value ? icons.light : icons.dark;
};

const setUserFromAuth = (user) => {
  if (!user) {
    userName.value = "";
    userEmail.value = "";
    return;
  }
  const meta = user.user_metadata || {};
  userName.value = meta.full_name || meta.name || meta.username || "";
  userEmail.value = user.email || "";
};

const logout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};

onMounted(async () => {
  const { data } = await supabase.auth.getUser();
  setUserFromAuth(data?.user || null);

  const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
    setUserFromAuth(session?.user || null);
  });
  authSubscription = authData?.subscription || null;
});

onBeforeUnmount(() => {
  authSubscription?.unsubscribe?.();
});
</script>
