<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="w-full max-w-sm px-6">
      <h1 class="text-xl font-semibold tracking-tight">
        {{ t.login }}
      </h1>

      <p class="text-sm text-white/60 mt-1">
        {{ t.admin_access }}
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="login">
        <div>
          <label class="text-sm text-white/60">{{ t.email_or_username }}</label>
          <input
            class="input mt-1"
            v-model.trim="username"
            required
          />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.password }}</label>
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
          {{ loading ? t.signing_in : t.sign_in }}
        </button>

        <p v-if="errorMsg" class="text-sm text-red-300 mt-2">
          {{ errorMsg }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { useT } from "../lib/i18n";

const router = useRouter();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

const t = useT();

const login = async () => {
  loading.value = true;
  errorMsg.value = "";

  try {
    const input = username.value.trim();
    let email = input;

    if (!input.includes("@")) {
      const { data, error } = await supabase.functions.invoke("username-email", {
        body: { username: input },
      });

      if (error || !data?.email) {
        throw new Error("Invalid username or password");
      }

      email = data.email;
    }

    const res = await supabase.auth.signInWithPassword({
      email,
      password: password.value,
    });

    if (res.error) throw res.error;
  } catch (e) {
    errorMsg.value = "Invalid username or password";
    return;
  } finally {
    loading.value = false;
  }

  router.push("/dashboard");
};
</script>
