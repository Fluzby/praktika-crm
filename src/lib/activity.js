import { supabase } from "./supabase";

export const logActivity = async ({ type, entity, entity_id = null, label = null }) => {
  try {
    await supabase.from("activity_log").insert([{ type, entity, entity_id, label }]);
  } catch {
  }
};
