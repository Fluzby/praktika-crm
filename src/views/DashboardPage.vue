<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ t.dashboard }}</h1>
        <p class="text-white/60 mt-1">{{ t.dashboard_subtitle }}</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap justify-end">
        <button class="btn-ghost" @click="showAddHouse = true">+ {{ t.houses }}</button>
        <button class="btn-ghost" @click="showAddClient = true">+ {{ t.clients }}</button>
        <RouterLink to="/houses" class="btn-ghost">{{ t.open }} {{ t.houses }}</RouterLink>
        <RouterLink to="/clients" class="btn-ghost">{{ t.open }} {{ t.clients }}</RouterLink>
        <button class="btn-ghost" @click="load" :disabled="loading">{{ t.refresh }}</button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <section class="col-span-12 lg:col-span-8 space-y-6">
        <div v-if="settings.dashboardWidgets.overview" class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-white/60">{{ t.overview }}</div>
              <div class="text-lg font-semibold mt-1">{{ t.today }}</div>
            </div>

            <div class="text-xs text-white/50" v-if="error">{{ error }}</div>
          </div>

          <div class="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">{{ t.clients }}</div>
              <div class="text-2xl font-semibold mt-1">{{ clientsCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">{{ t.total }}</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">{{ t.houses }}</div>
              <div class="text-2xl font-semibold mt-1">{{ housesCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">{{ t.total }}</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">{{ t.photos }}</div>
              <div class="text-2xl font-semibold mt-1">{{ photosCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">{{ t.stored }}</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">{{ t.last_update }}</div>
              <div class="text-2xl font-semibold mt-1">{{ lastUpdated }}</div>
              <div class="text-xs text-white/45 mt-1">{{ t.local }}</div>
            </div>
          </div>
        </div>

        <!-- KPI widget removed (Active clients / Matches / Cold houses / AI efficiency) -->

        <div v-if="settings.dashboardWidgets.latest_listings" class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ t.latest_listings }}</h2>
              <p class="text-sm text-white/60 mt-1">{{ t.recent_houses_subtitle }}</p>
            </div>
            <RouterLink to="/houses" class="text-sm text-white/60 hover:text-white">
              {{ t.open }} →
            </RouterLink>
          </div>

          <div v-if="loading" class="mt-5 text-white/60">{{ t.loading }}</div>

          <ul v-else class="mt-5 space-y-2">
            <li
              v-for="h in recentHouses"
              :key="h.id"
              class="rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-white/[0.05] transition"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <RouterLink :to="`/houses/${h.id}`" class="font-semibold hover:underline">
                    {{ h.address }}
                  </RouterLink>
                  <div class="text-sm text-white/60 mt-1">
                    {{ h.city || "—" }} • {{ h.rooms ?? "?" }} rooms • €{{ h.price ?? "—" }}
                  </div>
                </div>

                <span class="chip">{{ formatDate(h.created_at) }}</span>
              </div>
            </li>

            <li v-if="recentHouses.length === 0" class="text-white/60">
              {{ t.no_houses_found }}
            </li>
          </ul>
        </div>
      </section>

      <aside class="col-span-12 lg:col-span-4 space-y-6">
        <div v-if="settings.dashboardWidgets.recent_clients" class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ t.recent_clients }}</h2>
              <p class="text-sm text-white/60 mt-1">{{ t.recent_clients_subtitle }}</p>
            </div>
            <RouterLink to="/clients" class="text-sm text-white/60 hover:text-white">
              {{ t.open }} →
            </RouterLink>
          </div>

          <div v-if="loading" class="mt-5 text-white/60">{{ t.loading }}</div>

          <ul v-else class="mt-5 space-y-2">
            <li
              v-for="c in recentClients"
              :key="c.id"
              class="rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-white/[0.05] transition"
            >
              <div class="font-semibold">{{ c.full_name }}</div>
              <div class="text-sm text-white/60 mt-1">
                {{ c.phone || "—" }} • {{ c.email || "—" }}
              </div>
            </li>

            <li v-if="recentClients.length === 0" class="text-white/60">
              {{ t.no_clients_found }}
            </li>
          </ul>
        </div>

        <div v-if="settings.dashboardWidgets.recent_activity" class="glass-soft p-6">
          <h2 class="font-semibold mb-3">{{ t.recent_activity }}</h2>
          <ul class="space-y-2 text-sm text-white/60">
            <li v-for="a in activity" :key="a.id" class="flex items-center justify-between gap-3">
              <span class="truncate">
                {{ a.type }} {{ a.entity }}<span v-if="a.label"> — {{ a.label }}</span>
              </span>
              <span class="text-xs text-white/40 whitespace-nowrap">
                {{ new Date(a.created_at).toLocaleDateString() }}
              </span>
            </li>
            <li v-if="activity.length===0">{{ t.no_recent_activity }}</li>
          </ul>
        </div>
      </aside>
    </div>

    <teleport to="body">
      <div
        v-if="showAddHouse"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        @keydown.esc="closeAddHouse"
        tabindex="-1"
      >
        <div class="absolute inset-0" @click="closeAddHouse"></div>

        <div
          class="relative bg-black/90 border border-white/10 rounded-2xl w-[90vw] max-w-5xl max-h-[90vh] flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ t.add_house }}</h2>
              <p class="text-sm text-white/60 mt-1">{{ t.add_house_subtitle }}</p>
            </div>

            <button
              class="h-10 w-10 rounded-xl border border-white/10 hover:bg-white/10 grid place-items-center"
              @click="closeAddHouse"
              :aria-label="t.close"
            >
              ✕
            </button>
          </div>

          <div class="px-6 pt-4 pb-3 border-b border-white/10">
            <div class="relative">
              <input
                v-model="fieldSearch"
                :placeholder="t.search_fields_placeholder"
                class="w-full input pr-10"
              />
              <button
                v-if="fieldSearch"
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                @click="fieldSearch = ''"
                :aria-label="t.clear"
                :title="t.clear"
              >
                ✕
              </button>
            </div>
            <div class="text-xs text-white/40 mt-1">
              {{ t.search_across_all_fields }}
            </div>
          </div>

          <div class="px-6 py-4 overflow-y-auto flex-1 space-y-8">
            <div class="glass-soft p-4 rounded-xl">
              <div class="text-xs text-white/50">{{ t.preview }}</div>
              <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div class="text-xs text-white/50">{{ t.address }}</div>
                  <div class="tabular-nums">{{ previewAddress }}</div>
                </div>
                <div>
                  <div class="text-xs text-white/50">{{ t.city }}</div>
                  <div class="tabular-nums">{{ previewCity }}</div>
                </div>
              </div>
            </div>

            <div
              v-if="Object.keys(filteredGroups).length === 0"
              class="text-sm text-white/50 text-center py-12"
            >
              {{ t.no_fields_match_search }}
            </div>

            <form id="add-house-form" class="space-y-8" @submit.prevent="createHouseAndClose">
              <div
                v-for="(group, groupKey) in filteredGroups"
                :key="groupKey"
                class="glass-soft p-4 rounded-xl"
              >
                <h3 class="text-sm font-semibold mb-3">
                  {{ groupLabel(group) }}
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="field in group.fields"
                    :key="field.key"
                  >
                    <label class="text-xs text-white/50">
                      {{ fieldLabel(field) }}
                    </label>

                    <input
                      v-if="field.type === 'text'"
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    />

                    <input
                      v-else-if="field.type === 'number'"
                      type="number"
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    />

                    <input
                      v-else-if="field.type === 'date'"
                      type="date"
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    />

                    <select
                      v-else-if="field.type === 'boolean'"
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    >
                      <option value="">—</option>
                      <option value="Yes">{{ t.yes }}</option>
                      <option value="No">{{ t.no }}</option>
                    </select>

                    <input
                      v-else
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    />
                  </div>
                </div>
              </div>

              <div class="glass-soft p-4 rounded-xl">
                <h3 class="text-sm font-semibold mb-3">
                  {{ t.description }}
                </h3>
                <textarea class="textarea" rows="4" v-model.trim="newHouse.description"></textarea>
              </div>

              <div class="glass-soft p-4 rounded-xl">
                <h3 class="text-sm font-semibold mb-3">
                  {{ t.tags }}
                </h3>
                <input class="input" v-model.trim="newHouse.tagsInput" :placeholder="t.tags_placeholder" />
              </div>

              <div class="glass-soft p-4 rounded-xl">
                <h3 class="text-sm font-semibold mb-3">
                  {{ t.photos }} (1–10)
                </h3>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  @change="onHouseFilesChange"
                  class="block w-full text-sm text-white/70"
                />
                <p class="text-xs text-white/50 mt-2" v-if="houseFiles.length">
                  {{ t.selected_files }}: {{ houseFiles.length }} {{ t.files }}
                </p>
              </div>
            </form>
          </div>

          <div class="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-2">
            <p v-if="createHouseError" class="text-sm text-red-300 mr-auto">{{ createHouseError }}</p>
            <p v-else-if="createHouseOk" class="text-sm text-green-300 mr-auto">{{ t.saved }}</p>

            <button class="btn-ghost" type="button" @click="closeAddHouse">
              {{ t.cancel }}
            </button>
            <button class="btn" type="submit" form="add-house-form" :disabled="creatingHouse">
              {{ creatingHouse ? t.saving : t.save }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <Modal
      :open="showAddClient"
      :title="t.add_client"
      :subtitle="t.add_client_subtitle"
      @close="showAddClient = false"
    >
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="createClientAndClose">
        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.full_name }} *</label>
          <input class="input mt-1" v-model.trim="clientForm.full_name" required />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.phone }}</label>
          <input class="input mt-1" v-model.trim="clientForm.phone" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.email }}</label>
          <input class="input mt-1" type="email" v-model.trim="clientForm.email" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.notes }}</label>
          <textarea class="textarea mt-1" rows="4" v-model.trim="clientForm.notes"></textarea>
        </div>

        <div class="md:col-span-2 flex items-center gap-3 mt-2">
          <button class="btn" :disabled="creatingClient">
            {{ creatingClient ? t.saving : t.save }}
          </button>
          <button type="button" class="btn-ghost" @click="showAddClient = false">{{ t.cancel }}</button>

          <p v-if="createClientError" class="text-sm text-red-300">{{ createClientError }}</p>
          <p v-if="createClientOk" class="text-sm text-green-300">{{ t.saved }}</p>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import Modal from "../components/Modal.vue";
