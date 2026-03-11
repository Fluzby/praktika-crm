<template>
  <div class="space-y-6">
    <div class="glass p-4 records-surface">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="flex-1">
          <input
            class="input"
            :placeholder="t.search_houses_placeholder"
            v-model.trim="q"
          />
        </div>

        <div class="flex items-center gap-2">
          <select class="input w-[170px]" v-model="propertyKind">
            <option value="all">{{ t.property_type_all }}</option>
            <option value="apartment">{{ t.property_type_apartment }}</option>
            <option value="house">{{ t.property_type_house }}</option>
          </select>
          <select class="input w-[170px]" v-model="dealKind">
            <option value="all">{{ t.property_deal_all }}</option>
            <option value="sale">{{ t.property_deal_sale }}</option>
            <option value="rent">{{ t.property_deal_rent }}</option>
          </select>
          <select class="input w-[170px]" v-model="availabilityKind">
            <option value="all">{{ t.property_type_all }}</option>
            <option value="entering">{{ t.availability_entering }}</option>
            <option value="available">{{ t.availability_available }}</option>
            <option value="unavailable">{{ t.availability_unavailable }}</option>
          </select>
          <select class="input w-[200px]" v-model="sortBy">
            <option value="default">{{ t.sort_default }}</option>
            <option value="name_asc">{{ t.sort_name_az }}</option>
            <option value="name_desc">{{ t.sort_name_za }}</option>
            <option value="price_desc">{{ t.sort_price_high_low }}</option>
            <option value="price_asc">{{ t.sort_price_low_high }}</option>
          </select>
          <button class="btn-ghost" @click="resetFilters" :disabled="!hasActiveFilters">{{ t.clear }}</button>
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

      <div v-else class="glass-soft overflow-hidden records-surface records-table-surface">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1180px] text-sm" :class="selectionMode ? 'select-none' : ''">
            <thead class="bg-white/[0.02] border-b border-white/10">
              <tr class="text-left text-xs uppercase tracking-[0.08em] text-white/50">
                <th v-if="selectionMode" class="px-4 py-3 font-medium w-10">
                  <input
                    type="checkbox"
                    :checked="allVisibleHousesSelected"
                    @change="toggleSelectAllVisibleHouses"
                  />
                </th>
                <th class="px-4 py-3 font-medium">{{ t.address }}</th>
                <th class="px-4 py-3 font-medium">{{ t.city }}</th>
                <th class="px-4 py-3 font-medium">{{ t.availability }}</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">{{ t.rooms }}</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">{{ t.size_m2 }}</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">{{ t.price }}</th>
                <th class="px-4 py-3 font-medium">{{ t.tags }}</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">{{ t.created }}</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap text-right">{{ t.actions }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(h, index) in filtered"
                :key="h.id"
                :data-kb-index="index"
                class="border-b border-white/8 last:border-b-0 hover:bg-white/[0.03] cursor-pointer align-top"
                :class="settings.proKeyboardMode && keyboardIndex === index ? 'bg-white/[0.07]' : ''"
                @mousedown="selectionMode && $event.shiftKey && $event.preventDefault()"
                @click="selectionMode ? onHouseSelectInteraction(h.id, index, $event) : openHouse(h.id)"
              >
                <td v-if="selectionMode" class="px-4 py-3" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isHouseSelected(h.id)"
                    @change="onHouseSelectInteraction(h.id, index, $event)"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="font-semibold text-white truncate max-w-[260px]">{{ h.address }}</div>
                </td>
                <td class="px-4 py-3 text-white/75 whitespace-nowrap">{{ h.city || "—" }}</td>
                <td class="px-4 py-3" @click.stop>
                  <span
                    class="chip inline-flex items-center gap-2 pr-7 relative whitespace-nowrap"
                    :style="availabilityChipStyle(h.availability)"
                  >
                    <span class="h-2 w-2 rounded-full" :style="{ background: availabilityColor(h.availability) }"></span>
                    <select
                      class="bg-transparent appearance-none outline-none border-0 p-0 m-0 text-xs cursor-pointer"
                      v-model="h.availability"
                      @focus="h._prevAvailability = h.availability || 'entering'"
                      @click.stop
                      @change.stop="stageAvailabilityChange(h)"
                      :disabled="savingAvailability[h.id]"
                    >
                      <option value="entering">{{ t.availability_entering }}</option>
                      <option value="available">{{ t.availability_available }}</option>
                      <option value="unavailable">{{ t.availability_unavailable }}</option>
                    </select>
                    <span class="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none">▾</span>
                  </span>
                </td>
                <td class="px-4 py-3 text-white/75 tabular-nums whitespace-nowrap">{{ h.rooms ?? "—" }}</td>
                <td class="px-4 py-3 text-white/75 tabular-nums whitespace-nowrap">{{ h.size_m2 ? `${h.size_m2} m²` : "—" }}</td>
                <td class="px-4 py-3 text-white/85 tabular-nums whitespace-nowrap">€{{ h.price ?? "—" }}</td>
                <td class="px-4 py-3 text-white/60">
                  <div v-if="normalizeTagList(h.tags).length" class="flex max-w-[260px] flex-wrap gap-1.5">
                    <span
                      v-for="tag in normalizeTagList(h.tags).slice(0, 2)"
                      :key="tag"
                      class="chip"
                    >
                      {{ tag }}
                    </span>
                    <span
                      v-if="normalizeTagList(h.tags).length > 2"
                      class="chip"
                    >
                      +{{ normalizeTagList(h.tags).length - 2 }}
                    </span>
                  </div>
                  <div v-else>—</div>
                </td>
                <td class="px-4 py-3 text-white/50 whitespace-nowrap">{{ formatDate(h.created_at) }}</td>
                <td class="px-4 py-3 text-right" @click.stop>
                  <RowActionsMenu
                    v-if="!selectionMode"
                    :archived="!!h.is_archived"
                    @archive="onArchiveHouse(h)"
                    @delete="onDeleteHouse(h)"
                  />
                </td>
              </tr>

              <tr v-if="filtered.length === 0">
                <td :colspan="selectionMode ? 10 : 9" class="px-4 py-8 text-center text-white/60">
                  {{ t.no_houses_found }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
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
                ref="fieldSearchInputEl"
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
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import { useT } from "../lib/i18n";
import RowActionsMenu from "../components/RowActionsMenu.vue";
import { HOUSE_FIELD_GROUPS } from "@/config/houseFields.en";
import { settings } from "../lib/settings";
import { archiveEntity } from "../lib/entityActions";
import { useTopbarActions } from "../lib/topbarActions";
import { normalizeTagList, parseTagsInput } from "../lib/tags";

const router = useRouter();

const houses = ref([]);
const loading = ref(false);
const error = ref("");

const q = ref("");
const showAdd = ref(false);
const propertyKind = ref("all");
const dealKind = ref("all");
const availabilityKind = ref("all");
const sortBy = ref("default");
const selectionMode = ref(false);
const selectedHouseIds = ref([]);
const bulkAvailability = ref("available");
const bulkBusy = ref(false);
const lastHouseSelectionIndex = ref(null);
const availabilityDrafts = ref({});

const creating = ref(false);
const createError = ref("");
const createOk = ref(false);
const keyboardIndex = ref(-1);
const fieldSearchInputEl = ref(null);

const newHouse = ref({
  raw_data: {},
  availability: "entering",
  description: "",
  tagsInput: "",
});
const fieldSearch = ref("");
const selectedFiles = ref([]);

const t = useT();

const groupLabel = (group) => (settings.lang === "et" ? (group.label_et || group.label) : group.label);
const fieldLabel = (field) => (settings.lang === "et" ? (field.label_et || field.label) : field.label);

const onFilesChange = (e) => {
  selectedFiles.value = Array.from(e.target.files || []).slice(0, 10);
};

const hasActiveFilters = computed(() =>
  q.value.trim().length > 0
  || propertyKind.value !== "all"
  || dealKind.value !== "all"
  || availabilityKind.value !== "all"
  || sortBy.value !== "default"
);

const resetFilters = () => {
  q.value = "";
  propertyKind.value = "all";
  dealKind.value = "all";
  availabilityKind.value = "all";
  sortBy.value = "default";
};

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
const pendingAvailabilityCount = computed(() => Object.keys(availabilityDrafts.value).length);

const stageAvailabilityChange = (h) => {
  const next = h.availability || "entering";
  const prev = h._prevAvailability || "entering";

  if (
    selectionMode.value &&
    selectedHouseIds.value.length > 1 &&
    selectedHouseIdSet.value.has(h.id)
  ) {
    // In multi-select, changing one selected row's availability applies to all selected rows.
    applyAvailabilityToSelected(next);
    return;
  }

  if (next === prev) {
    const { [h.id]: _remove, ...rest } = availabilityDrafts.value;
    availabilityDrafts.value = rest;
    return;
  }
  availabilityDrafts.value = { ...availabilityDrafts.value, [h.id]: next };
};

const applyAvailabilityToSelected = (nextAvailability) => {
  if (!selectedHouseIds.value.length) return;
  const nextDrafts = { ...availabilityDrafts.value };
  for (const id of selectedHouseIds.value) {
    const row = houses.value.find((h) => h.id === id);
    if (!row) continue;
    row.availability = nextAvailability;
    const prev = row._prevAvailability || "entering";
    if (nextAvailability === prev) {
      delete nextDrafts[id];
    } else {
      nextDrafts[id] = nextAvailability;
    }
  }
  availabilityDrafts.value = nextDrafts;
};

const saveAvailabilityChanges = async () => {
  const entries = Object.entries(availabilityDrafts.value);
  if (!entries.length) return;
  bulkBusy.value = true;
  error.value = "";
  try {
    for (const [id, availability] of entries) {
      savingAvailability.value = { ...savingAvailability.value, [id]: true };
      const { error: e } = await supabase
        .from("houses")
        .update({ availability })
        .eq("id", id);
      if (e) throw e;
      const row = houses.value.find((h) => h.id === id);
      if (row) row._prevAvailability = availability;
      savingAvailability.value = { ...savingAvailability.value, [id]: false };
    }
    availabilityDrafts.value = {};
    if (selectionMode.value) {
      selectionMode.value = false;
      selectedHouseIds.value = [];
      lastHouseSelectionIndex.value = null;
    }
  } catch (e) {
    error.value = e?.message || String(e);
    for (const [id] of entries) {
      const row = houses.value.find((h) => h.id === id);
      if (!row) continue;
      row.availability = row._prevAvailability || "entering";
      savingAvailability.value = { ...savingAvailability.value, [id]: false };
    }
  } finally {
    bulkBusy.value = false;
  }
};

const openHouse = (id) => router.push(`/houses/${id}`);

const isTypingContext = (target) => {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return !!target.closest('[contenteditable="true"]');
};

const onKeydown = (e) => {
  if (settings.proKeyboardMode && !isTypingContext(e.target) && !showAdd.value) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      if (!selectionMode.value) toggleSelectionMode();
      toggleSelectAllVisibleHouses();
      return;
    }
    if (!e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!filtered.value.length) return;
        keyboardIndex.value = Math.min(
          filtered.value.length - 1,
          keyboardIndex.value < 0 ? 0 : keyboardIndex.value + 1
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!filtered.value.length) return;
        keyboardIndex.value = Math.max(0, keyboardIndex.value < 0 ? 0 : keyboardIndex.value - 1);
        return;
      }
      if (e.key === " " && keyboardIndex.value >= 0 && keyboardIndex.value < filtered.value.length) {
        e.preventDefault();
        const row = filtered.value[keyboardIndex.value];
        if (!selectionMode.value) toggleSelectionMode();
        onHouseSelectInteraction(row.id, keyboardIndex.value, { shiftKey: false });
        return;
      }
      if (e.key === "Enter" && !selectionMode.value && keyboardIndex.value >= 0 && keyboardIndex.value < filtered.value.length) {
        e.preventDefault();
        openHouse(filtered.value[keyboardIndex.value].id);
        return;
      }
    }
  }

  if (!settings.shortcuts) return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  if (isTypingContext(e.target)) return;
  if (e.key === "Enter" && pendingAvailabilityCount.value > 0) {
    e.preventDefault();
    void saveAvailabilityChanges();
    return;
  }
  if (e.key === "Enter" && selectionMode.value) {
    e.preventDefault();
    toggleSelectionMode();
    return;
  }
  if (e.key !== "e" && e.key !== "E") return;
  if (showAdd.value || bulkBusy.value) return;
  e.preventDefault();
  toggleSelectionMode();
};

