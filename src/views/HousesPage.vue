<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ t.houses }}</h1>
        <p class="text-white/60 mt-1">{{ t.houses_subtitle }}</p>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="load" :disabled="loading">{{ t.refresh }}</button>
        <button class="btn" @click="showAdd = true">+ {{ t.add }}</button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="glass p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="flex-1">
          <input
            class="input"
            :placeholder="t.search_houses_placeholder"
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

    <!-- List -->
    <div class="space-y-3">
      <div v-if="loading" class="text-white/60">{{ t.loading }}</div>
      <div v-else-if="error" class="text-red-300">{{ error }}</div>

      <ul v-else class="space-y-3">
        <li
          v-for="h in filtered"
          :key="h.id"
          class="glass-soft p-4 hover:bg-white/[0.05] transition cursor-pointer"
          @click="openHouse(h.id)"
        >
          <div class="flex gap-4">
            <!-- Thumb -->
            <div class="w-28 h-20 rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0">
              <img
                v-if="coverUrls[h.id]"
                :src="coverUrls[h.id]"
                class="w-full h-full object-cover"
                :alt="t.house"
              />
              <div v-else class="w-full h-full grid place-items-center text-white/30 text-sm">
                {{ t.no_photo }}
              </div>
            </div>

            <!-- Content -->
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-semibold truncate">
                    {{ h.address }}
                  </div>
                  <div class="text-sm text-white/60 mt-1">
                    {{ h.city || "—" }}
                    <span class="mx-2 text-white/30">•</span>
                    {{ h.rooms ?? "?" }} {{ t.rooms }}
                    <span class="mx-2 text-white/30">•</span>
                    €{{ h.price ?? "—" }}
                    <span v-if="h.size_m2" class="mx-2 text-white/30">•</span>
                    <span v-if="h.size_m2">{{ h.size_m2 }} m²</span>
                  </div>
                </div>

                <div class="text-xs text-white/45 whitespace-nowrap">
                  {{ formatDate(h.created_at) }}
                </div>
              </div>

              <!-- Tags -->
              <div v-if="(h.tags || []).length" class="mt-3 flex flex-wrap gap-2">
                <span v-for="t in h.tags" :key="t" class="chip">
                  {{ t }}
                </span>
              </div>
            </div>
          </div>
        </li>

        <li v-if="filtered.length === 0" class="text-white/60">
          {{ t.no_houses_found }}
        </li>
      </ul>
    </div>

    <!-- Add modal -->
    <Modal
      :open="showAdd"
      :title="t.add_house"
      :subtitle="t.add_house_subtitle"
      @close="showAdd = false"
    >
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="createHouseAndClose">
        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.address }} *</label>
          <input class="input mt-1" v-model.trim="form.address" required />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.city }}</label>
          <input class="input mt-1" v-model.trim="form.city" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.price }}</label>
          <input class="input mt-1" type="number" min="0" v-model.number="form.price" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.rooms }}</label>
          <input class="input mt-1" type="number" min="0" v-model.number="form.rooms" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.size_m2 }}</label>
          <input class="input mt-1" type="number" min="0" v-model.number="form.size_m2" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.tags }}</label>
          <input class="input mt-1" v-model.trim="tagsInput" :placeholder="t.tags_placeholder" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.description }}</label>
          <textarea class="textarea mt-1" rows="4" v-model.trim="form.description"></textarea>
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.photos }} (1–10)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="onFilesChange"
            class="mt-2 block w-full text-sm text-white/70"
          />
          <p class="text-xs text-white/50 mt-1" v-if="selectedFiles.length">
            {{ t.selected_files }}: {{ selectedFiles.length }} {{ t.files }}
          </p>
        </div>

        <div class="md:col-span-2 flex items-center gap-3 mt-2">
          <button class="btn" :disabled="creating">
            {{ creating ? t.saving : t.save }}
          </button>
          <button type="button" class="btn-ghost" @click="showAdd = false">{{ t.cancel }}</button>

          <p v-if="createError" class="text-sm text-red-300">{{ createError }}</p>
          <p v-if="createOk" class="text-sm text-green-300">{{ t.saved }}</p>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import Modal from "../components/Modal.vue";
import { useT } from "../lib/i18n";

const router = useRouter();

const houses = ref([]);
const coverUrls = ref({});

const loading = ref(false);
const error = ref("");

const q = ref("");
const showAdd = ref(false);

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
const selectedFiles = ref([]);

const t = useT();

const onFilesChange = (e) => {
  selectedFiles.value = Array.from(e.target.files || []).slice(0, 10);
};

const parseTags = (s) =>
  (s || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
};

const getSignedUrl = async (path) => {
  const { data, error } = await supabase.storage
    .from("house-photos")
    .createSignedUrl(path, 60 * 60);

  if (error) throw error;
  return data.signedUrl;
};

const openHouse = (id) => router.push(`/houses/${id}`);

const filtered = computed(() => {
  const term = q.value.toLowerCase();
  if (!term) return houses.value;

  return houses.value.filter((h) => {
    const hay = [
      h.address,
      h.city,
      ...(h.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(term);
  });
});

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

    const { data: house, error: e } = await supabase
      .from("houses")
      .insert(payload)
      .select()
      .single();

    if (e) throw e;

    await logActivity({ type: "create", entity: "house", entity_id: house.id, label: house.address });

    const files = selectedFiles.value.slice(0, 10);
    if (files.length) {
      const rows = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `houses/${house.id}/${crypto.randomUUID?.() || Date.now()}-${i}.${ext}`;

        const up = await supabase.storage.from("house-photos").upload(path, f, { upsert: false });
        if (up.error) throw up.error;

        rows.push({ house_id: house.id, storage_path: path, is_cover: i === 0 });
      }

      const ins = await supabase.from("house_photos").insert(rows);
      if (ins.error) throw ins.error;
    }

    form.value = { address: "", city: "", price: null, rooms: null, size_m2: null, description: "", tags: [] };
    tagsInput.value = "";
    selectedFiles.value = [];

    await load();
    createOk.value = true;
    setTimeout(() => (createOk.value = false), 1200);
  } catch (err) {
    createError.value = err?.message || String(err);
  } finally {
    creating.value = false;
  }
};

const createHouseAndClose = async () => {
  await createHouse();
  if (!createError.value) showAdd.value = false;
};

onMounted(load);
</script>
