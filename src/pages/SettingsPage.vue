<script setup>
import { settings } from "../lib/settings";
import { useT } from "../lib/i18n";

const t = useT();
</script>

<template>
  <div class="space-y-4">
    <div class="text-xl font-semibold">{{ t.settings }}</div>

    <div class="glass-soft p-4 space-y-4">
      <div>
        <div class="text-sm text-white/70">{{ t.language }}</div>
        <div class="mt-2 flex gap-2">
          <button
            class="btn-ghost"
            :class="settings.lang === 'en' ? 'ring-1 ring-white/20' : ''"
            @click="settings.lang = 'en'"
          >
            English
          </button>
          <button
            class="btn-ghost"
            :class="settings.lang === 'et' ? 'ring-1 ring-white/20' : ''"
            @click="settings.lang = 'et'"
          >
            Eesti
          </button>
        </div>
      </div>

      <div>
        <div class="text-sm text-white/70">{{ t.theme }}</div>
        <div class="mt-2 flex gap-2">
          <button
            class="btn-ghost"
            :class="settings.theme === 'dark' ? 'ring-1 ring-white/20' : ''"
            @click="settings.theme = 'dark'"
          >
            {{ t.dark }}
          </button>
          <button
            class="btn-ghost"
            :class="settings.theme === 'light' ? 'ring-1 ring-white/20' : ''"
            @click="settings.theme = 'light'"
          >
            {{ t.light }}
          </button>
          <button
            class="btn-ghost"
            :class="settings.theme === 'glass' ? 'ring-1 ring-white/20' : ''"
            @click="settings.theme = 'glass'"
          >
            {{ t.glass }}
          </button>
          <button
            class="btn-ghost"
            :class="settings.theme === 'warm' ? 'ring-1 ring-white/20' : ''"
            @click="settings.theme = 'warm'"
          >
            {{ t.warm }}
          </button>
          <button
            class="btn-ghost"
            :class="settings.theme === 'brutalist' ? 'ring-1 ring-white/20' : ''"
            @click="settings.theme = 'brutalist'"
          >
            {{ t.brutalist }}
          </button>
          <button
            class="btn-ghost"
            :class="settings.theme === 'plain' ? 'ring-1 ring-white/20' : ''"
            @click="settings.theme = 'plain'"
          >
            {{ t.plain }}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm">{{ t.ai_modal_readability }}</div>
          <div class="text-xs text-white/50">{{ t.ai_modal_readability_help }}</div>
        </div>
        <input type="checkbox" v-model="settings.aiModalStrong" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm">{{ t.shortcuts }}</div>
          <div class="text-xs text-white/50">{{ t.shortcuts_help }}</div>
        </div>
        <input type="checkbox" v-model="settings.shortcuts" />
      </div>

      <div>
        <div class="text-sm text-white/70">{{ t.ai_top_n }}</div>
        <select class="input mt-2" v-model.number="settings.aiTopN">
          <option :value="3">3</option>
          <option :value="5">5</option>
          <option :value="10">10</option>
        </select>
      </div>

      <div>
        <div class="text-sm text-white/70">{{ t.dashboard_widgets }}</div>
        <div class="mt-2 space-y-2">
          <label class="flex items-center justify-between text-sm">
            <span>{{ t.widget_overview }}</span>
            <input type="checkbox" v-model="settings.dashboardWidgets.overview" />
          </label>
          <label class="flex items-center justify-between text-sm">
            <span>{{ t.widget_latest_listings }}</span>
            <input type="checkbox" v-model="settings.dashboardWidgets.latest_listings" />
          </label>
          <label class="flex items-center justify-between text-sm">
            <span>{{ t.widget_recent_clients }}</span>
            <input type="checkbox" v-model="settings.dashboardWidgets.recent_clients" />
          </label>
          <label class="flex items-center justify-between text-sm">
            <span>{{ t.widget_recent_activity }}</span>
            <input type="checkbox" v-model="settings.dashboardWidgets.recent_activity" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
