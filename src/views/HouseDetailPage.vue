<template>
  <div class="space-y-6" v-if="house">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ house.address }}
        </h1>
        <p class="text-sm text-white/60 mt-1">
          {{ house.city || "—" }}
          <span class="mx-2 text-white/30">•</span>
          {{ house.rooms ?? "?" }} {{ t.rooms }}
          <span class="mx-2 text-white/30">•</span>
          €{{ house.price ?? "—" }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="load" :disabled="saving || savingCover">{{ t.refresh }}</button>
        <button
          class="px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10"
          @click="deleteHouse"
          :disabled="saving || savingCover"
        >
          {{ t.delete }}
        </button>
      </div>
    </div>

    <div v-if="coverPhoto" class="glass-soft p-2">
      <div class="w-full h-[260px] rounded-xl overflow-hidden bg-black/30">
        <img
          :src="coverPhoto.url"
          class="w-full h-full object-cover"
          :alt="t.cover"
        />
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <section class="col-span-12 lg:col-span-8 space-y-6">
        <div class="glass p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-4">
            {{ t.details }}
          </h2>

          <form class="grid gap-3 md:grid-cols-2" @submit.prevent="saveHouse">
            <div class="md:col-span-2">
              <label class="text-sm text-white/60">{{ t.title }}</label>
              <input class="input mt-1" v-model.trim="edit.title" :placeholder="t.optional_title" />
            </div>

            <div class="md:col-span-2">
              <label class="text-sm text-white/60">{{ t.address }} *</label>
              <input class="input mt-1" v-model.trim="edit.address" required />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.city }}</label>
              <input class="input mt-1" v-model.trim="edit.city" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.price }}</label>
              <input class="input mt-1" type="number" min="0" v-model.number="edit.price" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.rooms }}</label>
              <input class="input mt-1" type="number" min="0" v-model.number="edit.rooms" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.size_m2 }}</label>
              <input class="input mt-1" type="number" min="0" v-model.number="edit.size_m2" />
            </div>

            <div class="md:col-span-2">
              <label class="text-sm text-white/60">{{ t.tags }}</label>
              <input class="input mt-1" v-model.trim="edit.tagsInput" :placeholder="t.tags_placeholder" />
            </div>

            <div class="md:col-span-2 flex items-center gap-3 mt-2">
              <button class="btn" :disabled="saving">
                {{ saving ? t.saving : t.save_changes }}
              </button>
              <p v-if="err" class="text-sm text-red-300">{{ err }}</p>
            </div>

            <p v-if="saveMsg" class="text-xs text-emerald-400">
              {{ t.changes_saved }}
            </p>
          </form>
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            {{ t.description }}
          </h2>

          <textarea
            class="textarea"
            rows="4"
            v-model.trim="edit.description"
            :placeholder="t.internal_description"
          />
        </div>

        <div v-if="edit.tagsInput" class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            {{ t.tags }}
          </h2>

          <div class="flex flex-wrap gap-2">
            <span v-for="t in parseTags(edit.tagsInput)" :key="t" class="chip">
              {{ t }}
            </span>
          </div>
        </div>
      </section>

      <aside class="col-span-12 lg:col-span-4 space-y-6">
        <div class="glass p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-white/80">
              {{ t.photos }}
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
              {{ t.upload }}
            </button>
          </div>

          <p class="text-xs text-white/50 mb-3" v-if="photos.length >= 10">
            {{ t.max_photos_reached }}
          </p>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="p in photos"
              :key="p.id"
              class="rounded-xl overflow-hidden border border-white/10 bg-black/30"
            >
              <img :src="p.url" class="w-full h-24 object-cover" :alt="t.house" />

              <div class="flex items-center justify-between px-2 py-1 text-xs">
                <button
                  class="text-white/60 hover:text-white disabled:opacity-40"
                  @click="setCover(p.id)"
                  :disabled="savingCover || p.is_cover"
                >
                  {{ p.is_cover ? t.cover : t.set_cover }}
                </button>

                <button
                  class="text-red-300 hover:text-red-400"
                  @click="deletePhoto(p)"
                  :disabled="savingCover"
                >
                  {{ t.delete }}
                </button>
              </div>
            </div>
          </div>

          <p v-if="err" class="text-sm text-red-300 mt-3">{{ err }}</p>
        </div>

        <div class="glass-soft p-4">
          <div class="text-sm font-semibold mb-3">
            {{ t.matched_clients }}
          </div>

          <div v-if="!matchedClients.length" class="text-xs text-white/60">
            {{ t.no_matched_clients }}
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
                @click.stop
                @change.stop="updateMatchStatus(m)"
              >
                <option value="suggested">{{ t.suggested }}</option>
                <option value="contacted">{{ t.contacted }}</option>
                <option value="viewed">{{ t.viewed }}</option>
                <option value="interested">{{ t.interested }}</option>
                <option value="rejected">{{ t.rejected }}</option>
              </select>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <select
              v-model="selectedClientId"
              class="input flex-1"
            >
              <option value="">{{ t.add_client_placeholder }}</option>
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
              {{ t.add }}
            </button>
          </div>
        </div>

        <div class="glass-soft p-4">
          <div class="font-semibold mb-3">{{ t.activity }}</div>

          <div v-if="!activity.length" class="text-xs text-white/60">
            {{ t.no_activity }}
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

  <div v-else class="text-white/70">{{ t.loading }}</div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import { useT } from "../lib/i18n";

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

const t = useT();

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

const statusLabel = (s) => {
  const map = {
    suggested: t.value.suggested,
    contacted: t.value.contacted,
    viewed: t.value.viewed,
    interested: t.value.interested,
    rejected: t.value.rejected,
  };
  return map[s] || s;
};

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
    message: `${t.value.client_marked_as} ${statusLabel(m.status)}`,
  });
};

const loadActivity = async () => {
  if (!house.value?.id) return;

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("entity", "house")
    .eq("entity_id", house.value.id)
    .order("created_at", { ascending: false });

  if (!error) activity.value = data || [];
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
  await loadActivity();
};

const saveHouse = async () => {
  saving.value = true;
  err.value = "";
  saveMsg.value = "";

  if (!edit.value.address?.trim()) {
    err.value = t.value.address_required;
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

    saveMsg.value = t.value.saved;
    setTimeout(() => (saveMsg.value = ""), 1500);

    await load();
  } catch (e) {
    err.value = e?.message || String(e);
  } finally {
    saving.value = false;
  }
};

const deleteHouse = async () => {
  if (!confirm(t.value.delete_house_confirm)) return;

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
  if (!confirm(t.value.delete_photo_confirm)) return;

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
onMounted(() => {
  const handler = (e) => {
    if (!house.value?.id) return;
    if (e?.detail?.houseId === house.value.id) {
      loadMatchedClients();
      loadActivity();
    }
  };
  window.addEventListener("match-changed", handler);
  onBeforeUnmount(() => window.removeEventListener("match-changed", handler));
});
</script>
