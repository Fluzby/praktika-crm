<template>
  <div class="h-screen overflow-hidden">
    <aside class="fixed left-6 top-6 bottom-6 w-[92px] z-50">
      <div class="glass h-full px-3 py-4 flex flex-col items-center">
        <SideRail />
      </div>
    </aside>

    <main class="h-screen overflow-y-auto overscroll-none pl-[132px]">
      <div class="max-w-6xl ml-0 mr-auto px-6 py-10">
        <RouterView />
      </div>
    </main>

  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import SideRail from "../components/SideRail.vue";
</script>
