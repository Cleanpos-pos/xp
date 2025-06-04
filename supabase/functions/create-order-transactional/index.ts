
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// We'll keep the shared import to see if that's an issue
import { corsHeaders } from '../_shared/cors.ts';

console.log("[create-order-transactional] Simplified function module loading...");

serve(async (req: Request) => {
  console.log(`[create-order-transactional] Request received: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log("[create-order-transactional] Handling OPTIONS request.");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseURL = Deno.env.get('SUPABASE_URL');
    const serviceKeySet = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Just check if it's set

    console.log(`[create-order-transactional] SUPABASE_URL from env: ${supabaseURL}`);
    console.log(`[create-order-transactional] SUPABASE_SERVICE_ROLE_KEY is set: ${serviceKeySet}`);

    if (!supabaseURL || !serviceKeySet) {
      console.error("[create-order-transactional] CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in function secrets!");
      return new Response(JSON.stringify({ error: "Function configuration error: Essential secrets missing." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const data = {
      message: "Hello from simplified create-order-transactional!",
      timestamp: new Date().toISOString(),
      configCheck: {
        urlPresent: !!supabaseURL,
        serviceKeyPresent: serviceKeySet
      }
    };
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[create-order-transactional] Error in simplified serve handler:', error.message, error.stack);
    return new Response(JSON.stringify({ error: "Internal server error in simplified function.", details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

console.log("[create-order-transactional] Simplified function module loaded and serve called.");
