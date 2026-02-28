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
          <table class="w-full min-w-[860px] text-sm">
            <thead class="bg-white/[0.02] border-b border-white/10">
              <tr class="text-left text-xs uppercase tracking-[0.08em] text-white/50">
                <th class="px-4 py-3 font-medium">Client</th>
                <th class="px-4 py-3 font-medium">Pipeline</th>
                <th class="px-4 py-3 font-medium">Phone</th>
                <th class="px-4 py-3 font-medium">Email</th>
                <th class="px-4 py-3 font-medium">Notes</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">Created</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in filtered"
                :key="c.id"
                class="border-b border-white/8 last:border-b-0 hover:bg-white/[0.03] cursor-pointer"
                @click="openClient(c.id)"
              >
                <td class="px-4 py-3">
                  <div class="font-semibold text-white truncate max-w-[240px]">{{ c.full_name }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="chip whitespace-nowrap">{{ clientStageLabel(c.id) }}</span>
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
                    :archived="!!c.is_archived"
                    @archive="onArchiveClient(c)"
                    @delete="onDeleteClient(c)"
                  />
                </td>
              </tr>

              <tr v-if="filtered.length === 0">
                <td colspan="7" class="px-4 py-8 text-center text-white/60">
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
          <input class="input mt-1" v-model.trim="form.full_name" required />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.phone }}</label>
          <input class="input mt-1" v-model.trim="form.phone" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.email }}</label>
          <input class="input mt-1" type="email" v-model.trim="form.email" />
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
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import Modal from "../components/Modal.vue";
import RowActionsMenu from "../components/RowActionsMenu.vue";
import { useT } from "../lib/i18n";
import {
  CLIENT_PIPELINE_LABELS,
  getClientStatus,
} from "../lib/crmEnhancements";
import { archiveEntity } from "../lib/entityActions";
import { useTopbarActions } from "../lib/topbarActions";

const router = useRouter();

const clients = ref([]);
const loading = ref(false);
const error = ref("");

const q = ref("");
const showAdd = ref(false);

const alreadyInterested = ref(false);
const interestedHouseId = ref("");
const housesForSelect = ref([]);
const housesLoading = ref(false);
const housesError = ref("");

const creating = ref(false);
const createError = ref("");
const createOk = ref(false);

const form = ref({
  full_name: "",
  phone: "",
  email: "",
  notes: "",
});

const t = useT();
const clientStageLabel = (clientId) => CLIENT_PIPELINE_LABELS[getClientStatus(clientId)] || "New Lead";

useTopbarActions(() => [
  { key: "refresh", label: t.value.refresh, onClick: () => load(), disabled: loading.value },
  { key: "add", label: `+ ${t.value.add}`, onClick: () => (showAdd.value = true) },
]);

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
  if (!confirm(`Delete ${clientRow.full_name}?`)) return;
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
    const payload = {
      full_name: form.value.full_name,
      phone: form.value.phone || null,
      email: form.value.email || null,
      notes: form.value.notes || null,
    };

    const { data: clientRow, error: e } = await supabase.from("clients").insert(payload).select().single();
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

    form.value = { full_name: "", phone: "", email: "", notes: "" };
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

onMounted(load);
</script>
