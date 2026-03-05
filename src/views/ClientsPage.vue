<template>
  <div class="space-y-6">
    <div class="glass p-4">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="flex-1">
          <input
            class="input"
            :placeholder="t.search_clients_placeholder"
            v-model.trim="q"
          />
        </div>

        <div class="flex items-center gap-2">
          <button class="btn-ghost" @click="q = ''" :disabled="!q">{{ t.clear }}</button>
          <div class="text-sm text-white/50">
            {{ filtered.length }} {{ t.results }}
          </div>
        </div>
      </div>
      </div>
    </div>

    <div class="space-y-3">
      <div v-if="loading" class="text-white/60">{{ t.loading }}</div>
      <div v-else-if="error" class="text-red-300">{{ error }}</div>

      <div v-else class="glass-soft overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[860px] text-sm" :class="selectionMode ? 'select-none' : ''">
            <thead class="bg-white/[0.02] border-b border-white/10">
              <tr class="text-left text-xs uppercase tracking-[0.08em] text-white/50">
                <th v-if="selectionMode" class="px-4 py-3 font-medium w-10">
                  <input
                    type="checkbox"
                    :checked="allVisibleClientsSelected"
                    @change="toggleSelectAllVisibleClients"
                  />
                </th>
                <th class="px-4 py-3 font-medium">{{ t.client }}</th>
                <th class="px-4 py-3 font-medium">{{ t.phone }}</th>
                <th class="px-4 py-3 font-medium">{{ t.email }}</th>
                <th class="px-4 py-3 font-medium">{{ t.notes }}</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">{{ t.created }}</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap text-right">{{ t.actions }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(c, index) in filtered"
                :key="c.id"
                :data-kb-index="index"
                class="border-b border-white/8 last:border-b-0 hover:bg-white/[0.03] cursor-pointer"
                :class="settings.proKeyboardMode && keyboardIndex === index ? 'bg-white/[0.07]' : ''"
                @mousedown="selectionMode && $event.shiftKey && $event.preventDefault()"
                @click="selectionMode ? onClientSelectInteraction(c.id, index, $event) : openClient(c.id)"
              >
                <td v-if="selectionMode" class="px-4 py-3" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isClientSelected(c.id)"
                    @change="onClientSelectInteraction(c.id, index, $event)"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="font-semibold text-white truncate max-w-[240px]">{{ c.full_name }}</div>
                </td>
                <td class="px-4 py-3 text-white/75 whitespace-nowrap">{{ c.phone || "—" }}</td>
                <td class="px-4 py-3 text-white/75">
                  <div class="truncate max-w-[220px]">{{ c.email || "—" }}</div>
                </td>
                <td class="px-4 py-3 text-white/60">
                  <div class="truncate max-w-[280px]">{{ c.notes || "—" }}</div>
                </td>
                <td class="px-4 py-3 text-white/50 whitespace-nowrap">{{ formatDate(c.created_at) }}</td>
                <td class="px-4 py-3 text-right" @click.stop>
                  <RowActionsMenu
                    v-if="!selectionMode"
                    :archived="!!c.is_archived"
                    @archive="onArchiveClient(c)"
                    @delete="onDeleteClient(c)"
                  />
                </td>
              </tr>

              <tr v-if="filtered.length === 0">
                <td :colspan="selectionMode ? 7 : 6" class="px-4 py-8 text-center text-white/60">
                  {{ t.no_clients_found }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <Modal
      :open="showAdd"
      :title="t.add_client"
      :subtitle="t.add_client_subtitle"
      @close="showAdd = false"
    >
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="createClientAndClose">
        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.full_name }} *</label>
          <input ref="fullNameInputEl" class="input mt-1" v-model.trim="form.full_name" required />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.phone }}</label>
          <input class="input mt-1" v-model.trim="form.phone" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.email }}</label>
          <input ref="emailInputEl" class="input mt-1" type="email" v-model.trim="form.email" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.deal_preference }}</label>
          <select class="input mt-1" v-model="form.deal_preference">
            <option value="any">{{ t.deal_preference_any }}</option>
            <option value="buy">{{ t.deal_preference_buy }}</option>
            <option value="rent">{{ t.deal_preference_rent }}</option>
          </select>
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.property_preference }}</label>
          <select class="input mt-1" v-model="form.property_preference">
            <option value="any">{{ t.property_preference_any }}</option>
            <option value="apartment">{{ t.property_preference_apartment }}</option>
            <option value="house">{{ t.property_preference_house }}</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.notes }}</label>
          <textarea
            class="textarea mt-1"
            rows="4"
            v-model.trim="form.notes"
            :placeholder="t.notes_placeholder"
          ></textarea>
        </div>

        <label class="md:col-span-2 flex items-center gap-3 mt-1">
          <input type="checkbox" v-model="alreadyInterested" />
          <span class="text-sm text-white/60">{{ t.already_interested }}</span>
        </label>

        <div v-if="alreadyInterested" class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.interested_house }}</label>
          <select class="input mt-1" v-model="interestedHouseId" :disabled="housesLoading" :required="alreadyInterested">
            <option value="">{{ t.select_house }}</option>
            <option v-for="h in housesForSelect" :key="h.id" :value="h.id">
              {{ h.address }}{{ h.city ? ` • ${h.city}` : "" }}
            </option>
          </select>
          <p v-if="housesError" class="text-xs text-red-300 mt-2">{{ housesError }}</p>
        </div>

        <div class="md:col-span-2 flex items-center gap-3 mt-2">
          <button class="btn" :disabled="creating">
            {{ creating ? t.saving : t.save }}
          </button>
          <button type="button" class="btn-ghost" @click="showAdd = false">
            {{ t.cancel }}
          </button>

          <p v-if="createError" class="text-sm text-red-300">{{ createError }}</p>
          <p v-if="createOk" class="text-sm text-green-300">{{ t.saved }}</p>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import Modal from "../components/Modal.vue";
