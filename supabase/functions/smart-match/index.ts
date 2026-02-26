import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { client_id, force, top_n } = await req.json();
    if (!client_id) {
      return new Response(JSON.stringify({ error: "Missing client_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const requestedTop = Number(top_n);
    const topN = [3, 5, 10].includes(requestedTop) ? requestedTop : 5;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!force) {
      const { data: cached } = await supabase
        .from("ai_match_cache")
        .select("results, updated_at")
        .eq("client_id", client_id)
        .maybeSingle();

      if (cached?.results) {
        const ageMs = Date.now() - new Date(cached.updated_at).getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (ageMs < oneDay) {
          return new Response(JSON.stringify(cached.results.slice(0, topN)), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: client, error: cErr } = await supabase
      .from("clients")
      .select("id, full_name, notes, min_price, max_price, min_rooms, max_rooms, preferred_tags")
      .eq("id", client_id)
      .single();

    if (cErr || !client) throw cErr;

    const { data: rejected } = await supabase
      .from("house_matches")
      .select("house_id")
      .eq("client_id", client_id)
      .eq("status", "rejected");

    const rejectedIds = new Set((rejected || []).map((r) => r.house_id));

    const buildHouseQuery = () => {
      let q = supabase
        .from("houses")
        .select("id, address, city, price, rooms, tags, description")
        .order("created_at", { ascending: false });

      if (client.min_price != null) q = q.gte("price", client.min_price);
      if (client.max_price != null) q = q.lte("price", client.max_price);
      if (client.min_rooms != null) q = q.gte("rooms", client.min_rooms);
      if (client.max_rooms != null) q = q.lte("rooms", client.max_rooms);
      return q;
    };

    const houses: any[] = [];
    const pageSize = 200;
    for (let from = 0; ; from += pageSize) {
      const to = from + pageSize - 1;
      const { data, error } = await buildHouseQuery().range(from, to);
      if (error) throw error;
      const page = data || [];
      houses.push(...page);
      if (page.length < pageSize) break;
    }

    if (!houses || houses.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filteredHouses = (houses || []).filter((h) => !rejectedIds.has(h.id));
    if (filteredHouses.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const isUuid = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

    const rankBatch = async (batchHouses: any[], batchTopN: number) => {
      const prompt = `
You are a real estate assistant.

LANGUAGE RULE:
- Client notes may be written in different languages (e.g. Estonian or English).
- Detect the language of the client notes.
- Write the "reason" in the SAME language as the client notes.
- Do NOT translate unless explicitly asked.

IMPORTANT RULE:
Some houses have already been rejected by this client.
Those houses MUST NOT be suggested again.
If a house is not listed below, assume it is allowed.

Client notes:
${client.notes || "No notes"}

Client preferences:
- Min price: ${client.min_price ?? "any"}
- Max price: ${client.max_price ?? "any"}
- Min rooms: ${client.min_rooms ?? "any"}
- Max rooms: ${client.max_rooms ?? "any"}
- Preferred tags: ${(client.preferred_tags || []).join(", ") || "any"}

Houses:
${batchHouses
  .map(
    (h, i) => `
${i + 1}) id=${h.id}
Address: ${h.address}
City: ${h.city || "—"}
Price: ${h.price ?? "—"}
Rooms: ${h.rooms ?? "—"}
Tags: ${(h.tags || []).join(", ") || "—"}
Description: ${h.description || "—"}`
  )
  .join("\n")}

TASK:
Rank the houses from best to worst for this client.

Return ONLY valid JSON in this exact format:
{
  "results": [
    { "house_id": "uuid", "reason": "short explanation", "confidence": 0 }
  ]
}
IMPORTANT:
- house_id MUST be copied exactly from the "id=" field of a house above.
- house_id MUST be a UUID string (contains letters a-f and dashes).
- NEVER return price, rooms, address, or any other value as house_id.
- confidence is an integer 0–100 (100 = perfect match, 0 = terrible match).
- Return at most ${batchTopN} results.
`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(completion.choices[0].message.content!);
      const raw = parsed.results || [];

      return raw
        .filter(
          (r: any) =>
            r &&
            typeof r.house_id === "string" &&
            isUuid(r.house_id) &&
            !rejectedIds.has(r.house_id)
        )
        .map((r: any) => ({
          house_id: r.house_id,
          reason: typeof r.reason === "string" ? r.reason.slice(0, 200) : "",
          confidence: clamp(Number(r.confidence ?? 0)),
        }))
        .slice(0, batchTopN);
    };

    let valid: any[] = [];
    const batchSize = 40;
    if (filteredHouses.length <= batchSize) {
      valid = await rankBatch(filteredHouses, topN);
    } else {
      const candidateTopPerBatch = Math.min(10, Math.max(topN * 2, 5));
      const merged = new Map<string, any>();

      for (let i = 0; i < filteredHouses.length; i += batchSize) {
        const chunk = filteredHouses.slice(i, i + batchSize);
        const ranked = await rankBatch(chunk, candidateTopPerBatch);
        for (const r of ranked) {
          const prev = merged.get(r.house_id);
          if (!prev || (r.confidence ?? 0) > (prev.confidence ?? 0)) {
            merged.set(r.house_id, r);
          }
        }
      }

      const candidateIds = Array.from(merged.keys());
      const byId = new Map(filteredHouses.map((h) => [h.id, h]));
      const candidateHouses = candidateIds
        .map((id) => byId.get(id))
        .filter(Boolean);

      if (candidateHouses.length <= batchSize) {
        valid = await rankBatch(candidateHouses, topN);
      } else {
        // Final rerank in batches if candidate pool is still large, then merge by confidence.
        const rerankMerged = new Map<string, any>();
        for (let i = 0; i < candidateHouses.length; i += batchSize) {
          const chunk = candidateHouses.slice(i, i + batchSize);
          const ranked = await rankBatch(chunk, candidateTopPerBatch);
          for (const r of ranked) {
            const prev = rerankMerged.get(r.house_id);
            if (!prev || (r.confidence ?? 0) > (prev.confidence ?? 0)) {
              rerankMerged.set(r.house_id, r);
            }
          }
        }
        valid = Array.from(rerankMerged.values())
          .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
          .slice(0, topN);
      }
    }

    await supabase.from("ai_match_cache").upsert(
      {
        client_id,
        results: valid,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id" }
    );

    await supabase.from("house_matches").upsert(
      valid.map((r: any) => ({
        client_id,
        house_id: r.house_id,
        source: "ai",
      })),
      { onConflict: "client_id,house_id" }
    );

    await supabase.from("activity_log").insert({
      entity_type: "client",
      entity_id: client_id,
      message: "AI matched houses",
    });

    return new Response(JSON.stringify(valid), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
