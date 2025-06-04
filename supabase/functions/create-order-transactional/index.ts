// supabase/functions/create-order-transactional/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// Inlined CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For development. In production, specify your frontend domain.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Specify allowed methods
};

console.log("[create-order-transactional] Simplified function module loading (with inlined CORS)...");

serve(async (req: Request) => {
  console.log(`[create-order-transactional] Request received: ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log("[create-order-transactional] Handling OPTIONS request.");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure secrets are set in the Supabase Dashboard for this function
    const supabaseURL = Deno.env.get('SUPABASE_URL');
    const serviceKeyIsSet = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Just check if it's set

    console.log(`[create-order-transactional] SUPABASE_URL from env: ${supabaseURL}`);
    console.log(`[create-order-transactional] SUPABASE_SERVICE_ROLE_KEY is set (check): ${serviceKeyIsSet}`);

    if (!supabaseURL || !serviceKeyIsSet) {
      console.error("[create-order-transactional] CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in function secrets!");
      return new Response(JSON.stringify({ error: "Function configuration error: Essential secrets missing." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // If we reach here, secrets are likely present (or at least the env vars were found by Deno.env.get)
    const data = {
      message: "Hello from simplified create-order-transactional!",
      timestamp: new Date().toISOString(),
      configCheck: {
        urlPresent: !!supabaseURL,
        serviceKeyPresent: serviceKeyIsSet
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

console.log("[create-order-transactional] Simplified function module loaded and serve called (with inlined CORS).");
