<template>
  <div class="h-full w-full flex flex-col items-center">
    <div class="mb-6">
      <div class="w-12 h-12 rounded-2xl border border-white/10 bg-white/[0.04] grid place-items-center font-bold">
        R
      </div>
    </div>

    <nav class="flex flex-col gap-3">
      <NavIcon to="/dashboard">📊</NavIcon>
      <NavIcon to="/clients">👥</NavIcon>
      <NavIcon to="/houses">🏠</NavIcon>
    </nav>

    <div class="flex-1"></div>

    <button
      class="w-14 h-14 rounded-2xl border border-red-500/20 bg-white/[0.02]
             hover:bg-red-500/10 text-red-300 transition grid place-items-center text-[20px]"
      @click="logout"
      title="Logout"
    >
      🚪
    </button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import NavIcon from "./SideRailIcon.vue";

const router = useRouter();

const logout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};
</script>
