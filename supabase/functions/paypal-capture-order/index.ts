import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') ?? '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') ?? '';
const PAYPAL_API_BASE =
  Deno.env.get('PAYPAL_ENV') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'Missing authorization header' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);
    if (getUserError || !user) return corsResponse({ error: 'Failed to authenticate user' }, 401);

    const { order_id } = await req.json();
    if (!order_id) return corsResponse({ error: 'order_id is required' }, 400);

    const accessToken = await getPaypalAccessToken();
    const captureRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const capture = await captureRes.json();
    if (!captureRes.ok) throw new Error(capture.message || 'PayPal capture failed');

    const purchaseUnit = capture.purchase_units?.[0];
    const customId = purchaseUnit?.payments?.captures?.[0]?.custom_id ?? purchaseUnit?.custom_id;

    // Defense in depth: make sure the order we just captured actually
    // belongs to the signed-in user making this request, not just whoever
    // happens to know a valid order_id.
    if (customId && customId !== user.id) {
      return corsResponse({ error: 'This order does not belong to the signed-in user.' }, 403);
    }

    if (capture.status !== 'COMPLETED') {
      return corsResponse({ status: capture.status, granted: false });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        has_lifetime_access: true,
        lifetime_access_order_id: order_id,
        lifetime_access_granted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to record lifetime access after successful payment:', updateError);
      // The payment genuinely succeeded even though our own bookkeeping
      // failed — surface this distinctly so it can be fixed by hand
      // (via the order_id we still returned) rather than silently losing
      // a paying customer's access.
      return corsResponse(
        { error: 'Payment succeeded but we could not update your account. Contact support with this order ID: ' + order_id },
        500
      );
    }

    return corsResponse({ status: 'COMPLETED', granted: true });
  } catch (err) {
    console.error(err);
    return corsResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
