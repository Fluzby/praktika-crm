<template>
  <div v-if="client" class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ client.full_name }}
        </h1>
        <p class="text-sm text-white/60 mt-1">
          Client record
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="load">Refresh</button>
        <button class="btn-ghost" @click="openMatches">Match houses</button>
        <button
          class="px-4 py-2 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10"
          @click="remove"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Main layout -->
    <div class="grid grid-cols-12 gap-6">
      <!-- LEFT -->
      <section class="col-span-12 lg:col-span-8 space-y-6">
        <!-- Details -->
        <div class="glass p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-4">
            Details
          </h2>

          <form class="grid gap-4 md:grid-cols-2" @submit.prevent="save">
            <div class="md:col-span-2">
              <label class="text-sm text-white/60">Full name *</label>
              <input class="input mt-1" v-model.trim="edit.full_name" required />
            </div>

            <div>
              <label class="text-sm text-white/60">Phone</label>
              <input class="input mt-1" v-model.trim="edit.phone" />
            </div>

            <div>
              <label class="text-sm text-white/60">Email</label>
              <input class="input mt-1" type="email" v-model.trim="edit.email" />
            </div>

            <div class="md:col-span-2 flex items-center gap-3 mt-2">
              <button class="btn" :disabled="saving">
                {{ saving ? "Saving…" : "Save changes" }}
              </button>

              <span
                v-if="ok"
                class="text-xs text-emerald-400"
              >
                Changes saved
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

        <!-- Notes -->
        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            Notes
          </h2>

          <textarea
            class="textarea"
            rows="5"
            v-model.trim="edit.notes"
            placeholder="Internal notes, preferences, reminders…"
          />
        </div>

        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">Matching preferences</h2>

          <div class="grid gap-3 md:grid-cols-2">
            <div>
              <label class="text-sm text-white/60">Min price (€)</label>
              <input class="input mt-1" type="number" v-model.number="edit.min_price" />
            </div>

            <div>
              <label class="text-sm text-white/60">Max price (€)</label>
              <input class="input mt-1" type="number" v-model.number="edit.max_price" />
            </div>

            <div>
              <label class="text-sm text-white/60">Min rooms</label>
              <input class="input mt-1" type="number" v-model.number="edit.min_rooms" />
            </div>

            <div>
              <label class="text-sm text-white/60">Max rooms</label>
              <input class="input mt-1" type="number" v-model.number="edit.max_rooms" />
            </div>

            <div class="md:col-span-2">
              <label class="text-sm text-white/60">Preferred tags</label>
              <input class="input mt-1" placeholder="garden, garage, modern"
                     v-model.trim="edit.preferred_tags_input" />
            </div>
          </div>
        </div>
      </section>

      <!-- RIGHT -->
      <aside class="col-span-12 lg:col-span-4 space-y-6">
        <div class="glass-soft p-6">
          <h2 class="text-sm font-semibold text-white/80 mb-3">
            Metadata
          </h2>

          <div class="text-sm text-white/60 space-y-1">
            <div>
              Created:
              <span class="text-white/80">
                {{ formatDate(client.created_at) }}
              </span>
            </div>
            <div>
              Updated:
              <span class="text-white/80">
                {{ formatDate(client.updated_at) }}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <Modal :open="showMatches" title="Top AI Matches" @close="showMatches=false">
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
          class="glass-soft rounded-xl p-3 max-h-[420px] overflow-y-auto space-y-2"
        >
          <div
            v-for="h in aiHouseCards"
            :key="h.id"
            class="rounded-lg border border-white/10 p-3 hover:bg-white/[0.04] cursor-pointer transition"
            :class="h.rank === 1 ? 'ring-1 ring-amber-400/30' : ''"
          >
            <div class="flex items-center justify-between">
              <div class="font-medium truncate">
                {{ h.address }}
              </div>

              <span
                v-if="h.rank <= 3"
                class="text-xs px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-200"
              >
                ✨ Top {{ h.rank }}
              </span>
            </div>

            <div class="text-xs text-white/60 mt-1">
              {{ h.city || "—" }} • {{ h.rooms ?? "?" }} rooms • €{{ h.price ?? "—" }}
            </div>

            <div
              v-if="h.reason"
              class="text-xs text-white/50 leading-relaxed mt-2"
            >
              {{ h.reason }}
            </div>

            <div class="flex justify-end mt-3 gap-2">
              <button
                class="text-xs px-3 py-1 rounded-md bg-red-500/15 text-red-200 hover:bg-red-500/25"
                @click.stop="rejectHouse(h)"
              >
                Reject / Hide
              </button>

              <button
                class="text-xs px-3 py-1 rounded-md"
                :class="h._picked
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'"
                :disabled="h._picked"
                @click.stop="pickHouse(h)"
              >
                {{ h._picked ? "Picked" : "Pick for client" }}
              </button>

              <button
                class="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
                @click.stop="$router.push(`/houses/${h.id}`)"
              >
                View house
              </button>
            </div>
          </div>

          <div v-if="!aiHouseCards.length" class="text-white/60 text-sm">
            No good matches found.
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-between w-full">
          <button class="btn-ghost" @click="openMatches(true)">Re-run AI</button>

          <button
            class="btn-ghost"
            :disabled="!lastAction"
            @click="undoLast"
          >
            Undo
          </button>
        </div>
      </template>
    </Modal>
  </div>

  <div v-else class="text-white/60">Loading…</div>

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
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import Modal from "../components/Modal.vue";

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

