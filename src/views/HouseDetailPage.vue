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

        <div class="mt-2">
          <span class="chip inline-flex items-center gap-2" :style="availabilityChipStyle(house.availability)">
            <span class="h-2 w-2 rounded-full" :style="{ background: availabilityColor(house.availability) }"></span>
            <span>{{ availabilityLabel(house.availability) }}</span>
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="load" :disabled="saving || savingCover">{{ t.refresh }}</button>
        <button
          v-if="!isEditing"
          class="btn-ghost"
          @click="startEdit"
          :disabled="saving || savingCover"
        >
          {{ t.edit }}
        </button>
        <button
          v-else
          class="btn-ghost"
          @click="cancelEdit"
          :disabled="saving || savingCover"
        >
          {{ t.cancel_edit }}
        </button>
        <RowActionsMenu
          :archived="!!house?.is_archived"
          @archive="onArchiveHouse"
          @delete="deleteHouse"
        />
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

          <div v-if="!isEditing" class="grid gap-3 md:grid-cols-2">
            <div class="md:col-span-2" v-if="house.title">
              <div class="text-xs text-white/50">{{ t.title }}</div>
              <div class="text-sm">{{ house.title }}</div>
            </div>

            <div class="md:col-span-2">
              <div class="text-xs text-white/50">{{ t.address }}</div>
              <div class="text-sm">{{ house.address }}</div>
            </div>

            <div>
              <div class="text-xs text-white/50">{{ t.city }}</div>
              <div class="text-sm">{{ house.city || "—" }}</div>
            </div>

            <div>
              <div class="text-xs text-white/50">{{ t.availability }}</div>
              <div class="text-sm inline-flex items-center gap-2">
                <span class="h-2 w-2 rounded-full" :style="{ background: availabilityColor(house.availability) }"></span>
                <span>{{ availabilityLabel(house.availability) }}</span>
              </div>
            </div>

            <div>
              <div class="text-xs text-white/50">{{ t.price }}</div>
              <div class="text-sm tabular-nums">€{{ house.price ?? "—" }}</div>
            </div>

            <div>
              <div class="text-xs text-white/50">{{ t.rooms }}</div>
              <div class="text-sm tabular-nums">{{ house.rooms ?? "—" }}</div>
            </div>

            <div>
              <div class="text-xs text-white/50">{{ t.size_m2 }}</div>
              <div class="text-sm tabular-nums">{{ house.size_m2 ?? "—" }}</div>
            </div>
          </div>

          <form v-else class="grid gap-3 md:grid-cols-2" novalidate @submit.prevent="saveHouse">
            <div class="md:col-span-2">
              <label class="text-sm text-white/60">{{ t.title }}</label>
              <input class="input mt-1" v-model.trim="edit.title" :placeholder="t.optional_title" />
            </div>

            <div class="md:col-span-2">
              <label class="text-sm text-white/60">{{ t.address }} *</label>
              <input class="input mt-1" v-model.trim="edit.address" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.city }}</label>
              <input class="input mt-1" v-model.trim="edit.city" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.availability }}</label>
              <select class="input mt-1" v-model="edit.availability">
                <option value="entering">{{ t.availability_entering }}</option>
                <option value="available">{{ t.availability_available }}</option>
                <option value="unavailable">{{ t.availability_unavailable }}</option>
              </select>
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

            <div class="md:col-span-2 pt-3 border-t border-white/10">
              <details>
                <summary class="text-sm font-semibold text-white/80 cursor-pointer select-none">
                  {{ t.xlsx_fields }}
                </summary>

                <div class="mt-4 space-y-6">
                  <section
                    v-for="(group, groupKey) in HOUSE_FIELD_GROUPS"
                    :key="groupKey"
                    class="glass-soft p-4 rounded-xl"
                  >
                    <h3 class="text-sm font-semibold mb-3 text-white/80">
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
                          v-model="rawDraft[field.key]"
                        />

                        <input
                          v-else-if="field.type === 'number'"
                          type="number"
                          class="input mt-1"
                          v-model="rawDraft[field.key]"
                        />

                        <input
                          v-else-if="field.type === 'date'"
                          type="date"
                          class="input mt-1"
                          v-model="rawDraft[field.key]"
                        />

                        <select
                          v-else-if="field.type === 'boolean'"
                          class="input mt-1"
                          v-model="rawDraft[field.key]"
                        >
                          <option value="">—</option>
                          <option value="Yes">{{ t.yes }}</option>
                          <option value="No">{{ t.no }}</option>
                        </select>

                        <input
                          v-else
                          class="input mt-1"
                          v-model="rawDraft[field.key]"
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </details>
            </div>

            <div class="md:col-span-2 flex items-center gap-3 mt-2">
              <button class="btn" type="submit" :disabled="saving">
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
            v-if="isEditing"
            class="textarea"
            rows="4"
            v-model.trim="edit.description"
            :placeholder="t.internal_description"
          />
          <div v-else class="text-sm text-white/70 whitespace-pre-wrap">
            {{ house.description || "—" }}
          </div>
        </div>

        <div v-if="isEditing ? edit.tagsInput : normalizeTagList(house.tags).length" class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            {{ t.tags }}
          </h2>

          <div class="flex flex-wrap gap-2">
            <span v-for="t in (isEditing ? parseTagsInput(edit.tagsInput) : normalizeTagList(house.tags))" :key="t" class="chip">
              {{ t }}
            </span>
          </div>
        </div>

        <div class="glass-soft p-6">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h2 class="text-sm font-semibold text-white/80">
              {{ t.xlsx_fields }}
            </h2>
            <div class="flex items-center gap-2">
              <label class="text-xs text-white/60 flex items-center gap-2">
                <input type="checkbox" v-model="hideEmptyXlsxFields" />
                {{ t.hide_empty_fields }}
              </label>
              <button class="btn-ghost" type="button" @click="showAllInfo = !showAllInfo">
                {{ showAllInfo ? t.hide_all_info : t.show_all_info }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div v-if="xlsxDisplayGroups.length === 0" class="text-sm text-white/60">
              {{ t.no_xlsx_fields_with_values }}
            </div>
            <details
              v-for="group in xlsxDisplayGroups"
              :key="group.key"
              class="rounded-xl border border-white/10 bg-black/30 p-4"
              :open="showAllInfo"
            >
              <summary class="text-sm font-semibold text-white/80 cursor-pointer select-none">
                {{ groupLabel(group) }}
              </summary>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div
                  v-for="field in group.fields"
                  :key="field.key"
                >
                  <div class="text-xs text-white/50">
                    {{ fieldLabel(field) }}
                  </div>
                  <div class="text-sm tabular-nums">
                    {{ renderValue(field, house.raw_data) }}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      <aside class="col-span-12 lg:col-span-4 space-y-6">
        <div class="glass-soft p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-white/80">{{ t.follow_up_tasks }}</h2>
            <span class="text-xs text-white/50">{{ openHouseTasks.length }} {{ t.open }}</span>
          </div>
          <div class="space-y-2 mb-3">
            <input class="input" v-model.trim="newTaskTitle" :placeholder="t.add_property_task" />
            <input class="input" type="date" v-model="newTaskDueDate" />
            <select class="input" v-model="newTaskType">
              <option value="follow_up">{{ t.task_type_follow_up }}</option>
              <option value="meeting">{{ t.task_type_meeting }}</option>
              <option value="call">{{ t.task_type_call }}</option>
              <option value="deadline">{{ t.task_type_deadline }}</option>
            </select>
            <textarea class="textarea" rows="2" v-model.trim="newTaskNote" :placeholder="t.task_note_optional"></textarea>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-white/60">{{ t.task_color }}</span>
              <button
                v-for="preset in TASK_COLOR_PRESETS"
                :key="preset"
                type="button"
                class="h-5 w-5 rounded-md border"
                :style="{ background: preset, borderColor: newTaskColor === preset ? 'white' : 'rgba(255,255,255,0.28)' }"
                @click="newTaskColor = preset"
              ></button>
            </div>
            <button class="btn w-full" type="button" @click="addHouseTask" :disabled="!newTaskTitle">
              {{ t.add_task }}
            </button>
          </div>
          <div v-if="houseTasks.length === 0" class="text-xs text-white/60">{{ t.no_tasks_yet }}</div>
          <div v-else class="space-y-2">
            <div v-for="task in houseTasks" :key="task.id" class="rounded-xl border border-white/10 p-3">
              <div class="flex items-start gap-2">
                <input type="checkbox" :checked="task.done" @change="toggleHouseTask(task.id)" class="mt-1" />
                <div class="min-w-0 flex-1">
                  <div class="text-sm flex items-center gap-2" :class="task.done ? 'line-through text-white/40' : ''">
                    <span class="h-2 w-2 rounded-full" :style="{ background: task.color || '#22c55e' }"></span>
                    <span>{{ task.title }}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded border border-white/15 text-white/60">
                      {{ taskTypeLabel(task.type) }}
                    </span>
                  </div>
                  <div class="text-xs text-white/50 mt-1">{{ t.due }} {{ task.dueDate || t.unscheduled }}</div>
                  <div v-if="task.note" class="text-xs text-white/45 mt-1 whitespace-pre-wrap">{{ task.note }}</div>
                </div>
                <button class="text-xs text-red-300 hover:text-red-200" type="button" @click="removeHouseTask(task.id)">{{ t.delete }}</button>
              </div>
            </div>
          </div>
        </div>

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
              class="btn"
              @click="addManualMatch"
              :disabled="!selectedClientId"
            >
              {{ t.add }}
            </button>
          </div>
        </div>

        <div class="glass-soft p-4">
          <div class="font-semibold mb-3">{{ t.activity }}</div>

          <div v-if="!timelineEntries.length" class="text-xs text-white/60">
            {{ t.no_activity }}
          </div>

          <div v-else class="space-y-2 text-xs">
            <div v-for="a in timelineEntries" :key="a.key">
              <span class="text-white/70">{{ a.label }}</span>
              <span class="text-white/40 ml-2">{{ a.when }}</span>
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
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import { useT } from "../lib/i18n";
import RowActionsMenu from "../components/RowActionsMenu.vue";
import { HOUSE_FIELD_GROUPS } from "@/config/houseFields.en";
import { formatDate, formatEuro, formatEuro2, formatBool } from "@/lib/formatters";
import { settings } from "../lib/settings";
import {
  getEntityLocalActivity,
  logLocalActivity,
} from "../lib/crmEnhancements";
import {
  createEntityTask,
  loadEntityTasks,
  removeEntityTask,
  setEntityTaskDone,
} from "../lib/tasksBackend";
import { archiveEntity } from "../lib/entityActions";
import { normalizeTagList, parseTagsInput } from "../lib/tags";

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
const houseTasks = ref([]);
const newTaskTitle = ref("");
const newTaskDueDate = ref("");
const newTaskType = ref("follow_up");
const newTaskNote = ref("");
const newTaskColor = ref("#22c55e");
const rawDraft = ref({});
const isEditing = ref(false);
const showAllInfo = ref(false);
const hideEmptyXlsxFields = ref(true);

const t = useT();
const TASK_COLOR_PRESETS = ["#4285f4", "#34a853", "#ea4335", "#fbbc05", "#8e24aa", "#22c55e"];
const taskTypeLabel = (type) => {
  const map = {
    follow_up: t.value.task_type_follow_up,
    meeting: t.value.task_type_meeting,
    call: t.value.task_type_call,
    deadline: t.value.task_type_deadline,
  };
  return map[type] || t.value.task_type_follow_up;
};
const openHouseTasks = computed(() => houseTasks.value.filter((x) => !x.done));
const timelineEntries = computed(() => {
  const db = (activity.value || []).map((a) => ({
    key: `db-${a.id}`,
    at: a.created_at,
    label: a.message || [a.type, a.entity, a.label].filter(Boolean).join(" • "),
  }));
  const local = getEntityLocalActivity("house", id).map((a) => ({
    key: `local-${a.id}`,
    at: a.created_at,
    label: a.label || a.message || a.type || "Activity",
  }));
  return [...db, ...local]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 16)
    .map((x) => ({ ...x, when: x.at ? new Date(x.at).toLocaleString() : "—" }));
});

