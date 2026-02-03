<template>
  <div class="min-h-screen bg-zinc-950 text-white">
    <header class="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div class="font-bold">Real Estate CRM</div>

        <nav class="flex gap-2">
          <RouterLink
            to="/houses"
            class="px-3 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/5"
            active-class="bg-white/10"
          >
            Houses
          </RouterLink>
          <RouterLink
            to="/clients"
            class="px-3 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/5"
            active-class="bg-white/10"
          >
            Clients
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>
