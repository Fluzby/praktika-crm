<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="w-full max-w-sm px-6">
      <h1 class="text-xl font-semibold tracking-tight">
        Login
      </h1>

      <p class="text-sm text-white/60 mt-1">
        Admin access
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="login">
        <div>
          <label class="text-sm text-white/60">Email</label>
          <input
            type="email"
            class="input mt-1"
            v-model.trim="email"
            required
          />
        </div>

        <div>
          <label class="text-sm text-white/60">Password</label>
          <input
            type="password"
            class="input mt-1"
            v-model.trim="password"
            required
          />
        </div>

        <button
          class="btn w-full mt-2"
          :disabled="loading"
        >
          {{ loading ? "Signing in…" : "Sign in" }}
        </button>

        <p v-if="error" class="text-sm text-red-300 mt-2">
          {{ error }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const login = async () => {
  loading.value = true;
  error.value = "";

  const { error: e } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  loading.value = false;

  if (e) {
    error.value = e.message;
    return;
  }

  router.push("/dashboard");
};
</script>
