import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') ?? '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') ?? '';
const PAYPAL_API_BASE =
  Deno.env.get('PAYPAL_ENV') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

// Lifetime access price in USD. Kept as one constant so it's trivial to
// change later without hunting through the codebase.
const LIFETIME_ACCESS_PRICE_USD = '25.00';

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  if (status === 204) return new Response(null, { status, headers });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

async function getPaypalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error('Could not authenticate with PayPal');
  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return corsResponse({}, 204);
    if (req.method !== 'POST') return corsResponse({ error: 'Method not allowed' }, 405);

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return corsResponse({ error: 'PayPal is not configured on the server yet.' }, 500);
    }

    // Same auth pattern as the old stripe-checkout function: verify the
    // caller's Supabase session so we know *who* is paying, even though
    // PayPal itself doesn't need to know their user id at this step.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'Missing authorization header' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);
    if (getUserError || !user) return corsResponse({ error: 'Failed to authenticate user' }, 401);

    const accessToken = await getPaypalAccessToken();
    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            // custom_id round-trips back to us on capture, so we can map
            // the PayPal order back to the Supabase user without needing
            // a separate customer-mapping table.
            custom_id: user.id,
            description: 'FreedomPath — lifetime access',
            amount: { currency_code: 'USD', value: LIFETIME_ACCESS_PRICE_USD },
          },
        ],
      }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(order.message || 'PayPal order creation failed');

    return corsResponse({ id: order.id });
  } catch (err) {
    console.error(err);
    return corsResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
