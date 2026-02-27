import { supabase } from "./supabase";

export async function loadEntityTasks(entityType, entityId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.due_at ? t.due_at.slice(0, 10) : "",
    done: t.status === "done",
    raw: t,
  }));
}

export async function createEntityTask({ entityType, entityId, title, dueDate }) {
  const dueAt = dueDate ? `${dueDate}T12:00:00.000Z` : null;
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      title: title?.trim() || "Follow up",
      due_at: dueAt,
      status: "open",
    })
    .select("*")
    .single();
  if (error) throw error;
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
    .select("id,title,due_at,status,entity_type,entity_id,created_at")
    .neq("status", "cancelled")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(200);
  if (error) throw error;

  const tasks = data || [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  return {
    overdue: tasks.filter((t) => t.status !== "done" && t.due_at && t.due_at.slice(0, 10) < todayStr).length,
    today: tasks.filter((t) => t.status !== "done" && t.due_at && t.due_at.slice(0, 10) === todayStr).length,
    upcoming: tasks.filter((t) => t.status !== "done" && (!t.due_at || t.due_at.slice(0, 10) > todayStr)).length,
    totalOpen: tasks.filter((t) => t.status !== "done").length,
    recent: tasks.slice(0, 8).map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.due_at ? t.due_at.slice(0, 10) : "",
      entityType: t.entity_type,
    })),
    items: tasks
      .filter((t) => t.status !== "cancelled")
      .map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.due_at ? t.due_at.slice(0, 10) : "",
        status: t.status,
        entityType: t.entity_type,
        entityId: t.entity_id,
      })),
  };
}
