<template>
  <button
    type="button"
    class="back-to-top focus:outline-none"
    :class="visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'"
    @click="scrollToTop"
    aria-label="Back to top"
    title="Back to top"
  >
    <span class="inline-flex items-center gap-2">
      <span class="text-base leading-none">↑</span>
      <span class="hidden sm:inline">Top</span>
    </span>
  </button>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, unref, watch } from "vue";

const props = defineProps({
  // Scroll container (AppLayout's <main>). Can be an element or a ref to an element.
  target: { type: [Object], default: null },
  threshold: { type: Number, default: 700 },
});

const visible = ref(false);

let cleanup = null;

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const getEl = () => {
  const t = unref(props.target);
  if (t && t.$el) return t.$el;
  return t || null;
};

const attach = () => {
  if (cleanup) cleanup();

  const el = getEl();
  if (!el || !el.addEventListener) return;

  const onScroll = () => {
    const top = el.scrollTop ?? 0;
    visible.value = top > props.threshold;
  };

  el.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  cleanup = () => el.removeEventListener("scroll", onScroll);
};

const scrollToTop = () => {
  const el = getEl();
  if (!el) return;
  el.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
};

onMounted(attach);
watch(() => props.target, attach);
watch(() => props.threshold, attach);

onBeforeUnmount(() => {
  if (cleanup) cleanup();
});
</script>