const toastMsg = ref("");
const toastType = ref("info");
let toastTimer = null;

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
};

const openMatches = async (force = false) => {
  showMatches.value = true;
  matchesLoading.value = true;
  matchesError.value = "";
  aiHouseCards.value = [];

  try {
    const { data, error } = await supabase.functions.invoke("smart-match", {
      body: { client_id: client.value.id, force },
    });

    if (error) throw error;

    const results = Array.isArray(data) ? data : [];
    if (!results.length) return;

    const isUuid = (s) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    const ids = results.map(r => r.house_id).filter(isUuid);
    const meta = new Map(results.map((r, i) => [r.house_id, { reason: r.reason, rank: i + 1 }]));

    const { data: houses, error: hErr } = await supabase
      .from("houses")
      .select("id,address,city,price,rooms,tags")
      .in("id", ids);

    if (hErr) throw hErr;

    const byId = new Map((houses || []).map(h => [h.id, h]));
    aiHouseCards.value = ids
      .slice(0, 5)
      .map(id => byId.get(id) && ({ ...byId.get(id), ...meta.get(id) }))
      .filter(Boolean);

    aiHouseCards.value = aiHouseCards.value.filter(h => h.status !== "rejected");
  } catch (e) {
    matchesError.value = e?.message || String(e);
  } finally {
    matchesLoading.value = false;
  }
};

const openHouse = (houseId) => router.push(`/houses/${houseId}`);

const notifyMatchChanged = (clientId, houseId) => {
  window.dispatchEvent(new CustomEvent("match-changed", {
    detail: { clientId, houseId },
  }));
};

const pickHouse = async (h) => {
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
      },
      { onConflict: "client_id,house_id" }
    );

    if (error) throw error;

    h._picked = true;
    h.status = "contacted";

    toast("Picked for client ✅", "success");
    notifyMatchChanged(client.value.id, h.id);
  } catch (e) {
    console.error("pickHouse error:", e);
    toast(e?.message || String(e), "error");
  }
};

const rejectHouse = async (h) => {
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
      },
      { onConflict: "client_id,house_id" }
    );

    if (error) throw error;

    toast("Rejected (hidden) 🟥", "info");

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

    toast("Undo ✅", "info");

    await openMatches(false);

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

  ok.value = true;
  setTimeout(() => (ok.value = false), 1200);
};

const remove = async () => {
  if (!confirm("Delete this client?")) return;
  await supabase.from("clients").delete().eq("id", id);
  router.push("/clients");
};

onMounted(load);
</script>
