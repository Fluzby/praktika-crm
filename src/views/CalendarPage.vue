<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
      <section class="glass p-4 relative">
        <div class="flex items-center justify-between gap-3">
          <button class="btn-ghost" type="button" @click="prevMonth">←</button>
          <div class="font-semibold">{{ monthLabel }}</div>
          <button class="btn-ghost" type="button" @click="nextMonth">→</button>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[720px] table-fixed text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-[0.08em] text-white/50 border-b border-white/10">
                <th v-for="d in weekDays" :key="d" class="px-3 py-2 font-medium">{{ d }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(week, wi) in calendarGrid" :key="wi" class="border-b border-white/8 last:border-b-0">
                <td v-for="day in week" :key="day.key" class="align-top p-2">
                  <button
                    type="button"
                    class="relative w-full h-24 rounded-lg border p-2 text-left transition overflow-hidden"
                    :class="day.active
                      ? day.events.length
                        ? 'hover:opacity-95'
                        : day.isToday
                          ? 'border-emerald-400/60 bg-emerald-500/12 hover:bg-emerald-500/16'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                      : 'border-white/5 bg-white/[0.01] opacity-40'"
                    :style="dayCellStyle(day)"
                    @click="day.active && selectDate(day.date)"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs">{{ day.dayNum }}</span>
                      <span
                        v-if="day.isToday"
                        class="text-[10px]"
                        :class="day.events.length ? 'opacity-85' : 'text-emerald-300'"
                      >
                        Today
                      </span>
                    </div>
                    <div class="text-xs mt-2 min-h-8 space-y-1 overflow-hidden">
                      <div v-if="day.active && day.deadlines.length" class="truncate">
                        ● {{ day.deadlines[0].title }}
                      </div>
                      <div v-else-if="day.active && day.events.length" class="truncate">
                        <span class="opacity-85">◆</span>
                        {{ day.events[0].title }}
                      </div>
                      <div v-if="day.active && day.deadlines.length + day.events.length > 1" class="opacity-70">
                        +{{ day.deadlines.length + day.events.length - 1 }} more
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
        <div class="text-sm font-semibold">Add event</div>
        <div class="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
          <div>
            <label class="text-xs text-white/60 mb-1 block">Pealkiri (Title)</label>
            <input
              class="input"
              v-model.trim="eventTitle"
              placeholder="Enter event title..."
              @keyup.enter="addEvent"
            />
          </div>

          <div>
            <label class="text-xs text-white/60 mb-1 block">Märkus (Note)</label>
            <textarea
              class="textarea"
              rows="3"
              v-model.trim="eventNote"
              placeholder="Optional note for this event..."
            ></textarea>
          </div>

          <div>
            <label class="text-xs text-white/60 mb-1 block">Date</label>
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
            <label class="text-xs text-white/60 mb-1 block">Repeat</label>
            <select class="input" v-model="eventRepeat">
              <option value="none">Do not repeat</option>
              <option value="yearly">Repeat every year</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-white/60 mb-1 block">Event type</label>
            <select class="input" v-model="eventType">
              <option v-for="option in EVENT_TYPE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs text-white/60 mb-1 block">Linked client (optional)</label>
            <select class="input" v-model="eventClientId">
              <option value="">No client</option>
              <option v-for="c in eventClients" :key="c.id" :value="c.id">
                {{ c.full_name }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs text-white/60 mb-1 block">Linked property (optional)</label>
            <select class="input" v-model="eventHouseId">
              <option value="">No property</option>
              <option v-for="h in eventHouses" :key="h.id" :value="h.id">
                {{ h.city ? `${h.address} • ${h.city}` : h.address }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs text-white/60 mb-1 block">Color</label>
            <div class="mt-1 flex items-center gap-2 flex-wrap">
              <button
                v-for="preset in CALENDAR_COLOR_PRESETS"
                :key="preset"
                type="button"
                class="h-6 w-6 rounded-md border transition"
                :style="{ background: preset, borderColor: eventColor === preset ? 'white' : 'rgba(255,255,255,0.25)' }"
                @click="eventColor = preset"
              ></button>
            </div>
          </div>

          <button class="btn w-full" type="button" @click="addEvent">Add event</button>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div class="text-xs text-white/55 mb-2">Upcoming events</div>
          <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
            <div
              v-for="e in upcomingEvents"
              :key="`up-${e.id}`"
              class="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-2"
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
            <div v-if="upcomingEvents.length === 0" class="text-sm text-white/55">No upcoming events.</div>
          </div>
        </div>

      </aside>
    </div>

    <teleport to="body">
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
import { useTopbarActions } from "../lib/topbarActions";

const STORAGE_KEY = "crm_calendar_events_v2";
const LEGACY_STORAGE_KEY = "crm_calendar_events_v1";
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

const events = ref(loadEvents());
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
const eventClients = ref([]);
const eventHouses = ref([]);

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
    ? { boxShadow: "inset 0 0 0 2px rgba(52, 211, 153, 0.95)" }
    : {};

  if (!day.events.length) return selectedOutline;
  const color = normalizeHexColor(day.events[0].color);
  const text = contrastText(color);
  const { r, g, b } = hexToRgb(color);
  return {
    ...selectedOutline,
    background: `rgba(${r}, ${g}, ${b}, 0.2)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.6)`,
    color: text,
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

function loadEvents() {
  const hasV2Key = localStorage.getItem(STORAGE_KEY) !== null;
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (hasV2Key) return normalizeEvents(current);
  } catch {
    // ignore
  }

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "{}");
    return normalizeEvents(legacy);
  } catch {
    return [];
  }
}

function persistEvents() {
  try {
    const clean = sanitizeEvents(events.value);
    events.value = clean;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    // Prevent old migrated data from reappearing after deletes.
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
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

const eventTypeLabel = (type) => EVENT_TYPE_OPTIONS.find((o) => o.value === type)?.label || "Meeting";

function isSelected(date) {
  return date && date === selectedDate.value;
}

function selectDate(date) {
  selectedDate.value = date;
  eventExactDate.value = date;
  const dayEvents = events.value.filter((event) => eventOccursOnDate(event, date));
  const dayDeadlines = deadlinesByDate.value[date] || [];
  if (dayEvents[0]) {
    selectedCalendarItem.value = {
      kind: "event",
      id: dayEvents[0].id,
      title: dayEvents[0].title,
      note: dayEvents[0].note || "",
      date,
      color: dayEvents[0].color || "#22c55e",
      type: dayEvents[0].type || "meeting",
      clientId: dayEvents[0].clientId || "",
      houseId: dayEvents[0].houseId || "",
      repeat: dayEvents[0].repeat,
    };
  } else if (dayDeadlines[0]) {
    selectedCalendarItem.value = {
      kind: "deadline",
      id: dayDeadlines[0].id,
      title: dayDeadlines[0].title,
      note: "",
      date,
      entityType: dayDeadlines[0].entityType,
      entityId: dayDeadlines[0].entityId,
      repeat: "none",
    };
  } else {
    selectedCalendarItem.value = null;
  }
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

function addEvent() {
  const title = eventTitle.value.trim();
  if (!title) return;

  const targetDate = eventDateMode.value === "exact" ? eventExactDate.value : todayKey.value;
  if (!targetDate) return;

  const event = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    title,
    note: eventNote.value.trim(),
    date: targetDate,
    color: normalizeHexColor(eventColor.value),
    type: eventType.value,
    clientId: eventClientId.value || "",
    houseId: eventHouseId.value || "",
    repeat: eventRepeat.value,
    createdAt: new Date().toISOString(),
  };

  events.value = [event, ...events.value];
  persistEvents();
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

function removeEvent(eventId) {
  const target = events.value.find((event) => event.id === eventId);
  const label = (target?.title || "").trim() || "this event";
  if (!confirm(`Delete "${label}"?`)) return;

  events.value = events.value.filter((event) => {
    if (event.id === eventId) return false;
    // Also remove duplicate migrated copies that differ only by id.
    if (!target) return true;
    return !(
      event.title === target.title &&
      event.date === target.date &&
      (event.type || "meeting") === (target.type || "meeting") &&
      (event.repeat || "none") === (target.repeat || "none") &&
      (event.clientId || "") === (target.clientId || "") &&
      (event.houseId || "") === (target.houseId || "")
    );
  });
  selectedCalendarItem.value = null;
  persistEvents();
}

function resetCalendar() {
  if (!confirm("Reset calendar events? This will remove all saved events.")) return;
  events.value = [];
  selectedCalendarItem.value = null;
  eventTitle.value = "";
  eventNote.value = "";
  eventType.value = "meeting";
  eventClientId.value = "";
  eventHouseId.value = "";
  eventRepeat.value = "none";
  eventColor.value = CALENDAR_COLOR_PRESETS[0];
  try {
    localStorage.setItem(STORAGE_KEY, "[]");
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function openEventDetails(event) {
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

onMounted(() => {
  events.value = sanitizeEvents(events.value);
  if (!eventColor.value) eventColor.value = CALENDAR_COLOR_PRESETS[0];
  eventColor.value = normalizeHexColor(eventColor.value);
  persistEvents();
  loadDeadlinesForMonth();
  loadEventLinkOptions();
});
</script>
