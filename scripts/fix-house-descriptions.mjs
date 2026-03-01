import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes("--apply");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const humanizeEnumToken = (raw) => {
  let token = String(raw || "").trim();
  if (!token) return "";

  if (token.startsWith("types.")) {
    token = token.slice("types.".length);
    if (token.includes(".")) token = token.split(".").pop() || token;
  }

  if (/^[A-Z0-9_]+$/.test(token)) {
    return token
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }

  if (/^[a-z0-9_]+$/.test(token)) {
    return token.replace(/_/g, " ");
  }

  return token;
};

const normalizeDescription = (value) => {
  if (value === null || value === undefined) return null;
  let text = String(value);

  text = text.replace(/\r\n?/g, "\n");
  text = text.replace(/types\.[A-Za-z0-9_.]+/g, (m) => humanizeEnumToken(m));

  const lines = text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd());

  const compact = [];
  for (const line of lines) {
    const isBlank = line.trim() === "";
    if (isBlank && compact[compact.length - 1] === "") continue;
    compact.push(isBlank ? "" : line.trim());
  }

  text = compact.join("\n").trim();
  return text.length ? text : null;
};

const loadAllHouses = async () => {
  const all = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from("houses")
      .select("id,address,description")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    const page = data || [];
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return all;
};

const main = async () => {
  const houses = await loadAllHouses();
  const candidates = houses.filter((h) => h.description != null && String(h.description).trim() !== "");
  const updates = [];

  for (const h of candidates) {
    const before = h.description;
    const after = normalizeDescription(before);
    if ((before ?? null) !== (after ?? null)) {
      updates.push({ id: h.id, address: h.address, before, after });
    }
  }

  console.log(`Total houses: ${houses.length}`);
  console.log(`Houses with non-empty description: ${candidates.length}`);
  console.log(`Descriptions to update: ${updates.length}`);

  if (updates.length) {
    console.log("\nSample changes:");
    for (const row of updates.slice(0, 5)) {
      console.log(`- ${row.address || row.id}`);
      console.log(`  BEFORE: ${String(row.before).slice(0, 180).replace(/\n/g, " / ")}`);
      console.log(`  AFTER : ${String(row.after).slice(0, 180).replace(/\n/g, " / ")}`);
    }
  }

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
    return;
  }

  let applied = 0;
  const chunkSize = 25;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (row) => {
        const { error } = await supabase
          .from("houses")
          .update({ description: row.after })
          .eq("id", row.id);
        if (error) throw error;
      })
    );
    applied += chunk.length;
    console.log(`Applied ${applied}/${updates.length}`);
  }

  console.log("Done.");
};

main().catch((err) => {
  console.error("Failed:", err?.message || err);
  process.exit(1);
});
