<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
      <section class="glass p-4 md:p-5 relative overflow-hidden">
        <div
          class="absolute inset-x-0 top-0 h-24 pointer-events-none"
          :style="{ background: 'linear-gradient(180deg, color-mix(in srgb, var(--shell-accent-soft) 70%, transparent), transparent)' }"
        ></div>

        <div class="relative flex items-center justify-between gap-3">
          <div>
            <div class="text-[11px] uppercase tracking-[0.14em]" style="color: var(--shell-text-muted);">Planner</div>
            <div class="font-semibold text-lg leading-tight mt-1">{{ monthLabel }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="h-9 w-9 rounded-lg border"
              style="border-color: var(--shell-border-soft); background: color-mix(in srgb, var(--shell-card) 88%, transparent); color: var(--shell-text);"
              type="button"
              @click="prevMonth"
            >
              ←
            </button>
            <button
              class="h-9 w-9 rounded-lg border"
              style="border-color: var(--shell-border-soft); background: color-mix(in srgb, var(--shell-card) 88%, transparent); color: var(--shell-text);"
              type="button"
              @click="nextMonth"
            >
              →
            </button>
          </div>
        </div>

        <div class="relative mt-3 flex items-center gap-2 text-xs" style="color: var(--shell-text-muted);">
          <span class="chip px-2 py-0.5">Events: {{ monthEventCount }}</span>
          <span class="chip px-2 py-0.5">Deadlines: {{ monthDeadlineCount }}</span>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[720px] table-fixed text-sm">
            <thead>
              <tr class="text-left text-[10px] uppercase tracking-[0.14em] border-b border-white/10" style="color: var(--shell-text-muted);">
                <th v-for="d in weekDays" :key="d" class="px-3 py-2.5 font-medium">{{ d }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(week, wi) in calendarGrid" :key="wi" class="border-b border-white/8 last:border-b-0">
                <td v-for="day in week" :key="day.key" class="align-top p-1.5">
                  <button
                    type="button"
                    class="relative w-full h-24 rounded-xl border p-2.5 text-left transition overflow-hidden"
                    :class="day.active
                      ? day.events.length
                        ? 'hover:brightness-110'
                        : day.isToday
                          ? 'border-emerald-400/70 bg-emerald-500/14 hover:bg-emerald-500/18'
                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08]'
                      : 'border-white/5 bg-white/[0.01] text-white/20 opacity-45'"
                    :style="dayCellStyle(day)"
                    @click="day.active && handleDayPress(day)"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium">{{ day.dayNum }}</span>
                      <span
                        v-if="day.isToday"
                        class="text-[10px] rounded-md px-1.5 py-0.5"
                        style="background: rgba(26,115,232,0.18); border: 1px solid rgba(26,115,232,0.42); color: #1a73e8;"
                      >
                        Today
                      </span>
                    </div>
                    <div class="text-[11px] mt-2 min-h-8 space-y-1 overflow-hidden">
                      <div
                        v-for="item in dayPreviewItems(day)"
                        :key="item.key"
                        class="truncate flex items-center gap-1.5"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full shrink-0"
                          :style="{ background: item.color }"
                        ></span>
                        <span class="truncate">{{ item.title }}</span>
                      </div>
                      <div v-if="dayTotalItems(day) > dayPreviewItems(day).length" class="opacity-75 text-[10px]">
                        +{{ dayTotalItems(day) - dayPreviewItems(day).length }} more
                      </div>
                    </div>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>

      <aside class="glass-soft p-4 xl:sticky xl:top-20 space-y-4">
        <div class="text-sm font-semibold" style="color: var(--shell-text-strong);">Create Event</div>
        <div class="rounded-xl border p-3 space-y-3" style="border-color: var(--shell-border-soft); background: color-mix(in srgb, var(--shell-card) 82%, transparent);">
          <div>
            <label class="text-xs mb-1 block" style="color: var(--shell-text-muted);">Title</label>
            <input
              class="input"
              v-model.trim="eventTitle"
              placeholder="Enter event title..."
              @keyup.enter="addEvent"
            />
          </div>

          <div>
            <label class="text-xs mb-1 block" style="color: var(--shell-text-muted);">Note</label>
            <textarea
              class="textarea"
              rows="3"
              v-model.trim="eventNote"
              placeholder="Optional note for this event..."
            ></textarea>
          </div>

          <div>
            <label class="text-xs mb-1 block" style="color: var(--shell-text-muted);">Date</label>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                class="btn-ghost text-sm"
                type="button"
                :class="{ 'ring-1 ring-emerald-400/60': eventDateMode === 'today' }"
                @click="eventDateMode = 'today'"
              >
                Today
              </button>
              <button
                class="btn-ghost text-sm"
                type="button"
                :class="{ 'ring-1 ring-emerald-400/60': eventDateMode === 'exact' }"
                @click="eventDateMode = 'exact'"
              >
                Exact date
              </button>
              <input
                v-if="eventDateMode === 'exact'"
                class="input max-w-[220px]"
                type="date"
                v-model="eventExactDate"
              />
            </div>
          </div>

          <div>
            <label class="text-xs mb-1 block" style="color: var(--shell-text-muted);">Repeat</label>
            <select class="input" v-model="eventRepeat">
              <option value="none">Do not repeat</option>
              <option value="yearly">Repeat every year</option>
            </select>
          </div>

          <div>
            <label class="text-xs mb-1 block" style="color: var(--shell-text-muted);">Event type</label>
            <select class="input" v-model="eventType">
              <option v-for="option in EVENT_TYPE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs mb-1 block" style="color: var(--shell-text-muted);">Linked client (optional)</label>
            <select class="input" v-model="eventClientId">
              <option value="">No client</option>
              <option v-for="c in eventClients" :key="c.id" :value="c.id">
                {{ c.full_name }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs mb-1 block" style="color: var(--shell-text-muted);">Linked property (optional)</label>
            <select class="input" v-model="eventHouseId">
              <option value="">No property</option>
              <option v-for="h in eventHouses" :key="h.id" :value="h.id">
                {{ h.city ? `${h.address} • ${h.city}` : h.address }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs mb-1 block" style="color: var(--shell-text-muted);">Color</label>
            <div class="mt-1 flex items-center gap-2 flex-wrap">
              <button
                v-for="preset in CALENDAR_COLOR_PRESETS"
                :key="preset"
                type="button"
                class="h-6 w-6 rounded-md border transition disabled:opacity-30 disabled:cursor-not-allowed"
                :style="{ background: preset, borderColor: eventColor === preset ? 'white' : 'rgba(255,255,255,0.25)' }"
                @click="eventColor = preset"
                :disabled="isColorTakenForDraftDate(preset) && eventColor !== preset"
                :title="isColorTakenForDraftDate(preset) && eventColor !== preset ? 'Already used on this date' : ''"
              ></button>
            </div>
          </div>

          <button class="btn w-full" type="button" @click="addEvent">Add event</button>
        </div>

        <div class="rounded-xl border p-3" style="border-color: var(--shell-border-soft); background: color-mix(in srgb, var(--shell-card) 82%, transparent);">
          <div class="text-xs uppercase tracking-[0.1em] mb-2" style="color: var(--shell-text-muted);">Upcoming events</div>
          <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
            <div
              v-for="e in upcomingEvents"
              :key="`up-${e.id}`"
              class="flex items-center justify-between gap-2 rounded-xl border border-white/12 px-2.5 py-2.5"
              :style="eventCardStyle(e)"
            >
              <div class="min-w-0">
                <div class="text-sm leading-snug">
                  <span class="opacity-85">◆</span> {{ e.title }}
                </div>
                <div class="text-[11px] opacity-75">
                  {{ eventTypeLabel(e.type) }} •
                  {{ formatDate(e.nextOccurrence) }}<span v-if="e.repeat === 'yearly'"> • yearly</span>
                </div>
                <div v-if="e.clientId || e.houseId" class="text-[11px] opacity-80 mt-0.5">
                  <span v-if="e.clientId">{{ clientNameById[e.clientId] || "Client" }}</span>
                  <span v-if="e.clientId && e.houseId"> • </span>
                  <span v-if="e.houseId">{{ houseNameById[e.houseId] || "Property" }}</span>
                </div>
                <div v-if="e.note" class="text-[11px] opacity-80 mt-0.5 whitespace-pre-wrap">{{ e.note }}</div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button class="btn-ghost text-xs" type="button" @click="openEventDetails(e)">Open</button>
                <button class="btn-ghost text-xs" type="button" @click="removeEvent(e.id)">
                  Delete
                </button>
              </div>
            </div>
            <div v-if="upcomingEvents.length === 0" class="text-sm" style="color: var(--shell-text-muted);">No upcoming events.</div>
          </div>
        </div>

      </aside>
    </div>

    <teleport to="body">
      <div
        v-if="selectedDayDetails"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 modal-backdrop" @click="selectedDayDetails = null"></div>
        <div
          class="relative modal-panel rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-auto p-6"
          role="dialog"
          aria-modal="true"
          style="color: var(--shell-text-strong);"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="text-xs uppercase tracking-[0.08em]" style="color: var(--shell-text-muted);">
              {{ formatDate(selectedDayDetails.date) }} • Day details
            </div>
            <button class="btn-ghost text-xs" type="button" @click="selectedDayDetails = null">Close</button>
          </div>

          <div class="space-y-4">
            <div v-if="selectedDayDetails.events.length" class="space-y-2">
              <div class="text-xs uppercase tracking-[0.08em]" style="color: var(--shell-text-muted);">Events</div>
              <div
                v-for="event in selectedDayDetails.events"
                :key="`day-ev-${event.id}`"
                class="rounded-lg border p-3"
                style="border-color: var(--shell-border); background: var(--shell-card);"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-medium">◆ {{ event.title }}</div>
                    <div class="text-xs mt-1 opacity-80">
                      {{ eventTypeLabel(event.type) }}<span v-if="event.repeat === 'yearly'"> • yearly</span>
                    </div>
                    <div v-if="event.note" class="text-xs mt-1.5 opacity-85 whitespace-pre-wrap">{{ event.note }}</div>
                  </div>
                  <button class="btn-ghost text-xs shrink-0" type="button" @click="openEventDetails(event)">
                    Open
                  </button>
                </div>
              </div>
            </div>

            <div v-if="selectedDayDetails.deadlines.length" class="space-y-2">
              <div class="text-xs uppercase tracking-[0.08em]" style="color: var(--shell-text-muted);">Deadlines</div>
              <div
                v-for="deadline in selectedDayDetails.deadlines"
                :key="`day-dl-${deadline.id}`"
                class="rounded-lg border p-3"
                style="border-color: var(--shell-border); background: var(--shell-card);"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="font-medium">● {{ deadline.title }}</div>
                    <div class="text-xs mt-1 opacity-80">{{ deadline.entityType || "record" }}</div>
                  </div>
                  <button class="btn-ghost text-xs shrink-0" type="button" @click="openDeadlineDetails(deadline)">
                    Open
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="!selectedDayDetails.events.length && !selectedDayDetails.deadlines.length"
              class="text-sm"
              style="color: var(--shell-text-muted);"
            >
              No items for this day.
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="selectedCalendarItem"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 modal-backdrop" @click="selectedCalendarItem = null"></div>
        <div
          class="relative modal-panel rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-auto p-6"
          role="dialog"
          aria-modal="true"
          style="color: var(--shell-text-strong);"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="text-xs uppercase tracking-[0.08em]" style="color: var(--shell-text-muted);">Event details</div>
            <button class="btn-ghost text-xs" type="button" @click="selectedCalendarItem = null">Close</button>
          </div>

          <div class="space-y-4">
            <div>
              <div class="text-xs mb-1" style="color: var(--shell-text-muted);">Title</div>
              <div class="text-xl font-semibold leading-snug" style="color: var(--shell-text-strong);">
                {{ selectedCalendarItem.title }}
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="rounded-lg border p-3" style="border-color: var(--shell-border); background: var(--shell-card);">
                <div class="text-xs mb-1" style="color: var(--shell-text-muted);">Date</div>
                <div style="color: var(--shell-text);">{{ formatDate(selectedCalendarItem.date) }}</div>
              </div>
              <div class="rounded-lg border p-3" style="border-color: var(--shell-border); background: var(--shell-card);">
                <div class="text-xs mb-1" style="color: var(--shell-text-muted);">Type</div>
                <div style="color: var(--shell-text);">
                  {{ selectedCalendarItem.kind === "deadline" ? "Deadline" : eventTypeLabel(selectedCalendarItem.type) }}
                </div>
              </div>
              <div
                v-if="selectedCalendarItem.kind === 'deadline' && selectedCalendarItem.entityId"
                class="rounded-lg border p-3"
                style="border-color: var(--shell-border); background: var(--shell-card);"
              >
                <div class="text-xs mb-1" style="color: var(--shell-text-muted);">Shortcut</div>
                <button class="btn-ghost text-xs" type="button" @click="openLinkedDeadlineRecord">
                  Open linked {{ selectedCalendarItem.entityType || "record" }}
                </button>
              </div>
              <div
                v-if="selectedCalendarItem.kind === 'event'"
                class="rounded-lg border p-3"
                style="border-color: var(--shell-border); background: var(--shell-card);"
              >
                <div class="text-xs mb-1" style="color: var(--shell-text-muted);">Color</div>
                <div class="flex items-center gap-2" style="color: var(--shell-text);">
                  <span class="h-3 w-3 rounded-full border border-white/20" :style="{ background: selectedCalendarItem.color || '#22c55e' }"></span>
                  <span>{{ selectedCalendarItem.color || "#22c55e" }}</span>
                </div>
              </div>
            </div>
            <div v-if="selectedCalendarItem.kind === 'event'" class="rounded-lg border p-3" style="border-color: var(--shell-border); background: var(--shell-card);">
              <div class="text-xs mb-1" style="color: var(--shell-text-muted);">Repeat</div>
              <div style="color: var(--shell-text);">{{ selectedCalendarItem.repeat === "yearly" ? "Yearly" : "No repeat" }}</div>
            </div>
            <div v-if="selectedCalendarItem.kind === 'event' && (selectedCalendarItem.clientId || selectedCalendarItem.houseId)" class="rounded-lg border p-3" style="border-color: var(--shell-border); background: var(--shell-card);">
              <div class="text-xs mb-1" style="color: var(--shell-text-muted);">Linked records</div>
              <div style="color: var(--shell-text);" class="space-y-1">
                <div v-if="selectedCalendarItem.clientId">Client: {{ clientNameById[selectedCalendarItem.clientId] || "—" }}</div>
                <div v-if="selectedCalendarItem.houseId">Property: {{ houseNameById[selectedCalendarItem.houseId] || "—" }}</div>
              </div>
            </div>
            <div class="rounded-lg border p-4 min-h-36" style="border-color: var(--shell-border); background: var(--shell-card);">
              <div class="text-xs mb-1" style="color: var(--shell-text-muted);">Note</div>
              <div style="color: var(--shell-text);" class="whitespace-pre-wrap leading-relaxed">
                {{ selectedCalendarItem.note || "No note added." }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";
import {
  createCalendarEvent,
  importCalendarEvents,
  loadCalendarEvents,
  removeCalendarEvent,
  resetCalendarEvents,
} from "../lib/calendarEventsBackend";
import { useTopbarActions } from "../lib/topbarActions";

const LOCAL_STORAGE_KEY = "crm_calendar_events_v2";
const LOCAL_LEGACY_STORAGE_KEY = "crm_calendar_events_v1";
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CALENDAR_COLOR_PRESETS = ["#4285f4", "#34a853", "#ea4335", "#fbbc05", "#8e24aa"];
const EVENT_TYPE_OPTIONS = [
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Call" },
  { value: "deadline", label: "Deadline" },
];
const router = useRouter();

const now = new Date();
const viewYear = ref(now.getFullYear());
const viewMonth = ref(now.getMonth());
const selectedDate = ref(toDateKey(now));

const events = ref([]);
const eventTitle = ref("");
const eventNote = ref("");
const eventDateMode = ref("today");
const eventExactDate = ref(selectedDate.value);
const eventRepeat = ref("none");
const eventType = ref("meeting");
const eventClientId = ref("");
const eventHouseId = ref("");
const eventColor = ref("#22c55e");
const deadlinesByDate = ref({});
const selectedCalendarItem = ref(null);
const selectedDayDetails = ref(null);
const eventClients = ref([]);
const eventHouses = ref([]);
const DAY_DOUBLE_TAP_MS = 340;
let lastDayTapDate = "";
let lastDayTapAt = 0;

useTopbarActions(() => [
  { key: "today", label: "Today", onClick: () => goToday() },
  { key: "reset-calendar", label: "Reset calendar", onClick: () => resetCalendar() },
]);

function toDateKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateParts(dateKey) {
  const [yyyy, mm, dd] = String(dateKey).split("-").map(Number);
  return { yyyy, mm, dd };
}

function isValidDate(yyyy, mm, dd) {
  if (!yyyy || !mm || !dd) return false;
  const date = new Date(yyyy, mm - 1, dd);
  return date.getFullYear() === yyyy && date.getMonth() + 1 === mm && date.getDate() === dd;
}

function isValidDateKey(dateKey) {
  const { yyyy, mm, dd } = parseDateParts(dateKey);
  return isValidDate(yyyy, mm, dd);
}

function normalizeHexColor(raw) {
  const color = String(raw || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
  return "#22c55e";
}

function hexToRgb(color) {
  const hex = normalizeHexColor(color).replace("#", "");
  const num = Number.parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function isDarkColor(color) {
  const { r, g, b } = hexToRgb(color);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.55;
}

function contrastText(color) {
  return isDarkColor(color) ? "#ffffff" : "#111111";
}

function dayCellStyle(day) {
  if (!day.active) return {};
  const selectedOutline = isSelected(day.date)
    ? { boxShadow: "inset 0 0 0 2px rgba(26, 115, 232, 0.95)" }
    : {};
  const todayAccent = day.isToday
    ? { borderColor: "rgba(26,115,232,0.5)", background: "rgba(26,115,232,0.08)" }
    : {};
  const colors = dayBackgroundColors(day);

  if (!colors.length) return { ...todayAccent, ...selectedOutline };
  if (colors.length === 1) {
    const { r, g, b } = hexToRgb(colors[0]);
    return {
      ...todayAccent,
      ...selectedOutline,
      background: `rgba(${r}, ${g}, ${b}, 0.2)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.6)`,
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
    ...todayAccent,
    ...selectedOutline,
    background: `linear-gradient(135deg, ${stops.join(", ")})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.6)`,
  };
}

function eventCardStyle(event) {
  const color = normalizeHexColor(event.color);
  const text = contrastText(color);
  const { r, g, b } = hexToRgb(color);
  return {
    background: `rgba(${r}, ${g}, ${b}, 0.24)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.7)`,
    color: text,
  };
}

function sanitizeEvents(list) {
  return (list || [])
    .filter((item) => item && item.id && item.title && item.date)
    .map((item) => ({
      ...item,
      title: String(item.title).trim(),
      date: String(item.date),
      note: item.note ? String(item.note) : "",
      color: normalizeHexColor(item.color),
      type: EVENT_TYPE_OPTIONS.some((o) => o.value === item.type) ? item.type : "meeting",
      clientId: item.clientId ? String(item.clientId) : "",
      houseId: item.houseId ? String(item.houseId) : "",
      repeat: item.repeat === "yearly" ? "yearly" : "none",
      createdAt: item.createdAt || new Date().toISOString(),
    }))
    .filter((item) => item.title.length > 0 && isValidDateKey(item.date));
}

function normalizeEvents(payload) {
  if (Array.isArray(payload)) {
    return sanitizeEvents(
      payload.map((item) => ({
        id: String(item.id),
        title: String(item.title),
        date: String(item.date),
        note: item.note ? String(item.note) : "",
        color: item.color,
        type: item.type,
        clientId: item.clientId,
        houseId: item.houseId,
        repeat: item.repeat === "yearly" ? "yearly" : "none",
        createdAt: item.createdAt || new Date().toISOString(),
      }))
    );
  }

  if (payload && typeof payload === "object") {
    const migrated = [];
    for (const [dateKey, rows] of Object.entries(payload)) {
      for (const row of rows || []) {
        if (!row?.title) continue;
        migrated.push({
          id: row.id || (crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
          title: row.title,
          date: dateKey,
          note: row.note ? String(row.note) : "",
          type: row.type || "meeting",
          clientId: row.clientId || "",
          houseId: row.houseId || "",
          repeat: "none",
          createdAt: row.createdAt || new Date().toISOString(),
        });
      }
    }
    return sanitizeEvents(migrated);
  }

  return [];
}

function loadEventsFromLocal() {
  const hasV2Key = localStorage.getItem(LOCAL_STORAGE_KEY) !== null;
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    if (hasV2Key) return normalizeEvents(current);
  } catch {
    // ignore
  }

  try {
    const legacy = JSON.parse(localStorage.getItem(LOCAL_LEGACY_STORAGE_KEY) || "{}");
    return normalizeEvents(legacy);
  } catch {
    return [];
  }
}

function clearLocalEventStorage() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, "[]");
    localStorage.removeItem(LOCAL_LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function persistEventsToLocal(list = events.value) {
  try {
    const clean = sanitizeEvents(list);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
    localStorage.removeItem(LOCAL_LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

async function loadEventsFromDbWithLocalMigration() {
  let dbEvents = [];
  try {
    dbEvents = sanitizeEvents(await loadCalendarEvents());
  } catch {
    events.value = sanitizeEvents(loadEventsFromLocal());
    persistEventsToLocal(events.value);
    return;
  }

  if (dbEvents.length) {
    events.value = dbEvents;
    clearLocalEventStorage();
    return;
  }

  const localEvents = sanitizeEvents(loadEventsFromLocal());
  if (!localEvents.length) {
    events.value = [];
    return;
  }

  try {
    await importCalendarEvents(localEvents);
    events.value = sanitizeEvents(await loadCalendarEvents());
    clearLocalEventStorage();
  } catch {
    // If import fails, keep local events visible.
    events.value = localEvents;
  }
}

function eventOccursOnDate(event, dateKey) {
  if (event.repeat === "yearly") {
    return event.date.slice(5, 10) === dateKey.slice(5, 10);
  }
  return event.date === dateKey;
}

function buildMonthEventsMap(year, monthIndex) {
  const map = {};
  for (const event of events.value) {
    const { mm, dd } = parseDateParts(event.date);

    if (event.repeat === "yearly") {
      if (mm !== monthIndex + 1) continue;
      if (!isValidDate(year, mm, dd)) continue;
      const key = `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(event);
      continue;
    }

    const { yyyy } = parseDateParts(event.date);
    if (yyyy !== year || mm !== monthIndex + 1) continue;
    if (!map[event.date]) map[event.date] = [];
    map[event.date].push(event);
  }
  return map;
}

function nextOccurrenceFrom(event, fromDateKey) {
  if (event.repeat !== "yearly") {
    return event.date >= fromDateKey ? event.date : null;
  }

  const from = parseDateParts(fromDateKey);
  const base = parseDateParts(event.date);
  for (let y = from.yyyy; y < from.yyyy + 8; y++) {
    if (!isValidDate(y, base.mm, base.dd)) continue;
    const candidate = `${y}-${String(base.mm).padStart(2, "0")}-${String(base.dd).padStart(2, "0")}`;
    if (candidate >= fromDateKey) return candidate;
  }
  return null;
}

function formatDate(dateKey) {
  if (!dateKey) return "—";
  const { yyyy, mm, dd } = parseDateParts(dateKey);
  return new Date(yyyy, mm - 1, dd).toLocaleDateString();
}

const todayKey = computed(() => toDateKey(new Date()));
const monthEventsByDate = computed(() => buildMonthEventsMap(viewYear.value, viewMonth.value));

const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
});

const monthEventCount = computed(() =>
  Object.values(monthEventsByDate.value).reduce((sum, items) => sum + items.length, 0)
);

const monthDeadlineCount = computed(() =>
  Object.values(deadlinesByDate.value).reduce((sum, items) => sum + items.length, 0)
);

const calendarGrid = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1);
  const last = new Date(viewYear.value, viewMonth.value + 1, 0);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = last.getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const cells = [];

  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startWeekday + 1;
    const active = dayNum >= 1 && dayNum <= daysInMonth;
    const date = active ? toDateKey(new Date(viewYear.value, viewMonth.value, dayNum)) : "";
    cells.push({
      key: `${viewYear.value}-${viewMonth.value}-${i}`,
      active,
      date,
      dayNum: active ? dayNum : "",
      isToday: active && date === todayKey.value,
      deadlines: active ? (deadlinesByDate.value[date] || []) : [],
      events: active ? (monthEventsByDate.value[date] || []) : [],
    });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
});

const selectedDeadlines = computed(() => deadlinesByDate.value[selectedDate.value] || []);
const selectedEvents = computed(() =>
  events.value
    .filter((event) => String(event.title || "").trim().length > 0)
    .filter((event) => eventOccursOnDate(event, selectedDate.value))
);

const upcomingEvents = computed(() =>
  events.value
    .filter((event) => String(event.title || "").trim().length > 0)
    .map((event) => ({ ...event, nextOccurrence: nextOccurrenceFrom(event, todayKey.value) }))
    .filter((event) => !!event.nextOccurrence)
    .sort((a, b) => a.nextOccurrence.localeCompare(b.nextOccurrence))
);

const pastEvents = computed(() =>
  events.value
    .filter((event) => String(event.title || "").trim().length > 0)
    .filter((event) => event.repeat !== "yearly" && event.date < todayKey.value)
    .sort((a, b) => b.date.localeCompare(a.date))
);

const clientNameById = computed(() => {
  const map = {};
  for (const c of eventClients.value) map[c.id] = c.full_name;
  return map;
});

const houseNameById = computed(() => {
  const map = {};
  for (const h of eventHouses.value) {
    map[h.id] = h.city ? `${h.address} • ${h.city}` : h.address;
  }
  return map;
});

const draftTargetDate = computed(() =>
  eventDateMode.value === "exact" ? eventExactDate.value : todayKey.value
);

const usedDraftDateColors = computed(() => {
  const date = draftTargetDate.value;
  if (!date) return new Set();
  const colors = events.value
    .filter((event) => eventOccursOnDate(event, date))
    .map((event) => normalizeHexColor(event.color));
  return new Set(colors);
});

const eventTypeLabel = (type) => EVENT_TYPE_OPTIONS.find((o) => o.value === type)?.label || "Meeting";

function isColorTakenForDraftDate(color) {
  return usedDraftDateColors.value.has(normalizeHexColor(color));
}

function pickAvailableColorForDate(dateKey, preferredColor = "") {
  const used = new Set(
    events.value
      .filter((event) => eventOccursOnDate(event, dateKey))
      .map((event) => normalizeHexColor(event.color))
  );

  const preferred = normalizeHexColor(preferredColor || eventColor.value);
  if (!used.has(preferred)) return preferred;

  for (const preset of CALENDAR_COLOR_PRESETS) {
    const c = normalizeHexColor(preset);
    if (!used.has(c)) return c;
  }

  // Fallback palette if all presets are already used for the date.
  const fallback = [
    "#00acc1",
    "#7cb342",
    "#fb8c00",
    "#d81b60",
    "#5e35b1",
    "#546e7a",
    "#039be5",
    "#43a047",
    "#f4511e",
    "#8e24aa",
    "#3949ab",
    "#6d4c41",
  ];
  for (const c of fallback) {
    if (!used.has(c)) return c;
  }
  return preferred;
}

function isSelected(date) {
  return date && date === selectedDate.value;
}

function selectDate(date, openInfo = false) {
  selectedDate.value = date;
  eventDateMode.value = "exact";
  eventExactDate.value = date;
  if (!openInfo) {
    selectedCalendarItem.value = null;
    selectedDayDetails.value = null;
    return;
  }
  const dayEvents = events.value.filter((event) => eventOccursOnDate(event, date));
  const dayDeadlines = deadlinesByDate.value[date] || [];
  selectedCalendarItem.value = null;
  selectedDayDetails.value = { date, events: dayEvents, deadlines: dayDeadlines };
}

function handleDayPress(day) {
  if (!day?.active || !day.date) return;
  const now = Date.now();
  const isDoubleTap = lastDayTapDate === day.date && now - lastDayTapAt <= DAY_DOUBLE_TAP_MS;
  lastDayTapDate = day.date;
  lastDayTapAt = now;
  selectDate(day.date, isDoubleTap);
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value -= 1;
  } else {
    viewMonth.value -= 1;
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value += 1;
  } else {
    viewMonth.value += 1;
  }
}

function dayPreviewItems(day) {
  if (!day?.active) return [];
  const deadlines = (day.deadlines || []).map((d) => ({
    key: `d-${d.id}`,
    title: d.title,
    color: "#1a73e8",
  }));
  const eventsPreview = (day.events || []).map((e) => ({
    key: `e-${e.id}`,
    title: e.title,
    color: normalizeHexColor(e.color),
  }));
  return [...deadlines, ...eventsPreview].slice(0, 2);
}

function dayTotalItems(day) {
  if (!day?.active) return 0;
  return (day.deadlines?.length || 0) + (day.events?.length || 0);
}

function dayBackgroundColors(day) {
  if (!day?.active) return [];
  const colors = [];
  if (day.deadlines?.length) colors.push("#1a73e8");
  for (const event of day.events || []) {
    colors.push(normalizeHexColor(event.color));
  }
  return colors.slice(0, 6);
}

function goToday() {
  const d = new Date();
  viewYear.value = d.getFullYear();
  viewMonth.value = d.getMonth();
  selectDate(toDateKey(d));
}

async function loadDeadlinesForMonth() {
  const monthStart = new Date(viewYear.value, viewMonth.value, 1);
  const monthEnd = new Date(viewYear.value, viewMonth.value + 1, 0, 23, 59, 59, 999);
  const { data, error } = await supabase
    .from("tasks")
    .select("id,title,due_at,status,entity_type,entity_id")
    .gte("due_at", monthStart.toISOString())
    .lte("due_at", monthEnd.toISOString())
    .neq("status", "cancelled")
    .order("due_at", { ascending: true });

  if (error) return;

  const map = {};
  for (const row of data || []) {
    const dateKey = row.due_at ? row.due_at.slice(0, 10) : "";
    if (!dateKey) continue;
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push({
      id: row.id,
      title: row.title,
      status: row.status,
      entityType: row.entity_type,
      entityId: row.entity_id,
    });
  }
  deadlinesByDate.value = map;
}

async function addEvent() {
  const title = eventTitle.value.trim();
  if (!title) return;

  const targetDate = eventDateMode.value === "exact" ? eventExactDate.value : todayKey.value;
  if (!targetDate) return;
  const pickedColor = pickAvailableColorForDate(targetDate, eventColor.value);
  eventColor.value = pickedColor;

  const eventDraft = {
    title,
    note: eventNote.value.trim(),
    date: targetDate,
    color: pickedColor,
    type: eventType.value,
    clientId: eventClientId.value || "",
    houseId: eventHouseId.value || "",
    repeat: eventRepeat.value,
  };

  try {
    const saved = await createCalendarEvent(eventDraft);
    events.value = sanitizeEvents([saved, ...events.value]);
  } catch {
    const localEvent = {
      ...eventDraft,
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    };
    events.value = sanitizeEvents([localEvent, ...events.value]);
    persistEventsToLocal(events.value);
  }

  eventTitle.value = "";
  eventNote.value = "";
  eventRepeat.value = "none";
  eventType.value = "meeting";
  eventClientId.value = "";
  eventHouseId.value = "";
  eventColor.value = CALENDAR_COLOR_PRESETS[0];

  const { yyyy, mm } = parseDateParts(targetDate);
  if (yyyy && mm) {
    viewYear.value = yyyy;
    viewMonth.value = mm - 1;
    selectDate(targetDate);
  }
}

async function removeEvent(eventId) {
  const target = events.value.find((event) => event.id === eventId);
  const label = (target?.title || "").trim() || "this event";
  if (!confirm(`Delete "${label}"?`)) return;

  try {
    await removeCalendarEvent(eventId);
  } catch {
    events.value = events.value.filter((event) => event.id !== eventId);
    persistEventsToLocal(events.value);
    selectedCalendarItem.value = null;
    selectedDayDetails.value = null;
    return;
  }

  events.value = events.value.filter((event) => event.id !== eventId);
  selectedCalendarItem.value = null;
  selectedDayDetails.value = null;
}

async function resetCalendar() {
  if (!confirm("Reset calendar events? This will remove all saved events.")) return;

  try {
    await resetCalendarEvents();
  } catch {
    events.value = [];
    persistEventsToLocal(events.value);
    selectedCalendarItem.value = null;
    selectedDayDetails.value = null;
    eventTitle.value = "";
    eventNote.value = "";
    eventType.value = "meeting";
    eventClientId.value = "";
    eventHouseId.value = "";
    eventRepeat.value = "none";
    eventColor.value = CALENDAR_COLOR_PRESETS[0];
    return;
  }

  events.value = [];
  selectedCalendarItem.value = null;
  selectedDayDetails.value = null;
  eventTitle.value = "";
  eventNote.value = "";
  eventType.value = "meeting";
  eventClientId.value = "";
  eventHouseId.value = "";
  eventRepeat.value = "none";
  eventColor.value = CALENDAR_COLOR_PRESETS[0];
  clearLocalEventStorage();
}

function openEventDetails(event) {
  selectedDayDetails.value = null;
  const detailDate = event.repeat === "yearly" ? (nextOccurrenceFrom(event, selectedDate.value) || event.date) : event.date;
  selectDate(detailDate);
  selectedCalendarItem.value = {
    kind: "event",
    id: event.id,
    title: event.title,
    note: event.note || "",
    date: detailDate,
    color: event.color || "#22c55e",
    type: event.type || "meeting",
    clientId: event.clientId || "",
    houseId: event.houseId || "",
    repeat: event.repeat,
  };
}

function openDeadlineDetails(deadline) {
  selectedDayDetails.value = null;
  const date = selectedDate.value;
  selectedCalendarItem.value = {
    kind: "deadline",
    id: deadline.id,
    title: deadline.title,
    note: "",
    date,
    entityType: deadline.entityType,
    entityId: deadline.entityId,
    repeat: "none",
  };
}

function openLinkedDeadlineRecord() {
  const item = selectedCalendarItem.value;
  if (!item || item.kind !== "deadline" || !item.entityId) return;
  if (item.entityType === "house") {
    router.push(`/houses/${item.entityId}`);
    return;
  }
  if (item.entityType === "client") {
    router.push(`/clients/${item.entityId}`);
  }
}

watch([viewYear, viewMonth], () => {
  const firstDate = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, "0")}-01`;
  if (!selectedDate.value.startsWith(firstDate.slice(0, 7))) {
    selectDate(firstDate);
  }
  loadDeadlinesForMonth();
});

watch(events, () => {
  if (!selectedCalendarItem.value || selectedCalendarItem.value.kind !== "event") return;
  const exists = events.value.some((e) => e.id === selectedCalendarItem.value.id);
  if (!exists) {
    selectedCalendarItem.value = null;
  }
}, { deep: true });

async function loadEventLinkOptions() {
  try {
    const [clientsRes, housesRes] = await Promise.all([
      supabase.from("clients").select("id, full_name").eq("is_archived", false).order("full_name", { ascending: true }).limit(200),
      supabase.from("houses").select("id, address, city").eq("is_archived", false).order("created_at", { ascending: false }).limit(200),
    ]);
    if (!clientsRes.error) eventClients.value = clientsRes.data || [];
    if (!housesRes.error) eventHouses.value = housesRes.data || [];
  } catch {
    // ignore link-option loading errors
  }
}

onMounted(async () => {
  if (!eventColor.value) eventColor.value = CALENDAR_COLOR_PRESETS[0];
  eventColor.value = normalizeHexColor(eventColor.value);
  await loadEventsFromDbWithLocalMigration();
  loadDeadlinesForMonth();
  loadEventLinkOptions();
});
</script>
