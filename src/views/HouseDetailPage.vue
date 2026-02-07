<template>
  <div class="space-y-6" v-if="house">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ house.address }}
        </h1>
        <p class="text-sm text-white/60 mt-1">
          {{ house.city || "—" }}
          <span class="mx-2 text-white/30">•</span>
          {{ house.rooms ?? "?" }} rooms
          <span class="mx-2 text-white/30">•</span>
          €{{ house.price ?? "—" }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="load" :disabled="saving || savingCover">Refresh</button>
        <button
          class="px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10"
          @click="deleteHouse"
          :disabled="saving || savingCover"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Cover -->
    <div v-if="coverPhoto" class="glass-soft p-2">
      <div class="w-full h-[260px] rounded-xl overflow-hidden bg-black/30">
        <img
          :src="coverPhoto.url"
          class="w-full h-full object-cover"
          alt="Cover"
        />
      </div>
    </div>

    <!-- Main grid -->
    <div class="grid grid-cols-12 gap-6">
      <!-- LEFT: Details -->
      <section class="col-span-12 lg:col-span-8 space-y-6">
        <div class="glass p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-4">
            Details
          </h2>

          <form class="grid gap-3 md:grid-cols-2" @submit.prevent="saveHouse">
            <div class="md:col-span-2">
              <label class="text-sm text-white/60">Title</label>
              <input class="input mt-1" v-model.trim="edit.title" placeholder="Optional title" />
            </div>

            <div class="md:col-span-2">
              <label class="text-sm text-white/60">Address *</label>
              <input class="input mt-1" v-model.trim="edit.address" required />
            </div>

            <div>
              <label class="text-sm text-white/60">City</label>
              <input class="input mt-1" v-model.trim="edit.city" />
            </div>

            <div>
              <label class="text-sm text-white/60">Price (€)</label>
              <input class="input mt-1" type="number" min="0" v-model.number="edit.price" />
            </div>

            <div>
              <label class="text-sm text-white/60">Rooms</label>
              <input class="input mt-1" type="number" min="0" v-model.number="edit.rooms" />
            </div>

            <div>
              <label class="text-sm text-white/60">Size (m²)</label>
              <input class="input mt-1" type="number" min="0" v-model.number="edit.size_m2" />
            </div>

            <div class="md:col-span-2">
              <label class="text-sm text-white/60">Tags (comma separated)</label>
              <input class="input mt-1" v-model.trim="edit.tagsInput" placeholder="garden, garage, renovated" />
            </div>

            <div class="md:col-span-2 flex items-center gap-3 mt-2">
              <button class="btn" :disabled="saving">
                {{ saving ? "Saving..." : "Save changes" }}
              </button>
              <p v-if="err" class="text-sm text-red-300">{{ err }}</p>
            </div>

            <p v-if="saveMsg" class="text-xs text-emerald-400">
              Changes saved
            </p>
          </form>
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            Description
          </h2>

          <textarea
            class="textarea"
            rows="4"
            v-model.trim="edit.description"
            placeholder="Internal description"
          />
        </div>

        <div v-if="edit.tagsInput" class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            Tags
          </h2>

          <div class="flex flex-wrap gap-2">
            <span v-for="t in parseTags(edit.tagsInput)" :key="t" class="chip">
              {{ t }}
            </span>
          </div>
        </div>
      </section>

      <!-- RIGHT: Photos -->
      <aside class="col-span-12 lg:col-span-4 space-y-6">
        <div class="glass p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-white/80">
              Photos
            </h2>
            <span class="text-xs text-white/50">
              {{ photos.length }}/10
            </span>
          </div>

          <div class="flex items-center gap-2 mb-3">
            <input
              type="file"
              accept="image/*"
              multiple
              @change="onFilesChange"
              class="block w-full text-sm text-white/70"
            />
            <button
              class="btn-ghost"
              @click="uploadMorePhotos"
              :disabled="savingCover || filesToUpload.length === 0 || photos.length >= 10"
            >
              Upload
            </button>
          </div>

          <p class="text-xs text-white/50 mb-3" v-if="photos.length >= 10">
            Max 10 photos reached.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="p in photos"
              :key="p.id"
              class="rounded-xl overflow-hidden border border-white/10 bg-black/30"
            >
              <img :src="p.url" class="w-full h-24 object-cover" alt="House" />

              <div class="flex items-center justify-between px-2 py-1 text-xs">
                <button
                  class="text-white/60 hover:text-white disabled:opacity-40"
                  @click="setCover(p.id)"
                  :disabled="savingCover || p.is_cover"
                >
                  {{ p.is_cover ? "Cover" : "Set cover" }}
                </button>

                <button
                  class="text-red-300 hover:text-red-400"
                  @click="deletePhoto(p)"
                  :disabled="savingCover"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <p v-if="err" class="text-sm text-red-300 mt-3">{{ err }}</p>
        </div>

        <div class="glass-soft p-4">
          <div class="text-sm font-semibold mb-3">
            Matched clients
          </div>

          <div v-if="!matchedClients.length" class="text-xs text-white/60">
            No clients matched yet.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="m in matchedClients"
              :key="m.clients.id"
              class="flex items-center justify-between text-sm cursor-pointer hover:bg-white/5 rounded-md px-2 py-1"
              @click="$router.push(`/clients/${m.clients.id}`)"
            >
              <div class="truncate">
                {{ m.clients.full_name }}
              </div>

              <select
                v-model="m.status"
                class="text-xs bg-white/10 rounded px-2 py-0.5"
                @change="updateMatchStatus(m)"
              >
                <option value="suggested">Suggested</option>
                <option value="contacted">Contacted</option>
                <option value="viewed">Viewed</option>
                <option value="interested">Interested</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <select
              v-model="selectedClientId"
              class="input flex-1"
            >
              <option value="">Add client…</option>
              <option
                v-for="c in allClients"
                :key="c.id"
                :value="c.id"
              >
                {{ c.full_name }}
              </option>
            </select>

            <button
              class="btn-primary"
              @click="addManualMatch"
              :disabled="!selectedClientId"
            >
              Add
            </button>
          </div>
        </div>

        <div class="glass-soft p-4">
          <div class="font-semibold mb-3">Activity</div>

          <div v-if="!activity.length" class="text-xs text-white/60">
            No activity yet.
          </div>

          <div v-else class="space-y-2 text-xs">
            <div v-for="a in activity" :key="a.id">
              <span class="text-white/70">{{ a.message }}</span>
              <span class="text-white/40 ml-2">
                {{ new Date(a.created_at).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>

  <div v-else class="text-white/70">Loading…</div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const house = ref(null);
const photos = ref([]);
const err = ref("");
const savingCover = ref(false);
const saving = ref(false);
const saveMsg = ref("");
const matchedClients = ref([]);
const allClients = ref([]);
const selectedClientId = ref(null);
const activity = ref([]);

const edit = ref({
  title: "",
  address: "",
  city: "",
  price: null,
  rooms: null,
  size_m2: null,
  description: "",
  tagsInput: "",
});

const filesToUpload = ref([]);
const onFilesChange = (e) => {
  filesToUpload.value = Array.from(e.target.files || []).slice(0, 10);
};

const parseTags = (s) =>
  (s || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

const randomId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const coverPhoto = computed(() => photos.value.find(p => p.is_cover) || photos.value[0] || null);

const loadMatchedClients = async () => {
  if (!house.value?.id) return;

  const { data, error } = await supabase
    .from("house_matches")
    .select("created_at, source, status, clients(id, full_name)")
    .eq("house_id", house.value.id)
    .order("created_at", { ascending: false });

  if (!error) matchedClients.value = data || [];
};

const loadAllClients = async () => {
  const { data } = await supabase
    .from("clients")
    .select("id, full_name")
    .order("full_name");

  allClients.value = data || [];
};

const addManualMatch = async () => {
  if (!selectedClientId.value) return;

  await supabase.from("house_matches").upsert({
    house_id: house.value.id,
    client_id: selectedClientId.value,
    source: "manual",
  });

  selectedClientId.value = null;
  await loadMatchedClients();
};

const updateMatchStatus = async (m) => {
  await supabase
    .from("house_matches")
    .update({ status: m.status })
    .eq("client_id", m.clients.id)
    .eq("house_id", house.value.id);

  await supabase.from("activity_log").insert({
    entity_type: "house",
    entity_id: house.value.id,
    message: `Client marked as ${m.status}`,
  });
};

const loadActivity = async () => {
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .eq("entity_type", "house")
    .eq("entity_id", house.value.id)
    .order("created_at", { ascending: false });

  activity.value = data || [];
};

const signedUrl = async (path) => {
  const { data, error } = await supabase.storage
    .from("house-photos")
    .createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
};

const load = async () => {
  err.value = "";

  const h = await supabase
    .from("houses")
    .select("*")
    .eq("id", id)
    .single();

  if (h.error) return (err.value = h.error.message);
  house.value = h.data;

  edit.value = {
    title: house.value.title || "",
    address: house.value.address || "",
    city: house.value.city || "",
    price: house.value.price ?? null,
    rooms: house.value.rooms ?? null,
    size_m2: house.value.size_m2 ?? null,
    description: house.value.description || "",
    tagsInput: (house.value.tags || []).join(", "),
  };

  const p = await supabase
    .from("house_photos")
    .select("id, storage_path, is_cover")
    .eq("house_id", id)
    .order("created_at", { ascending: true });

  if (p.error) return (err.value = p.error.message);

  const withUrls = [];
  for (const row of p.data || []) {
    withUrls.push({
      ...row,
      url: await signedUrl(row.storage_path),
    });
  }
  photos.value = withUrls;

  await loadMatchedClients();
};

const saveHouse = async () => {
  saving.value = true;
  err.value = "";
  saveMsg.value = "";

  if (!edit.value.address?.trim()) {
    err.value = "Address is required.";
    saving.value = false;
    return;
  }

  try {
    const payload = {
      title: edit.value.title || null,
      address: edit.value.address,
      city: edit.value.city || null,
      price: edit.value.price ?? null,
      rooms: edit.value.rooms ?? null,
      size_m2: edit.value.size_m2 ?? null,
      description: edit.value.description || null,
      tags: parseTags(edit.value.tagsInput),
    };

    const { error: e } = await supabase.from("houses").update(payload).eq("id", id);
    if (e) throw e;

    saveMsg.value = "Saved ✅";
    setTimeout(() => (saveMsg.value = ""), 1500);

    await load();
  } catch (e) {
    err.value = e?.message || String(e);
  } finally {
    saving.value = false;
  }
};

const deleteHouse = async () => {
  if (!confirm("Delete this house and all photos?")) return;

  saving.value = true;
  err.value = "";

  try {
    const p = await supabase
      .from("house_photos")
      .select("storage_path")
      .eq("house_id", id);

    if (p.error) throw p.error;

    const paths = (p.data || []).map((x) => x.storage_path).filter(Boolean);

    const d = await supabase.from("houses").delete().eq("id", id);
    if (d.error) throw d.error;

    if (paths.length > 0) {
      const r = await supabase.storage.from("house-photos").remove(paths);
      if (r.error) throw r.error;
    }

    await logActivity({ type: "delete", entity: "house", entity_id: id, label: house.value?.address });

    router.push("/houses");
  } catch (e) {
    err.value = e?.message || String(e);
  } finally {
    saving.value = false;
  }
};

const uploadMorePhotos = async () => {
  savingCover.value = true;
  err.value = "";
  try {
    const remaining = Math.max(0, 10 - photos.value.length);
    const files = filesToUpload.value.slice(0, remaining);

    if (files.length === 0) return;

    const rows = [];
    for (const f of files) {
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const path = `houses/${id}/${randomId()}.${ext}`;

      const up = await supabase.storage.from("house-photos").upload(path, f, { upsert: false });
      if (up.error) throw up.error;

      rows.push({ house_id: id, storage_path: path, is_cover: false });
    }

    const ins = await supabase.from("house_photos").insert(rows);
    if (ins.error) throw ins.error;

    filesToUpload.value = [];
    await load();
  } catch (e) {
    err.value = e?.message || String(e);
  } finally {
    savingCover.value = false;
  }
};

const setCover = async (photoId) => {
  savingCover.value = true;
  err.value = "";
  try {
    const a = await supabase
      .from("house_photos")
      .update({ is_cover: false })
      .eq("house_id", id);

    if (a.error) throw a.error;

    const b = await supabase
      .from("house_photos")
      .update({ is_cover: true })
      .eq("id", photoId);

    if (b.error) throw b.error;

    await load();
  } catch (e) {
    err.value = e?.message || String(e);
  } finally {
    savingCover.value = false;
  }
};

const deletePhoto = async (p) => {
  if (!confirm("Delete this photo?")) return;

  savingCover.value = true;
  err.value = "";

  try {
    const delRow = await supabase.from("house_photos").delete().eq("id", p.id);
    if (delRow.error) throw delRow.error;

    const delFile = await supabase.storage.from("house-photos").remove([p.storage_path]);
    if (delFile.error) throw delFile.error;

    await load();
    if (p.is_cover && photos.value.length > 0) {
      await setCover(photos.value[0].id);
    }
  } catch (e) {
    err.value = e?.message || String(e);
  } finally {
    savingCover.value = false;
  }
};

onMounted(load);
onMounted(loadAllClients);
onMounted(loadActivity);
onMounted(() => {
  const handler = (e) => {
    if (e?.detail?.houseId === house.value?.id) {
      loadMatchedClients();
    }
  };
  window.addEventListener("match-changed", handler);
  onBeforeUnmount(() => window.removeEventListener("match-changed", handler));
});
</script>