import RowActionsMenu from "../components/RowActionsMenu.vue";
import { useT } from "../lib/i18n";
import { archiveEntity } from "../lib/entityActions";
import { useTopbarActions } from "../lib/topbarActions";
import { settings } from "../lib/settings";

const router = useRouter();

const clients = ref([]);
const loading = ref(false);
const error = ref("");

const q = ref("");
const showAdd = ref(false);
const selectionMode = ref(false);
const selectedClientIds = ref([]);
const bulkBusy = ref(false);
const lastClientSelectionIndex = ref(null);

const alreadyInterested = ref(false);
const interestedHouseId = ref("");
const housesForSelect = ref([]);
const housesLoading = ref(false);
const housesError = ref("");

const creating = ref(false);
const createError = ref("");
const createOk = ref(false);
const keyboardIndex = ref(-1);
const fullNameInputEl = ref(null);
const emailInputEl = ref(null);
const pendingFocusField = ref("full_name");

const form = ref({
  full_name: "",
  phone: "",
  email: "",
  deal_preference: "any",
  property_preference: "any",
  notes: "",
});

const t = useT();

const loadHousesForSelect = async () => {
  housesLoading.value = true;
  housesError.value = "";

  try {
    const { data, error } = await supabase
      .from("houses")
      .select("id, address, city")
      .order("created_at", { ascending: false });

    if (error) throw error;
    housesForSelect.value = data || [];
  } catch (e) {
    housesError.value = e?.message || String(e);
  } finally {
    housesLoading.value = false;
  }
};

watch(showAdd, (open) => {
  if (!open) return;
  alreadyInterested.value = false;
  interestedHouseId.value = "";
  nextTick(() => {
    if (pendingFocusField.value === "email") {
      emailInputEl.value?.focus?.();
    } else {
      fullNameInputEl.value?.focus?.();
    }
    pendingFocusField.value = "full_name";
  });
});

watch(alreadyInterested, (v) => {
  if (!v) return;
  if (housesForSelect.value.length > 0) return;
  loadHousesForSelect();
});

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
};

const openClient = (id) => router.push(`/clients/${id}`);

const isTypingContext = (target) => {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return !!target.closest('[contenteditable="true"]');
};

