import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScreenEntryRequest {
  weekStartLocal: string; // YYYY-MM-DD format
  totalHours: number;
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
    const body: ScreenEntryRequest = await req.json();
    const { weekStartLocal, totalHours } = body;

    // Validate input
    if (!weekStartLocal || typeof totalHours !== 'number') {
      throw new Error('Invalid input: weekStartLocal and totalHours are required');
    }

    if (totalHours < 0 || totalHours > 168) {
      throw new Error('Invalid totalHours: must be between 0 and 168');
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(weekStartLocal)) {
      throw new Error('Invalid date format: use YYYY-MM-DD');
    }

    // Parse and validate date is a Sunday
    const weekDate = new Date(weekStartLocal + 'T00:00:00Z');
    if (isNaN(weekDate.getTime())) {
      throw new Error('Invalid date');
    }

    if (weekDate.getUTCDay() !== 0) {
      throw new Error('Week start must be a Sunday');
    }

    // Check if week is within allowed window (current + 2 previous weeks)
    const now = new Date();
    const currentSunday = new Date(now);
    currentSunday.setUTCDate(now.getUTCDate() - now.getUTCDay());
    currentSunday.setUTCHours(0, 0, 0, 0);

    const twoWeeksAgo = new Date(currentSunday);
    twoWeeksAgo.setUTCDate(currentSunday.getUTCDate() - 14);

    if (weekDate < twoWeeksAgo || weekDate > currentSunday) {
      throw new Error('Week must be within the current week or the two preceding weeks');
    }

    // Upsert screen entry
    const { data, error } = await supabase
      .from('screen_entries')
      .upsert({
        user_id: user.id,
        week_start_local: weekStartLocal,
        total_hours: totalHours,
      }, {
        onConflict: 'user_id,week_start_local'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`Screen entry upserted for user ${user.id}: ${totalHours} hours for week ${weekStartLocal}`);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in screen-entries function:', error);
    
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