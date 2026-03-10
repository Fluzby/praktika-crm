<template>
  <div v-if="client" class="space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ client.full_name }}
        </h1>
        <p class="text-sm text-white/60 mt-1">
          {{ t.client_record }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span class="chip">{{ t.open_tasks }}: {{ openClientTasks.length }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="load">{{ t.refresh }}</button>
        <RowActionsMenu
          :archived="!!client?.is_archived"
          @archive="onArchiveClient"
          @delete="remove"
        />
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <section class="col-span-12 lg:col-span-8 space-y-6">
        <div class="glass p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-4">
            {{ t.details }}
          </h2>

          <form class="grid gap-4 md:grid-cols-2" novalidate @submit.prevent="save">
            <div class="md:col-span-2">
              <label class="text-sm text-white/60">{{ t.full_name }} *</label>
              <input class="input mt-1" v-model.trim="edit.full_name" required />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.phone }}</label>
              <input class="input mt-1" v-model.trim="edit.phone" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.email }}</label>
              <input class="input mt-1" type="text" v-model.trim="edit.email" />
            </div>

            <div class="md:col-span-2 flex items-center gap-3 mt-2">
              <button class="btn" type="submit" :disabled="saving">
                {{ saving ? t.saving : t.save_changes }}
              </button>

              <span
                v-if="ok"
                class="text-xs text-emerald-400"
              >
                {{ t.changes_saved }}
              </span>

              <span
                v-if="error"
                class="text-xs text-red-300"
              >
                {{ error }}
              </span>
            </div>
          </form>
        </div>

        <div class="glass-soft p-6 records-surface client-notes-surface">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            {{ t.notes }}
          </h2>

          <textarea
            class="textarea client-notes-textarea"
            rows="5"
            v-model.trim="edit.notes"
            :placeholder="t.notes_placeholder"
          />
        </div>

        <div class="glass-soft p-4 mt-6 ai-matching-window">
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold">{{ t.recommended_houses }}</div>

            <div class="flex items-center gap-3">
              <label class="text-xs text-white/60 flex items-center gap-2">
                <input type="checkbox" v-model="hideRejected" />
                {{ t.hide_rejected }}
              </label>
              <button class="btn-ghost text-xs" @click="refreshAiMatches(true)">{{ t.re_run_ai }}</button>
              <button class="btn-ghost text-xs" :disabled="!lastAction" @click="undoLast">{{ t.undo }}</button>
            </div>
          </div>

          <div v-if="matchesLoading || autoMatching || matchedLoading" class="space-y-2">
            <div class="text-white/60 text-sm">
              {{ autoMatching ? t.finding_suggested_properties : t.loading }}
            </div>
            <div class="rounded-xl border border-white/10 p-3 animate-pulse bg-white/[0.02]"></div>
            <div class="rounded-xl border border-white/10 p-3 animate-pulse bg-white/[0.02]"></div>
          </div>

          <div v-else-if="matchesError" class="text-red-300 text-sm">
            {{ matchesError }}
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="h in visibleAiHouseCards"
              :key="h.id"
              class="rounded-xl border p-4 transition-all duration-150"
              :class="h._picked
                ? 'border-emerald-400/60 bg-emerald-400/8'
                : 'border-white/12 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/35 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.16)]'"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="font-semibold text-white truncate cursor-pointer" @click="$router.push(`/houses/${h.id}`)">
                  {{ h.address }}
                </div>

                <div class="flex items-center gap-2">
                  <span
                    v-if="h.rank <= 3"
                    class="text-xs px-2 py-0.5 rounded-full bg-amber-400/15 text-black"
                  >
                    ✨ {{ t.top }} {{ h.rank }}
                  </span>

                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="
                      (h.confidence ?? 0) >= 80 ? 'bg-emerald-500/15 text-black'
                      : (h.confidence ?? 0) >= 55 ? 'bg-amber-400/15 text-black'
                      : 'bg-white/10 text-black/70'
                    "
                  >
                    {{ h.confidence ?? 0 }}%
                  </span>
                </div>
              </div>

              <div class="text-xs text-white/75 mt-1">
                {{ h.city || "—" }} • {{ h.rooms ?? "?" }} {{ t.rooms }} • €{{ h.price ?? "—" }}
              </div>

              <div
                v-if="h.reason"
                class="text-sm text-white/80 leading-relaxed mt-2"
              >
                {{ h.reason }}
              </div>

              <div class="flex justify-end mt-3 gap-2">
                <button
                  class="text-xs px-3 py-1 rounded-md border border-red-400/40 bg-red-500/18 text-black hover:bg-red-500/28"
                  @click.stop="rejectHouse(h)"
                >
                  {{ t.reject_hide }}
                </button>

                <button
                  class="text-xs px-3 py-1 rounded-md"
                  :class="h._picked
                    ? 'border border-white/15 bg-white/10 text-black/50 cursor-not-allowed'
                    : 'border border-emerald-300/40 bg-emerald-500/20 text-black hover:bg-emerald-500/30'"
                  :disabled="h._picked"
                  @click.stop="pickHouse(h)"
                >
                  {{ h._picked ? t.picked : t.pick_for_client }}
                </button>

                <button
                  class="text-xs px-3 py-1 rounded-md border border-white/15 bg-white/10 text-black hover:bg-white/20"
                  @click.stop="$router.push(`/houses/${h.id}`)"
                >
                  {{ t.view_house }}
                </button>
              </div>
            </div>

            <div v-if="visibleAiHouseCards.length === 0" class="text-white/60 text-sm">
              {{ t.no_good_matches }}
            </div>
          </div>
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">{{ t.matching_preferences }}</h2>

          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label class="text-sm text-white/60">{{ t.deal_preference }}</label>
              <select class="input mt-1" v-model="edit.deal_preference">
                <option value="any">{{ t.deal_preference_any }}</option>
                <option value="buy">{{ t.deal_preference_buy }}</option>
                <option value="rent">{{ t.deal_preference_rent }}</option>
              </select>
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.property_preference }}</label>
              <select class="input mt-1" v-model="edit.property_preference">
                <option value="any">{{ t.property_preference_any }}</option>
                <option value="apartment">{{ t.property_preference_apartment }}</option>
                <option value="house">{{ t.property_preference_house }}</option>
              </select>
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.min_price }}</label>
              <input class="input mt-1" type="number" v-model.number="edit.min_price" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.max_price }}</label>
              <input class="input mt-1" type="number" v-model.number="edit.max_price" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.min_rooms }}</label>
              <input class="input mt-1" type="number" v-model.number="edit.min_rooms" />
            </div>

            <div>
              <label class="text-sm text-white/60">{{ t.max_rooms }}</label>
              <input class="input mt-1" type="number" v-model.number="edit.max_rooms" />
            </div>

            <div class="md:col-span-2">
              <label class="text-sm text-white/60">{{ t.preferred_tags }}</label>
              <input class="input mt-1" :placeholder="t.tags_placeholder"
                     v-model.trim="edit.preferred_tags_input" />
            </div>
          </div>
        </div>
      </section>

      <aside class="col-span-12 lg:col-span-4 space-y-6">
        <div class="glass-soft p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-white/80">{{ t.follow_up_tasks }}</h2>
            <span class="text-xs text-white/50">{{ openClientTasks.length }} {{ t.open }}</span>
          </div>

          <div class="space-y-2 mb-3">
            <input class="input" v-model.trim="newTaskTitle" :placeholder="t.add_next_action" />
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
            <button class="btn w-full" type="button" @click="addClientTask" :disabled="!newTaskTitle">
              {{ t.add_task }}
            </button>
          </div>

          <div v-if="clientTasks.length === 0" class="text-xs text-white/60">{{ t.no_tasks_yet }}</div>
          <div v-else class="space-y-2">
            <div v-for="task in clientTasks" :key="task.id" class="rounded-xl border border-white/10 p-3">
              <div class="flex items-start gap-2">
                <input type="checkbox" :checked="task.done" @change="toggleClientTask(task.id)" class="mt-1" />
                <div class="min-w-0 flex-1">
                  <div class="text-sm flex items-center gap-2" :class="task.done ? 'line-through text-white/40' : ''">
                    <span class="h-2 w-2 rounded-full" :style="{ background: task.color || '#22c55e' }"></span>
                    <span>{{ task.title }}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded border border-white/15 text-white/60">
                      {{ taskTypeLabel(task.type) }}
                    </span>
                  </div>
                  <div class="text-xs text-white/50 mt-1">
                    {{ t.due }} {{ task.dueDate || t.unscheduled }}
                  </div>
                  <div v-if="task.note" class="text-xs text-white/45 mt-1 whitespace-pre-wrap">{{ task.note }}</div>
                </div>
                <button class="text-xs text-red-300 hover:text-red-200" type="button" @click="removeClientTask(task.id)">{{ t.delete }}</button>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">{{ t.relationship_overview }}</h2>
          <div class="grid grid-cols-1 gap-3 text-sm">
            <div class="rounded-xl border border-white/10 p-3">
              <div class="text-xs text-white/50">{{ t.interested }}</div>
              <div class="text-lg font-semibold mt-1">{{ interestedMatchesCount }}</div>
            </div>
          </div>
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            {{ t.metadata }}
          </h2>

          <div class="text-sm text-white/60 space-y-1">
            <div>
              {{ t.created }}:
              <span class="text-white/80">
                {{ formatDate(client.created_at) }}
              </span>
            </div>
            <div>
              {{ t.updated }}:
              <span class="text-white/80">
                {{ formatDate(client.updated_at) }}
              </span>
            </div>
          </div>
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">{{ t.timeline }}</h2>
          <div v-if="timelineEntries.length === 0" class="text-xs text-white/60">{{ t.no_activity }}</div>
          <div v-else class="space-y-2">
            <div v-for="item in timelineEntries" :key="item.key" class="rounded-xl border border-white/10 p-3">
              <div class="text-sm text-white/80">{{ item.label }}</div>
              <div class="text-xs text-white/45 mt-1">{{ item.when }}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>

  </div>

  <div v-else class="text-white/60">{{ t.loading }}</div>

  <div
    v-if="toastMsg"
    class="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl border border-white/10 bg-black/70 backdrop-blur text-sm"
    :class="toastType === 'success'
      ? 'text-emerald-200'
      : toastType === 'error'
      ? 'text-red-200'
      : 'text-white/80'"
  >
    {{ toastMsg }}
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { settings } from "../lib/settings";
import { logActivity } from "../lib/activity";
import RowActionsMenu from "../components/RowActionsMenu.vue";
import { useT } from "../lib/i18n";
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
import { parseTagsInput } from "../lib/tags";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const client = ref(null);
const edit = ref({});
const saving = ref(false);
const error = ref("");
const ok = ref(false);

