<template>
  <div class="space-y-6" v-if="house">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">{{ house.address }}</h1>
        <div class="text-white/70 text-sm mt-1">
          {{ house.city || "—" }} • {{ house.rooms ?? "?" }} rooms • €{{ house.price ?? "—" }}
        </div>
      </div>

      <RouterLink to="/houses" class="px-3 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/10">
        Back
      </RouterLink>
    </div>

    <img
      v-if="photos.find(p => p.is_cover)"
      :src="photos.find(p => p.is_cover).url"
      class="w-full h-72 object-cover rounded-2xl border border-white/10"
    />

    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 class="font-semibold">Photos</h2>

      <div v-if="photos.length === 0" class="text-white/60 mt-3">No photos.</div>

      <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div v-for="p in photos" :key="p.id" class="rounded-xl border border-white/10 bg-zinc-950/30 overflow-hidden">
          <img :src="p.url" class="h-40 w-full object-cover transition-transform duration-200 hover:scale-[1.03]" />

          <div class="p-2 flex items-center justify-between">
            <span
              v-if="p.is_cover"
              class="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-400/30"
            >
              Cover
            </span>
            <span v-else class="text-xs text-white/50">—</span>

            <button
              class="text-xs px-2 py-1 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-40"
              @click="setCover(p.id)"
              :disabled="savingCover || p.is_cover"
            >
              {{ p.is_cover ? "Current cover" : "Set cover" }}
            </button>
          </div>
        </div>
      </div>

      <p v-if="err" class="text-sm text-red-300 mt-3">{{ err }}</p>
    </div>
  </div>

  <div v-else class="text-white/70">Loading…</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { RouterLink } from "vue-router";
import { supabase } from "../lib/supabase";

const route = useRoute();
const id = route.params.id;

const house = ref(null);
const photos = ref([]);
const err = ref("");
const savingCover = ref(false);

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
};

const setCover = async (photoId) => {
  savingCover.value = true;
  err.value = "";
  try {
    // set all to false
    const a = await supabase
      .from("house_photos")
      .update({ is_cover: false })
      .eq("house_id", id);

    if (a.error) throw a.error;

    // set selected to true
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

onMounted(load);
</script>
