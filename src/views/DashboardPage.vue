<template>
  <div class="space-y-6">
    <div class="grid grid-cols-12 gap-6">
      <section class="col-span-12 lg:col-span-8 space-y-6">
        <div v-if="settings.dashboardWidgets.overview" class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm text-white/60">{{ t.overview }}</div>
              <div class="text-lg font-semibold mt-1">{{ t.today }}</div>
            </div>

            <div class="text-xs text-white/50" v-if="error">{{ error }}</div>
          </div>

          <div class="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">{{ t.clients }}</div>
              <div class="text-2xl font-semibold mt-1">{{ clientsCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">{{ t.total }}</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">{{ t.houses }}</div>
              <div class="text-2xl font-semibold mt-1">{{ housesCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">{{ t.total }}</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">{{ t.photos }}</div>
              <div class="text-2xl font-semibold mt-1">{{ photosCount ?? "—" }}</div>
              <div class="text-xs text-white/45 mt-1">{{ t.stored }}</div>
            </div>

            <div class="glass-soft p-4">
              <div class="text-xs text-white/60">{{ t.last_update }}</div>
              <div class="text-2xl font-semibold mt-1">{{ lastUpdated }}</div>
              <div class="text-xs text-white/45 mt-1">{{ t.local }}</div>
            </div>
          </div>
        </div>

        <!-- KPI widget removed (Active clients / Matches / Cold houses / AI efficiency) -->

        <div v-if="settings.dashboardWidgets.house_availability" class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ t.widget_house_availability }}</h2>
              <p class="text-sm text-white/60 mt-1">{{ t.houses }}</p>
            </div>
          </div>

          <div class="mt-5 flex flex-col md:flex-row md:items-center gap-6">
            <div class="shrink-0 grid place-items-center">
              <svg width="120" height="120" viewBox="0 0 120 120" class="overflow-visible">
                <g transform="translate(60,60) rotate(-90)">
                  <circle
                    r="42"
                    cx="0"
                    cy="0"
                    fill="transparent"
                    stroke="var(--nav-border)"
                    stroke-width="14"
                  />
                  <circle
                    v-for="s in availabilitySegments"
                    :key="s.key"
                    r="42"
                    cx="0"
                    cy="0"
                    fill="transparent"
                    :stroke="s.color"
                    stroke-width="14"
                    stroke-linecap="round"
                    :stroke-dasharray="s.dasharray"
                    :stroke-dashoffset="s.dashoffset"
                  />
                </g>
              </svg>
              <div class="text-sm text-white/60 -mt-2">
                {{ availabilityTotal }} {{ t.total }}
              </div>
            </div>

            <div class="flex-1 grid gap-2 text-sm">
              <div v-for="s in availabilityLegend" :key="s.key" class="flex items-center justify-between gap-6">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ background: s.color }"></span>
                  <span class="truncate">{{ s.label }}</span>
                </div>
                <div class="tabular-nums text-white/60">{{ s.count ?? "—" }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="settings.dashboardWidgets.latest_listings" class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ t.latest_listings }}</h2>
              <p class="text-sm text-white/60 mt-1">{{ t.recent_houses_subtitle }}</p>
            </div>
            <RouterLink to="/houses" class="text-sm text-white/60 hover:text-white">
              {{ t.open }} →
            </RouterLink>
          </div>

          <div v-if="loading" class="mt-5 text-white/60">{{ t.loading }}</div>

          <ul v-else class="mt-5 space-y-2">
            <li
              v-for="h in recentHouses"
              :key="h.id"
              class="rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-white/[0.05] transition"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <RouterLink :to="`/houses/${h.id}`" class="font-semibold hover:underline">
                    {{ h.address }}
                  </RouterLink>
                  <div class="text-sm text-white/60 mt-1">
                    {{ h.city || "—" }} • {{ h.rooms ?? "?" }} rooms • €{{ h.price ?? "—" }}
                  </div>
                </div>

                <div class="flex flex-col items-end gap-2">
                  <span class="chip inline-flex items-center gap-2" :style="availabilityChipStyle(h.availability)">
                    <span class="h-2 w-2 rounded-full" :style="{ background: availabilityColor(h.availability) }"></span>
                    <span>{{ availabilityLabel(h.availability) }}</span>
                  </span>
                  <span class="chip">{{ formatDate(h.created_at) }}</span>
                </div>
              </div>
            </li>

            <li v-if="recentHouses.length === 0" class="text-white/60">
              {{ t.no_houses_found }}
            </li>
          </ul>
        </div>
      </section>

      <aside class="col-span-12 lg:col-span-4 space-y-6">
        <div v-if="settings.dashboardWidgets.recent_activity" class="glass-soft p-6">
          <div
            class="mb-5 relative rounded-2xl border p-4"
            style="border-color: var(--shell-border-soft); background: color-mix(in srgb, var(--shell-card) 84%, transparent);"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="font-semibold" style="color: var(--shell-text-strong);">{{ t.calendar }}</h2>
                <div class="text-sm mt-0.5" style="color: var(--shell-text-muted);">{{ dashboardMonthLabel }}</div>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn-ghost text-xs px-2.5 py-1.5" type="button" @click="dashboardGoToday">{{ t.today }}</button>
                <button class="h-8 w-8 rounded-lg border" style="border-color: var(--shell-border-soft); background: color-mix(in srgb, var(--shell-card) 88%, transparent); color: var(--shell-text);" type="button" @click="dashboardPrevMonth">←</button>
                <button class="h-8 w-8 rounded-lg border" style="border-color: var(--shell-border-soft); background: color-mix(in srgb, var(--shell-card) 88%, transparent); color: var(--shell-text);" type="button" @click="dashboardNextMonth">→</button>
                <RouterLink to="/calendar" class="btn-ghost text-xs px-2.5 py-1.5">{{ t.open }}</RouterLink>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-7 gap-1.5">
              <div
                v-for="d in calendarWeekdays"
                :key="`h-${d}`"
                class="text-center py-1 text-[10px] uppercase tracking-[0.12em]"
                style="color: var(--shell-text-muted);"
              >
                {{ d }}
              </div>
              <button
                v-for="day in dashboardCalendarCells"
                :key="day.key"
                class="relative h-11 rounded-xl border text-left px-2 pt-1.5 transition"
                :class="dashboardDayClass(day)"
                :style="dashboardDayStyle(day)"
                @click="openDashboardDate(day)"
                type="button"
                :disabled="!day.active"
              >
                <div class="text-xs font-medium">{{ day.dayNum || "" }}</div>
                <div
                  v-if="day.taskCount"
                  class="absolute right-1.5 bottom-1 rounded px-1 py-0.5 text-[10px] leading-none"
                  style="background: rgba(26,115,232,0.18); color: #1a73e8;"
                >
                  {{ formatTaskCount(day.taskCount) }}
                </div>
              </button>
            </div>

            <div
              v-if="dashboardSelectedDate"
              class="mt-3 rounded-xl border p-3"
              style="border-color: var(--shell-border-soft); background: color-mix(in srgb, var(--shell-card) 90%, transparent);"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs" style="color: var(--shell-text-muted);">{{ t.selected }}: {{ dashboardSelectedDate }}</div>
                <button class="btn-ghost text-xs px-2 py-1" type="button" @click="dashboardSelectedDate = ''">{{ t.close }}</button>
              </div>
              <div class="space-y-2 max-h-44 overflow-y-auto pr-1 text-xs">
                <div
                  v-for="event in dashboardSelectedItems.events"
                  :key="`ev-${event.id}`"
                  class="rounded-md border px-2 py-1.5"
                  style="border-color: var(--shell-border-soft);"
                  :style="dashboardDayStyle({ active: true, events: [event] })"
                >
                  <div class="font-medium">◆ {{ event.title }}</div>
                  <div v-if="event.note" class="opacity-80 mt-0.5 whitespace-pre-wrap">{{ event.note }}</div>
                </div>
                <div
                  v-for="task in dashboardSelectedItems.tasks"
                  :key="`tk-${task.id}`"
                  class="rounded-md border px-2 py-1.5"
                  style="border-color: var(--shell-border-soft);"
                  :class="task.entityId ? 'cursor-pointer hover:bg-white/[0.05]' : ''"
                  @click="task.entityId && openTaskEntity(task)"
                >
                  <div class="font-medium">• {{ task.title }}</div>
                  <div class="opacity-70 flex items-center justify-between gap-2">
                    <span>{{ task.entityType }}</span>
                    <button
                      v-if="task.entityId"
                      class="btn-ghost text-[11px] px-2 py-1"
                      type="button"
                      @click.stop="openTaskEntity(task)"
                    >
                      {{ t.open }}
                    </button>
                  </div>
                </div>
                <div
                  v-if="!dashboardSelectedItems.events.length && !dashboardSelectedItems.tasks.length"
                  style="color: var(--shell-text-muted);"
                >
                  {{ t.no_items_for_day }}
                </div>
              </div>
            </div>
          </div>

          <div class="mb-5">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ t.follow_ups }}</h2>
              <span class="text-xs text-white/50">{{ taskSummary.totalOpen }} {{ t.open }}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 mt-3 text-sm">
              <div class="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <div class="text-xs text-white/50">{{ t.overdue }}</div>
                <div class="font-semibold text-lg leading-tight mt-1">{{ taskSummary.overdue }}</div>
                <div class="text-[11px] text-white/45 mt-1">{{ t.needs_attention }}</div>
              </div>
              <div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <div class="text-xs text-white/50">{{ t.today }}</div>
                <div class="font-semibold text-lg leading-tight mt-1">{{ taskSummary.today }}</div>
                <div class="text-[11px] text-white/45 mt-1">{{ t.due_now }}</div>
              </div>
              <div class="rounded-xl border border-sky-500/25 bg-sky-500/8 p-3">
                <div class="text-xs text-white/50">{{ t.upcoming }}</div>
                <div class="font-semibold text-lg leading-tight mt-1">{{ taskSummary.upcoming }}</div>
                <div class="text-[11px] text-white/45 mt-1">{{ t.planned_next }}</div>
              </div>
            </div>
            <div v-if="taskSummary.recent.length" class="mt-3 space-y-2 text-xs">
              <button
                v-for="task in taskSummary.recent"
                :key="task.id"
                class="w-full text-left rounded-lg border border-white/10 px-3 py-2 hover:bg-white/[0.05] transition"
                type="button"
                :disabled="!task.entityId"
                @click="openTaskEntity(task)"
              >
                <div class="truncate font-medium">{{ task.title }}</div>
                <div class="text-white/45 mt-1 flex items-center justify-between gap-2">
                  <span>{{ task.dueDate || t.no_due_date }} • {{ task.entityType }}</span>
                  <span v-if="task.entityId" class="text-white/65">{{ t.open }}</span>
                </div>
              </button>
            </div>
            <div v-else class="mt-3 text-xs text-white/45">{{ t.no_follow_ups_yet }}</div>
          </div>

          <h2 class="font-semibold mb-3">{{ t.recent_activity }}</h2>
          <ul class="space-y-2 text-sm text-white/60">
            <li v-for="a in activity" :key="a.id" class="flex items-center justify-between gap-3">
              <span class="truncate">
                {{ a.type }} {{ a.entity }}<span v-if="a.label"> — {{ a.label }}</span>
              </span>
              <span class="text-xs text-white/40 whitespace-nowrap">
                {{ new Date(a.created_at).toLocaleDateString() }}
              </span>
            </li>
            <li v-if="activity.length===0">{{ t.no_recent_activity }}</li>
          </ul>
        </div>

        <div v-if="settings.dashboardWidgets.recent_clients" class="glass p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ t.recent_clients }}</h2>
              <p class="text-sm text-white/60 mt-1">{{ t.recent_clients_subtitle }}</p>
            </div>
            <RouterLink to="/clients" class="text-sm text-white/60 hover:text-white">
              {{ t.open }} →
            </RouterLink>
          </div>

          <div v-if="loading" class="mt-5 text-white/60">{{ t.loading }}</div>

          <ul v-else class="mt-5 space-y-2">
            <li
              v-for="c in recentClients"
              :key="c.id"
              class="rounded-xl border border-white/10 bg-black/30 p-4 hover:bg-white/[0.05] transition"
            >
              <div class="font-semibold">{{ c.full_name }}</div>
              <div class="text-sm text-white/60 mt-1">
                {{ c.phone || "—" }} • {{ c.email || "—" }}
              </div>
            </li>

            <li v-if="recentClients.length === 0" class="text-white/60">
              {{ t.no_clients_found }}
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <teleport to="body">
      <div
        v-if="showAddHouse"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @keydown.esc="closeAddHouse"
        tabindex="-1"
      >
        <div
          class="absolute inset-0 modal-backdrop"
          :class="settings.aiModalStrong ? 'modal-backdrop-strong' : ''"
          @click="closeAddHouse"
        ></div>

        <div
          class="relative modal-panel rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          :class="settings.aiModalStrong ? 'modal-panel-strong' : ''"
          role="dialog"
          aria-modal="true"
        >
          <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ t.add_house }}</h2>
              <p class="text-sm text-white/60 mt-1">{{ t.add_house_subtitle }}</p>
            </div>

            <button
              class="h-10 w-10 rounded-xl border border-white/10 hover:bg-white/10 grid place-items-center"
              @click="closeAddHouse"
              :aria-label="t.close"
            >
              ✕
            </button>
          </div>

          <div class="px-6 pt-4 pb-3 border-b border-white/10">
            <div class="relative">
              <input
                v-model="fieldSearch"
                :placeholder="t.search_fields_placeholder"
                class="w-full input pr-10"
              />
              <button
                v-if="fieldSearch"
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                @click="fieldSearch = ''"
                :aria-label="t.clear"
                :title="t.clear"
              >
                ✕
              </button>
            </div>
            <div class="text-xs text-white/40 mt-1">
              {{ t.search_across_all_fields }}
            </div>
          </div>

          <div class="px-6 py-4 overflow-y-auto flex-1 space-y-8">
            <div class="glass-soft p-4 rounded-xl">
              <div class="text-xs text-white/50">{{ t.preview }}</div>
              <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div class="text-xs text-white/50">{{ t.address }}</div>
                  <div class="tabular-nums">{{ previewAddress }}</div>
                </div>
                <div>
                  <div class="text-xs text-white/50">{{ t.city }}</div>
                  <div class="tabular-nums">{{ previewCity }}</div>
                </div>
              </div>
            </div>

            <div
              v-if="Object.keys(filteredGroups).length === 0"
              class="text-sm text-white/50 text-center py-12"
            >
              {{ t.no_fields_match_search }}
            </div>

            <form id="add-house-form" class="space-y-8" @submit.prevent="createHouseAndClose">
              <div class="glass-soft p-4 rounded-xl">
                <h3 class="text-sm font-semibold mb-3">
                  {{ t.availability }}
                </h3>
                <select class="input" v-model="newHouse.availability">
                  <option value="entering">{{ t.availability_entering }}</option>
                  <option value="available">{{ t.availability_available }}</option>
                  <option value="unavailable">{{ t.availability_unavailable }}</option>
                </select>
              </div>

              <div
                v-for="(group, groupKey) in filteredGroups"
                :key="groupKey"
                class="glass-soft p-4 rounded-xl"
              >
                <h3 class="text-sm font-semibold mb-3">
                  {{ groupLabel(group) }}
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="field in group.fields"
                    :key="field.key"
                  >
                    <label class="text-xs text-white/50">
                      {{ fieldLabel(field) }}
                    </label>

                    <input
                      v-if="field.type === 'text'"
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    />

                    <input
                      v-else-if="field.type === 'number'"
                      type="number"
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    />

                    <input
                      v-else-if="field.type === 'date'"
                      type="date"
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    />

                    <select
                      v-else-if="field.type === 'boolean'"
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    >
                      <option value="">—</option>
                      <option value="Yes">{{ t.yes }}</option>
                      <option value="No">{{ t.no }}</option>
                    </select>

                    <input
                      v-else
                      class="input mt-1"
                      v-model="newHouse.raw_data[field.key]"
                    />
                  </div>
                </div>
              </div>

              <div class="glass-soft p-4 rounded-xl">
                <h3 class="text-sm font-semibold mb-3">
                  {{ t.description }}
                </h3>
                <textarea class="textarea" rows="4" v-model.trim="newHouse.description"></textarea>
              </div>

              <div class="glass-soft p-4 rounded-xl">
                <h3 class="text-sm font-semibold mb-3">
                  {{ t.tags }}
                </h3>
                <input class="input" v-model.trim="newHouse.tagsInput" :placeholder="t.tags_placeholder" />
              </div>

              <div class="glass-soft p-4 rounded-xl">
                <h3 class="text-sm font-semibold mb-3">
                  {{ t.photos }} (1–10)
                </h3>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  @change="onHouseFilesChange"
                  class="block w-full text-sm text-white/70"
                />
                <p class="text-xs text-white/50 mt-2" v-if="houseFiles.length">
                  {{ t.selected_files }}: {{ houseFiles.length }} {{ t.files }}
                </p>
              </div>
            </form>
          </div>

          <div class="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-2">
            <p v-if="createHouseError" class="text-sm text-red-300 mr-auto">{{ createHouseError }}</p>
            <p v-else-if="createHouseOk" class="text-sm text-green-300 mr-auto">{{ t.saved }}</p>

            <button class="btn-ghost" type="button" @click="closeAddHouse">
              {{ t.cancel }}
            </button>
            <button class="btn" type="submit" form="add-house-form" :disabled="creatingHouse">
              {{ creatingHouse ? t.saving : t.save }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <Modal
      :open="showAddClient"
      :title="t.add_client"
      :subtitle="t.add_client_subtitle"
      @close="showAddClient = false"
    >
      <form class="grid gap-3 md:grid-cols-2" @submit.prevent="createClientAndClose">
        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.full_name }} *</label>
          <input class="input mt-1" v-model.trim="clientForm.full_name" required />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.phone }}</label>
          <input class="input mt-1" v-model.trim="clientForm.phone" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.email }}</label>
          <input class="input mt-1" type="email" v-model.trim="clientForm.email" />
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.deal_preference }}</label>
          <select class="input mt-1" v-model="clientForm.deal_preference">
            <option value="any">{{ t.deal_preference_any }}</option>
            <option value="buy">{{ t.deal_preference_buy }}</option>
            <option value="rent">{{ t.deal_preference_rent }}</option>
          </select>
        </div>

        <div>
          <label class="text-sm text-white/60">{{ t.property_preference }}</label>
          <select class="input mt-1" v-model="clientForm.property_preference">
            <option value="any">{{ t.property_preference_any }}</option>
            <option value="apartment">{{ t.property_preference_apartment }}</option>
            <option value="house">{{ t.property_preference_house }}</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.notes }}</label>
          <textarea class="textarea mt-1" rows="4" v-model.trim="clientForm.notes"></textarea>
        </div>

        <label class="md:col-span-2 flex items-center gap-3 mt-1">
          <input type="checkbox" v-model="clientAlreadyInterested" />
          <span class="text-sm text-white/60">{{ t.already_interested }}</span>
        </label>

        <div v-if="clientAlreadyInterested" class="md:col-span-2">
          <label class="text-sm text-white/60">{{ t.interested_house }}</label>
          <select
            class="input mt-1"
            v-model="clientInterestedHouseId"
            :disabled="clientHousesLoading"
            :required="clientAlreadyInterested"
          >
            <option value="">{{ t.select_house }}</option>
            <option v-for="h in clientHousesForSelect" :key="h.id" :value="h.id">
              {{ h.address }}{{ h.city ? ` • ${h.city}` : "" }}
            </option>
          </select>
          <p v-if="clientHousesError" class="text-xs text-red-300 mt-2">{{ clientHousesError }}</p>
        </div>

        <div class="md:col-span-2 flex items-center gap-3 mt-2">
          <button class="btn" :disabled="creatingClient">
            {{ creatingClient ? t.saving : t.save }}
          </button>
          <button type="button" class="btn-ghost" @click="showAddClient = false">{{ t.cancel }}</button>

          <p v-if="createClientError" class="text-sm text-red-300">{{ createClientError }}</p>
          <p v-if="createClientOk" class="text-sm text-green-300">{{ t.saved }}</p>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import { logActivity } from "../lib/activity";