import { useT } from "../lib/i18n";
import { settings } from "../lib/settings";
import { HOUSE_FIELD_GROUPS } from "@/config/houseFields.en";

const clientsCount = ref(null);
const housesCount = ref(null);
const photosCount = ref(null);

const recentClients = ref([]);
const recentHouses = ref([]);
const activity = ref([]);

// KPI stats removed from dashboard

const loading = ref(false);
const error = ref("");

const lastUpdated = ref("—");

const showAddHouse = ref(false);
const showAddClient = ref(false);

const creatingHouse = ref(false);
const createHouseError = ref("");
const createHouseOk = ref(false);

const creatingClient = ref(false);
const createClientError = ref("");
const createClientOk = ref(false);

const newHouse = ref({
  raw_data: {},
  description: "",
  tagsInput: "",
});
const fieldSearch = ref("");
const houseFiles = ref([]);

const clientForm = ref({
  full_name: "",
  phone: "",
  email: "",
  notes: "",
});

const t = useT();

const groupLabel = (group) => (settings.lang === "et" ? (group.label_et || group.label) : group.label);
const fieldLabel = (field) => (settings.lang === "et" ? (field.label_et || field.label) : field.label);

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
};

const onHouseFilesChange = (e) => {
  houseFiles.value = Array.from(e.target.files || []).slice(0, 10);
};

