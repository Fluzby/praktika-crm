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
        <div class="shell-user-avatar">M</div>
        <div v-if="!collapsed" class="min-w-0">
          <div class="shell-user-name truncate">Member</div>
          <div class="shell-user-role truncate">Agent</div>
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
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import NavIcon from "./SideRailIcon.vue";
import { useT } from "../lib/i18n";

defineProps({
  collapsed: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle-collapse", "navigate"]);
const router = useRouter();
const t = useT();

const handleNavigate = () => {
  emit("navigate");
};

const logout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};
</script>
