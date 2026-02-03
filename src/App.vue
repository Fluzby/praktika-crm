<template>
  <div class="min-h-screen bg-zinc-950 text-white p-6">
    <h1 class="text-2xl font-bold">Real Estate CRM</h1>
    <p class="text-white/70 mt-2">Connected to Supabase ✅</p>

    <div class="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Houses</h2>
        <button
          class="px-3 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/10"
          @click="load"
        >
          Refresh
        </button>
      </div>

      <div v-if="loading" class="mt-4 text-white/70">Loading…</div>
      <div v-else-if="error" class="mt-4 text-red-300">{{ error }}</div>

      <ul v-else class="mt-4 space-y-2">
        <li
          v-for="h in houses"
          :key="h.id"
          class="rounded-xl border border-white/10 bg-white/5 p-3"
        >
          <div class="font-semibold">{{ h.address }}</div>
          <div class="text-sm text-white/70">
            {{ h.city || "—" }} • {{ h.rooms ?? "?" }} rooms • €{{ h.price ?? "—" }}
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="t in (h.tags || [])"
              :key="t"
              class="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10"
            >
              {{ t }}
            </span>
          </div>
        </li>

        <li v-if="houses.length === 0" class="text-white/60">
          No houses yet (this is fine).
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "./lib/supabase";

const houses = ref([]);
const loading = ref(false);
const error = ref("");

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    const { data, error: e } = await supabase
      .from("houses")
      .select("*")
      .order("created_at", { ascending: false });

    if (e) throw e;
    houses.value = data || [];
  } catch (err) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
