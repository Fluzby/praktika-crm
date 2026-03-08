import { supabase } from "./supabase";

const EVENT_TYPES = new Set(["meeting", "call", "deadline"]);

function normalizeHexColor(raw) {
  const color = String(raw || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase();
  return "#22c55e";
}

function normalizeRepeat(raw) {
  return raw === "yearly" ? "yearly" : "none";
}

function mapRowToEvent(row) {
  return {
    id: String(row.id),
    title: String(row.title || "").trim(),
    note: row.note ? String(row.note) : "",
    date: String(row.event_date || ""),
    color: normalizeHexColor(row.color),
    type: EVENT_TYPES.has(row.type) ? row.type : "meeting",
    clientId: row.client_id ? String(row.client_id) : "",
    houseId: row.house_id ? String(row.house_id) : "",
    repeat: normalizeRepeat(row.repeat),
    status: row.status === "done" ? "done" : "open",
    completedAt: row.completed_at || null,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapEventToInsert(event) {
  return {
    title: String(event.title || "").trim(),
    note: event.note ? String(event.note) : null,
    event_date: String(event.date || ""),
    repeat: normalizeRepeat(event.repeat),
    type: EVENT_TYPES.has(event.type) ? event.type : "meeting",
    client_id: event.clientId || null,
    house_id: event.houseId || null,
    color: normalizeHexColor(event.color),
    status: "open",
    completed_at: null,
  };
}

export async function loadCalendarEvents() {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id,title,note,event_date,repeat,type,client_id,house_id,color,status,completed_at,created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []).map(mapRowToEvent);
}

export async function createCalendarEvent(event) {
  const payload = mapEventToInsert(event);
  const { data, error } = await supabase
    .from("calendar_events")
    .insert(payload)
    .select("id,title,note,event_date,repeat,type,client_id,house_id,color,status,completed_at,created_at")
    .single();
  if (error) throw error;
  return mapRowToEvent(data);
}

export async function setCalendarEventDone(eventId, done) {
  const payload = {
    status: done ? "done" : "open",
    completed_at: done ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from("calendar_events")
    .update(payload)
    .eq("id", eventId)
    .select("id,title,note,event_date,repeat,type,client_id,house_id,color,status,completed_at,created_at")
    .single();
  if (error) throw error;
  return mapRowToEvent(data);
}

export async function removeCalendarEvent(eventId) {
  const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);
  if (error) throw error;
}

export async function resetCalendarEvents() {
  const { error } = await supabase.from("calendar_events").delete().not("id", "is", null);
  if (error) throw error;
}

export async function importCalendarEvents(events) {
  const rows = (events || [])
    .map(mapEventToInsert)
    .filter((row) => row.title && row.event_date);
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from("calendar_events")
    .insert(rows)
    .select("id,title,note,event_date,repeat,type,client_id,house_id,color,status,completed_at,created_at");
  if (error) throw error;
  return (data || []).map(mapRowToEvent);
}
