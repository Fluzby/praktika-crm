<template>
  <div class="shell-nav-panel" :class="collapsed ? 'is-collapsed' : ''">
    <div class="shell-nav-header">
      <div class="shell-workspace-badge">R</div>
      <div v-if="!collapsed" class="min-w-0">
        <div class="shell-workspace-name truncate">Realestate CRM</div>
        <div class="shell-workspace-subtle truncate">Workspace</div>
      </div>
    </div>

    <div v-if="!collapsed" class="shell-nav-group-label">Views</div>
    <nav class="shell-nav-list" aria-label="Primary">
      <NavIcon
        to="/dashboard"
        icon="▦"
        :label="t.dashboard"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/houses"
        icon="⌂"
        :label="t.houses"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/clients"
        icon="◍"
        :label="t.clients"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/calendar"
        icon="◷"
        label="Calendar"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/archive"
        icon="🗄"
        label="Archive"
        :collapsed="collapsed"
        @click="handleNavigate"
      />
      <NavIcon
        to="/settings"
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
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span class="text-base leading-none">{{ collapsed ? "»" : "«" }}</span>
        <span v-if="!collapsed">Collapse sidebar</span>
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

const userDisplayName = computed(() => {
  if (userName.value) return userName.value;
  if (userEmail.value) return userEmail.value;
  return "Account";
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