const matchesLoading = ref(false);
const matchesError = ref("");
const aiHouseCards = ref([]);
const lastAction = ref(null);

const matched = ref([]);
const matchedLoading = ref(false);
const hideRejected = ref(true);
const autoMatching = ref(false);
const activity = ref([]);
const newTaskTitle = ref("");
const newTaskDueDate = ref("");
const newTaskType = ref("follow_up");
const newTaskNote = ref("");
const newTaskColor = ref("#22c55e");
const clientTasks = ref([]);
const TASK_COLOR_PRESETS = ["#4285f4", "#34a853", "#ea4335", "#fbbc05", "#8e24aa", "#22c55e"];

const toastMsg = ref("");
const toastType = ref("info");
let toastTimer = null;

const t = useT();
const taskTypeLabel = (type) => {
  const map = {
    follow_up: t.value.task_type_follow_up,
    meeting: t.value.task_type_meeting,
    call: t.value.task_type_call,
    deadline: t.value.task_type_deadline,
  };
  return map[type] || t.value.task_type_follow_up;
};

const openClientTasks = computed(() => clientTasks.value.filter((x) => !x.done));
const interestedMatchesCount = computed(() => matched.value.filter((x) => x.status === "interested").length);
const visibleAiHouseCards = computed(() =>
  hideRejected.value ? aiHouseCards.value.filter((x) => x.status !== "rejected") : aiHouseCards.value
);
const timelineEntries = computed(() => {
  const supa = (activity.value || []).map((a) => ({
    key: `db-${a.id}`,
    at: a.created_at,
    label: [a.type, a.entity, a.label].filter(Boolean).join(" • "),
  }));
  const local = getEntityLocalActivity("client", id).map((a) => ({
    key: `local-${a.id}`,
    at: a.created_at,
    label: a.label || a.message || a.type || "Activity",
  }));
  return [...supa, ...local]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 14)
    .map((x) => ({
      ...x,
      when: x.at ? new Date(x.at).toLocaleString() : "—",
    }));
});

