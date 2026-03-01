import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const toDateStrLocal = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const main = async () => {
  const { data, error } = await supabase
    .from("tasks")
    .select("id,title,due_at,status,entity_type,entity_id,created_at")
    .neq("status", "cancelled")
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(5000);

  if (error) throw error;
  const tasks = data || [];

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const todayUtc = new Date().toISOString().slice(0, 10);
  const todayLocal = toDateStrLocal(new Date());

  const calc = (todayStr) => ({
    overdue: tasks.filter((t) => t.status !== "done" && t.due_at && t.due_at.slice(0, 10) < todayStr).length,
    today: tasks.filter((t) => t.status !== "done" && t.due_at && t.due_at.slice(0, 10) === todayStr).length,
    upcoming: tasks.filter((t) => t.status !== "done" && (!t.due_at || t.due_at.slice(0, 10) > todayStr)).length,
    totalOpen: tasks.filter((t) => t.status !== "done").length,
  });

  console.log(`Total tasks (status != cancelled): ${tasks.length}`);
  console.log("Status counts:", statusCounts);
  console.log("Today (UTC):", todayUtc, "=>", calc(todayUtc));
  console.log("Today (Local):", todayLocal, "=>", calc(todayLocal));

  const withDue = tasks.filter((t) => t.due_at).slice(0, 10).map((t) => ({
    id: t.id,
    status: t.status,
    due_at: t.due_at,
    due_date: t.due_at.slice(0, 10),
    title: t.title,
  }));
  console.log("Sample due_at rows:", withDue);
};

main().catch((err) => {
  console.error("Failed:", err?.message || err);
  process.exit(1);
});
