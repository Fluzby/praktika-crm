<template>
  <div class="p-6 space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-2xl font-bold">Houses</h1>
        <p class="text-white/70">Add houses with tags for matching later.</p>
      </div>
      <button
        class="px-3 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/10"
        @click="load"
      >
        Refresh
      </button>
    </div>

    <!-- Add House -->
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 class="font-semibold">Add house</h2>

      <form class="mt-4 grid gap-3 md:grid-cols-2" @submit.prevent="createHouse">
        <div class="md:col-span-2">
          <label class="text-sm text-white/70">Address *</label>
          <input v-model.trim="form.address" required class="mt-1 w-full rounded-xl bg-zinc-950 border border-white/10 px-3 py-2" />
        </div>

        <div>
          <label class="text-sm text-white/70">City</label>
          <input v-model.trim="form.city" class="mt-1 w-full rounded-xl bg-zinc-950 border border-white/10 px-3 py-2" />
        </div>

        <div>
          <label class="text-sm text-white/70">Price (€)</label>
          <input v-model.number="form.price" type="number" min="0" class="mt-1 w-full rounded-xl bg-zinc-950 border border-white/10 px-3 py-2" />
        </div>

        <div>
          <label class="text-sm text-white/70">Rooms</label>
          <input v-model.number="form.rooms" type="number" min="0" class="mt-1 w-full rounded-xl bg-zinc-950 border border-white/10 px-3 py-2" />
        </div>

        <div>
          <label class="text-sm text-white/70">Size (m²)</label>
          <input v-model.number="form.size_m2" type="number" min="0" class="mt-1 w-full rounded-xl bg-zinc-950 border border-white/10 px-3 py-2" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/70">Tags (comma separated)</label>
          <input v-model.trim="tagsInput" placeholder="big house, garden, garage"
            class="mt-1 w-full rounded-xl bg-zinc-950 border border-white/10 px-3 py-2" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/70">Description</label>
          <textarea v-model.trim="form.description" rows="3"
            class="mt-1 w-full rounded-xl bg-zinc-950 border border-white/10 px-3 py-2"></textarea>
        </div>

        <div class="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            :disabled="creating"
          >
            {{ creating ? "Saving..." : "Save house" }}
          </button>
          <p v-if="createError" class="text-sm text-red-300">{{ createError }}</p>
          <p v-if="createOk" class="text-sm text-green-300">Saved ✅</p>
        </div>
      </form>
    </div>

    <!-- List -->
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div v-if="loading" class="text-white/70">Loading…</div>
      <div v-else-if="error" class="text-red-300">{{ error }}</div>

      <ul v-else class="space-y-2">
        <li v-for="h in houses" :key="h.id" class="rounded-xl border border-white/10 bg-white/5 p-3">
          <div class="font-semibold">{{ h.address }}</div>
          <div class="text-sm text-white/70">
            {{ h.city || "—" }} • {{ h.rooms ?? "?" }} rooms • €{{ h.price ?? "—" }}
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="t in (h.tags || [])" :key="t" class="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
              {{ t }}
            </span>
          </div>
        </li>

        <li v-if="houses.length === 0" class="text-white/60">
          No houses yet.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabase";

const houses = ref([]);
const loading = ref(false);
const error = ref("");

const creating = ref(false);
const createError = ref("");
const createOk = ref(false);

const form = ref({
  address: "",
  city: "",
  price: null,
  rooms: null,
  size_m2: null,
  description: "",
  tags: [],
});

const tagsInput = ref("");

const parseTags = (s) =>
  (s || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const load = async () => {
  loading.value = true;
  error.value = "";
  const { data, error: e } = await supabase
    .from("houses")
    .select("*")
    .order("created_at", { ascending: false });
  if (e) error.value = e.message;
  houses.value = data || [];
  loading.value = false;
};

const createHouse = async () => {
  creating.value = true;
  createError.value = "";
  createOk.value = false;

  const payload = {
    address: form.value.address,
    city: form.value.city || null,
    price: form.value.price ?? null,
    rooms: form.value.rooms ?? null,
    size_m2: form.value.size_m2 ?? null,
    description: form.value.description || null,
    tags: parseTags(tagsInput.value),
  };

  const { error: e } = await supabase.from("houses").insert(payload);
  if (e) {
    createError.value = e.message;
  } else {
    createOk.value = true;
    form.value = { address: "", city: "", price: null, rooms: null, size_m2: null, description: "", tags: [] };
    tagsInput.value = "";
    await load();
    setTimeout(() => (createOk.value = false), 1500);
  }

  creating.value = false;
};

onMounted(load);
</script>