import Modal from "../components/Modal.vue";
import { useT } from "../lib/i18n";
import { settings } from "../lib/settings";
import { HOUSE_FIELD_GROUPS } from "@/config/houseFields.en";
import { loadTaskCalendarSummary } from "../lib/tasksBackend";
import { loadCalendarEvents } from "../lib/calendarEventsBackend";
import { useTopbarActions } from "../lib/topbarActions";
import { parseTagsInput } from "../lib/tags";

const clientsCount = ref(null);
const housesCount = ref(null);
const photosCount = ref(null);

const recentClients = ref([]);
const recentHouses = ref([]);
const activity = ref([]);
const taskSummary = ref({ overdue: 0, today: 0, upcoming: 0, totalOpen: 0, recent: [] });
const calendarWeekdays = ["E", "T", "K", "N", "R", "L", "P"];
const dashboardViewYear = ref(new Date().getFullYear());
const dashboardViewMonth = ref(new Date().getMonth());
const dashboardSelectedDate = ref("");
const dashboardEvents = ref([]);
const DASHBOARD_DAY_DOUBLE_TAP_MS = 340;
let dashboardLastTapDate = "";
let dashboardLastTapAt = 0;

// KPI stats removed from dashboard

const loading = ref(false);
const error = ref("");

const lastUpdated = ref("—");

