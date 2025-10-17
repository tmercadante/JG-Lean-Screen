// supabase/functions/leaderboard/index.ts
// Deno Edge Function for computing the leaderboard.
// - Handles CORS for ALL responses (2xx and non-2xx)
// - Responds to OPTIONS preflight
// - Never throws uncaught exceptions

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  // ensure CORS on ALL responses (including errors)
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
  return new Response(JSON.stringify(body), { ...init, headers });
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      return json(
        { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      );
    }

    // Parse body (default rangeDays=7)
    let rangeDays = 7;
    try {
      const body = (await req.json().catch(() => ({}))) as {
        rangeDays?: number;
      };
      if (typeof body?.rangeDays === "number" && body.rangeDays > 0) {
        rangeDays = Math.min(90, Math.floor(body.rangeDays));
      }
    } catch {
      /* ignore; default rangeDays */
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Adjust these table/column names to match your schema if different
    // Assumes a table "screen_time_logs" with:
    //   user_id (uuid/text), minutes (int), logged_at (timestamp)
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000)
      .toISOString();

    const { data, error } = await supabase
      .from("screen_time_logs")
      .select("user_id, minutes")
      .gte("logged_at", since);

    if (error) {
      // Known non-2xx with CORS + JSON
      return json({ error: error.message }, { status: 500 });
    }

    // Aggregate totals per user
    const totals = new Map<string, number>();
    for (const row of data ?? []) {
      const k = String(row.user_id);
      totals.set(k, (totals.get(k) ?? 0) + (Number(row.minutes) || 0));
    }

    // Convert to sorted array (lowest time first is “leanest”)
    const leaderboard = Array.from(totals.entries())
      .map(([user_id, total_minutes]) => ({
        user_id,
        total_minutes,
      }))
      .sort((a, b) => a.total_minutes - b.total_minutes)
      .map((row, idx) => ({ ...row, rank: idx + 1 }));

    return json({ ok: true, rangeDays, leaderboard }, { status: 200 });
  } catch (e) {
    console.error("leaderboard error:", e)
