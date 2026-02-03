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
          <input v-model.trim="form.address" required class="input mt-1" />
        </div>

        <div>
          <label class="text-sm text-white/70">City</label>
          <input v-model.trim="form.city" class="input mt-1" />
        </div>

        <div>
          <label class="text-sm text-white/70">Price (€)</label>
          <input v-model.number="form.price" type="number" min="0" class="input mt-1" />
        </div>

        <div>
          <label class="text-sm text-white/70">Rooms</label>
          <input v-model.number="form.rooms" type="number" min="0" class="input mt-1" />
        </div>

        <div>
          <label class="text-sm text-white/70">Size (m²)</label>
          <input v-model.number="form.size_m2" type="number" min="0" class="input mt-1" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/70">Tags (comma separated)</label>
          <input v-model.trim="tagsInput" placeholder="big house, garden, garage"
            class="input mt-1" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/70">Description</label>
          <textarea v-model.trim="form.description" rows="3"
            class="textarea mt-1"></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/70">Photos (1–10)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="onFilesChange"
            class="mt-1 block w-full text-sm text-white/70"
          />
          <p class="mt-1 text-xs text-white/60" v-if="selectedFiles.length">
            Selected: {{ selectedFiles.length }} file(s)
          </p>
        </div>

        <div class="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            class="btn"
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
          <img
            v-if="coverUrls[h.id]"
            :src="coverUrls[h.id]"
            class="mb-2 h-44 w-full object-cover rounded-xl border border-white/10"
          />
          <RouterLink :to="`/houses/${h.id}`" class="font-semibold hover:underline">
            {{ h.address }}
          </RouterLink>
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
import { RouterLink } from "vue-router";
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
const selectedFiles = ref([]); // File[]
const coverUrls = ref({}); // { [houseId]: signedUrl }

const onFilesChange = (e) => {
  const files = Array.from(e.target.files || []);
  selectedFiles.value = files.slice(0, 10); // hard cap to 10
};

const randomId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const getSignedUrl = async (path) => {
  const { data, error } = await supabase.storage
    .from("house-photos")
    .createSignedUrl(path, 60 * 60); // 1 hour

  if (error) throw error;
  return data.signedUrl;
};

const parseTags = (s) =>
  (s || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const load = async () => {
  loading.value = true;
  error.value = "";

  try {
    const { data, error: e } = await supabase
      .from("houses")
      .select(`
        *,
        house_photos (
          storage_path,
          is_cover
        )
      `)
      .order("created_at", { ascending: false });

    if (e) throw e;

    houses.value = data || [];

    // Build cover URLs (signed)
    const map = {};
    for (const h of houses.value) {
      const cover = h.house_photos?.find((p) => p.is_cover) || h.house_photos?.[0];
      if (cover?.storage_path) {
        map[h.id] = await getSignedUrl(cover.storage_path);
      }
    }
    coverUrls.value = map;
  } catch (err) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
};

const createHouse = async () => {
  creating.value = true;
  createError.value = "";
  createOk.value = false;

  try {
    const payload = {
      address: form.value.address,
      city: form.value.city || null,
      price: form.value.price ?? null,
      rooms: form.value.rooms ?? null,
      size_m2: form.value.size_m2 ?? null,
      description: form.value.description || null,
      tags: parseTags(tagsInput.value),
    };

    // 1) Create the house row
    const { data: house, error: e } = await supabase
      .from("houses")
      .insert(payload)
      .select()
      .single();

    if (e) throw e;

    // 2) Upload photos (optional, but if provided: 1–10)
    const files = selectedFiles.value.slice(0, 10);
    if (files.length > 0) {
      const photoRows = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `houses/${house.id}/${randomId()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("house-photos")
          .upload(path, f, { upsert: false });

        if (uploadErr) throw uploadErr;

        photoRows.push({
          house_id: house.id,
          storage_path: path,
          is_cover: i === 0, // first photo is cover
        });
      }

      const { error: photosErr } = await supabase.from("house_photos").insert(photoRows);
      if (photosErr) throw photosErr;
    }

    // reset form
    form.value = { address: "", city: "", price: null, rooms: null, size_m2: null, description: "", tags: [] };
    tagsInput.value = "";
    selectedFiles.value = [];

    // refresh list
    await load();
    createOk.value = true;
    setTimeout(() => (createOk.value = false), 1500);
  } catch (err) {
    createError.value = err?.message || String(err);
  } finally {
    creating.value = false;
  }
};

onMounted(load);
</script>