const availableCount = ref(null);
const unavailableCount = ref(null);
const enteringCount = ref(null);

const showAddHouse = ref(false);
const showAddClient = ref(false);

const creatingHouse = ref(false);
const createHouseError = ref("");
const createHouseOk = ref(false);

const creatingClient = ref(false);
const createClientError = ref("");
const createClientOk = ref(false);

const clientAlreadyInterested = ref(false);
const clientInterestedHouseId = ref("");
const clientHousesForSelect = ref([]);
const clientHousesLoading = ref(false);
const clientHousesError = ref("");

const newHouse = ref({
  raw_data: {},
  availability: "entering",
  description: "",
  tagsInput: "",
});
const fieldSearch = ref("");
const houseFiles = ref([]);

const clientForm = ref({
  full_name: "",
  phone: "",
  email: "",
  deal_preference: "any",
  property_preference: "any",
  notes: "",
});

const t = useT();
const router = useRouter();

useTopbarActions(() => [
  { key: "add-house", label: `+ ${t.value.houses}`, onClick: () => (showAddHouse.value = true) },
  { key: "add-client", label: `+ ${t.value.clients}`, onClick: () => (showAddClient.value = true) },
  { key: "open-houses", label: `${t.value.open} ${t.value.houses}`, to: "/houses" },
  { key: "open-clients", label: `${t.value.open} ${t.value.clients}`, to: "/clients" },
  { key: "refresh", label: t.value.refresh, onClick: load, disabled: loading.value },
]);

