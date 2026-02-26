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
          <span class="chip">{{ clientPipelineLabel }}</span>
          <span class="chip">Open tasks: {{ openClientTasks.length }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="load">{{ t.refresh }}</button>
        <button class="btn-ghost" @click="openMatches">{{ t.match_houses }}</button>
        <button
          class="px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10"
          @click="remove"
        >
          {{ t.delete }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <section class="col-span-12 lg:col-span-8 space-y-6">
        <div class="glass p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-4">
            {{ t.details }}
          </h2>

          <form class="grid gap-4 md:grid-cols-2" @submit.prevent="save">
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
              <input class="input mt-1" type="email" v-model.trim="edit.email" />
            </div>

            <div class="md:col-span-2 flex items-center gap-3 mt-2">
              <button class="btn" :disabled="saving">
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

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            {{ t.notes }}
          </h2>

          <textarea
            class="textarea"
            rows="5"
            v-model.trim="edit.notes"
            :placeholder="t.notes_placeholder"
          />
        </div>

        <div class="glass-soft p-4 mt-6">
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold">Recommended Houses</div>

            <label class="text-xs text-white/60 flex items-center gap-2">
              <input type="checkbox" v-model="hideRejected" />
              {{ t.hide_rejected }}
            </label>
          </div>

          <div v-if="matchedLoading || autoMatching" class="space-y-2">
            <div class="text-white/60 text-sm">
              {{ autoMatching ? "Finding suggested properties..." : t.loading }}
            </div>
            <div class="rounded-xl border border-white/10 p-3 animate-pulse bg-white/[0.02]"></div>
            <div class="rounded-xl border border-white/10 p-3 animate-pulse bg-white/[0.02]"></div>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="m in recommendedMatches"
              :key="m.house.id"
              class="rounded-xl border border-white/10 p-3 hover:bg-white/[0.03] transition"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 cursor-pointer" @click="$router.push(`/houses/${m.house.id}`)">
                  <div class="font-medium truncate">{{ m.house.address }}</div>
                  <div class="text-xs text-white/60 mt-1">
                    {{ m.house.city || "—" }} • {{ m.house.rooms ?? "?" }} {{ t.rooms }} • €{{ m.house.price ?? "—" }}
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span
                    v-if="m.ai_confidence != null"
                    class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70"
                  >
                    {{ m.ai_confidence }}%
                  </span>

                  <span class="text-xs px-2 py-0.5 rounded-full" :class="statusPill(m.status)">
                    {{ statusLabel(m.status) }}
                  </span>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 mt-3">
                <button class="btn-ghost text-xs" @click="setMatchStatus(m.house.id, 'contacted')">{{ t.contacted }}</button>
                <button class="btn-ghost text-xs" @click="setMatchStatus(m.house.id, 'viewed')">{{ t.viewed }}</button>
                <button class="btn-ghost text-xs" @click="setMatchStatus(m.house.id, 'interested')">{{ t.interested }}</button>
                <button class="btn-ghost text-xs" @click="setMatchStatus(m.house.id, 'rejected')">{{ t.rejected }}</button>
              </div>
            </div>

            <div v-if="recommendedMatches.length === 0" class="text-white/60 text-sm">
              No recommended houses yet.
            </div>
          </div>
        </div>

        <div class="glass-soft p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold">{{ t.matched_houses }}</div>
            <div class="text-xs text-white/50">{{ visibleMatched.length }} total</div>
          </div>

          <div v-if="matchedLoading || autoMatching" class="text-white/60 text-sm">
            {{ autoMatching ? "Refreshing matches..." : t.loading }}
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="m in visibleMatched"
              :key="`all-${m.house.id}`"
              class="rounded-xl border border-white/10 p-3 hover:bg-white/[0.03] transition"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 cursor-pointer" @click="$router.push(`/houses/${m.house.id}`)">
                  <div class="font-medium truncate">{{ m.house.address }}</div>
                  <div class="text-xs text-white/60 mt-1">
                    {{ m.house.city || "—" }} • {{ m.house.rooms ?? "?" }} {{ t.rooms }} • €{{ m.house.price ?? "—" }}
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span
                    v-if="m.ai_confidence != null"
                    class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70"
                  >
                    {{ m.ai_confidence }}%
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-full" :class="statusPill(m.status)">
                    {{ statusLabel(m.status) }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="visibleMatched.length === 0" class="text-white/60 text-sm">
              {{ t.no_matched_houses }}
            </div>
          </div>
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">{{ t.matching_preferences }}</h2>

          <div class="grid gap-3 md:grid-cols-2">
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
        <div class="glass p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">Client Pipeline</h2>
          <select class="input" v-model="clientStatus" @change="onClientStatusChange">
            <option v-for="s in CLIENT_PIPELINE" :key="s" :value="s">
              {{ CLIENT_PIPELINE_LABELS[s] }}
            </option>
          </select>
          <p class="text-xs text-white/50 mt-2">Track lead progress across the deal cycle.</p>
        </div>

        <div class="glass-soft p-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-white/80">Follow-up Tasks</h2>
            <span class="text-xs text-white/50">{{ openClientTasks.length }} open</span>
          </div>

          <div class="space-y-2 mb-3">
            <input class="input" v-model.trim="newTaskTitle" placeholder="Add next action..." />
            <input class="input" type="date" v-model="newTaskDueDate" />
            <button class="btn w-full" type="button" @click="addClientTask" :disabled="!newTaskTitle">
              Add Task
            </button>
          </div>

          <div v-if="clientTasks.length === 0" class="text-xs text-white/60">No tasks yet.</div>
          <div v-else class="space-y-2">
            <div v-for="task in clientTasks" :key="task.id" class="rounded-xl border border-white/10 p-3">
              <div class="flex items-start gap-2">
                <input type="checkbox" :checked="task.done" @change="toggleClientTask(task.id)" class="mt-1" />
                <div class="min-w-0 flex-1">
                  <div class="text-sm" :class="task.done ? 'line-through text-white/40' : ''">{{ task.title }}</div>
                  <div class="text-xs text-white/50 mt-1">
                    Due {{ task.dueDate || "unscheduled" }}
                  </div>
                </div>
                <button class="text-xs text-red-300 hover:text-red-200" type="button" @click="removeClientTask(task.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">Relationship Overview</h2>
          <div class="grid grid-cols-1 gap-3 text-sm">
            <div class="rounded-xl border border-white/10 p-3">
              <div class="text-xs text-white/50">Interested</div>
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
          <h2 class="text-sm font-semibold text-white/80 mb-3">Timeline</h2>
          <div v-if="timelineEntries.length === 0" class="text-xs text-white/60">No activity yet.</div>
          <div v-else class="space-y-2">
            <div v-for="item in timelineEntries" :key="item.key" class="rounded-xl border border-white/10 p-3">
              <div class="text-sm text-white/80">{{ item.label }}</div>
              <div class="text-xs text-white/45 mt-1">{{ item.when }}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <Modal :open="showMatches" title="Most Recommended" @close="showMatches=false">
      <div class="flex flex-col gap-3">
        <div v-if="matchesLoading" class="space-y-2">
          <div class="glass-soft h-16 animate-pulse"></div>
          <div class="glass-soft h-16 animate-pulse"></div>
          <div class="glass-soft h-16 animate-pulse"></div>
        </div>

        <div v-else-if="matchesError" class="text-red-300">
          {{ matchesError }}
        </div>

        <div
          v-else
          class="glass-soft rounded-xl p-3 max-h-[420px] overflow-y-auto space-y-2 ai-matchup-list"
        >
          <div
            v-for="(h, i) in aiHouseCards"
            :key="h.id"
            class="rounded-lg cursor-pointer transition ai-card"
            :class="[
              'rounded-xl border p-4 transition',
              selectedIndex === i
                ? 'border-emerald-400/60 bg-emerald-400/8'
                : 'border-white/12 bg-white/[0.02] hover:bg-white/[0.05]'
            ]"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="font-semibold text-white truncate">
                {{ h.address }}
              </div>

              <div class="flex items-center gap-2">
                <span
                  v-if="h.rank <= 3"
                  class="text-xs px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-200"
                >
                  ✨ {{ t.top }} {{ h.rank }}
                </span>

                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="
                    (h.confidence ?? 0) >= 80 ? 'bg-emerald-500/15 text-emerald-200'
                    : (h.confidence ?? 0) >= 55 ? 'bg-amber-400/15 text-amber-200'
                    : 'bg-white/10 text-white/70'
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
                class="text-xs px-3 py-1 rounded-md bg-red-500/15 text-red-200 hover:bg-red-500/25"
                @click.stop="rejectHouse(h)"
              >
                {{ t.reject_hide }}
              </button>

              <button
                class="text-xs px-3 py-1 rounded-md"
                :class="h._picked
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'"
                :disabled="h._picked"
                @click.stop="pickHouse(h)"
              >
                {{ h._picked ? t.picked : t.pick_for_client }}
              </button>

              <button
                class="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
                @click.stop="$router.push(`/houses/${h.id}`)"
              >
                {{ t.view_house }}
              </button>
            </div>
          </div>

          <div v-if="!aiHouseCards.length" class="text-white/60 text-sm">
            {{ t.no_good_matches }}
          </div>
        </div>
      </div>
      <div v-if="settings.shortcuts" class="text-xs text-white/40 mt-4 flex gap-4">
        <span>⏎ {{ t.pick_shortcut }}</span>
        <span>R {{ t.reject_shortcut }}</span>
        <span>U {{ t.undo_shortcut }}</span>
        <span>Esc {{ t.close_shortcut }}</span>
      </div>
      <template #footer>
        <div class="flex items-center justify-between w-full">
          <button class="btn-ghost" @click="openMatches(true)">{{ t.re_run_ai }}</button>

          <button
            class="btn-ghost"
            :disabled="!lastAction"
            @click="undoLast"
          >
            {{ t.undo }}
          </button>
        </div>
      </template>
    </Modal>
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
import Modal from "../components/Modal.vue";
import { useT } from "../lib/i18n";
import {
  CLIENT_PIPELINE,
  CLIENT_PIPELINE_LABELS,
  addTask,
  deleteTask,
  getClientStatus,
  getEntityLocalActivity,
  getEntityTasks,
  logLocalActivity,
  setClientStatus,
  toggleTask,
} from "../lib/crmEnhancements";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const client = ref(null);
const edit = ref({});
const saving = ref(false);
const error = ref("");
const ok = ref(false);

const showMatches = ref(false);
const matchesLoading = ref(false);
const matchesError = ref("");
const aiHouseCards = ref([]);
const lastAction = ref(null);
const selectedIndex = ref(0);

const matched = ref([]);
const matchedLoading = ref(false);
const hideRejected = ref(true);
const autoMatching = ref(false);
const activity = ref([]);
const clientStatus = ref("new_lead");
const newTaskTitle = ref("");
const newTaskDueDate = ref("");
const clientTasks = ref([]);

const toastMsg = ref("");
const toastType = ref("info");
let toastTimer = null;

const t = useT();

const clientPipelineLabel = computed(() => CLIENT_PIPELINE_LABELS[clientStatus.value] || "New Lead");
const openClientTasks = computed(() => clientTasks.value.filter((x) => !x.done));
const interestedMatchesCount = computed(() => matched.value.filter((x) => x.status === "interested").length);
const visibleMatched = computed(() =>
  hideRejected.value ? matched.value.filter((x) => x.status !== "rejected") : matched.value
);
const recommendedMatches = computed(() =>
  visibleMatched.value.filter((x) => x.source === "ai" || x.status === "suggested")
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

const loadLocalCRMState = () => {
  clientStatus.value = getClientStatus(id);
  clientTasks.value = getEntityTasks("client", id);
};

const statusPill = (s) => {
  if (s === "interested") return "bg-emerald-500/15 text-emerald-200";
  if (s === "viewed") return "bg-fuchsia-500/15 text-fuchsia-200";
  if (s === "contacted") return "bg-sky-500/15 text-sky-200";
  if (s === "rejected") return "bg-red-500/15 text-red-200";
  return "bg-white/10 text-white/70";
};

const statusLabel = (s) => {
  const map = {
    suggested: t.value.suggested,
    contacted: t.value.contacted,
    viewed: t.value.viewed,
    interested: t.value.interested,
    rejected: t.value.rejected,
  };
  return map[s] || t.value.suggested;
};

const setMatchStatus = async (houseId, status) => {
  const { error } = await supabase
    .from("house_matches")
    .update({ status })
    .eq("client_id", client.value.id)
    .eq("house_id", houseId);

  if (error) {
    console.error("setMatchStatus error:", error);
    return;
  }
  await loadMatched();
  logLocalActivity({
    entity: "client",
    entity_id: id,
    type: "match_status",
    label: `Property match marked as ${status}`,
  });
};

const onClientStatusChange = () => {
  setClientStatus(id, clientStatus.value);
  logLocalActivity({
    entity: "client",
    entity_id: id,
    type: "pipeline",
    label: `Client stage changed to ${CLIENT_PIPELINE_LABELS[clientStatus.value]}`,
  });
};

const addClientTask = () => {
  const row = addTask({
    entityType: "client",
    entityId: id,
    title: newTaskTitle.value,
    dueDate: newTaskDueDate.value || null,
  });
  logLocalActivity({
    entity: "client",
    entity_id: id,
    type: "task",
    label: `Task created: ${row.title}`,
  });
  newTaskTitle.value = "";
  newTaskDueDate.value = "";
  loadLocalCRMState();
};

const toggleClientTask = (taskId) => {
  const task = toggleTask(taskId);
  logLocalActivity({
    entity: "client",
    entity_id: id,
    type: "task",
    label: `Task ${task?.done ? "completed" : "reopened"}: ${task?.title || ""}`.trim(),
  });
  loadLocalCRMState();
};

const removeClientTask = (taskId) => {
  const task = clientTasks.value.find((x) => x.id === taskId);
  deleteTask(taskId);
  logLocalActivity({
    entity: "client",
    entity_id: id,
    type: "task",
    label: `Task deleted: ${task?.title || "Task"}`,
  });
  loadLocalCRMState();
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
    min_price: data.min_price,
    max_price: data.max_price,
    min_rooms: data.min_rooms,
    max_rooms: data.max_rooms,
    preferred_tags_input: (data.preferred_tags || []).join(", "),
  };
  loadLocalCRMState();
};

const openMatches = async (force = false) => {
  showMatches.value = true;
  matchesLoading.value = true;
  matchesError.value = "";
  aiHouseCards.value = [];
  selectedIndex.value = 0;

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
        return h && m ? { ...h, reason: m.reason, rank: m.rank, confidence: m.confidence } : null;
      })
      .filter(Boolean);

    aiHouseCards.value = aiHouseCards.value.filter(h => h.status !== "rejected");

    const rejectedSet = new Set(
      matched.value
        .filter(m => m.status === "rejected")
        .map(m => m.house.id)
    );

    aiHouseCards.value = aiHouseCards.value.filter(
      h => !rejectedSet.has(h.id)
    );
  } catch (e) {
    matchesError.value = e?.message || String(e);
  } finally {
    matchesLoading.value = false;
  }
};

