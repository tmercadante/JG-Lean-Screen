import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaderboardRequest {
  scope: 'week' | 'month' | 'year';
  weekStart?: string; // YYYY-MM-DD for week scope
  month?: string; // YYYY-MM for month scope
  year?: string; // YYYY for year scope
  limit?: string;
}

interface UserTotal {
  user_id: string;
  name: string;
  totalHours: number;
  streak: number;
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
    const body: LeaderboardRequest = await req.json();
    const { scope, weekStart, month, year, limit = '50' } = body;
    const limitNum = parseInt(limit);

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

    // Fetch screen entries with user profiles for the period
    const { data: entries, error: entriesError } = await supabase
      .from('screen_entries')
      .select(`
        user_id,
        total_hours,
        profiles!inner(name)
      `)
      .gte('week_start_local', startDate)
      .lte('week_start_local', endDate);

    if (entriesError) {
      console.error('Database error:', entriesError);
      throw new Error(`Database error: ${entriesError.message}`);
    }

    // Group by user and calculate totals
    const userTotals = new Map<string, UserTotal>();

    entries.forEach(entry => {
      const userId = entry.user_id;
      const hours = parseFloat(entry.total_hours);
      const name = (entry.profiles as any)?.name || 'Unknown User';

      if (!userTotals.has(userId)) {
        userTotals.set(userId, {
          user_id: userId,
          name,
          totalHours: 0,
          streak: 0,
        });
      }

      const userTotal = userTotals.get(userId)!;
      userTotal.totalHours += hours;
    });

    // Calculate streaks for each user
    for (const [userId, userTotal] of userTotals.entries()) {
      const { data: userEntries, error: userEntriesError } = await supabase
        .from('screen_entries')
        .select('week_start_local')
        .eq('user_id', userId)
        .order('week_start_local', { ascending: false });

      if (userEntriesError) {
        console.error('Error fetching user entries for streak:', userEntriesError);
        userTotal.streak = 0;
      } else {
        // Calculate consecutive weeks
        let streak = 0;
        for (let i = 0; i < userEntries.length; i++) {
          if (i === 0) {
            streak = 1;
          } else {
            const currentWeek = new Date(userEntries[i].week_start_local);
            const previousWeek = new Date(userEntries[i - 1].week_start_local);
            const expectedPreviousWeek = new Date(currentWeek);
            expectedPreviousWeek.setUTCDate(currentWeek.getUTCDate() + 7);

            if (previousWeek.getTime() === expectedPreviousWeek.getTime()) {
              streak++;
            } else {
              break;
            }
          }
        }
        userTotal.streak = streak;
      }
    }

    // Sort by total hours (ascending - least hours = highest rank)
    const sortedUsers = Array.from(userTotals.values()).sort((a, b) => a.totalHours - b.totalHours);

    // Assign ranks with proper tie handling
    const rankedUsers = [];
    let currentRank = 1;

    for (let i = 0; i < sortedUsers.length; i++) {
      const user = sortedUsers[i];
      
      // Check if tied with previous user
      if (i > 0 && sortedUsers[i - 1].totalHours === user.totalHours) {
        // Same rank as previous user
      } else {
        currentRank = i + 1;
      }

      rankedUsers.push({
        rank: currentRank,
        user: {
          id: user.user_id,
          name: user.name,
        },
        totalHours: Math.round(user.totalHours * 100) / 100,
        top3: currentRank <= 3,
        streak: user.streak > 1 ? user.streak : undefined,
      });
    }

    // Limit results
    const limitedResults = rankedUsers.slice(0, limitNum);

    // Find current user's rank
    const myRank = rankedUsers.find(r => r.user.id === user.id);

    const response = {
      scope,
      range: {
        start: startDate,
        end: endDate,
      },
      rows: limitedResults,
      ...(myRank && {
        myRank: {
          rank: myRank.rank,
          totalHours: myRank.totalHours,
        }
      }),
    };

    console.log(`Leaderboard calculated (${scope}): ${limitedResults.length} users, current user rank: ${myRank?.rank || 'not found'}`);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in leaderboard function:', error);
    
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