const toDateKey = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const dashboardMonthLabel = computed(() => {
  const d = new Date(dashboardViewYear.value, dashboardViewMonth.value, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
});

const parseDateParts = (dateKey) => {
  const [yyyy, mm, dd] = String(dateKey).split("-").map(Number);
  return { yyyy, mm, dd };
};

const isValidDate = (yyyy, mm, dd) => {
  if (!yyyy || !mm || !dd) return false;
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() + 1 === mm && d.getDate() === dd;
};

const isValidDateKey = (dateKey) => {
  const { yyyy, mm, dd } = parseDateParts(dateKey);
  return isValidDate(yyyy, mm, dd);
};

const normalizeHexColor = (raw) => {
  const color = String(raw || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
  return "#22c55e";
};

const sanitizeDashboardEvents = (list) =>
  (list || [])
    .filter((item) => item && item.id && item.title && item.date)
    .map((item) => ({
      ...item,
      title: String(item.title).trim(),
      date: String(item.date),
      note: item.note ? String(item.note) : "",
      color: normalizeHexColor(item.color),
      repeat: item.repeat === "yearly" ? "yearly" : "none",
    }))
    .filter((item) => item.title.length > 0 && isValidDateKey(item.date));

const buildDashboardMonthEventsMap = (year, month) => {
  const map = {};
  for (const event of dashboardEvents.value) {
    const { yyyy, mm, dd } = parseDateParts(event.date);
    if (event.repeat === "yearly") {
      if (mm !== month + 1 || !isValidDate(year, mm, dd)) continue;
      const key = `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
      continue;
    }
    if (yyyy !== year || mm !== month + 1) continue;
    if (!map[event.date]) map[event.date] = [];
    map[event.date].push(event);
  }
  return map;
};

const dashboardMonthEventsMap = computed(() =>
  buildDashboardMonthEventsMap(dashboardViewYear.value, dashboardViewMonth.value)
);

const dashboardTaskMap = computed(() => {
  const map = {};
  for (const item of taskSummary.value.items || []) {
    if (!item?.dueDate) continue;
    const { yyyy, mm } = parseDateParts(item.dueDate);
    if (yyyy !== dashboardViewYear.value || mm !== dashboardViewMonth.value + 1) continue;
    if (!map[item.dueDate]) map[item.dueDate] = [];
    map[item.dueDate].push(item);
  }
  return map;
});

const dashboardCalendarCells = computed(() => {
  const y = dashboardViewYear.value;
  const m = dashboardViewMonth.value;
  const now = new Date();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const startWeekday = (first.getDay() + 6) % 7;
  const totalCells = Math.ceil((startWeekday + last.getDate()) / 7) * 7;
  const todayKey = toDateKey(now);

  const cells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1;
    const active = dayNum >= 1 && dayNum <= last.getDate();
    const dateKey = active ? toDateKey(new Date(y, m, dayNum)) : "";
    const events = active ? (dashboardMonthEventsMap.value[dateKey] || []) : [];
    const tasks = active ? (dashboardTaskMap.value[dateKey] || []) : [];
    cells.push({
      key: `dw-${i}`,
      active,
      dateKey,
      dayNum: active ? dayNum : "",
      isToday: active && dateKey === todayKey,
      taskCount: tasks.length,
      events,
      tasks,
    });
  }
  return cells;
});

const dashboardSelectedItems = computed(() => {
  if (!dashboardSelectedDate.value) return { events: [], tasks: [] };
  return {
    events: dashboardMonthEventsMap.value[dashboardSelectedDate.value] || [],
    tasks: dashboardTaskMap.value[dashboardSelectedDate.value] || [],
  };
});

const hexToRgb = (color) => {
  const hex = normalizeHexColor(color).replace("#", "");
  const num = Number.parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const dashboardDayStyle = (day) => {
  if (!day?.active) return {};
  const colors = (day.events || []).map((e) => normalizeHexColor(e.color)).slice(0, 6);
  if (!colors.length) return {};
  if (colors.length === 1) {
    const { r, g, b } = hexToRgb(colors[0]);
    return {
      background: `rgba(${r}, ${g}, ${b}, 0.2)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.62)`,
    };
  }

  const step = 100 / colors.length;
  const stops = colors.map((c, i) => {
    const { r, g, b } = hexToRgb(c);
    const start = (i * step).toFixed(2);
    const end = ((i + 1) * step).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, 0.2) ${start}%, rgba(${r}, ${g}, ${b}, 0.2) ${end}%`;
  });
  const { r, g, b } = hexToRgb(colors[0]);
  return {
    background: `linear-gradient(135deg, ${stops.join(", ")})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.62)`,
  };
};

const dashboardDayClass = (day) => {
  if (!day?.active) return "border-transparent bg-transparent opacity-45";
  if (day.dateKey === dashboardSelectedDate.value) {
    return "border-sky-400/70 bg-sky-500/12 shadow-[0_0_0_1px_rgba(56,189,248,0.24)]";
  }
  if (day.isToday) return "border-sky-400/55 bg-sky-500/8";
  return "border-white/10 bg-white/[0.02] hover:bg-white/[0.06]";
};

const openDashboardDate = (day) => {
  if (!day?.active) return;
  const now = Date.now();
  const isDoubleTap =
    dashboardLastTapDate === day.dateKey &&
    now - dashboardLastTapAt <= DASHBOARD_DAY_DOUBLE_TAP_MS;
  dashboardLastTapDate = day.dateKey;
  dashboardLastTapAt = now;

  if (!isDoubleTap) {
    dashboardSelectedDate.value = "";
    return;
  }
  dashboardSelectedDate.value = day.dateKey;
};

const openTaskEntity = (task) => {
  if (!task?.entityId) return;
  if (task.entityType === "house") {
    router.push(`/houses/${task.entityId}`);
    return;
  }
  if (task.entityType === "client") {
    router.push(`/clients/${task.entityId}`);
  }
};

const formatTaskCount = (count) => {
  const n = Number(count || 0);
  if (n <= 0) return "";
  if (n > 9) return "9+";
  return String(n);
};

const dashboardPrevMonth = () => {
  if (dashboardViewMonth.value === 0) {
    dashboardViewMonth.value = 11;
    dashboardViewYear.value -= 1;
  } else {
    dashboardViewMonth.value -= 1;
  }
};

const dashboardNextMonth = () => {
  if (dashboardViewMonth.value === 11) {
    dashboardViewMonth.value = 0;
    dashboardViewYear.value += 1;
  } else {
    dashboardViewMonth.value += 1;
  }
};

const dashboardGoToday = () => {
  const today = new Date();
  dashboardViewYear.value = today.getFullYear();
  dashboardViewMonth.value = today.getMonth();
  dashboardSelectedDate.value = toDateKey(today);
};

const loadClientHousesForSelect = async () => {
  clientHousesLoading.value = true;
  clientHousesError.value = "";
  try {
    const { data, error } = await supabase
      .from("houses")
      .select("id, address, city")
      .order("created_at", { ascending: false });
    if (error) throw error;
    clientHousesForSelect.value = data || [];
  } catch (e) {
    clientHousesError.value = e?.message || String(e);
  } finally {
    clientHousesLoading.value = false;
  }
};

const groupLabel = (group) => (settings.lang === "et" ? (group.label_et || group.label) : group.label);
const fieldLabel = (field) => (settings.lang === "et" ? (field.label_et || field.label) : field.label);

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
};

