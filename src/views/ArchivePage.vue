<template>
  <div class="space-y-6">
    <div class="glass p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <input
          class="input flex-1"
          v-model.trim="q"
          :placeholder="t.search_archived_placeholder"
        />
        <div class="text-sm text-white/50">{{ filteredClients.length + filteredHouses.length }} {{ t.results }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section class="glass-soft p-4">
        <h2 class="font-semibold mb-3">{{ t.archived_clients }}</h2>
        <div v-if="loading" class="text-white/60 text-sm">{{ t.loading }}</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[520px] text-sm" :class="selectionMode ? 'select-none' : ''">
            <thead class="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/50">
              <tr>
                <th v-if="selectionMode" class="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    :checked="allVisibleClientsSelected"
                    @change="toggleSelectAllVisibleClients"
                  />
                </th>
                <th class="px-3 py-2 text-left">{{ t.name }}</th>
                <th class="px-3 py-2 text-left">{{ t.email }}</th>
                <th class="px-3 py-2 text-left">{{ t.archived }}</th>
                <th class="px-3 py-2 text-right">{{ t.actions }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in filteredClients"
                :key="c.id"
                class="border-b border-white/8 last:border-b-0"
                :class="selectionMode ? 'cursor-pointer hover:bg-white/[0.03]' : ''"
                @click="selectionMode && toggleClientSelection(c.id)"
              >
                <td v-if="selectionMode" class="px-3 py-2" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedClientIdSet.has(c.id)"
                    @change="toggleClientSelection(c.id)"
                  />
                </td>
                <td class="px-3 py-2">{{ c.full_name }}</td>
                <td class="px-3 py-2 text-white/70">{{ c.email || "—" }}</td>
                <td class="px-3 py-2 text-white/50">{{ formatDate(c.updated_at || c.created_at) }}</td>
                <td class="px-3 py-2 text-right">
                  <template v-if="!selectionMode">
                    <button class="btn-ghost text-xs mr-2" @click="restoreClient(c)">{{ t.restore }}</button>
                    <button class="btn-ghost text-xs text-red-300" @click="deleteClient(c)">{{ t.delete }}</button>
                  </template>
                </td>
              </tr>
              <tr v-if="!loading && filteredClients.length === 0">
                <td :colspan="selectionMode ? 5 : 4" class="px-3 py-6 text-center text-white/60">{{ t.no_archived_clients }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="glass-soft p-4">
        <h2 class="font-semibold mb-3">{{ t.archived_properties }}</h2>
        <div v-if="loading" class="text-white/60 text-sm">{{ t.loading }}</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[560px] text-sm" :class="selectionMode ? 'select-none' : ''">
            <thead class="border-b border-white/10 text-xs uppercase tracking-[0.08em] text-white/50">
              <tr>
                <th v-if="selectionMode" class="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    :checked="allVisibleHousesSelected"
                    @change="toggleSelectAllVisibleHouses"
                  />
                </th>
                <th class="px-3 py-2 text-left">{{ t.address }}</th>
                <th class="px-3 py-2 text-left">{{ t.city }}</th>
                <th class="px-3 py-2 text-left">{{ t.price }}</th>
                <th class="px-3 py-2 text-right">{{ t.actions }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="h in filteredHouses"
                :key="h.id"
                class="border-b border-white/8 last:border-b-0"
                :class="selectionMode ? 'cursor-pointer hover:bg-white/[0.03]' : ''"
                @click="selectionMode && toggleHouseSelection(h.id)"
              >
                <td v-if="selectionMode" class="px-3 py-2" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedHouseIdSet.has(h.id)"
                    @change="toggleHouseSelection(h.id)"
                  />
                </td>
                <td class="px-3 py-2">{{ h.address }}</td>
                <td class="px-3 py-2 text-white/70">{{ h.city || "—" }}</td>
                <td class="px-3 py-2 text-white/70">€{{ h.price ?? "—" }}</td>
                <td class="px-3 py-2 text-right">
                  <template v-if="!selectionMode">
                    <button class="btn-ghost text-xs mr-2" @click="restoreHouse(h)">{{ t.restore }}</button>
                    <button class="btn-ghost text-xs text-red-300" @click="deleteHouse(h)">{{ t.delete }}</button>
                  </template>
                </td>
              </tr>
              <tr v-if="!loading && filteredHouses.length === 0">
                <td :colspan="selectionMode ? 5 : 4" class="px-3 py-6 text-center text-white/60">{{ t.no_archived_properties }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";
import { archiveEntity } from "../lib/entityActions";
import { useTopbarActions } from "../lib/topbarActions";
import { useT } from "../lib/i18n";
import { settings } from "../lib/settings";

const loading = ref(false);
const q = ref("");
const clients = ref([]);
const houses = ref([]);
const selectionMode = ref(false);
const selectedClientIds = ref([]);
const selectedHouseIds = ref([]);
const bulkBusy = ref(false);
const t = useT();

const selectedClientIdSet = computed(() => new Set(selectedClientIds.value));
const selectedHouseIdSet = computed(() => new Set(selectedHouseIds.value));
const totalSelected = computed(() => selectedClientIds.value.length + selectedHouseIds.value.length);

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

const allVisibleClientsSelected = computed(() =>
  filteredClients.value.length > 0 && filteredClients.value.every((c) => selectedClientIdSet.value.has(c.id))
);

const allVisibleHousesSelected = computed(() =>
  filteredHouses.value.length > 0 && filteredHouses.value.every((h) => selectedHouseIdSet.value.has(h.id))
);

const toggleClientSelection = (id) => {
  if (selectedClientIdSet.value.has(id)) {
    selectedClientIds.value = selectedClientIds.value.filter((x) => x !== id);
    return;
  }
  selectedClientIds.value = [...selectedClientIds.value, id];
};

const toggleHouseSelection = (id) => {
  if (selectedHouseIdSet.value.has(id)) {
    selectedHouseIds.value = selectedHouseIds.value.filter((x) => x !== id);
    return;
  }
  selectedHouseIds.value = [...selectedHouseIds.value, id];
};

const toggleSelectAllVisibleClients = () => {
  if (allVisibleClientsSelected.value) {
    const visibleIds = new Set(filteredClients.value.map((c) => c.id));
    selectedClientIds.value = selectedClientIds.value.filter((id) => !visibleIds.has(id));
    return;
  }
  const merged = new Set(selectedClientIds.value);
  for (const c of filteredClients.value) merged.add(c.id);
  selectedClientIds.value = Array.from(merged);
};

const toggleSelectAllVisibleHouses = () => {
  if (allVisibleHousesSelected.value) {
    const visibleIds = new Set(filteredHouses.value.map((h) => h.id));
    selectedHouseIds.value = selectedHouseIds.value.filter((id) => !visibleIds.has(id));
    return;
  }
  const merged = new Set(selectedHouseIds.value);
  for (const h of filteredHouses.value) merged.add(h.id);
  selectedHouseIds.value = Array.from(merged);
};

const toggleSelectAllVisible = () => {
  if (allVisibleClientsSelected.value && allVisibleHousesSelected.value) {
    toggleSelectAllVisibleClients();
    toggleSelectAllVisibleHouses();
    return;
  }
  toggleSelectAllVisibleClients();
  toggleSelectAllVisibleHouses();
};

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedClientIds.value = [];
    selectedHouseIds.value = [];
  }
}

const isTypingContext = (target) => {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return !!target.closest('[contenteditable="true"]');
};

const onKeydown = (e) => {
  if (!settings.shortcuts) return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  if (isTypingContext(e.target)) return;

  if (e.key === "Enter" && selectionMode.value) {
    e.preventDefault();
    toggleSelectionMode();
    return;
  }

  if (e.key !== "e" && e.key !== "E") return;
  if (loading.value || bulkBusy.value) return;
  e.preventDefault();
  toggleSelectionMode();
};

const restoreSelected = async () => {
  if (!totalSelected.value) return;
  bulkBusy.value = true;
  try {
    await Promise.all([
      ...selectedClientIds.value.map((id) => archiveEntity({ entityType: "client", entityId: id, archived: true })),
      ...selectedHouseIds.value.map((id) => archiveEntity({ entityType: "house", entityId: id, archived: true })),
    ]);
    await load();
    selectedClientIds.value = [];
    selectedHouseIds.value = [];
  } finally {
    bulkBusy.value = false;
  }
};

const deleteSelected = async () => {
  if (!totalSelected.value) return;
  if (!confirm(`${t.value.delete} ${totalSelected.value} ${t.value.selected_items}?`)) return;
  bulkBusy.value = true;
  try {
    if (selectedClientIds.value.length) {
      const { error } = await supabase.from("clients").delete().in("id", selectedClientIds.value);
      if (error) throw error;
    }
    if (selectedHouseIds.value.length) {
      const { error } = await supabase.from("houses").delete().in("id", selectedHouseIds.value);
      if (error) throw error;
    }
    await load();
    selectedClientIds.value = [];
    selectedHouseIds.value = [];
  } finally {
    bulkBusy.value = false;
  }
};

useTopbarActions(() => {
  if (!selectionMode.value) {
    return [
      { key: "refresh", label: t.value.refresh, onClick: () => load(), disabled: loading.value },
      { key: "select-mode", label: t.value.select_mode, onClick: toggleSelectionMode, disabled: loading.value },
    ];
  }

  return [
    {
      key: "select-visible",
      label: (allVisibleClientsSelected.value && allVisibleHousesSelected.value) ? t.value.clear_selection : t.value.select_all_visible,
      onClick: toggleSelectAllVisible,
      disabled: loading.value || bulkBusy.value || (!filteredClients.value.length && !filteredHouses.value.length),
    },
    {
      key: "restore-selected",
      label: t.value.restore,
      onClick: restoreSelected,
      disabled: loading.value || bulkBusy.value || !totalSelected.value,
    },
    {
      key: "delete-selected",
      label: t.value.delete_selected,
      onClick: deleteSelected,
      disabled: loading.value || bulkBusy.value || !totalSelected.value,
    },
    { key: "exit-select-mode", label: t.value.exit_select_mode, onClick: toggleSelectionMode, disabled: loading.value || bulkBusy.value },
  ];
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
    const liveClientIds = new Set(clients.value.map((c) => c.id));
    const liveHouseIds = new Set(houses.value.map((h) => h.id));
    selectedClientIds.value = selectedClientIds.value.filter((id) => liveClientIds.has(id));
    selectedHouseIds.value = selectedHouseIds.value.filter((id) => liveHouseIds.has(id));
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
  if (!confirm(`${t.value.delete} ${row.full_name}?`)) return;
  await supabase.from("clients").delete().eq("id", row.id);
  await load();
};

const deleteHouse = async (row) => {
  if (!confirm(`${t.value.delete} ${row.address}?`)) return;
  await supabase.from("houses").delete().eq("id", row.id);
  await load();
};

onMounted(load);
onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
});
</script>