const autoPopulateSuggestedMatches = async (force = false) => {
  if (!client.value?.id) return;
  autoMatching.value = true;

  try {
    const { data, error } = await supabase.functions.invoke("smart-match", {
      body: { client_id: client.value.id, force, top_n: settings.aiTopN },
    });
    if (error) throw error;

    const results = Array.isArray(data) ? data : [];
    if (!results.length) return;

    const ids = results
      .map((r) => r.house_id)
      .filter((v) => typeof v === "string" && v.length > 0);

    if (!ids.length) return;

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

    await loadMatched();
  } catch (e) {
    console.error("autoPopulateSuggestedMatches error:", e);
  } finally {
    autoMatching.value = false;
  }
};

const openHouse = (houseId) => router.push(`/houses/${houseId}`);

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

    aiHouseCards.value = aiHouseCards.value.filter((x) => x.id !== h.id);

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

    await openMatches(false);

    notifyMatchChanged(a.client_id, a.house_id);
  } catch (e) {
    console.error("undoLast error:", e);
    toast(e?.message || String(e), "error");
  }
};

const onKeydown = (e) => {
  if (!settings.shortcuts) return;
  if (!showMatches.value) return;
  if (!aiHouseCards.value.length) return;

  const max = aiHouseCards.value.length - 1;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, max);
      break;

    case "ArrowUp":
      e.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
      break;

    case "Enter":
      e.preventDefault();
      pickHouse(aiHouseCards.value[selectedIndex.value]);
      break;

    case "r":
    case "R":
      e.preventDefault();
      rejectHouse(aiHouseCards.value[selectedIndex.value]);
      break;

    case "u":
    case "U":
      e.preventDefault();
      undoLast();
      break;

    case "Escape":
      e.preventDefault();
      showMatches.value = false;
      break;
  }
};

const save = async () => {
  saving.value = true;
  error.value = "";
  ok.value = false;

  const { error: e } = await supabase
    .from("clients")
    .update({
      full_name: edit.value.full_name,
      phone: edit.value.phone || null,
      email: edit.value.email || null,
      notes: edit.value.notes || null,
      min_price: edit.value.min_price ?? null,
      max_price: edit.value.max_price ?? null,
      min_rooms: edit.value.min_rooms ?? null,
      max_rooms: edit.value.max_rooms ?? null,
      preferred_tags: (edit.value.preferred_tags_input || "")
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(Boolean),
    })
    .eq("id", id);

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

onMounted(async () => {
  await load();
  await loadMatched();
  await loadActivity();

  // Auto-run AI suggestions in the background and load them into the suggested area.
  if (client.value?.id) {
    await autoPopulateSuggestedMatches(false);
  }

  const handler = (e) => {
    if (e?.detail?.clientId === client.value?.id) {
      loadMatched();
      loadActivity();
    }
  };
  window.addEventListener("match-changed", handler);
  onBeforeUnmount(() => window.removeEventListener("match-changed", handler));

  window.addEventListener("keydown", onKeydown);
  onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
});
</script>
