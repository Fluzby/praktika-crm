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

    let client: any = null;
    const clientWithPrefs = await supabase
      .from("clients")
      .select("id, full_name, notes, deal_preference, property_preference, min_price, max_price, min_rooms, max_rooms, preferred_tags, updated_at")
      .eq("id", client_id)
      .single();

    if (!clientWithPrefs.error && clientWithPrefs.data) {
      client = clientWithPrefs.data;
    } else {
      const cMsg = String(clientWithPrefs.error?.message || clientWithPrefs.error || "");
      const missingPrefCols =
        cMsg.includes("deal_preference") || cMsg.includes("property_preference");
      if (!missingPrefCols) throw clientWithPrefs.error;

      const clientLegacy = await supabase
        .from("clients")
        .select("id, full_name, notes, min_price, max_price, min_rooms, max_rooms, preferred_tags, updated_at")
        .eq("id", client_id)
        .single();
      if (clientLegacy.error || !clientLegacy.data) throw clientLegacy.error;
      client = {
        ...clientLegacy.data,
        deal_preference: null,
        property_preference: null,
      };
    }

    if (!force) {
      const { data: cached } = await supabase
        .from("ai_match_cache")
        .select("results, updated_at")
        .eq("client_id", client_id)
        .maybeSingle();

      if (cached?.results) {
        const cacheTime = new Date(cached.updated_at).getTime();
        const clientUpdatedAt = client.updated_at ? new Date(client.updated_at).getTime() : 0;
        const ageMs = Date.now() - cacheTime;
        const oneDay = 24 * 60 * 60 * 1000;
        const cacheIsFresh = ageMs < oneDay && cacheTime >= clientUpdatedAt;

        if (cacheIsFresh) {
          return new Response(JSON.stringify(cached.results.slice(0, topN)), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: rejected } = await supabase
      .from("house_matches")
      .select("house_id")
      .eq("client_id", client_id)
      .eq("status", "rejected");

    const rejectedIds = new Set((rejected || []).map((r) => r.house_id));

    const buildHouseQuery = () => {
      let q = supabase
        .from("houses")
        .select("id, address, city, price, rooms, tags, description, deal_type, object_type")
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

    const APARTMENT_TOKENS = ["apartment", "flat", "condo", "korter", "korteri", "korterelamu"];
    const HOUSE_TOKENS = ["house", "detached", "townhouse", "villa", "maja", "eramu", "ridamaja", "paarismaja", "suvila"];
    const SALE_TOKENS = ["sale", "sell", "for sale", "buy", "ost", "müük", "muuk", "müüa"];
    const RENT_TOKENS = ["rent", "rental", "lease", "for rent", "üür", "uur", "üürile", "rentida"];

    const classifyPropertyType = (house: any) => {
      const fields = [house?.object_type, ...(house?.tags || [])];
      const haystack = fields
        .filter((v: unknown) => v != null && String(v).trim() !== "")
        .map((v: unknown) => String(v).toLowerCase())
        .join(" ");
      if (!haystack) return "unknown";
      if (APARTMENT_TOKENS.some((token) => haystack.includes(token))) return "apartment";
      if (HOUSE_TOKENS.some((token) => haystack.includes(token))) return "house";
      return "unknown";
    };

    const classifyDealType = (house: any) => {
      const fields = [house?.deal_type, ...(house?.tags || [])];
      const haystack = fields
        .filter((v: unknown) => v != null && String(v).trim() !== "")
        .map((v: unknown) => String(v).toLowerCase())
        .join(" ");
      if (!haystack) return "unknown";
      const isSale = SALE_TOKENS.some((token) => haystack.includes(token));
      const isRent = RENT_TOKENS.some((token) => haystack.includes(token));
      if (isSale && !isRent) return "sale";
      if (isRent && !isSale) return "rent";
      return "unknown";
    };

    const desiredDeal =
      client.deal_preference === "buy" ? "sale" :
      client.deal_preference === "rent" ? "rent" :
      "any";
    const desiredProperty =
      client.property_preference === "apartment" ? "apartment" :
      client.property_preference === "house" ? "house" :
      "any";

    let prefFilteredHouses = houses;
    if (desiredDeal !== "any") {
      const subset = prefFilteredHouses.filter((h) => classifyDealType(h) === desiredDeal);
      if (subset.length > 0) prefFilteredHouses = subset;
    }
    if (desiredProperty !== "any") {
      const subset = prefFilteredHouses.filter((h) => classifyPropertyType(h) === desiredProperty);
      if (subset.length > 0) prefFilteredHouses = subset;
    }

    const filteredHouses = (prefFilteredHouses || []).filter((h) => !rejectedIds.has(h.id));
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
    const normalizeTag = (v: unknown) => {
      let s = String(v ?? "").trim();
      if (!s) return "";
      if (/^types\./i.test(s)) {
        s = s.replace(/^types\./i, "");
        if (s.includes(".")) s = s.split(".").pop() || s;
      }
      return s.replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    };
    const preferredTags = (client.preferred_tags || []).map(normalizeTag).filter(Boolean);

    const rankBatch = async (batchHouses: any[], batchTopN: number) => {
      const systemPrompt = `
You are a strict real-estate matching engine.

Goal:
- Rank houses from best to worst for this specific client.
- Understand and use ALL details from client notes, including small details.

Priority of truth:
1) Explicit statements in client notes (highest priority).
2) Structured client preferences.
3) Reasonable inference only when not explicit.

Note understanding rules:
- Parse notes carefully, including typos, shorthand, mixed languages, and informal wording.
- Capture positives (wants), negatives (does not want), and hard constraints (must/must not/deal-breakers).
- Treat exclusions and negations as strict constraints.
- If notes conflict with structured preferences, notes win.
- If notes include updated intent (for example "now", "instead", "changed"), prefer the newer intent.
- Never ignore a concrete detail that can affect ranking.
- Preferred tags are a strong ranking signal; if two houses are otherwise similar, rank the one matching more preferred tags higher.

Language rule:
- Detect the dominant language of client notes.
- Write "reason" in the same dominant language.
- If notes are mixed-language, keep "reason" in the dominant language and keep important terms as written.
- Do not translate unless explicitly asked.

Scoring rules:
- Confidence is an integer 0-100.
- 90-100: very strong fit with no major conflicts.
- 70-89: good fit with minor tradeoffs.
- 40-69: partial fit with notable gaps.
- 0-39: weak fit or conflicts with important notes.
- Penalize missing key information when key note constraints cannot be verified.

Output rules:
- Return ONLY valid JSON.
- Return at most the requested number of results.
- house_id MUST be copied exactly from the provided "id=" value.
- house_id MUST be a UUID string.
- NEVER return price, rooms, address, or other values as house_id.
- Keep "reason" short and concrete (max 2 sentences).
`;

      const userPrompt = `
Client notes:
${client.notes || "No notes"}

Client preferences:
- Deal preference: ${client.deal_preference || "any"}
- Property preference: ${client.property_preference || "any"}
- Min price: ${client.min_price ?? "any"}
- Max price: ${client.max_price ?? "any"}
- Min rooms: ${client.min_rooms ?? "any"}
- Max rooms: ${client.max_rooms ?? "any"}
- Preferred tags: ${(client.preferred_tags || []).join(", ") || "any"}

Houses:
${batchHouses
  .map((h, i) => {
    const houseTags = (h.tags || []).map(normalizeTag).filter(Boolean);
    const matchedPreferredTags = preferredTags.filter((t) => houseTags.includes(t));
    return `
${i + 1}) id=${h.id}
Address: ${h.address}
City: ${h.city || "—"}
Deal type: ${h.deal_type || "—"}
Property type: ${h.object_type || "—"}
Price: ${h.price ?? "—"}
Rooms: ${h.rooms ?? "—"}
Tags: ${houseTags.join(", ") || "—"}
Preferred tag matches: ${matchedPreferredTags.join(", ") || "none"}
Description: ${h.description || "—"}`;
  })
  .join("\n")}

Return JSON in this exact shape:
{
  "results": [
    { "house_id": "uuid", "reason": "short explanation", "confidence": 0 }
  ]
}

Return at most ${batchTopN} results.
`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