const onKeydown = (e) => {
  if (settings.proKeyboardMode && !isTypingContext(e.target) && !showAdd.value) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (!selectionMode.value) toggleSelectionMode();
      toggleSelectAllVisibleClients();
      return;
    }
    if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!filtered.value.length) return;
        keyboardIndex.value = Math.min(
          filtered.value.length - 1,
          keyboardIndex.value < 0 ? 0 : keyboardIndex.value + 1
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!filtered.value.length) return;
        keyboardIndex.value = Math.max(0, keyboardIndex.value < 0 ? 0 : keyboardIndex.value - 1);
        return;
      }
      if (e.key === " " && keyboardIndex.value >= 0 && keyboardIndex.value < filtered.value.length) {
        e.preventDefault();
        const row = filtered.value[keyboardIndex.value];
        if (!selectionMode.value) toggleSelectionMode();
        onClientSelectInteraction(row.id, keyboardIndex.value, { shiftKey: false });
        return;
      }
      if (e.key === "Enter" && !selectionMode.value && keyboardIndex.value >= 0 && keyboardIndex.value < filtered.value.length) {
        e.preventDefault();
        openClient(filtered.value[keyboardIndex.value].id);
        return;
      }
    }
  }

  if (!settings.shortcuts) return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  if (isTypingContext(e.target)) return;
  if (e.key === "Enter" && selectionMode.value) {
    e.preventDefault();
    toggleSelectionMode();
    return;
  }
  if (e.key !== "e" && e.key !== "E") return;
  if (showAdd.value || bulkBusy.value) return;
  e.preventDefault();
  toggleSelectionMode();
};

const onArchiveClient = async (clientRow) => {
  try {
    await archiveEntity({
      entityType: "client",
      entityId: clientRow.id,
      archived: !!clientRow.is_archived,
    });
    await load();
  } catch (e) {
    alert(e?.message || String(e));
  }
};

const onDeleteClient = async (clientRow) => {
  if (!confirm(`${t.value.delete} ${clientRow.full_name}?`)) return;
  const { error: e } = await supabase.from("clients").delete().eq("id", clientRow.id);
  if (e) return alert(e.message);
  await load();
};

const filtered = computed(() => {
  const term = q.value.toLowerCase();
  if (!term) return clients.value;

  return clients.value.filter((c) => {
    const hay = [
      c.full_name,
      c.phone,
      c.email,
      c.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(term);
  });
});

watch(filtered, (rows) => {
  if (!rows.length) {
    keyboardIndex.value = -1;
    return;
  }
  if (keyboardIndex.value < 0) {
    keyboardIndex.value = 0;
    return;
  }
  if (keyboardIndex.value >= rows.length) keyboardIndex.value = rows.length - 1;
});

const selectedClientIdSet = computed(() => new Set(selectedClientIds.value));
const allVisibleClientsSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every((c) => selectedClientIdSet.value.has(c.id))
);

const isClientSelected = (id) => selectedClientIdSet.value.has(id);

const toggleClientSelection = (id) => {
  if (selectedClientIdSet.value.has(id)) {
    selectedClientIds.value = selectedClientIds.value.filter((x) => x !== id);
    return;
  }
  selectedClientIds.value = [...selectedClientIds.value, id];
};

const onClientSelectInteraction = (id, index, event) => {
  const shift = !!event?.shiftKey;
  if (
    shift &&
    Number.isInteger(lastClientSelectionIndex.value) &&
    Number.isInteger(index) &&
    filtered.value.length
  ) {
    const start = Math.min(lastClientSelectionIndex.value, index);
    const end = Math.max(lastClientSelectionIndex.value, index);
    const rangeIds = filtered.value.slice(start, end + 1).map((c) => c.id);
    const next = new Set(selectedClientIds.value);
    const shouldSelect = !next.has(id);
    for (const rangeId of rangeIds) {
      if (shouldSelect) next.add(rangeId);
      else next.delete(rangeId);
    }
    selectedClientIds.value = Array.from(next);
    lastClientSelectionIndex.value = index;
    return;
  }
  toggleClientSelection(id);
  lastClientSelectionIndex.value = index;
};

const toggleSelectAllVisibleClients = () => {
  if (allVisibleClientsSelected.value) {
    const visibleIds = new Set(filtered.value.map((c) => c.id));
    selectedClientIds.value = selectedClientIds.value.filter((id) => !visibleIds.has(id));
    return;
  }
  const merged = new Set(selectedClientIds.value);
  for (const c of filtered.value) merged.add(c.id);
  selectedClientIds.value = Array.from(merged);
};

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedClientIds.value = [];
    lastClientSelectionIndex.value = null;
  }
}