const availabilityLabel = (a) => {
  const map = {
    available: t.value.availability_available,
    unavailable: t.value.availability_unavailable,
    entering: t.value.availability_entering,
  };
  return map[a] || t.value.availability_entering;
};

const availabilityColor = (a) => {
  const map = {
    available: "#10b981",
    unavailable: "#ef4444",
    entering: "#f59e0b",
  };
  return map[a] || map.entering;
};

const availabilityChipStyle = (a) => {
  const c = availabilityColor(a);
  return {
    backgroundColor: `${c}22`,
    borderColor: `${c}66`,
  };
};

const availabilityTotal = computed(() => {
  const a = availableCount.value ?? 0;
  const u = unavailableCount.value ?? 0;
  const e = enteringCount.value ?? 0;
  return a + u + e;
});

const availabilityLegend = computed(() => [
  { key: "available", label: t.value.availability_available, count: availableCount.value, color: availabilityColor("available") },
  { key: "unavailable", label: t.value.availability_unavailable, count: unavailableCount.value, color: availabilityColor("unavailable") },
  { key: "entering", label: t.value.availability_entering, count: enteringCount.value, color: availabilityColor("entering") },
]);

const availabilitySegments = computed(() => {
  const total = availabilityTotal.value;
  const r = 42;
  const c = 2 * Math.PI * r;
  if (!total) {
    return [];
  }

  const parts = [
    { key: "available", count: availableCount.value ?? 0, color: availabilityColor("available") },
    { key: "unavailable", count: unavailableCount.value ?? 0, color: availabilityColor("unavailable") },
    { key: "entering", count: enteringCount.value ?? 0, color: availabilityColor("entering") },
  ];

  // Render in a stable order, but skip zero segments.
  let offset = 0;
  return parts
    .filter((p) => p.count > 0)
    .map((p) => {
      const len = (p.count / total) * c;
      const seg = {
        ...p,
        dasharray: `${len} ${c}`,
        dashoffset: `${-offset}`,
      };
      offset += len;
      return seg;
    });
});