const onArchiveHouse = async (houseRow) => {
  try {
    await archiveEntity({
      entityType: "house",
      entityId: houseRow.id,
      archived: !!houseRow.is_archived,
    });
    await load();
  } catch (e) {
    alert(e?.message || String(e));
  }
};

const onDeleteHouse = async (houseRow) => {
  if (!confirm(`${t.value.delete} ${houseRow.address}?`)) return;
  const { error: e } = await supabase.from("houses").delete().eq("id", houseRow.id);
  if (e) return alert(e.message);
  await load();
};

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();

  let rows = houses.value;
  if (propertyKind.value !== "all") {
    rows = rows.filter((h) => classifyPropertyType(h) === propertyKind.value);
  }
  if (dealKind.value !== "all") {
    rows = rows.filter((h) => classifyDealType(h) === dealKind.value);
  }
  if (availabilityKind.value !== "all") {
    rows = rows.filter((h) => (h.availability || "entering") === availabilityKind.value);
  }

  if (term) {
    rows = rows.filter((h) => {
      const haystack = [
        h.address,
        h.city,
        ...(normalizeTagList(h.tags) || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }

  if (sortBy.value === "name_asc") {
    return [...rows].sort((a, b) => String(a.address || "").localeCompare(String(b.address || ""), undefined, { sensitivity: "base" }));
  }
  if (sortBy.value === "name_desc") {
    return [...rows].sort((a, b) => String(b.address || "").localeCompare(String(a.address || ""), undefined, { sensitivity: "base" }));
  }
  if (sortBy.value === "price_desc") {
    return [...rows].sort((a, b) => Number(b.price ?? -Infinity) - Number(a.price ?? -Infinity));
  }
  if (sortBy.value === "price_asc") {
    return [...rows].sort((a, b) => Number(a.price ?? Infinity) - Number(b.price ?? Infinity));
  }
  return rows;
});

watch(filtered, (rows) => {
  if (!rows.length) {
    keyboardIndex.value = -1;
    return;
  }
  if (keyboardIndex.value < 0) return;
  if (keyboardIndex.value >= rows.length) keyboardIndex.value = rows.length - 1;
});

const selectedHouseIdSet = computed(() => new Set(selectedHouseIds.value));
const allVisibleHousesSelected = computed(() =>
  filtered.value.length > 0 && filtered.value.every((h) => selectedHouseIdSet.value.has(h.id))
);

const isHouseSelected = (id) => selectedHouseIdSet.value.has(id);

const toggleHouseSelection = (id) => {
  if (selectedHouseIdSet.value.has(id)) {
    selectedHouseIds.value = selectedHouseIds.value.filter((x) => x !== id);
    return;
  }
  selectedHouseIds.value = [...selectedHouseIds.value, id];
};

const onHouseSelectInteraction = (id, index, event) => {
  const shift = !!event?.shiftKey;
  if (
    shift &&
    Number.isInteger(lastHouseSelectionIndex.value) &&
    Number.isInteger(index) &&
    filtered.value.length
  ) {
    const start = Math.min(lastHouseSelectionIndex.value, index);
    const end = Math.max(lastHouseSelectionIndex.value, index);
    const rangeIds = filtered.value.slice(start, end + 1).map((h) => h.id);
    const next = new Set(selectedHouseIds.value);
    const shouldSelect = !next.has(id);
    for (const rangeId of rangeIds) {
      if (shouldSelect) next.add(rangeId);
      else next.delete(rangeId);
    }
    selectedHouseIds.value = Array.from(next);
    lastHouseSelectionIndex.value = index;
    return;
  }
  toggleHouseSelection(id);
  lastHouseSelectionIndex.value = index;
};

const toggleSelectAllVisibleHouses = () => {
  if (allVisibleHousesSelected.value) {
    const visibleIds = new Set(filtered.value.map((h) => h.id));
    selectedHouseIds.value = selectedHouseIds.value.filter((id) => !visibleIds.has(id));
    return;
  }
  const merged = new Set(selectedHouseIds.value);
  for (const h of filtered.value) merged.add(h.id);
  selectedHouseIds.value = Array.from(merged);
};

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedHouseIds.value = [];
    lastHouseSelectionIndex.value = null;
  }
}