const parseTags = (s) =>
  (s || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const randomId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const cleanStr = (v) => {
  if (v === null || v === undefined) return "";
  return String(v).trim();
};

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/\s/g, "").replace("€", "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const makeAddressFromRaw = (raw) => {
  const street = cleanStr(raw?.["Tänav"]);
  const houseNo = cleanStr(raw?.["Maja nr"]);
  const aptNo = cleanStr(raw?.["Korteri nr"]);
  let addr = [street, houseNo].filter(Boolean).join(" ");
  if (aptNo) addr += `-${aptNo}`;
  return addr || cleanStr(raw?.["ID"]) || "—";
};

const makeCityFromRaw = (raw) =>
  cleanStr(raw?.["Linn"]) || cleanStr(raw?.["Vald"]) || cleanStr(raw?.["Maakond"]) || "—";

const previewAddress = computed(() => makeAddressFromRaw(newHouse.value.raw_data));
const previewCity = computed(() => makeCityFromRaw(newHouse.value.raw_data));

const prevBodyOverflow = ref("");
watch(showAddHouse, (open) => {
  if (typeof document === "undefined") return;
  if (open) {
    prevBodyOverflow.value = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = prevBodyOverflow.value;
  }
});

onBeforeUnmount(() => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = prevBodyOverflow.value;
});

const closeAddHouse = () => {
  showAddHouse.value = false;
};

watch(showAddHouse, (open) => {
  if (!open) fieldSearch.value = "";
});

const filteredGroups = computed(() => {
  const q = fieldSearch.value.trim().toLowerCase();
  if (!q) return HOUSE_FIELD_GROUPS;

  const result = {};
  for (const [groupKey, group] of Object.entries(HOUSE_FIELD_GROUPS)) {
    const matchedFields = group.fields.filter((f) => {
      return (
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q)
      );
    });

    if (matchedFields.length > 0) {
      result[groupKey] = { ...group, fields: matchedFields };
    }
  }

  return result;
});

