<template>
  <div class="space-y-6">
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

    <div class="glass p-4">
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <select class="input !w-auto min-w-[180px]" v-model="pipelineFilter">
            <option value="">All property stages</option>
            <option v-for="s in HOUSE_PIPELINE" :key="s" :value="s">
              {{ HOUSE_PIPELINE_LABELS[s] }}
            </option>
          </select>
          <select class="input !w-auto min-w-[180px]" v-model="availabilityFilter">
            <option value="">All availability</option>
            <option value="entering">{{ t.availability_entering }}</option>
            <option value="available">{{ t.availability_available }}</option>
            <option value="unavailable">{{ t.availability_unavailable }}</option>
          </select>
          <input class="input !w-auto min-w-[180px]" v-model.trim="newSavedViewName" placeholder="Saved view name" />
          <button class="btn-ghost" type="button" @click="saveCurrentView" :disabled="!newSavedViewName">
            Save View
          </button>
        </div>

        <div v-if="savedViews.length" class="flex flex-wrap gap-2">
          <button
            v-for="view in savedViews"
            :key="view.name"
            type="button"
            class="chip hover:bg-white/[0.08]"
            @click="applySavedView(view)"
          >
            {{ view.name }}
          </button>
          <button class="btn-ghost text-xs" type="button" @click="clearFilters">Reset Filters</button>
        </div>

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
    </div>

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
                  <div>{{ formatDate(h.created_at) }}</div>
                  <div class="mt-2">
                    <span
                      class="chip inline-flex items-center gap-2 pr-7 relative"
                      :style="availabilityChipStyle(h.availability)"
                      @click.stop
                    >
                      <span class="h-2 w-2 rounded-full" :style="{ background: availabilityColor(h.availability) }"></span>
                      <select
                        class="bg-transparent appearance-none outline-none border-0 p-0 m-0 text-xs cursor-pointer"
                        v-model="h.availability"
                        @focus="h._prevAvailability = h.availability || 'entering'"
                        @click.stop
                        @change.stop="updateAvailability(h)"
                        :disabled="savingAvailability[h.id]"
                      >
                        <option value="entering">{{ t.availability_entering }}</option>
                        <option value="available">{{ t.availability_available }}</option>
                        <option value="unavailable">{{ t.availability_unavailable }}</option>
                      </select>
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none">
                        ▾
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="(h.tags || []).length" class="mt-3 flex flex-wrap gap-2">
                <span class="chip">{{ houseStageLabel(h.id) }}</span>
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

    <teleport to="body">
      <div
        v-if="showAdd"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown.esc="closeAdd"
        tabindex="-1"
      >
        <div
          class="absolute inset-0 modal-backdrop"
          :class="settings.aiModalStrong ? 'modal-backdrop-strong' : ''"
          @click="closeAdd"
        ></div>

        <div
          class="relative modal-panel rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          :class="settings.aiModalStrong ? 'modal-panel-strong' : ''"
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
              @click="closeAdd"
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
              <div class="glass-soft p-4 rounded-xl">
                <h3 class="text-sm font-semibold mb-3">
                  {{ t.availability }}
                </h3>
                <select class="input" v-model="newHouse.availability">
                  <option value="entering">{{ t.availability_entering }}</option>
                  <option value="available">{{ t.availability_available }}</option>
                  <option value="unavailable">{{ t.availability_unavailable }}</option>
                </select>
              </div>

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
                  @change="onFilesChange"
                  class="block w-full text-sm text-white/70"
                />
                <p class="text-xs text-white/50 mt-2" v-if="selectedFiles.length">
                  {{ t.selected_files }}: {{ selectedFiles.length }} {{ t.files }}
                </p>
              </div>
            </form>
          </div>

          <div class="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-2">
            <p v-if="createError" class="text-sm text-red-300 mr-auto">{{ createError }}</p>
            <p v-else-if="createOk" class="text-sm text-green-300 mr-auto">{{ t.saved }}</p>

            <button class="btn-ghost" type="button" @click="closeAdd">
              {{ t.cancel }}
            </button>
            <button class="btn" type="submit" form="add-house-form" :disabled="creating">
              {{ creating ? t.saving : t.save }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import { useT } from "../lib/i18n";
import { HOUSE_FIELD_GROUPS } from "@/config/houseFields.en";
import { settings } from "../lib/settings";
import {
  HOUSE_PIPELINE,
  HOUSE_PIPELINE_LABELS,
  getHouseStage,
  getSavedViews,
  saveView,
} from "../lib/crmEnhancements";

const router = useRouter();

const houses = ref([]);
const coverUrls = ref({});

const loading = ref(false);
const error = ref("");

const q = ref("");
const pipelineFilter = ref("");
const availabilityFilter = ref("");
const newSavedViewName = ref("");
const showAdd = ref(false);

const creating = ref(false);
const createError = ref("");
const createOk = ref(false);

const newHouse = ref({
  raw_data: {},
  availability: "entering",
  description: "",
  tagsInput: "",
});
const fieldSearch = ref("");
const selectedFiles = ref([]);

const t = useT();
const savedViews = ref([]);

const houseStageLabel = (houseId) => HOUSE_PIPELINE_LABELS[getHouseStage(houseId)] || "New Listing";

const reloadSavedViews = () => {
  savedViews.value = getSavedViews("houses");
};

const saveCurrentView = () => {
  saveView("houses", {
    name: newSavedViewName.value.trim(),
    q: q.value,
    pipelineFilter: pipelineFilter.value,
    availabilityFilter: availabilityFilter.value,
  });
  newSavedViewName.value = "";
  reloadSavedViews();
};

const applySavedView = (view) => {
  q.value = view.q || "";
  pipelineFilter.value = view.pipelineFilter || "";
  availabilityFilter.value = view.availabilityFilter || "";
};

const clearFilters = () => {
  q.value = "";
  pipelineFilter.value = "";
  availabilityFilter.value = "";
};

const groupLabel = (group) => (settings.lang === "et" ? (group.label_et || group.label) : group.label);
const fieldLabel = (field) => (settings.lang === "et" ? (field.label_et || field.label) : field.label);

const onFilesChange = (e) => {
  selectedFiles.value = Array.from(e.target.files || []).slice(0, 10);
};

const parseTags = (s) =>
  (s || "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

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
watch(showAdd, (open) => {
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

const closeAdd = () => {
  fieldSearch.value = "";
  showAdd.value = false;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
};

const availabilityColor = (a) => {
  const map = {
    available: "#10b981",
    unavailable: "#ef4444",
    entering: "#f59e0b",
  };
  return map[a] || map.entering;
};

const availabilityChipStyle = (a) => {
  const c = availabilityColor(a);
  return {
    backgroundColor: `${c}22`, // ~13% alpha
    borderColor: `${c}66`, // ~40% alpha
  };
};

const availabilityLabel = (a) => {
  const map = {
    available: t.value.availability_available,
    unavailable: t.value.availability_unavailable,
    entering: t.value.availability_entering,
  };
  return map[a] || t.value.availability_entering;
};

const savingAvailability = ref({});

const updateAvailability = async (h) => {
  const next = h.availability || "entering";
  const prev = h._prevAvailability || "entering";
  savingAvailability.value = { ...savingAvailability.value, [h.id]: true };

  try {
    const { error: e } = await supabase
      .from("houses")
      .update({ availability: next })
      .eq("id", h.id);
    if (e) throw e;
    h._prevAvailability = next;
  } catch (e) {
    error.value = e?.message || String(e);
    h.availability = prev;
    h._prevAvailability = prev;
  } finally {
    savingAvailability.value = { ...savingAvailability.value, [h.id]: false };
  }
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
    if (availabilityFilter.value && (h.availability || "entering") !== availabilityFilter.value) return false;
    if (pipelineFilter.value && getHouseStage(h.id) !== pipelineFilter.value) return false;
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
    const raw = newHouse.value.raw_data || {};
    const payload = {
      external_id: cleanStr(raw["ID"]) || null,
      deal_type: cleanStr(raw["Tehing"]) || null,
      object_type: cleanStr(raw["Objekti liik"]) || null,
      availability: newHouse.value.availability || "entering",
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

    newHouse.value = { raw_data: {}, availability: "entering", description: "", tagsInput: "" };
    fieldSearch.value = "";
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
  if (!createError.value) closeAdd();
};

onMounted(load);
onMounted(reloadSavedViews);
</script>
