<template>
  <RouterView />
</template>

<script setup>
import { RouterView } from "vue-router";
import { watch } from "vue";
import { settings, applyTheme } from "./lib/settings";

watch(() => settings.theme, applyTheme, { immediate: true });
</script>
