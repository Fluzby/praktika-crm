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

  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.9);

  transition: 160ms ease;
  font-size: 20px;
  line-height: 1;
}

.iconBtn:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.14);
}

.iconBtnActive {
  background: rgba(16,185,129,0.16);
  border-color: rgba(16,185,129,0.35);
}
</style>