const groupLabel = (group) => (settings.lang === "et" ? (group.label_et || group.label) : group.label);
const fieldLabel = (field) => (settings.lang === "et" ? (field.label_et || field.label) : field.label);

const edit = ref({
  title: "",
  address: "",
  city: "",
  availability: "entering",
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

const humanizeEnumLikeValue = (value) => {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  if (!raw) return raw;

  // Convert values like "types.heatings.TSENTRAALNE_GAASIGA" into readable text.
  const token = raw.startsWith("types.") ? raw.split(".").pop() || raw : raw;
  if (!/^[A-Z0-9_]+$/.test(token)) return raw;

  return token
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const renderValue = (field, raw) => {
  const v = raw?.[field.key];

  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) {
    const arr = v
      .filter((x) => x != null && x !== "")
      .map((x) => (typeof x === "string" ? humanizeEnumLikeValue(x) : x));
    return arr.join(", ") || "—";
  }
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  if (field.type === "date") return formatDate(v);
  if (field.type === "currency") return formatEuro(v);
  if (field.type === "currency2") return formatEuro2(v);
  if (field.type === "boolean") return formatBool(v);
  return typeof v === "string" ? humanizeEnumLikeValue(v) : String(v);
};

const hasRawValue = (field, raw) => {
  const v = raw?.[field.key];
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.some((x) => x != null && String(x).trim() !== "");
  return true;
};

const xlsxDisplayGroups = computed(() => {
  const groups = Object.entries(HOUSE_FIELD_GROUPS).map(([key, group]) => {
    const fields = hideEmptyXlsxFields.value
      ? group.fields.filter((field) => hasRawValue(field, house.value?.raw_data))
      : group.fields;

    return { key, ...group, fields };
  });

  return groups.filter((g) => g.fields.length > 0);
});

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

const availabilityLabel = (a) => {
  const map = {
    available: t.value.availability_available,
    unavailable: t.value.availability_unavailable,
    entering: t.value.availability_entering,
  };
  return map[a] || t.value.availability_entering;
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
    backgroundColor: `${c}22`,
    borderColor: `${c}66`,
  };
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

const loadLocalCRMState = async () => {
  try {
    houseTasks.value = await loadEntityTasks("house", id);
  } catch {
    houseTasks.value = [];
  }
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

  logLocalActivity({
    entity: "house",
    entity_id: id,
    type: "match",
    label: "Client linked to property",
  });
  selectedClientId.value = null;
  await loadMatchedClients();
};

const onArchiveHouse = async () => {
  if (!house.value?.id) return;
  try {
    await archiveEntity({
      entityType: "house",
      entityId: house.value.id,
      archived: !!house.value.is_archived,
    });
    router.push("/houses");
  } catch (e) {
    err.value = e?.message || String(e);
  }
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
  logLocalActivity({
    entity: "house",
    entity_id: id,
    type: "match_status",
    label: `Client match marked as ${statusLabel(m.status)}`,
  });
  await loadActivity();
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
  rawDraft.value = { ...(house.value?.raw_data || {}) };

  edit.value = {
    title: house.value.title || "",
    address: house.value.address || "",
    city: house.value.city || "",
    availability: house.value.availability || "entering",
    price: house.value.price ?? null,
    rooms: house.value.rooms ?? null,
    size_m2: house.value.size_m2 ?? null,
    description: house.value.description || "",
    tagsInput: normalizeTagList(house.value.tags).join(", "),
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
  await loadLocalCRMState();
};

const addHouseTask = async () => {
  const row = await createEntityTask({
    entityType: "house",
    entityId: id,
    title: newTaskTitle.value,
    dueDate: newTaskDueDate.value || null,
    type: newTaskType.value,
    note: newTaskNote.value,
    color: newTaskColor.value,
  });
  logLocalActivity({
    entity: "house",
    entity_id: id,
    type: "task",
    label: `Task created: ${row?.title || newTaskTitle.value}`,
  });
  newTaskTitle.value = "";
  newTaskDueDate.value = "";
  newTaskType.value = "follow_up";
  newTaskNote.value = "";
  newTaskColor.value = TASK_COLOR_PRESETS[0];
  await loadLocalCRMState();
};

const toggleHouseTask = async (taskId) => {
  const current = houseTasks.value.find((x) => x.id === taskId);
  const task = await setEntityTaskDone(taskId, !(current?.done));
  logLocalActivity({
    entity: "house",
    entity_id: id,
    type: "task",
    label: `Task ${task?.status === "done" ? "completed" : "reopened"}: ${task?.title || ""}`.trim(),
  });
  await loadLocalCRMState();
};

const removeHouseTask = async (taskId) => {
  const task = houseTasks.value.find((x) => x.id === taskId);
  await removeEntityTask(taskId);
  logLocalActivity({
    entity: "house",
    entity_id: id,
    type: "task",
    label: `Task deleted: ${task?.title || "Task"}`,
  });
  await loadLocalCRMState();
};

const startEdit = () => {
  isEditing.value = true;
};

const cancelEdit = async () => {
  isEditing.value = false;
  showAllInfo.value = false;
  await load();
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
      availability: edit.value.availability || "entering",
      price: edit.value.price ?? null,
      rooms: edit.value.rooms ?? null,
      size_m2: edit.value.size_m2 ?? null,
      description: edit.value.description || null,
      tags: parseTagsInput(edit.value.tagsInput),
      raw_data: rawDraft.value,
    };

    const { error: e } = await supabase.from("houses").update(payload).eq("id", id);
    if (e) throw e;

    saveMsg.value = t.value.saved;
    setTimeout(() => (saveMsg.value = ""), 1500);

    await load();
    isEditing.value = false;
    logLocalActivity({
      entity: "house",
      entity_id: id,
      type: "update",
      label: `Property updated: ${edit.value.address}`,
    });
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

const isTypingContext = (target) => {
  if (!(target instanceof Element)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return !!target.closest('[contenteditable="true"]');
};

const onKeydown = (e) => {
  if (!settings.shortcuts) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.key === "Enter" && isEditing.value && !saving.value && !savingCover.value) {
    const tag = e.target instanceof Element ? e.target.tagName : "";
    if (tag !== "TEXTAREA") {
      e.preventDefault();
      saveHouse();
      return;
    }
  }

  if (isTypingContext(e.target)) return;

  if (e.key === "e" || e.key === "E") {
    if (!isEditing.value && !saving.value && !savingCover.value) {
      e.preventDefault();
      startEdit();
    }
    return;
  }

  if (e.key === "r" || e.key === "R") {
    if (!saving.value && !savingCover.value) {
      e.preventDefault();
      load();
    }
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
onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
});
</script>
