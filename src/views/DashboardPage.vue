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

        <div v-if="settings.dashboardWidgets.kpis" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="glass-soft p-4">
            <div class="text-xs text-white/60">{{ t.active_clients }}</div>
            <div class="text-2xl font-semibold mt-1">
              {{ clientsWithMatches }}
            </div>
          </div>

          <div class="glass-soft p-4">
            <div class="text-xs text-white/60">{{ t.matches }}</div>
            <div class="text-sm mt-2 space-y-1">
              <div>{{ t.suggested }}: {{ matchStats.suggested }}</div>
              <div>{{ t.contacted }}: {{ matchStats.contacted }}</div>
              <div>{{ t.viewed }}: {{ matchStats.viewed }}</div>
              <div>{{ t.interested }}: {{ matchStats.interested }}</div>
            </div>
          </div>

          <div class="glass-soft p-4">
            <div class="text-xs text-white/60">{{ t.cold_houses }}</div>
            <div class="text-2xl font-semibold mt-1">
              {{ housesNoInterest }}
            </div>
          </div>

          <div class="glass-soft p-4">
            <div class="text-xs text-white/60">{{ t.ai_efficiency }}</div>
            <div class="text-sm mt-2">
              {{ aiEfficiency.contacted }} / {{ aiEfficiency.suggested }} {{ t.contacted_over_suggested }}
            </div>
          </div>
        </div>

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

    <Modal
      :open="showAddHouse"
      :title="t.add_house"
      :subtitle="t.add_house_subtitle"
      @close="showAddHouse = false"
    >
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="createHouseAndClose">
        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.address }} *</label>
          <input class="input mt-1" v-model.trim="houseForm.address" required />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.city }}</label>
          <input class="input mt-1" v-model.trim="houseForm.city" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.price }}</label>
          <input class="input mt-1" type="number" min="0" v-model.number="houseForm.price" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.rooms }}</label>
          <input class="input mt-1" type="number" min="0" v-model.number="houseForm.rooms" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.size_m2 }}</label>
          <input class="input mt-1" type="number" min="0" v-model.number="houseForm.size_m2" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.tags }}</label>
          <input class="input mt-1" v-model.trim="houseTagsInput" :placeholder="t.tags_placeholder" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.description }}</label>
          <textarea class="textarea mt-1" rows="4" v-model.trim="houseForm.description"></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.photos }} (1–10)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="onHouseFilesChange"
            class="mt-2 block w-full text-sm text-white/70"
          />
          <p class="text-xs text-white/50 mt-1" v-if="houseFiles.length">
            {{ t.selected_files }}: {{ houseFiles.length }} {{ t.files }}
          </p>
        </div>

        <div class="md:col-span-2 flex items-center gap-3 mt-2">
          <button class="btn" :disabled="creatingHouse">
            {{ creatingHouse ? t.saving : t.save }}
          </button>
          <button type="button" class="btn-ghost" @click="showAddHouse = false">{{ t.cancel }}</button>

          <p v-if="createHouseError" class="text-sm text-red-300">{{ createHouseError }}</p>
          <p v-if="createHouseOk" class="text-sm text-green-300">{{ t.saved }}</p>
        </div>
      </form>
    </Modal>

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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import Modal from "../components/Modal.vue";
import { useT } from "../lib/i18n";
import { settings } from "../lib/settings";

const clientsCount = ref(null);
const housesCount = ref(null);
const photosCount = ref(null);

const recentClients = ref([]);
const recentHouses = ref([]);
const activity = ref([]);

const clientsWithMatches = ref(0);
const matchStats = ref({
  suggested: 0,
  contacted: 0,
  viewed: 0,
  interested: 0,
});
const housesNoInterest = ref(0);
const aiEfficiency = ref({ suggested: 0, contacted: 0 });

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

const houseForm = ref({
  address: "",
  city: "",
  price: null,
  rooms: null,
  size_m2: null,
  description: "",
  tags: [],
});

const houseTagsInput = ref("");
const houseFiles = ref([]);

const clientForm = ref({
  full_name: "",
  phone: "",
  email: "",
  notes: "",
});

const t = useT();

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

const loadClientsWithMatches = async () => {
  const { data, error: e } = await supabase
    .from("house_matches")
    .select("client_id")
    .neq("status", "rejected");

  if (!e) clientsWithMatches.value = new Set((data || []).map((d) => d.client_id)).size;
};

const loadMatchStats = async () => {
  const { data, error: e } = await supabase.from("house_matches").select("status");
  if (e) return;

  const counts = { suggested: 0, contacted: 0, viewed: 0, interested: 0 };
  (data || []).forEach((m) => {
    if (counts[m.status] != null) counts[m.status]++;
  });

  matchStats.value = counts;
};

const loadHousesNoInterest = async () => {
  const { data, error: e } = await supabase.from("houses").select("id");
  if (e) return;

  const houseIds = (data || []).map((h) => h.id);

  const { data: interested } = await supabase
    .from("house_matches")
    .select("house_id")
    .eq("status", "interested");

  const interestedSet = new Set((interested || []).map((i) => i.house_id));
  housesNoInterest.value = houseIds.filter((id) => !interestedSet.has(id)).length;
};

const loadAiEfficiency = async () => {
  const { data, error: e } = await supabase
    .from("house_matches")
    .select("status")
    .eq("source", "ai");

  if (e) return;

  aiEfficiency.value.suggested = (data || []).length;
  aiEfficiency.value.contacted = (data || []).filter((m) => m.status === "contacted").length;
};

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

    await loadClientsWithMatches();
    await loadMatchStats();
    await loadHousesNoInterest();
    await loadAiEfficiency();

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
    const payload = {
      address: houseForm.value.address,
      city: houseForm.value.city || null,
      price: houseForm.value.price ?? null,
      rooms: houseForm.value.rooms ?? null,
      size_m2: houseForm.value.size_m2 ?? null,
      description: houseForm.value.description || null,
      tags: parseTags(houseTagsInput.value),
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

    houseForm.value = { address: "", city: "", price: null, rooms: null, size_m2: null, description: "", tags: [] };
    houseTagsInput.value = "";
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
    loadClientsWithMatches();
    loadMatchStats();
    loadHousesNoInterest();
    loadAiEfficiency();
  };
  window.addEventListener("match-changed", handler);
  onBeforeUnmount(() => window.removeEventListener("match-changed", handler));
});
</script>