const onHouseFilesChange = (e) => {
  houseFiles.value = Array.from(e.target.files || []).slice(0, 10);
};

const randomId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const cleanStr = (v) => {
  if (v === null || v === undefined) return "";
  return String(v).trim();
};

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/\s/g, "").replace("€", "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const makeAddressFromRaw = (raw) => {
  const street = cleanStr(raw?.["Tänav"]);
  const houseNo = cleanStr(raw?.["Maja nr"]);
  const aptNo = cleanStr(raw?.["Korteri nr"]);
  let addr = [street, houseNo].filter(Boolean).join(" ");
  if (aptNo) addr += `-${aptNo}`;
  return addr || cleanStr(raw?.["ID"]) || "—";
};

const makeCityFromRaw = (raw) =>
  cleanStr(raw?.["Linn"]) || cleanStr(raw?.["Vald"]) || cleanStr(raw?.["Maakond"]) || "—";

const previewAddress = computed(() => makeAddressFromRaw(newHouse.value.raw_data));
const previewCity = computed(() => makeCityFromRaw(newHouse.value.raw_data));

const prevBodyOverflow = ref("");
watch(showAddHouse, (open) => {
  if (typeof document === "undefined") return;
  if (open) {
    prevBodyOverflow.value = document.body.style.overflow || "";
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = prevBodyOverflow.value;
  }
});

