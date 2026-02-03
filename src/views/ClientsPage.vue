<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-2xl font-bold">Clients</h1>
        <p class="text-white/70">Contacts and notes.</p>
      </div>
      <button class="px-3 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/10" @click="load">
        Refresh
      </button>
    </div>

    <!-- Add Client -->
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 class="font-semibold">Add client</h2>

      <form class="mt-4 grid gap-3 md:grid-cols-2" @submit.prevent="createClient">
        <div>
          <label class="text-sm text-white/70">Full name *</label>
          <input class="input mt-1" v-model.trim="form.full_name" required />
        </div>

        <div>
          <label class="text-sm text-white/70">Phone</label>
          <input class="input mt-1" v-model.trim="form.phone" />
        </div>

        <div>
          <label class="text-sm text-white/70">Email</label>
          <input class="input mt-1" v-model.trim="form.email" type="email" />
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/70">Notes</label>
          <textarea class="textarea mt-1" rows="3" v-model.trim="form.notes"></textarea>
        </div>

        <div class="md:col-span-2 flex items-center gap-3">
          <button class="btn" :disabled="creating">
            {{ creating ? "Saving..." : "Save client" }}
          </button>
          <p v-if="createError" class="text-sm text-red-300">{{ createError }}</p>
          <p v-if="createOk" class="text-sm text-green-300">Saved ✅</p>
        </div>
      </form>
    </div>

    <!-- List -->
    <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div v-if="loading" class="text-white/70">Loading…</div>
      <div v-else-if="error" class="text-red-300">{{ error }}</div>

      <ul v-else class="space-y-2">
        <li v-for="c in clients" :key="c.id" class="rounded-xl border border-white/10 bg-white/5 p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold">{{ c.full_name }}</div>
              <div class="text-sm text-white/70 mt-1">
                {{ c.phone || "—" }} • {{ c.email || "—" }}
              </div>
              <div v-if="c.notes" class="text-sm text-white/60 mt-1">
                {{ c.notes }}
              </div>
            </div>

            <button
              class="text-sm px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10"
              @click="removeClient(c.id)"
            >
              Delete
            </button>
          </div>
        </li>

        <li v-if="clients.length === 0" class="text-white/60">
          No clients yet.
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabase";

const clients = ref([]);
const loading = ref(false);
const error = ref("");

const creating = ref(false);
const createError = ref("");
const createOk = ref(false);

const form = ref({
  full_name: "",
  phone: "",
  email: "",
  notes: "",
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

    const { error: e } = await supabase.from("clients").insert(payload);
    if (e) throw e;

    form.value = { full_name: "", phone: "", email: "", notes: "" };
    await load();
    createOk.value = true;
    setTimeout(() => (createOk.value = false), 1500);
  } catch (err) {
    createError.value = err?.message || String(err);
  } finally {
    creating.value = false;
  }
};

const removeClient = async (id) => {
  if (!confirm("Delete this client?")) return;
  const { error: e } = await supabase.from("clients").delete().eq("id", id);
  if (e) alert(e.message);
  await load();
};

onMounted(load);
</script>