async function bulkUpdateAvailability(nextAvailability) {
  applyAvailabilityToSelected(nextAvailability || "entering");
}

async function bulkArchiveHouses() {
  if (!selectedHouseIds.value.length) return;
  bulkBusy.value = true;
  error.value = "";
  try {
    await Promise.all(
      selectedHouseIds.value.map((id) =>
        archiveEntity({ entityType: "house", entityId: id, archived: false })
      )
    );
    await load();
    selectedHouseIds.value = [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    bulkBusy.value = false;
  }
}

async function bulkDeleteHouses() {
  if (!selectedHouseIds.value.length) return;
  if (!confirm(t.value.delete_selected_houses_confirm)) return;
  bulkBusy.value = true;
  error.value = "";
  try {
    const { error: e } = await supabase
      .from("houses")
      .delete()
      .in("id", selectedHouseIds.value);
    if (e) throw e;
    await load();
    selectedHouseIds.value = [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    bulkBusy.value = false;
  }
}

useTopbarActions(() => {
  if (!selectionMode.value) {
    const actions = [
      { key: "refresh", label: t.value.refresh, onClick: () => load(), disabled: loading.value || bulkBusy.value },
      { key: "add", label: `+ ${t.value.add}`, onClick: () => (showAdd.value = true), disabled: bulkBusy.value },
      { key: "select-mode", label: t.value.select_mode, onClick: toggleSelectionMode },
    ];
    if (pendingAvailabilityCount.value > 0) {
      actions.splice(1, 0, {
        key: "save-availability",
        label: `${t.value.save} (${pendingAvailabilityCount.value})`,
        onClick: saveAvailabilityChanges,
        disabled: bulkBusy.value,
      });
    }
    return actions;
  }

  const actions = [
    {
      key: "select-visible",
      label: allVisibleHousesSelected.value ? t.value.clear_selection : t.value.select_all_visible,
      onClick: toggleSelectAllVisibleHouses,
      disabled: !filtered.value.length || bulkBusy.value,
    },
    {
      key: "bulk-archive",
      label: t.value.archive_selected,
      onClick: bulkArchiveHouses,
      disabled: !selectedHouseIds.value.length || bulkBusy.value,
    },
    {
      key: "bulk-availability-select",
      type: "select",
      value: bulkAvailability.value,
      onChange: (v) => {
        bulkAvailability.value = v;
        if (!selectedHouseIds.value.length || bulkBusy.value) return;
        bulkUpdateAvailability(v);
      },
      disabled: !selectedHouseIds.value.length || bulkBusy.value,
      options: [
        { value: "entering", label: t.value.availability_entering },
        { value: "available", label: t.value.availability_available },
        { value: "unavailable", label: t.value.availability_unavailable },
      ],
    },
    { key: "exit-select-mode", label: t.value.exit_select_mode, onClick: toggleSelectionMode, disabled: bulkBusy.value },
  ];
  if (pendingAvailabilityCount.value > 0) {
    actions.splice(actions.length - 1, 0, {
      key: "save-availability",
      label: `${t.value.save} (${pendingAvailabilityCount.value})`,
      onClick: saveAvailabilityChanges,
      disabled: bulkBusy.value,
    });
  }
  return actions;
});

const APARTMENT_TOKENS = [
  "apartment",
  "flat",
  "condo",
  "korter",
  "korteri",
  "korterelamu",
];
const HOUSE_TOKENS = [
  "house",
  "detached",
  "townhouse",
  "villa",
  "maja",
  "eramu",
  "ridamaja",
  "paarismaja",
  "suvila",
];
const SALE_TOKENS = ["sale", "sell", "for sale", "müük", "muuk", "müüa", "ost"];
const RENT_TOKENS = ["rent", "rental", "lease", "for rent", "üür", "uur", "üürile", "rentida"];

const classifyPropertyType = (house) => {
  const fields = [
    house?.object_type,
    house?.raw_data?.["Objekti liik"],
    house?.raw_data?.["Objekti täpsustus"],
    ...normalizeTagList(house?.tags),
  ];
  const haystack = fields
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).toLowerCase())
    .join(" ");

  if (!haystack) return "unknown";
  if (APARTMENT_TOKENS.some((token) => haystack.includes(token))) return "apartment";
  if (HOUSE_TOKENS.some((token) => haystack.includes(token))) return "house";
  return "unknown";
};

