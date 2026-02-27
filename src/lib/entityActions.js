import { supabase } from "./supabase";

const randomToken = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export async function archiveEntity({ entityType, entityId, archived, reason = null }) {
  const table = entityType === "client" ? "clients" : "houses";
  const nextArchived = !archived;

  const { error } = await supabase
    .from(table)
    .update({ is_archived: nextArchived })
    .eq("id", entityId);
  if (error) throw error;

  if (nextArchived) {
    await supabase.from("archives").insert({
      entity_type: entityType,
      entity_id: entityId,
      reason,
    });
  }
}

export async function shareEntity({ entityType, entityId }) {
  const { data, error } = await supabase.functions.invoke("share-entity", {
    body: { entity_type: entityType, entity_id: entityId, token_hint: randomToken() },
  });

  if (!error && data?.url) {
    try {
      await navigator.clipboard.writeText(data.url);
    } catch {
      // ignore clipboard errors
    }
    return data;
  }

  // Fallback: fetch entity and copy payload.
  const table = entityType === "client" ? "clients" : "houses";
  const { data: row, error: rowErr } = await supabase.from(table).select("*").eq("id", entityId).single();
  if (rowErr) throw rowErr;

  const payload = JSON.stringify({ entityType, entityId, data: row }, null, 2);
  try {
    await navigator.clipboard.writeText(payload);
  } catch {
    // ignore clipboard errors
  }
  return { fallback: true, payload };
}
