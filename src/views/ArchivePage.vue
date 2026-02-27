<template>
  <div class="space-y-6">
    <div class="glass p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <input
          class="input flex-1"
          v-model.trim="q"
          placeholder="Search archived clients and properties..."
        />
        <div class="text-sm text-white/50">{{ filteredClients.length + filteredHouses.length }} results</div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section class="glass-soft p-4">
        <h2 class="font-semibold mb-3">Archived Clients</h2>
        <div v-if="loading" class="text-white/60 text-sm">Loading...</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[520px] text-sm">
            <thead class="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/50">
              <tr>
                <th class="px-3 py-2 text-left">Name</th>
                <th class="px-3 py-2 text-left">Email</th>
                <th class="px-3 py-2 text-left">Archived</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filteredClients" :key="c.id" class="border-b border-white/8 last:border-b-0">
                <td class="px-3 py-2">{{ c.full_name }}</td>
                <td class="px-3 py-2 text-white/70">{{ c.email || "—" }}</td>
                <td class="px-3 py-2 text-white/50">{{ formatDate(c.updated_at || c.created_at) }}</td>
                <td class="px-3 py-2 text-right">
                  <button class="btn-ghost text-xs mr-2" @click="restoreClient(c)">Restore</button>
                  <button class="btn-ghost text-xs text-red-300" @click="deleteClient(c)">Delete</button>
                </td>
              </tr>
              <tr v-if="!loading && filteredClients.length === 0">
                <td colspan="4" class="px-3 py-6 text-center text-white/60">No archived clients</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="glass-soft p-4">
        <h2 class="font-semibold mb-3">Archived Properties</h2>
        <div v-if="loading" class="text-white/60 text-sm">Loading...</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[560px] text-sm">
            <thead class="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/50">
              <tr>
                <th class="px-3 py-2 text-left">Address</th>
                <th class="px-3 py-2 text-left">City</th>
                <th class="px-3 py-2 text-left">Price</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in filteredHouses" :key="h.id" class="border-b border-white/8 last:border-b-0">
                <td class="px-3 py-2">{{ h.address }}</td>
                <td class="px-3 py-2 text-white/70">{{ h.city || "—" }}</td>
                <td class="px-3 py-2 text-white/70">€{{ h.price ?? "—" }}</td>
                <td class="px-3 py-2 text-right">
                  <button class="btn-ghost text-xs mr-2" @click="restoreHouse(h)">Restore</button>
                  <button class="btn-ghost text-xs text-red-300" @click="deleteHouse(h)">Delete</button>
                </td>
              </tr>
              <tr v-if="!loading && filteredHouses.length === 0">
                <td colspan="4" class="px-3 py-6 text-center text-white/60">No archived properties</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";
import { archiveEntity } from "../lib/entityActions";
import { useTopbarActions } from "../lib/topbarActions";

const loading = ref(false);
const q = ref("");
const clients = ref([]);
const houses = ref([]);

useTopbarActions(() => [
  { key: "refresh", label: "Refresh", onClick: () => load(), disabled: loading.value },
]);

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");

const filteredClients = computed(() => {
  const term = q.value.toLowerCase();
  if (!term) return clients.value;
  return clients.value.filter((c) =>
    [c.full_name, c.email, c.phone, c.notes].filter(Boolean).join(" ").toLowerCase().includes(term)
  );
});

const filteredHouses = computed(() => {
  const term = q.value.toLowerCase();
  if (!term) return houses.value;
  return houses.value.filter((h) =>
    [h.address, h.city, ...(h.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(term)
  );
});

async function load() {
  loading.value = true;
  try {
    const [c, h] = await Promise.all([
      supabase.from("clients").select("*").eq("is_archived", true).order("created_at", { ascending: false }),
      supabase.from("houses").select("*").eq("is_archived", true).order("created_at", { ascending: false }),
    ]);
    if (c.error) throw c.error;
    if (h.error) throw h.error;
    clients.value = c.data || [];
    houses.value = h.data || [];
  } catch (err) {
    console.error("Failed to load archive:", err);
    clients.value = [];
    houses.value = [];
  } finally {
    loading.value = false;
  }
};

const restoreClient = async (row) => {
  await archiveEntity({ entityType: "client", entityId: row.id, archived: true });
  await load();
};

const restoreHouse = async (row) => {
  await archiveEntity({ entityType: "house", entityId: row.id, archived: true });
  await load();
};

const deleteClient = async (row) => {
  if (!confirm(`Delete ${row.full_name}?`)) return;
  await supabase.from("clients").delete().eq("id", row.id);
  await load();
};

const deleteHouse = async (row) => {
  if (!confirm(`Delete ${row.address}?`)) return;
  await supabase.from("houses").delete().eq("id", row.id);
  await load();
};

onMounted(load);
</script>
