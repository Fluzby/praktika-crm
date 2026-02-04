<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-white/60 mt-1">Quick overview of your CRM</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap justify-end">
        <button class="btn" @click="showAddHouse = true">+ House</button>
        <button class="btn-ghost" @click="showAddClient = true">+ Client</button>
        <RouterLink to="/houses" class="btn-ghost">View houses</RouterLink>
        <RouterLink to="/clients" class="btn-ghost">View clients</RouterLink>
        <button class="btn-ghost" @click="load" :disabled="loading">Refresh</button>
      </div>
    </div>

    <!-- Workbench layout -->
    <div class="grid grid-cols-12 gap-6">
      <!-- LEFT: main column -->
      <section class="col-span-12 lg:col-span-8 space-y-6">
        <!-- Stats row -->
        <div class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-white/60">Overview</div>
              <div class="text-lg font-semibold mt-1">Today</div>
            </div>

            <div class="text-xs text-white/50" v-if="error">{{ error }}</div>
          </div>

          <div class="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">Clients</div>
              <div class="text-2xl font-semibold mt-1">{{ clientsCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">Total</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">Houses</div>
              <div class="text-2xl font-semibold mt-1">{{ housesCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">Total</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">Photos</div>
              <div class="text-2xl font-semibold mt-1">{{ photosCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">Stored</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">Last update</div>
              <div class="text-2xl font-semibold mt-1">{{ lastUpdated }}</div>
              <div class="text-xs text-white/45 mt-1">Local</div>
            </div>
          </div>
        </div>

        <!-- Latest listings -->
        <div class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">Latest listings</h2>
              <p class="text-sm text-white/60 mt-1">Recently added houses</p>
            </div>
            <RouterLink to="/houses" class="text-sm text-white/60 hover:text-white">
              Open →
            </RouterLink>
          </div>

          <div v-if="loading" class="mt-5 text-white/60">Loading…</div>

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
              No houses yet.
            </li>
          </ul>
        </div>
      </section>

      <!-- RIGHT: secondary column -->
      <aside class="col-span-12 lg:col-span-4 space-y-6">
        <!-- Recent clients -->
        <div class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">Recent clients</h2>
              <p class="text-sm text-white/60 mt-1">Latest contacts</p>
            </div>
            <RouterLink to="/clients" class="text-sm text-white/60 hover:text-white">
              Open →
            </RouterLink>
          </div>

          <div v-if="loading" class="mt-5 text-white/60">Loading…</div>

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
              No clients yet.
            </li>
          </ul>
        </div>

        <!-- Notes / Activity -->
        <div class="glass-soft p-6">
          <h2 class="font-semibold">Notes</h2>
          <p class="text-sm text-white/60 mt-2">
            This panel can later show tasks, reminders, or “recent changes”.
          </p>

          <div class="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
            Nothing here yet.
          </div>
        </div>
      </aside>
    </div>

    <!-- Add House modal -->
    <Modal
      :open="showAddHouse"
      title="Add house"
      subtitle="Add details and upload photos (1–10)"
      @close="showAddHouse = false"
    >
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="createHouseAndClose">
        <div class="md:col-span-2">
          <label class="text-sm text-white/60">Address *</label>
          <input class="input mt-1" v-model.trim="houseForm.address" required />
        </div>

        <div>
          <label class="text-sm text-white/60">City</label>
          <input class="input mt-1" v-model.trim="houseForm.city" />
        </div>

        <div>
          <label class="text-sm text-white/60">Price (€)</label>
          <input class="input mt-1" type="number" min="0" v-model.number="houseForm.price" />
        </div>

        <div>
          <label class="text-sm text-white/60">Rooms</label>
          <input class="input mt-1" type="number" min="0" v-model.number="houseForm.rooms" />
        </div>

        <div>
          <label class="text-sm text-white/60">Size (m²)</label>
          <input class="input mt-1" type="number" min="0" v-model.number="houseForm.size_m2" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">Tags (comma separated)</label>
          <input class="input mt-1" v-model.trim="houseTagsInput" placeholder="garden, garage, renovated" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">Description</label>
          <textarea class="textarea mt-1" rows="4" v-model.trim="houseForm.description"></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">Photos (1–10)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="onHouseFilesChange"
            class="mt-2 block w-full text-sm text-white/70"
          />
          <p class="text-xs text-white/50 mt-1" v-if="houseFiles.length">
            Selected: {{ houseFiles.length }} file(s)
          </p>
        </div>

        <div class="md:col-span-2 flex items-center gap-3 mt-2">
          <button class="btn" :disabled="creatingHouse">
            {{ creatingHouse ? "Saving..." : "Save house" }}
          </button>
          <button type="button" class="btn-ghost" @click="showAddHouse = false">Cancel</button>

          <p v-if="createHouseError" class="text-sm text-red-300">{{ createHouseError }}</p>
          <p v-if="createHouseOk" class="text-sm text-green-300">Saved ✅</p>
        </div>
      </form>
    </Modal>

    <!-- Add Client modal -->
    <Modal
      :open="showAddClient"
      title="Add client"
      subtitle="Contact details and internal notes"
      @close="showAddClient = false"
    >
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="createClientAndClose">
        <div class="md:col-span-2">
          <label class="text-sm text-white/60">Full name *</label>
          <input class="input mt-1" v-model.trim="clientForm.full_name" required />
        </div>

        <div>
          <label class="text-sm text-white/60">Phone</label>
          <input class="input mt-1" v-model.trim="clientForm.phone" />
        </div>

        <div>
          <label class="text-sm text-white/60">Email</label>
          <input class="input mt-1" type="email" v-model.trim="clientForm.email" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">Notes</label>
          <textarea class="textarea mt-1" rows="4" v-model.trim="clientForm.notes"></textarea>
        </div>

        <div class="md:col-span-2 flex items-center gap-3 mt-2">
          <button class="btn" :disabled="creatingClient">
            {{ creatingClient ? "Saving..." : "Save client" }}
          </button>
          <button type="button" class="btn-ghost" @click="showAddClient = false">Cancel</button>

          <p v-if="createClientError" class="text-sm text-red-300">{{ createClientError }}</p>
          <p v-if="createClientOk" class="text-sm text-green-300">Saved ✅</p>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal.vue";

const clientsCount = ref(null);
const housesCount = ref(null);
const photosCount = ref(null);

const recentClients = ref([]);
const recentHouses = ref([]);

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
      .limit(6);

    if (cRecent.error) throw cRecent.error;
    if (hRecent.error) throw hRecent.error;

    recentClients.value = cRecent.data || [];
    recentHouses.value = hRecent.data || [];

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

    const { error: e } = await supabase.from("clients").insert(payload);
    if (e) throw e;

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

onMounted(load);
</script>