const classifyDealType = (house) => {
  const fields = [
    house?.deal_type,
    house?.raw_data?.["Tehing"],
    house?.raw_data?.["Transaction type"],
    ...normalizeTagList(house?.tags),
  ];
  const haystack = fields
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).toLowerCase())
    .join(" ");

  if (!haystack) return "unknown";
  const isSale = SALE_TOKENS.some((token) => haystack.includes(token));
  const isRent = RENT_TOKENS.some((token) => haystack.includes(token));
  if (isSale && !isRent) return "sale";
  if (isRent && !isSale) return "rent";
  return "unknown";
};

async function load() {
  loading.value = true;
  error.value = "";

  try {
    let query = supabase
      .from("houses")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    const { data, error: e } = await query;

    if (e) throw e;

    houses.value = (data || []).map((h) => ({
      ...h,
      _prevAvailability: h.availability || "entering",
    }));
    const liveIds = new Set(houses.value.map((h) => h.id));
    selectedHouseIds.value = selectedHouseIds.value.filter((id) => liveIds.has(id));
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
      tags: parseTagsInput(newHouse.value.tagsInput),
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

const onNewOpportunityShortcut = () => {
  showAdd.value = true;
  nextTick(() => fieldSearchInputEl.value?.focus?.());
};

onMounted(load);
onMounted(() => {
  window.addEventListener("crm:shortcut:new-opportunity", onNewOpportunityShortcut);
  window.addEventListener("keydown", onKeydown);
  onBeforeUnmount(() => {
    window.removeEventListener("crm:shortcut:new-opportunity", onNewOpportunityShortcut);
    window.removeEventListener("keydown", onKeydown);
  });
});
</script>
