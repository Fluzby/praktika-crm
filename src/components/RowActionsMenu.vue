<template>
  <div class="relative inline-block text-left" ref="rootEl">
    <button
      ref="triggerEl"
      type="button"
      class="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] grid place-items-center text-white/80"
      @click.stop="toggleMenu"
      :aria-label="t.row_actions"
      :title="t.actions"
    >
      ⋯
    </button>

    <teleport to="body">
      <div
        v-if="open"
        class="fixed w-40 rounded-xl p-1 z-[140] row-menu-panel"
        :style="menuStyle"
        @click.stop
      >
        <button class="menu-item" type="button" @click="emitAndClose('archive')">
          {{ archived ? t.unarchive : t.archive }}
        </button>
        <button class="menu-item menu-item-danger" type="button" @click="emitAndClose('delete')">{{ t.delete }}</button>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useT } from "../lib/i18n";

defineProps({
  archived: { type: Boolean, default: false },
});

const emit = defineEmits(["archive", "delete"]);
const t = useT();
const open = ref(false);
const rootEl = ref(null);
const triggerEl = ref(null);
const menuPos = ref({ top: 0, left: 0 });

const menuStyle = computed(() => ({
  top: `${menuPos.value.top}px`,
  left: `${menuPos.value.left}px`,
}));

const emitAndClose = (name) => {
  emit(name);
  open.value = false;
};

const positionMenu = () => {
  const el = triggerEl.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  menuPos.value = {
    top: r.bottom + 8,
    left: Math.max(8, r.right - 160),
  };
};

const toggleMenu = () => {
  open.value = !open.value;
  if (open.value) positionMenu();
};

const onDocClick = (e) => {
  if (!open.value) return;
  if (!rootEl.value) return;
  if (rootEl.value.contains(e.target)) return;
  open.value = false;
};

const onWindowLayout = () => {
  if (!open.value) return;
  positionMenu();
};

onMounted(() => {
  document.addEventListener("click", onDocClick);
  window.addEventListener("resize", onWindowLayout);
  window.addEventListener("scroll", onWindowLayout, true);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  window.removeEventListener("resize", onWindowLayout);
  window.removeEventListener("scroll", onWindowLayout, true);
});
</script>

<style scoped>
.menu-item {
  width: 100%;
  text-align: left;
  padding: 0.45rem 0.6rem;
  border-radius: 0.5rem;
  color: var(--shell-text, rgba(255, 255, 255, 0.9));
  font-size: 0.84rem;
}

.menu-item:hover {
  background: var(--shell-nav-hover, rgba(255, 255, 255, 0.08));
}

.menu-item-danger {
  color: #fca5a5;
}

.menu-item-danger:hover {
  background: rgba(239, 68, 68, 0.15);
}

.row-menu-panel {
  border: 1px solid var(--shell-border, rgba(255, 255, 255, 0.15));
  background: color-mix(in srgb, var(--shell-panel, rgba(0, 0, 0, 0.92)) 96%, transparent);
  box-shadow: var(--shell-shadow, 0 20px 40px rgba(0, 0, 0, 0.3));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>