const load = async () => {
  loading.value = true;
  error.value = "";

  try {
    const cCount = await supabase.from("clients").select("*", { count: "exact", head: true });
    const hCount = await supabase.from("houses").select("*", { count: "exact", head: true });
    const pCount = await supabase.from("house_photos").select("*", { count: "exact", head: true });

    if (cCount.error) throw cCount.error;
    if (hCount.error) throw hCount.error;
    if (pCount.error) throw pCount.error;

    clientsCount.value = cCount.count ?? 0;
    housesCount.value = hCount.count ?? 0;
    photosCount.value = pCount.count ?? 0;

    const cRecent = await supabase
      .from("clients")
      .select("id, full_name, phone, email, created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    const hRecent = await supabase
      .from("houses")
      .select("id, address, city, price, rooms, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    if (cRecent.error) throw cRecent.error;
    if (hRecent.error) throw hRecent.error;

    const a = await supabase
      .from("activity_log")
      .select("id,type,entity,label,created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    recentClients.value = cRecent.data || [];
    recentHouses.value = hRecent.data || [];
    activity.value = a.data || [];

    lastUpdated.value = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
};

const createHouse = async () => {
  creatingHouse.value = true;
  createHouseError.value = "";
  createHouseOk.value = false;

  try {
    const raw = newHouse.value.raw_data || {};

    const payload = {
      external_id: cleanStr(raw["ID"]) || null,
      deal_type: cleanStr(raw["Tehing"]) || null,
      object_type: cleanStr(raw["Objekti liik"]) || null,
      address: makeAddressFromRaw(raw),
      city: makeCityFromRaw(raw) === "—" ? null : makeCityFromRaw(raw),
      price: toNum(raw["Tehingu hind"]),
      rooms: toNum(raw["Tube"]),
      size_m2: toNum(raw["Üldpind (m2)"]),
      description: newHouse.value.description || null,
      tags: parseTags(newHouse.value.tagsInput),
      raw_data: raw,
    };

    const { data: house, error: e } = await supabase
      .from("houses")
      .insert(payload)
      .select()
      .single();

    if (e) throw e;

    await supabase.from("activity_log").insert({
      type: "create",
      entity: "house",
      entity_id: house.id,
    });

    const files = houseFiles.value.slice(0, 10);
    if (files.length) {
      const rows = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `houses/${house.id}/${randomId()}.${ext}`;

        const up = await supabase.storage.from("house-photos").upload(path, f, { upsert: false });
        if (up.error) throw up.error;

        rows.push({ house_id: house.id, storage_path: path, is_cover: i === 0 });
      }

      const ins = await supabase.from("house_photos").insert(rows);
      if (ins.error) throw ins.error;
    }

    newHouse.value = { raw_data: {}, description: "", tagsInput: "" };
    fieldSearch.value = "";
    houseFiles.value = [];

    await load();
    createHouseOk.value = true;
    setTimeout(() => (createHouseOk.value = false), 1200);
  } catch (err) {
    createHouseError.value = err?.message || String(err);
  } finally {
    creatingHouse.value = false;
  }
};

const createHouseAndClose = async () => {
  await createHouse();
  if (!createHouseError.value) showAddHouse.value = false;
};

const createClient = async () => {
  creatingClient.value = true;
  createClientError.value = "";
  createClientOk.value = false;

  try {
    const payload = {
      full_name: clientForm.value.full_name,
      phone: clientForm.value.phone || null,
      email: clientForm.value.email || null,
      notes: clientForm.value.notes || null,
    };

    const { data: clientRow, error: e } = await supabase.from("clients").insert(payload).select().single();
    if (e) throw e;

    await logActivity({ type: "create", entity: "client", entity_id: clientRow.id, label: payload.full_name });

    clientForm.value = { full_name: "", phone: "", email: "", notes: "" };
    await load();

    createClientOk.value = true;
    setTimeout(() => (createClientOk.value = false), 1200);
  } catch (err) {
    createClientError.value = err?.message || String(err);
  } finally {
    creatingClient.value = false;
  }
};

const createClientAndClose = async () => {
  await createClient();
  if (!createClientError.value) showAddClient.value = false;
};

onMounted(() => {
  load();
  const handler = () => {
    // Keep the dashboard fresh if matches change.
    load();
  };
  window.addEventListener("match-changed", handler);
  onBeforeUnmount(() => window.removeEventListener("match-changed", handler));
});
</script>
