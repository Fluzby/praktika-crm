import { supabase } from "./supabase";
let taskMetaSupported = false;

function toLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function loadEntityTasks(entityType, entityId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (Array.isArray(data) && data.length > 0) {
    taskMetaSupported = Object.prototype.hasOwnProperty.call(data[0], "task_type")
      && Object.prototype.hasOwnProperty.call(data[0], "color");
  }

  return (data || []).map((t) => ({
    id: t.id,
    title: t.title,
    note: t.notes || "",
    type: t.task_type || "follow_up",
    color: t.color || "#22c55e",
    dueDate: t.due_at ? t.due_at.slice(0, 10) : "",
    done: t.status === "done",
    raw: t,
  }));
}

export async function createEntityTask({ entityType, entityId, title, dueDate, note, type, color }) {
  const dueAt = dueDate ? `${dueDate}T12:00:00.000Z` : null;
  const payload = {
    entity_type: entityType,
    entity_id: entityId,
    title: title?.trim() || "Follow up",
    notes: String(note || "").trim() || null,
    due_at: dueAt,
    status: "open",
  };
  if (taskMetaSupported) {
    payload.task_type = type || "follow_up";
    payload.color = color || "#22c55e";
  }
  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  if (data && Object.prototype.hasOwnProperty.call(data, "task_type") && Object.prototype.hasOwnProperty.call(data, "color")) {
    taskMetaSupported = true;
  }
  return data;
}

export async function setEntityTaskDone(taskId, done) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: done ? "done" : "open" })
    .eq("id", taskId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function removeEntityTask(taskId) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function loadTaskCalendarSummary() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .neq("status", "done")
    .neq("status", "cancelled")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(200);
  if (error) throw error;

  const tasks = data || [];
  if (tasks.length > 0) {
    taskMetaSupported = Object.prototype.hasOwnProperty.call(tasks[0], "task_type")
      && Object.prototype.hasOwnProperty.call(tasks[0], "color");
  }
  const todayStr = toLocalDateKey(new Date());
  return {
    overdue: tasks.filter((t) => t.due_at && t.due_at.slice(0, 10) < todayStr).length,
    today: tasks.filter((t) => t.due_at && t.due_at.slice(0, 10) === todayStr).length,
    upcoming: tasks.filter((t) => !t.due_at || t.due_at.slice(0, 10) > todayStr).length,
    totalOpen: tasks.length,
    recent: tasks.slice(0, 8).map((t) => ({
      id: t.id,
      title: t.title,
      note: t.notes || "",
      type: t.task_type || "follow_up",
      color: t.color || "#22c55e",
      dueDate: t.due_at ? t.due_at.slice(0, 10) : "",
      entityType: t.entity_type,
      entityId: t.entity_id,
      status: t.status,
    })),
    items: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      note: t.notes || "",
      type: t.task_type || "follow_up",
      color: t.color || "#22c55e",
      dueDate: t.due_at ? t.due_at.slice(0, 10) : "",
      status: t.status,
      entityType: t.entity_type,
      entityId: t.entity_id,
    })),
  };
}
