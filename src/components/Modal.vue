<template>
  <teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc="close"
      tabindex="-1"
    >
      <div
        class="absolute inset-0"
        :class="settings.aiModalStrong ? 'bg-black/70 backdrop-blur-md' : 'bg-black/50 backdrop-blur-sm'"
        @click="close"
      ></div>

      <div
        class="relative w-full max-w-2xl rounded-2xl border border-white/10 p-5"
        :class="settings.aiModalStrong ? 'bg-black/85 backdrop-blur-xl' : 'bg-black/70 backdrop-blur-lg'"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold">{{ title }}</h2>
            <p v-if="subtitle" class="text-sm text-white/60 mt-1">{{ subtitle }}</p>
          </div>

          <button
            class="h-10 w-10 rounded-xl border border-white/10 hover:bg-white/10 grid place-items-center"
            @click="close"
            :aria-label="t.close"
          >
            ✕
          </button>
        </div>

        <div class="mt-4">
          <slot />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { settings } from "../lib/settings";
import { useT } from "../lib/i18n";

const props = defineProps({
  open: Boolean,
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
});

const emit = defineEmits(["close"]);

const close = () => emit("close");
const t = useT();
</script>