async function bulkArchiveClients() {
  if (!selectedClientIds.value.length) return;
  bulkBusy.value = true;
  error.value = "";
  try {
    await Promise.all(
      selectedClientIds.value.map((id) =>
        archiveEntity({ entityType: "client", entityId: id, archived: false })
      )
    );
    await load();
    selectedClientIds.value = [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    bulkBusy.value = false;
  }
}

async function bulkDeleteClients() {
  if (!selectedClientIds.value.length) return;
  if (!confirm(t.value.delete_selected_clients_confirm)) return;
  bulkBusy.value = true;
  error.value = "";
  try {
    const { error: e } = await supabase
      .from("clients")
      .delete()
      .in("id", selectedClientIds.value);
    if (e) throw e;
    await load();
    selectedClientIds.value = [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    bulkBusy.value = false;
  }
}

useTopbarActions(() => {
  if (!selectionMode.value) {
    return [
      { key: "refresh", label: t.value.refresh, onClick: () => load(), disabled: loading.value || bulkBusy.value },
      { key: "add", label: `+ ${t.value.add}`, onClick: () => (showAdd.value = true), disabled: bulkBusy.value },
      { key: "select-mode", label: t.value.select_mode, onClick: toggleSelectionMode },
    ];
  }

  return [
    {
      key: "select-visible",
      label: allVisibleClientsSelected.value ? t.value.clear_selection : t.value.select_all_visible,
      onClick: toggleSelectAllVisibleClients,
      disabled: !filtered.value.length || bulkBusy.value,
    },
    {
      key: "bulk-archive",
      label: t.value.archive_selected,
      onClick: bulkArchiveClients,
      disabled: !selectedClientIds.value.length || bulkBusy.value,
    },
    { key: "exit-select-mode", label: t.value.exit_select_mode, onClick: toggleSelectionMode, disabled: bulkBusy.value },
  ];
});

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const { data, error: e } = await supabase
      .from("clients")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (e) throw e;
    clients.value = data || [];
    const liveIds = new Set(clients.value.map((c) => c.id));
    selectedClientIds.value = selectedClientIds.value.filter((id) => liveIds.has(id));
  } catch (err) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
};

const createClient = async () => {
  creating.value = true;
  createError.value = "";
  createOk.value = false;

  try {
    const basePayload = {
      full_name: form.value.full_name,
      phone: form.value.phone || null,
      email: form.value.email || null,
      notes: form.value.notes || null,
    };
    const payload = {
      ...basePayload,
      deal_preference: form.value.deal_preference === "any" ? null : form.value.deal_preference,
      property_preference: form.value.property_preference === "any" ? null : form.value.property_preference,
    };

    let { data: clientRow, error: e } = await supabase.from("clients").insert(payload).select().single();
    const msg = String(e?.message || e || "");
    const missingPrefCols =
      msg.includes("deal_preference") || msg.includes("property_preference");
    if (e && missingPrefCols) {
      const retry = await supabase.from("clients").insert(basePayload).select().single();
      clientRow = retry.data;
      e = retry.error;
    }
    if (e) throw e;

    await logActivity({ type: "create", entity: "client", entity_id: clientRow.id, label: payload.full_name });

    if (alreadyInterested.value) {
      if (!interestedHouseId.value) {
        throw new Error(t.value.select_house);
      }

      const { error: matchErr } = await supabase.from("house_matches").upsert({
        client_id: clientRow.id,
        house_id: interestedHouseId.value,
        status: "interested",
        source: "manual",
      });
      if (matchErr) throw matchErr;
    }

    form.value = {
      full_name: "",
      phone: "",
      email: "",
      deal_preference: "any",
      property_preference: "any",
      notes: "",
    };
    alreadyInterested.value = false;
    interestedHouseId.value = "";
    await load();

    createOk.value = true;
    setTimeout(() => (createOk.value = false), 1200);
  } catch (err) {
    createError.value = err?.message || String(err);
  } finally {
    creating.value = false;
  }
};

const createClientAndClose = async () => {
  await createClient();
  if (!createError.value) showAdd.value = false;
};

const onNewContactShortcut = () => {
  pendingFocusField.value = "full_name";
  showAdd.value = true;
};

onMounted(load);
onMounted(() => {
  window.addEventListener("crm:shortcut:new-contact", onNewContactShortcut);
  window.addEventListener("keydown", onKeydown);
  onBeforeUnmount(() => {
    window.removeEventListener("crm:shortcut:new-contact", onNewContactShortcut);
    window.removeEventListener("keydown", onKeydown);
  });
});
</script>
