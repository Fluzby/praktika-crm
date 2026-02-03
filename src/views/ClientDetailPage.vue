<template>
  <div class="space-y-6" v-if="client">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">{{ client.full_name }}</h1>
        <div class="text-white/70 text-sm mt-1">
          {{ client.phone || "—" }} • {{ client.email || "—" }} • {{ client.preferred_city || "—" }}
        </div>
        <div class="text-white/70 text-sm mt-1">
          Budget: €{{ client.budget_min ?? "—" }} – €{{ client.budget_max ?? "—" }}
          • Rooms: {{ client.rooms_min ?? "—" }} – {{ client.rooms_max ?? "—" }}
        </div>
        <div class="mt-2 flex flex-wrap gap-2">
          <span v-for="t in (client.tags || [])" :key="t" class="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
            {{ t }}
          </span>
        </div>
      </div>

      <RouterLink to="/clients" class="px-3 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/10">
        Back
      </RouterLink>
    </div>

    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 class="font-semibold">Matched houses</h2>
      <p class="text-white/60 text-sm mt-1">
        Match = fits budget/rooms + tag overlap score.
      </p>

      <div v-if="loading" class="text-white/70 mt-4">Loading…</div>
      <div v-else-if="error" class="text-red-300 mt-4">{{ error }}</div>

      <ul v-else class="mt-4 space-y-2">
        <li v-for="h in matches" :key="h.id" class="rounded-xl border border-white/10 bg-white/5 p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <RouterLink :to="`/houses/${h.id}`" class="font-semibold hover:underline">
                {{ h.address }}
              </RouterLink>
              <div class="text-sm text-white/70 mt-1">
                {{ h.city || "—" }} • {{ h.rooms ?? "?" }} rooms • €{{ h.price ?? "—" }}
                <span class="ml-2 text-white/50">• score {{ h.score }}</span>
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                <span v-for="t in (h.tags || [])" :key="t" class="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                  {{ t }}
                </span>
              </div>
            </div>
          </div>
        </li>

        <li v-if="matches.length === 0" class="text-white/60">
          No matches yet. Add more houses or adjust client preferences/tags.
        </li>
      </ul>
    </div>
  </div>

  <div v-else class="text-white/70">Loading…</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";

const route = useRoute();
const id = route.params.id;

const client = ref(null);
const matches = ref([]);
const loading = ref(false);
const error = ref("");

const intersectsCount = (a = [], b = []) => {
  const setB = new Set((b || []).map((x) => String(x).toLowerCase()));
  let count = 0;
  for (const x of (a || [])) {
    if (setB.has(String(x).toLowerCase())) count++;
  }
  return count;
};

const fits = (h, c) => {
  // Budget: house price should be within min/max if provided
  if (c.budget_min != null && h.price != null && h.price < c.budget_min) return false;
  if (c.budget_max != null && h.price != null && h.price > c.budget_max) return false;

  // Rooms: house rooms should be within min/max if provided
  if (c.rooms_min != null && h.rooms != null && h.rooms < c.rooms_min) return false;
  if (c.rooms_max != null && h.rooms != null && h.rooms > c.rooms_max) return false;

  // City preference (soft): if set, we'll keep matches but score lower if different
  return true;
};

const scoreHouse = (h, c) => {
  const tagScore = intersectsCount(h.tags, c.tags);
  const cityScore = c.preferred_city && h.city && c.preferred_city.toLowerCase() === h.city.toLowerCase() ? 2 : 0;
  return tagScore + cityScore;
};

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    const c = await supabase.from("clients").select("*").eq("id", id).single();
    if (c.error) throw c.error;
    client.value = c.data;

    const h = await supabase.from("houses").select("*").order("created_at", { ascending: false });
    if (h.error) throw h.error;

    const filtered = (h.data || [])
      .filter((row) => fits(row, client.value))
      .map((row) => ({ ...row, score: scoreHouse(row, client.value) }))
      .sort((a, b) => b.score - a.score);

    matches.value = filtered;
  } catch (err) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
