<template>
  <div class="min-h-screen bg-zinc-950 text-white flex">
    <aside class="w-64 border-r border-white/10 p-4 hidden md:block">
      <div class="font-bold text-lg">Real Estate CRM</div>
      <div class="text-xs text-white/60 mt-1">{{ userEmail }}</div>

      <nav class="mt-6 space-y-2">
        <RouterLink to="/dashboard" class="nav" active-class="nav-active">Dashboard</RouterLink>
        <RouterLink to="/clients" class="nav" active-class="nav-active">Clients</RouterLink>
        <RouterLink to="/houses" class="nav" active-class="nav-active">Houses</RouterLink>
      </nav>

      <button class="mt-6 w-full btn" @click="logout">Logout</button>
    </aside>

    <main class="flex-1">
      <header class="border-b border-white/10 p-4 md:hidden flex justify-between">
        <div class="font-bold">Real Estate CRM</div>
        <button class="btn" @click="logout">Logout</button>
      </header>

      <div class="mx-auto max-w-6xl p-6">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();
const userEmail = ref("");

onMounted(async () => {
  const { data } = await supabase.auth.getUser();
  userEmail.value = data.user?.email || "";
});

const logout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};
</script>

<style scoped>
.nav { display:block; padding:10px 12px; border-radius:12px; border:1px solid rgba(255,255,255,.1); }
.nav:hover { background: rgba(255,255,255,.06); }
.nav-active { background: rgba(255,255,255,.12); }
</style>
