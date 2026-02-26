const KEYS = {
  clientStatus: "crm_client_status_v1",
  houseStage: "crm_house_stage_v1",
  tasks: "crm_tasks_v1",
  savedViews: "crm_saved_views_v1",
  activity: "crm_local_activity_v1",
};

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore localStorage failures
  }
};

const uuid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export const CLIENT_PIPELINE = [
  "new_lead",
  "contacted",
  "viewing",
  "negotiation",
  "closed",
  "lost",
];

export const HOUSE_PIPELINE = [
  "new_listing",
  "qualified",
  "marketing",
  "viewings",
  "offer",
  "closed",
];

export const CLIENT_PIPELINE_LABELS = {
  new_lead: "New Lead",
  contacted: "Contacted",
  viewing: "Viewing",
  negotiation: "Negotiation",
  closed: "Closed",
  lost: "Lost",
};

export const HOUSE_PIPELINE_LABELS = {
  new_listing: "New Listing",
  qualified: "Qualified",
  marketing: "Marketing",
  viewings: "Viewings",
  offer: "Offer",
  closed: "Closed",
};

export function getClientStatus(clientId) {
  const map = safeRead(KEYS.clientStatus, {});
  return map[clientId] || "new_lead";
}

export function setClientStatus(clientId, status) {
  const map = safeRead(KEYS.clientStatus, {});
  map[clientId] = status;
  safeWrite(KEYS.clientStatus, map);
}

export function getHouseStage(houseId) {
  const map = safeRead(KEYS.houseStage, {});
  return map[houseId] || "new_listing";
}

export function setHouseStage(houseId, stage) {
  const map = safeRead(KEYS.houseStage, {});
  map[houseId] = stage;
  safeWrite(KEYS.houseStage, map);
}

export function getAllClientStatuses() {
  return safeRead(KEYS.clientStatus, {});
}

export function getAllHouseStages() {
  return safeRead(KEYS.houseStage, {});
}

export function getTasks() {
  return safeRead(KEYS.tasks, []);
}

export function getEntityTasks(entityType, entityId) {
  return getTasks()
    .filter((x) => x.entityType === entityType && String(x.entityId) === String(entityId))
    .sort((a, b) => {
      const ad = a.dueDate || "9999-12-31";
      const bd = b.dueDate || "9999-12-31";
      return ad.localeCompare(bd) || (b.createdAt || "").localeCompare(a.createdAt || "");
    });
}

export function addTask(task) {
  const tasks = getTasks();
  const row = {
    id: uuid(),
    title: task.title?.trim() || "Follow up",
    dueDate: task.dueDate || null,
    done: false,
    entityType: task.entityType,
    entityId: task.entityId,
    createdAt: new Date().toISOString(),
  };
  tasks.unshift(row);
  safeWrite(KEYS.tasks, tasks);
  return row;
}

export function toggleTask(taskId) {
  const tasks = getTasks();
  const next = tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
  safeWrite(KEYS.tasks, next);
  return next.find((t) => t.id === taskId) || null;
}

export function deleteTask(taskId) {
  const tasks = getTasks();
  safeWrite(
    KEYS.tasks,
    tasks.filter((t) => t.id !== taskId)
  );
}

export function getDashboardTasksSummary() {
  const tasks = getTasks();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  return {
    overdue: tasks.filter((t) => !t.done && t.dueDate && t.dueDate < todayStr).length,
    today: tasks.filter((t) => !t.done && t.dueDate === todayStr).length,
    upcoming: tasks.filter((t) => !t.done && (!t.dueDate || t.dueDate > todayStr)).length,
    totalOpen: tasks.filter((t) => !t.done).length,
    recent: tasks
      .slice()
      .sort((a, b) => (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31"))
      .slice(0, 8),
  };
}

export function logLocalActivity(entry) {
  const rows = safeRead(KEYS.activity, []);
  rows.unshift({
    id: uuid(),
    created_at: new Date().toISOString(),
    source: "local",
    ...entry,
  });
  safeWrite(KEYS.activity, rows.slice(0, 500));
}

export function getEntityLocalActivity(entity, entityId) {
  return safeRead(KEYS.activity, []).filter(
    (x) => x.entity === entity && String(x.entity_id) === String(entityId)
  );
}

export function getSavedViews(scope) {
  const all = safeRead(KEYS.savedViews, { clients: [], houses: [] });
  return all[scope] || [];
}

export function saveView(scope, view) {
  const all = safeRead(KEYS.savedViews, { clients: [], houses: [] });
  const next = (all[scope] || []).filter((v) => v.name !== view.name);
  next.unshift({ ...view, createdAt: new Date().toISOString() });
  all[scope] = next.slice(0, 12);
  safeWrite(KEYS.savedViews, all);
}

export function deleteSavedView(scope, name) {
  const all = safeRead(KEYS.savedViews, { clients: [], houses: [] });
  all[scope] = (all[scope] || []).filter((v) => v.name !== name);
  safeWrite(KEYS.savedViews, all);
}
