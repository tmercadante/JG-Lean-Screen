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

    // Get current user (for auth check)
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

    // Fetch aggregated screen entries for all users in the period
    const { data: entries, error: entriesError } = await supabase
      .from('screen_entries')
      .select('week_start_local, total_hours')
      .gte('week_start_local', startDate)
      .lte('week_start_local', endDate)
      .order('week_start_local', { ascending: true });

    if (entriesError) {
      console.error('Database error:', entriesError);
      throw new Error(`Database error: ${entriesError.message}`);
    }

    // Group by week and calculate averages
    const weeklyAverages = new Map<string, { total: number; count: number }>();

    entries.forEach(entry => {
      const week = entry.week_start_local;
      const hours = parseFloat(entry.total_hours);
      
      if (!weeklyAverages.has(week)) {
        weeklyAverages.set(week, { total: 0, count: 0 });
      }
      
      const weekData = weeklyAverages.get(week)!;
      weekData.total += hours;
      weekData.count += 1;
    });

    // Calculate series data (average per week)
    const series = Array.from(weeklyAverages.entries()).map(([week, data]) => ({
      date: week,
      totalHours: Math.round((data.total / data.count) * 100) / 100,
    }));

    // Calculate overall aggregates
    const totalHours = entries.reduce((sum, entry) => sum + parseFloat(entry.total_hours), 0);
    const totalUsers = new Set(entries.map(() => 'user')).size; // Simplified for aggregate view
    const avgPerWeek = series.length > 0 
      ? series.reduce((sum, item) => sum + item.totalHours, 0) / series.length 
      : 0;

    const response = {
      scope,
      range: {
        start: startDate,
        end: endDate,
      },
      series,
      aggregates: {
        totalHours: Math.round((totalHours / Math.max(totalUsers, 1)) * 100) / 100, // Average per user
        avgPerWeek: Math.round(avgPerWeek * 100) / 100,
      },
    };

    console.log(`Aggregate metrics calculated (${scope}): ${series.length} data points`);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in all-metrics function:', error);
    
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