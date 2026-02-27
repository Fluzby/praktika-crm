import { onBeforeUnmount, watchEffect, ref } from "vue";

export const topbarActions = ref([]);

export function useTopbarActions(factory) {
  const stop = watchEffect(() => {
    const next = typeof factory === "function" ? factory() : [];
    topbarActions.value = Array.isArray(next) ? next : [];
  });

  onBeforeUnmount(() => {
    stop();
    topbarActions.value = [];
  });
}

