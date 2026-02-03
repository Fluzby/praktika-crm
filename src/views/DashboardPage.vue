<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-white/70 mt-1">Overview</p>
      </div>

      <button
        class="px-3 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/10"
        @click="load"
      >
        Refresh
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="text-white/70 text-sm">Clients</div>
        <div class="text-4xl font-bold mt-2">{{ clientsCount ?? "—" }}</div>
        <RouterLink to="/clients" class="mt-4 inline-block text-sm text-blue-300 hover:underline">
          Manage clients →
        </RouterLink>
      </div>

      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="text-white/70 text-sm">Houses</div>
        <div class="text-4xl font-bold mt-2">{{ housesCount ?? "—" }}</div>
        <RouterLink to="/houses" class="mt-4 inline-block text-sm text-blue-300 hover:underline">
          Manage houses →
        </RouterLink>
      </div>
    </div>

    <!-- Recent -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Recent Houses -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Recent houses</h2>
          <RouterLink to="/houses" class="text-sm text-white/70 hover:text-white hover:underline">
            View all
          </RouterLink>
        </div>

        <div v-if="loading" class="mt-4 text-white/70">Loading…</div>
        <div v-else-if="error" class="mt-4 text-red-300">{{ error }}</div>

        <ul v-else class="mt-4 space-y-2">
          <li
            v-for="h in recentHouses"
            :key="h.id"
            class="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <RouterLink :to="`/houses/${h.id}`" class="font-semibold hover:underline">
              {{ h.address }}
            </RouterLink>
            <div class="text-sm text-white/70 mt-1">
              {{ h.city || "—" }} • {{ h.rooms ?? "?" }} rooms • €{{ h.price ?? "—" }}
            </div>
          </li>

          <li v-if="recentHouses.length === 0" class="text-white/60">
            No houses yet.
          </li>
        </ul>
      </div>

      <!-- Recent Clients -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Recent clients</h2>
          <RouterLink to="/clients" class="text-sm text-white/70 hover:text-white hover:underline">
            View all
          </RouterLink>
        </div>

        <div v-if="loading" class="mt-4 text-white/70">Loading…</div>
        <div v-else-if="error" class="mt-4 text-red-300">{{ error }}</div>

        <ul v-else class="mt-4 space-y-2">
          <li
            v-for="c in recentClients"
            :key="c.id"
            class="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div class="font-semibold">{{ c.full_name }}</div>
            <div class="text-sm text-white/70 mt-1">
              {{ c.phone || "—" }} • {{ c.email || "—" }}
            </div>
          </li>

          <li v-if="recentClients.length === 0" class="text-white/60">
            No clients yet.
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";

const clientsCount = ref(null);
const housesCount = ref(null);

const recentClients = ref([]);
const recentHouses = ref([]);

const loading = ref(false);
const error = ref("");

const load = async () => {
  loading.value = true;
  error.value = "";

  try {
    // Counts
    const cCount = await supabase.from("clients").select("*", { count: "exact", head: true });
    const hCount = await supabase.from("houses").select("*", { count: "exact", head: true });

    if (cCount.error) throw cCount.error;
    if (hCount.error) throw hCount.error;

    clientsCount.value = cCount.count ?? 0;
    housesCount.value = hCount.count ?? 0;

    // Recent lists
    const cRecent = await supabase
      .from("clients")
      .select("id, full_name, phone, email, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const hRecent = await supabase
      .from("houses")
      .select("id, address, city, price, rooms, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (cRecent.error) throw cRecent.error;
    if (hRecent.error) throw hRecent.error;

    recentClients.value = cRecent.data || [];
    recentHouses.value = hRecent.data || [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>