onBeforeUnmount(() => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = prevBodyOverflow.value;
});

const closeAddHouse = () => {
  showAddHouse.value = false;
};

watch(showAddHouse, (open) => {
  if (!open) fieldSearch.value = "";
});

watch(showAddClient, (open) => {
  if (!open) return;
  clientAlreadyInterested.value = false;
  clientInterestedHouseId.value = "";
  clientHousesError.value = "";
});

watch(clientAlreadyInterested, (v) => {
  if (!v) return;
  if (clientHousesForSelect.value.length > 0) return;
  loadClientHousesForSelect();
});

const filteredGroups = computed(() => {
  const q = fieldSearch.value.trim().toLowerCase();
  if (!q) return HOUSE_FIELD_GROUPS;

  const result = {};
  for (const [groupKey, group] of Object.entries(HOUSE_FIELD_GROUPS)) {
    const matchedFields = group.fields.filter((f) => {
      return (
        f.label.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q)
      );
    });

    if (matchedFields.length > 0) {
      result[groupKey] = { ...group, fields: matchedFields };
    }
  }

  return result;
});

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const cCount = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("is_archived", false);
    const hCount = await supabase.from("houses").select("*", { count: "exact", head: true }).eq("is_archived", false);
    const pCount = await supabase.from("house_photos").select("*", { count: "exact", head: true });

    if (cCount.error) throw cCount.error;
    if (hCount.error) throw hCount.error;
    if (pCount.error) throw pCount.error;

    clientsCount.value = cCount.count ?? 0;
    housesCount.value = hCount.count ?? 0;
    photosCount.value = pCount.count ?? 0;

    const aCount = await supabase
      .from("houses")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false)
      .eq("availability", "available");

    const uCount = await supabase
      .from("houses")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false)
      .eq("availability", "unavailable");

    // If the column doesn't exist yet, Supabase will error. Keep the widget graceful.
    if (!aCount.error) availableCount.value = aCount.count ?? 0;
    if (!uCount.error) unavailableCount.value = uCount.count ?? 0;
    if (!aCount.error && !uCount.error) {
      const total = hCount.count ?? 0;
      const a = aCount.count ?? 0;
      const u = uCount.count ?? 0;
      // Treat null/unknown values as "entering" for the distribution.
      enteringCount.value = Math.max(0, total - a - u);
    }

    const cRecent = await supabase
      .from("clients")
      .select("id, full_name, phone, email, created_at")
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(6);

    const hRecent = await supabase
      .from("houses")
      .select("id, address, city, price, rooms, availability, created_at")
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(3);

    if (cRecent.error) throw cRecent.error;
    if (hRecent.error) throw hRecent.error;

    const a = await supabase
      .from("activity_log")
      .select("id,type,entity,label,created_at")
      .order("created_at", { ascending: false })
      .limit(6);

    recentClients.value = cRecent.data || [];
    recentHouses.value = hRecent.data || [];
    activity.value = a.data || [];
    taskSummary.value = await loadTaskCalendarSummary();
    try {
      dashboardEvents.value = sanitizeDashboardEvents(await loadCalendarEvents());
    } catch {
      dashboardEvents.value = [];
    }

    lastUpdated.value = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
};

