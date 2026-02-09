<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{{ t.clients }}</h1>
        <p class="text-white/60 mt-1">{{ t.clients_subtitle }}</p>
      </div>

      <div class="flex items-center gap-2">
        <button class="btn-ghost" @click="load" :disabled="loading">{{ t.refresh }}</button>
        <button class="btn" @click="showAdd = true">+ {{ t.add }}</button>
      </div>
    </div>

    <div class="glass p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="flex-1">
          <input
            class="input"
            :placeholder="t.search_clients_placeholder"
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

    <div class="space-y-3">
      <div v-if="loading" class="text-white/60">{{ t.loading }}</div>
      <div v-else-if="error" class="text-red-300">{{ error }}</div>

      <ul v-else class="space-y-3">
        <li
          v-for="c in filtered"
          :key="c.id"
          class="glass-soft p-4 hover:bg-white/[0.05] transition cursor-pointer"
          @click="openClient(c.id)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="font-semibold truncate">
                {{ c.full_name }}
              </div>

              <div class="text-sm text-white/60 mt-1">
                {{ c.phone || "—" }}
                <span class="mx-2 text-white/30">•</span>
                {{ c.email || "—" }}
              </div>

              <div
                v-if="c.notes"
                class="mt-2 text-sm text-white/50 line-clamp-2"
              >
                {{ c.notes }}
              </div>
            </div>

            <div class="text-xs text-white/45 whitespace-nowrap">
              {{ formatDate(c.created_at) }}
            </div>
          </div>
        </li>

        <li v-if="filtered.length === 0" class="text-white/60">
          {{ t.no_clients_found }}
        </li>
      </ul>
    </div>

    <Modal
      :open="showAdd"
      :title="t.add_client"
      :subtitle="t.add_client_subtitle"
      @close="showAdd = false"
    >
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="createClientAndClose">
        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.full_name }} *</label>
          <input class="input mt-1" v-model.trim="form.full_name" required />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.phone }}</label>
          <input class="input mt-1" v-model.trim="form.phone" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.email }}</label>
          <input class="input mt-1" type="email" v-model.trim="form.email" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.notes }}</label>
          <textarea
            class="textarea mt-1"
            rows="4"
            v-model.trim="form.notes"
            :placeholder="t.notes_placeholder"
          ></textarea>
        </div>

        <div class="md:col-span-2 flex items-center gap-3 mt-2">
          <button class="btn" :disabled="creating">
            {{ creating ? t.saving : t.save }}
          </button>
          <button type="button" class="btn-ghost" @click="showAdd = false">
            {{ t.cancel }}
          </button>

          <p v-if="createError" class="text-sm text-red-300">{{ createError }}</p>
          <p v-if="createOk" class="text-sm text-green-300">{{ t.saved }}</p>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import Modal from "../components/Modal.vue";
import { useT } from "../lib/i18n";

const router = useRouter();

const clients = ref([]);
const loading = ref(false);
const error = ref("");

const q = ref("");
const showAdd = ref(false);

const creating = ref(false);
const createError = ref("");
const createOk = ref(false);

const form = ref({
  full_name: "",
  phone: "",
  email: "",
  notes: "",
});

const t = useT();

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
};

const openClient = (id) => router.push(`/clients/${id}`);

const filtered = computed(() => {
  const term = q.value.toLowerCase();
  if (!term) return clients.value;

  return clients.value.filter((c) => {
    const hay = [
      c.full_name,
      c.phone,
      c.email,
      c.notes,
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
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (e) throw e;
    clients.value = data || [];
  } catch (err) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
};

const createClient = async () => {
  creating.value = true;
  createError.value = "";
  createOk.value = false;

  try {
    const payload = {
      full_name: form.value.full_name,
      phone: form.value.phone || null,
      email: form.value.email || null,
      notes: form.value.notes || null,
    };

    const { data: clientRow, error: e } = await supabase.from("clients").insert(payload).select().single();
    if (e) throw e;

    await logActivity({ type: "create", entity: "client", entity_id: clientRow.id, label: payload.full_name });

    form.value = { full_name: "", phone: "", email: "", notes: "" };
    await load();

    createOk.value = true;
    setTimeout(() => (createOk.value = false), 1200);
  } catch (err) {
    createError.value = err?.message || String(err);
  } finally {
    creating.value = false;
  }
};

const createClientAndClose = async () => {
  await createClient();
  if (!createError.value) showAdd.value = false;
};

onMounted(load);
</script>
