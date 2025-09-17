import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricsRequest {
  scope: 'week' | 'month' | 'year';
  weekStart?: string; // YYYY-MM-DD for week scope
  month?: string; // YYYY-MM for month scope
  year?: string; // YYYY for year scope
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { 
        persistSession: false,
        detectSessionInUrl: false 
      },
      global: { 
        headers: { Authorization: authHeader } 
      }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body
    const body: MetricsRequest = await req.json();
    const { scope, weekStart, month, year } = body;

    // Validate scope
    if (!['week', 'month', 'year'].includes(scope)) {
      throw new Error('Invalid scope: must be week, month, or year');
    }

    let startDate: string;
    let endDate: string;

    // Calculate date range based on scope
    if (scope === 'week') {
      if (!weekStart) {
        throw new Error('weekStart is required for week scope');
      }
      startDate = weekStart;
      const weekEndDate = new Date(weekStart + 'T00:00:00Z');
      weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
      endDate = weekEndDate.toISOString().split('T')[0];
    } else if (scope === 'month') {
      if (!month) {
        throw new Error('month is required for month scope');
      }
      const [yearStr, monthStr] = month.split('-');
      const monthDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      startDate = monthDate.toISOString().split('T')[0];
      const monthEndDate = new Date(parseInt(yearStr), parseInt(monthStr), 0);
      endDate = monthEndDate.toISOString().split('T')[0];
    } else {
      if (!year) {
        throw new Error('year is required for year scope');
      }
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    // Fetch user's screen entries for the period
    const { data: entries, error: entriesError } = await supabase
      .from('screen_entries')
      .select('week_start_local, total_hours')
      .eq('user_id', user.id)
      .gte('week_start_local', startDate)
      .lte('week_start_local', endDate)
      .order('week_start_local', { ascending: true });

    if (entriesError) {
      console.error('Database error:', entriesError);
      throw new Error(`Database error: ${entriesError.message}`);
    }

    // Calculate aggregates
    const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.total_hours), 0);
    const avgPerWeek = entries.length > 0 ? totalHours / entries.length : 0;

    // Calculate streak (consecutive weeks with entries)
    let streak = 0;
    let currentStreakStart: string | null = null;

    if (entries.length > 0) {
      // Get all user entries to calculate streak
      const { data: allEntries, error: allEntriesError } = await supabase
        .from('screen_entries')
        .select('week_start_local')
        .eq('user_id', user.id)
        .order('week_start_local', { ascending: false });

      if (allEntriesError) {
        console.error('Error fetching all entries:', allEntriesError);
      } else {
        // Calculate consecutive weeks from most recent
        for (let i = 0; i < allEntries.length; i++) {
          if (i === 0) {
            streak = 1;
            currentStreakStart = allEntries[i].week_start_local;
          } else {
            const currentWeek = new Date(allEntries[i].week_start_local);
            const previousWeek = new Date(allEntries[i - 1].week_start_local);
            const expectedPreviousWeek = new Date(currentWeek);
            expectedPreviousWeek.setUTCDate(currentWeek.getUTCDate() + 7);

            if (previousWeek.getTime() === expectedPreviousWeek.getTime()) {
              streak++;
              currentStreakStart = allEntries[i].week_start_local;
            } else {
              break;
            }
          }
        }
      }
    }

    // Format series data
    const series = entries.map(entry => ({
      date: entry.week_start_local,
      totalHours: parseFloat(entry.total_hours),
    }));

    const response = {
      scope,
      range: {
        start: startDate,
        end: endDate,
      },
      series,
      aggregates: {
        totalHours: Math.round(totalHours * 100) / 100,
        avgPerWeek: Math.round(avgPerWeek * 100) / 100,
      },
      ...(streak > 0 && {
        streak: {
          weeks: streak,
          currentStart: currentStreakStart!,
        }
      }),
    };

    console.log(`Metrics calculated for user ${user.id} (${scope}): ${totalHours} total hours, ${streak} week streak`);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in me-metrics function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});