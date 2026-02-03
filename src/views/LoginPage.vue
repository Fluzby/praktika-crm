<template>
  <div class="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 class="text-2xl font-bold">Login</h1>
      <p class="text-white/70 mt-2">Admin access</p>

      <form class="mt-6 space-y-3" @submit.prevent="login">
        <div>
          <label class="text-sm text-white/70">Email</label>
          <input class="input mt-1" v-model.trim="email" type="email" required />
        </div>

        <div>
          <label class="text-sm text-white/70">Password</label>
          <input class="input mt-1" v-model="password" type="password" required />
        </div>

        <button class="btn w-full" :disabled="loading">
          {{ loading ? "Signing in..." : "Sign in" }}
        </button>

        <p v-if="error" class="text-sm text-red-300">{{ error }}</p>
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

  if (e) return (error.value = e.message);
  router.push("/dashboard");
};
</script>