const toast = (msg, type = "info") => {
  toastMsg.value = msg;
  toastType.value = type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMsg.value = "";
  }, 1800);
};

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
};

const loadMatched = async () => {
  matchedLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("house_matches")
      .select("status, source, ai_confidence, ai_reason, created_at, house:houses(id,address,city,price,rooms,tags)")
      .eq("client_id", client.value.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    matched.value = (data || []).filter(m => m.house);
  } catch (e) {
    console.error("loadMatched error:", e);
  } finally {
    matchedLoading.value = false;
  }
};

const loadActivity = async () => {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("entity", "client")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (!error) activity.value = data || [];
};

const loadLocalCRMState = async () => {
  try {
    clientTasks.value = await loadEntityTasks("client", id);
  } catch {
    clientTasks.value = [];
  }
};

const addClientTask = async () => {
  const row = await createEntityTask({
    entityType: "client",
    entityId: id,
    title: newTaskTitle.value,
    dueDate: newTaskDueDate.value || null,
    type: newTaskType.value,
    note: newTaskNote.value,
    color: newTaskColor.value,
  });
  logLocalActivity({
    entity: "client",
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

const toggleClientTask = async (taskId) => {
  const current = clientTasks.value.find((x) => x.id === taskId);
  const task = await setEntityTaskDone(taskId, !(current?.done));
  logLocalActivity({
    entity: "client",
    entity_id: id,
    type: "task",
    label: `Task ${task?.status === "done" ? "completed" : "reopened"}: ${task?.title || ""}`.trim(),
  });
  await loadLocalCRMState();
};

const removeClientTask = async (taskId) => {
  const task = clientTasks.value.find((x) => x.id === taskId);
  await removeEntityTask(taskId);
  logLocalActivity({
    entity: "client",
    entity_id: id,
    type: "task",
    label: `Task deleted: ${task?.title || "Task"}`,
  });
  await loadLocalCRMState();
};

const load = async () => {
  const { data, error: e } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (e) return (error.value = e.message);

  client.value = data;
  edit.value = {
    full_name: data.full_name,
    phone: data.phone,
    email: data.email,
    notes: data.notes,
    deal_preference: data.deal_preference || "any",
    property_preference: data.property_preference || "any",
    min_price: data.min_price,
    max_price: data.max_price,
    min_rooms: data.min_rooms,
    max_rooms: data.max_rooms,
    preferred_tags_input: (data.preferred_tags || []).join(", "),
  };
  await loadLocalCRMState();
};

const refreshAiMatches = async (force = false) => {
  if (!client.value?.id) return;
  matchesLoading.value = true;
  autoMatching.value = true;
  matchesError.value = "";
  aiHouseCards.value = [];

  try {
    const { data, error } = await supabase.functions.invoke("smart-match", {
      body: { client_id: client.value.id, force, top_n: settings.aiTopN },
    });

    if (error) throw error;

    const results = Array.isArray(data) ? data : [];
    if (!results.length) return;

    const isUuid = (s) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    const ids = results.map(r => r.house_id).filter(isUuid);
    if (!ids.length) {
      aiHouseCards.value = [];
      await loadMatched();
      return;
    }

    const { data: existing, error: existingErr } = await supabase
      .from("house_matches")
      .select("house_id, status")
      .eq("client_id", client.value.id)
      .in("house_id", ids);
    if (existingErr) throw existingErr;

    const existingByHouseId = new Map((existing || []).map((m) => [m.house_id, m.status]));
    const rows = results.slice(0, settings.aiTopN ?? 5).map((r) => ({
      client_id: client.value.id,
      house_id: r.house_id,
      source: "ai",
      status: existingByHouseId.get(r.house_id) || "suggested",
      ai_confidence: r.confidence ?? null,
      ai_reason: r.reason ?? null,
    }));

    const { error: upsertErr } = await supabase
      .from("house_matches")
      .upsert(rows, { onConflict: "client_id,house_id" });
    if (upsertErr) throw upsertErr;

    const meta = new Map(
      results.map((r, i) => [r.house_id, { reason: r.reason, rank: i + 1, confidence: r.confidence ?? 0 }])
    );

    const { data: houses, error: hErr } = await supabase
      .from("houses")
      .select("id,address,city,price,rooms,tags")
      .in("id", ids);

    if (hErr) throw hErr;

    const byId = new Map((houses || []).map(h => [h.id, h]));
    aiHouseCards.value = ids
      .slice(0, settings.aiTopN ?? 5)
      .map((id) => {
        const h = byId.get(id);
        const m = meta.get(id);
        const status = existingByHouseId.get(id) || "suggested";
        const picked = status === "contacted" || status === "viewed" || status === "interested";
        return h && m ? { ...h, reason: m.reason, rank: m.rank, confidence: m.confidence, status, _picked: picked } : null;
      })
      .filter(Boolean);
    await loadMatched();
  } catch (e) {
    matchesError.value = e?.message || String(e);
  } finally {
    matchesLoading.value = false;
    autoMatching.value = false;
  }
};

const openHouse = (houseId) => router.push(`/houses/${houseId}`);

const onArchiveClient = async () => {
  if (!client.value?.id) return;
  try {
    await archiveEntity({
      entityType: "client",
      entityId: client.value.id,
      archived: !!client.value.is_archived,
    });
    router.push("/clients");
  } catch (e) {
    toast(e?.message || String(e), "error");
  }
};

const notifyMatchChanged = (clientId, houseId) => {
  window.dispatchEvent(new CustomEvent("match-changed", {
    detail: { clientId, houseId },
  }));
};

const pickHouse = async (h) => {
  if (h._picked) return;

  try {
    lastAction.value = {
      type: "pick",
      client_id: client.value.id,
      house_id: h.id,
    };

    const { error } = await supabase.from("house_matches").upsert(
      {
        client_id: client.value.id,
        house_id: h.id,
        source: "ai",
        status: "contacted",
        ai_confidence: h.confidence ?? null,
        ai_reason: h.reason ?? null,
      },
      { onConflict: "client_id,house_id" }
    );

    if (error) throw error;

    h._picked = true;
    h.status = "contacted";

    toast(t.value.picked_for_client_toast, "success");
    notifyMatchChanged(client.value.id, h.id);
  } catch (e) {
    console.error("pickHouse error:", e);
    toast(e?.message || String(e), "error");
  }
};

const rejectHouse = async (h) => {
  if (h._picked) return;

  try {
    lastAction.value = {
      type: "reject",
      client_id: client.value.id,
      house_id: h.id,
    };

    const { error } = await supabase.from("house_matches").upsert(
      {
        client_id: client.value.id,
        house_id: h.id,
        source: "ai",
        status: "rejected",
        ai_confidence: h.confidence ?? null,
        ai_reason: h.reason ?? null,
      },
      { onConflict: "client_id,house_id" }
    );

    if (error) throw error;

    toast(t.value.rejected_hidden_toast, "info");

    h.status = "rejected";
    h._picked = false;

    notifyMatchChanged(client.value.id, h.id);
  } catch (e) {
    console.error("rejectHouse error:", e);
    toast(e?.message || String(e), "error");
  }
};

const undoLast = async () => {
  if (!lastAction.value) return;

  const a = lastAction.value;
  lastAction.value = null;

  try {
    const { error } = await supabase
      .from("house_matches")
      .delete()
      .eq("client_id", a.client_id)
      .eq("house_id", a.house_id);

    if (error) throw error;

    toast(t.value.undo_toast, "info");

    await refreshAiMatches(false);

    notifyMatchChanged(a.client_id, a.house_id);
  } catch (e) {
    console.error("undoLast error:", e);
    toast(e?.message || String(e), "error");
  }
};

const save = async () => {
  saving.value = true;
  error.value = "";
  ok.value = false;

  if (!String(edit.value.full_name || "").trim()) {
    error.value = t.value.full_name;
    saving.value = false;
    return;
  }

  const basePayload = {
    full_name: edit.value.full_name,
    phone: edit.value.phone || null,
    email: edit.value.email || null,
    notes: edit.value.notes || null,
    min_price: edit.value.min_price ?? null,
    max_price: edit.value.max_price ?? null,
    min_rooms: edit.value.min_rooms ?? null,
    max_rooms: edit.value.max_rooms ?? null,
    preferred_tags: parseTagsInput(edit.value.preferred_tags_input),
  };
  const fullPayload = {
    ...basePayload,
    deal_preference: edit.value.deal_preference === "any" ? null : edit.value.deal_preference,
    property_preference: edit.value.property_preference === "any" ? null : edit.value.property_preference,
  };

  let { error: e } = await supabase
    .from("clients")
    .update(fullPayload)
    .eq("id", id);

  const msg = String(e?.message || e || "");
  const missingPrefCols =
    msg.includes("deal_preference") || msg.includes("property_preference");
  if (e && missingPrefCols) {
    const retry = await supabase
      .from("clients")
      .update(basePayload)
      .eq("id", id);
    e = retry.error;
  }

  saving.value = false;

  if (e) return (error.value = e.message);

  await logActivity({ type: "update", entity: "client", entity_id: id, label: edit.value.full_name });
  logLocalActivity({
    entity: "client",
    entity_id: id,
    type: "update",
    label: `Client details updated (${edit.value.full_name})`,
  });

  ok.value = true;
  setTimeout(() => (ok.value = false), 1200);
};

const remove = async () => {
  if (!confirm(t.value.delete_client_confirm)) return;
  await supabase.from("clients").delete().eq("id", id);
  router.push("/clients");
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
  if (e.key !== "Enter") return;
  if (saving.value) return;

  const tag = e.target instanceof Element ? e.target.tagName : "";
  if (tag === "TEXTAREA") return;
  if (isTypingContext(e.target)) {
    e.preventDefault();
    save();
  }
};

onMounted(async () => {
  await load();
  await loadMatched();
  await loadActivity();

  // Auto-run AI suggestions and render the best matches directly in the page list.
  if (client.value?.id) {
    await refreshAiMatches(false);
  }

  const handler = (e) => {
    if (e?.detail?.clientId === client.value?.id) {
      loadMatched();
      loadActivity();
      refreshAiMatches(false);
    }
  };
  window.addEventListener("match-changed", handler);
  onBeforeUnmount(() => window.removeEventListener("match-changed", handler));

  window.addEventListener("keydown", onKeydown);
  onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
});
</script>

<style scoped>
.client-notes-surface {
  background: rgba(255, 255, 255, 0.82) !important;
}

.client-notes-textarea {
  min-height: 160px;
  background: rgba(255, 255, 255, 0.92) !important;
  border-radius: 24px !important;
  border: 1px solid var(--shell-border-soft) !important;
  padding: 1.1rem 1.25rem !important;
  line-height: 1.5;
}

html.theme-dark .client-notes-surface {
  background: rgba(255, 255, 255, 0.05) !important;
}

html.theme-dark .client-notes-textarea {
  background: rgba(255, 255, 255, 0.04) !important;
}
</style>
