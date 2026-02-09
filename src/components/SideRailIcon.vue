<template>
  <RouterLink
    :to="to"
    class="iconBtn"
    active-class="iconBtnActive"
  >
    <slot />
  </RouterLink>
</template>

<script setup>
import { RouterLink } from "vue-router";

defineProps({
  to: { type: String, required: true },
});
</script>

<style scoped>
.iconBtn {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;

  border: 1px solid var(--nav-border);
  background: var(--nav-bg);
  color: var(--nav-text);

  transition: 160ms ease;
  font-size: 20px;
  line-height: 1;
}

.iconBtn:hover {
  background: var(--nav-bg-hover);
  border-color: var(--nav-border-hover);
}

.iconBtnActive {
  background: var(--nav-bg-active);
  border-color: var(--nav-border-active);
  color: var(--nav-text-active);
}

</style>
