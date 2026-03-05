<template>
  <RouterLink
    :to="to"
    class="shell-nav-item"
    :class="collapsed ? 'is-collapsed' : ''"
    active-class="shell-nav-item-active"
    @click="$emit('click')"
  >
    <span class="shell-nav-item-icon" aria-hidden="true">
      <img
        v-if="iconSrc"
        class="shell-nav-item-icon-img"
        :class="{ 'is-force-white': forceWhite, 'is-zoomed': zoom }"
        :src="iconSrc"
        :alt="label"
      />
      <slot v-else>{{ icon }}</slot>
    </span>
    <span v-if="!collapsed" class="shell-nav-item-label">{{ label }}</span>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from "vue-router";

defineProps({
  to: { type: String, required: true },
  icon: { type: String, default: "" },
  iconSrc: { type: String, default: "" },
  forceWhite: { type: Boolean, default: false },
  zoom: { type: Boolean, default: false },
  label: { type: String, default: "" },
  collapsed: { type: Boolean, default: false },
});

defineEmits(["click"]);
</script>

<style scoped>
.shell-nav-item {
  min-height: 46px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border-radius: 12px;
  padding: 0.55rem 0.7rem;
  border: 1px solid transparent;
  color: var(--shell-text);
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
  text-decoration: none;
}

.shell-nav-item:hover {
  background: var(--shell-nav-hover);
  border-color: var(--shell-border-soft);
}

.shell-nav-item:active {
  transform: translateY(1px);
}

.shell-nav-item-icon {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 1rem;
  line-height: 1;
  background: var(--shell-nav-icon-bg);
  border: 1px solid var(--shell-border-soft);
  flex-shrink: 0;
}

.shell-nav-item-label {
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
}

.shell-nav-item-icon-img {
  width: 1rem;
  height: 1rem;
  object-fit: contain;
  display: block;
}

.shell-nav-item-icon-img.is-force-white {
  filter: brightness(0) invert(1);
}

.shell-nav-item-icon-img.is-zoomed {
  width: 1.2rem;
  height: 1.2rem;
}

.shell-nav-item-active {
  background: var(--shell-nav-active-bg);
  border-color: var(--shell-nav-active-border);
  color: var(--shell-text-strong);
}

.shell-nav-item-active .shell-nav-item-icon {
  background: var(--shell-accent-soft);
  border-color: var(--shell-nav-active-border);
}

.shell-nav-item.is-collapsed {
  justify-content: center;
  padding-inline: 0.4rem;
}

.shell-nav-item.is-collapsed .shell-nav-item-icon {
  width: 2rem;
  height: 2rem;
}
</style>
