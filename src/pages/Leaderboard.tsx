// src/pages/Leaderboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = { user_id: string; total_minutes: number; rank: number };

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const { data, error } = await supabase.functions.invoke("leaderboard", {
          body: { rangeDays: 7 },
          headers: { "Content-Type": "application/json" },
        });

        // supabase-js returns `error` for non-2xx; data for 2xx
        if (error) {
          throw error;
        }
        // Defensive: the function always returns JSON { ok, leaderboard }
        const list = (data?.leaderboard ?? []) as Row[];
        if (!aborted) setRows(list);
      } catch (e: any) {
        console.error("load leaderboard failed:", e);
        // Show a friendly error
        const msg =
          e?.message ??
          e?.name ??
          "Failed to load leaderboard (server unavailable)";
        if (!aborted) setErr(msg);
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Loading leaderboard…
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
          <div className="font-medium mb-1">Error loading leaderboard</div>
          <div className="opacity-80">{err}</div>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No data yet. Log some time to see the leaderboard.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Leaderboard (7 days)</h1>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/50">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-right">Total minutes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t border-zinc-800">
                <td className="px-4 py-2">{r.rank}</td>
                <td className="px-4 py-2">{r.user_id}</td>
                <td className="px-4 py-2 text-right">{r.total_minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
