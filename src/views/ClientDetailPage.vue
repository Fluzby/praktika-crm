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

    <Modal
      :open="showMatches"
      title="Matching houses"
      @close="showMatches = false"
    >
      <ul class="space-y-2">
        <li
          v-for="h in matches"
          :key="h.id"
          class="glass-soft p-3 hover:bg-white/[0.05] cursor-pointer"
          @click="openHouse(h.id)"
        >
          <div class="font-semibold">{{ h.address }}</div>
          <div class="text-sm text-white/60">
            {{ h.rooms }} rooms • €{{ h.price }}
          </div>
        </li>

        <li v-if="matches.length === 0" class="text-white/60">
          No matches found.
        </li>
      </ul>
    </Modal>
  </div>

  <div v-else class="text-white/60">Loading…</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
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
const matches = ref([]);

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
  };
};

const findMatches = async () => {
  let q = supabase.from("houses").select("*");

  if (client.value.min_price)
    q = q.gte("price", client.value.min_price);

  if (client.value.max_price)
    q = q.lte("price", client.value.max_price);

  if (client.value.min_rooms)
    q = q.gte("rooms", client.value.min_rooms);

  if (client.value.max_rooms)
    q = q.lte("rooms", client.value.max_rooms);

  const { data, error: e } = await q.limit(20);

  if (e) return;

  matches.value = (data || []).map((h) => {
    const overlap =
      client.value.preferred_tags?.filter((t) => h.tags?.includes(t)).length || 0;

    return { ...h, score: overlap };
  }).sort((a, b) => b.score - a.score);
};

const openMatches = async () => {
  showMatches.value = true;
  await findMatches();
};

const openHouse = (houseId) => router.push(`/houses/${houseId}`);

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
    })
    .eq("id", id);

  saving.value = false;

  if (e) return (error.value = e.message);

  await supabase.from("activity_log").insert({
    type: "update",
    entity: "client",
    entity_id: id,
  });

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
