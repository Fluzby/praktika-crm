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
  min-height: 42px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border-radius: 12px;
  padding: 0.45rem 0.55rem;
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
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 0;
  display: grid;
  place-items: center;
  font-size: 1.05rem;
  line-height: 1;
  background: transparent;
  border: 0;
  flex-shrink: 0;
}

.shell-nav-item-label {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

.shell-nav-item-icon-img {
  width: 1.1rem;
  height: 1.1rem;
  object-fit: contain;
  display: block;
}

.shell-nav-item-icon-img.is-force-white {
  filter: brightness(0) invert(1);
}

.shell-nav-item-icon-img.is-zoomed {
  width: 1.15rem;
  height: 1.15rem;
}

.shell-nav-item-active {
  background: color-mix(in srgb, var(--shell-accent) 10%, transparent);
  border-color: color-mix(in srgb, var(--shell-accent) 22%, transparent);
  color: var(--shell-text-strong);
  border-radius: 12px;
}

.shell-nav-item-active .shell-nav-item-icon {
  background: transparent;
  border-color: transparent;
}

.shell-nav-item.is-collapsed {
  justify-content: center;
  width: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  margin-inline: auto;
  border-radius: 12px;
}

.shell-nav-item.is-collapsed .shell-nav-item-icon {
  width: 1.1rem;
  height: 1.1rem;
}
</style>