const createHouse = async () => {
  creatingHouse.value = true;
  createHouseError.value = "";
  createHouseOk.value = false;

  try {
    const raw = newHouse.value.raw_data || {};

    const payload = {
      external_id: cleanStr(raw["ID"]) || null,
      deal_type: cleanStr(raw["Tehing"]) || null,
      object_type: cleanStr(raw["Objekti liik"]) || null,
      availability: newHouse.value.availability || "entering",
      address: makeAddressFromRaw(raw),
      city: makeCityFromRaw(raw) === "—" ? null : makeCityFromRaw(raw),
      price: toNum(raw["Tehingu hind"]),
      rooms: toNum(raw["Tube"]),
      size_m2: toNum(raw["Üldpind (m2)"]),
      description: newHouse.value.description || null,
      tags: parseTagsInput(newHouse.value.tagsInput),
      raw_data: raw,
    };

    const { data: house, error: e } = await supabase
      .from("houses")
      .insert(payload)
      .select()
      .single();

    if (e) throw e;

    await supabase.from("activity_log").insert({
      type: "create",
      entity: "house",
      entity_id: house.id,
    });

    const files = houseFiles.value.slice(0, 10);
    if (files.length) {
      const rows = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `houses/${house.id}/${randomId()}.${ext}`;

        const up = await supabase.storage.from("house-photos").upload(path, f, { upsert: false });
        if (up.error) throw up.error;

        rows.push({ house_id: house.id, storage_path: path, is_cover: i === 0 });
      }

      const ins = await supabase.from("house_photos").insert(rows);
      if (ins.error) throw ins.error;
    }

    newHouse.value = { raw_data: {}, availability: "entering", description: "", tagsInput: "" };
    fieldSearch.value = "";
    houseFiles.value = [];

    await load();
    createHouseOk.value = true;
    setTimeout(() => (createHouseOk.value = false), 1200);
  } catch (err) {
    createHouseError.value = err?.message || String(err);
  } finally {
    creatingHouse.value = false;
  }
};

const createHouseAndClose = async () => {
  await createHouse();
  if (!createHouseError.value) showAddHouse.value = false;
};

const createClient = async () => {
  creatingClient.value = true;
  createClientError.value = "";
  createClientOk.value = false;

  try {
    const basePayload = {
      full_name: clientForm.value.full_name,
      phone: clientForm.value.phone || null,
      email: clientForm.value.email || null,
      notes: clientForm.value.notes || null,
    };
    const payload = {
      ...basePayload,
      deal_preference: clientForm.value.deal_preference === "any" ? null : clientForm.value.deal_preference,
      property_preference: clientForm.value.property_preference === "any" ? null : clientForm.value.property_preference,
    };

    let { data: clientRow, error: e } = await supabase.from("clients").insert(payload).select().single();
    const msg = String(e?.message || e || "");
    const missingPrefCols =
      msg.includes("deal_preference") || msg.includes("property_preference");
    if (e && missingPrefCols) {
      const retry = await supabase.from("clients").insert(basePayload).select().single();
      clientRow = retry.data;
      e = retry.error;
    }
    if (e) throw e;

    await logActivity({ type: "create", entity: "client", entity_id: clientRow.id, label: payload.full_name });

    if (clientAlreadyInterested.value) {
      if (!clientInterestedHouseId.value) {
        throw new Error(t.value.select_house);
      }

      const { error: matchErr } = await supabase.from("house_matches").upsert({
        client_id: clientRow.id,
        house_id: clientInterestedHouseId.value,
        status: "interested",
        source: "manual",
      });
      if (matchErr) throw matchErr;
    }

    clientForm.value = {
      full_name: "",
      phone: "",
      email: "",
      deal_preference: "any",
      property_preference: "any",
      notes: "",
    };
    clientAlreadyInterested.value = false;
    clientInterestedHouseId.value = "";
    await load();

    createClientOk.value = true;
    setTimeout(() => (createClientOk.value = false), 1200);
  } catch (err) {
    createClientError.value = err?.message || String(err);
  } finally {
    creatingClient.value = false;
  }
};

const createClientAndClose = async () => {
  await createClient();
  if (!createClientError.value) showAddClient.value = false;
};

onMounted(() => {
  load();
  const handler = () => {
    // Keep the dashboard fresh if matches change.
    load();
  };
  window.addEventListener("match-changed", handler);
  onBeforeUnmount(() => window.removeEventListener("match-changed", handler));
});
</script>
