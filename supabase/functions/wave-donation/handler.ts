export interface DonationConfig {
  apiKey: string | undefined;
  /** Only set when the Wave API key was created with request signing. */
  signingSecret: string | undefined;
  siteUrl: string;
  fetch: typeof fetch;
  now(): number;
}

export const MIN_DONATION = 100;
export const MAX_DONATION = 500_000;
const CHECKOUT_URL = 'https://api.wave.com/v1/checkout/sessions';

function headers(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'apikey, content-type, x-client-info, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  };
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createDonationHandler(config: DonationConfig) {
  const allowed = [config.siteUrl, 'http://localhost:4200'];

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');
    const cors = headers(origin && allowed.includes(origin) ? origin : config.siteUrl);
    const response = (status: number, value: object) =>
      new Response(JSON.stringify(value), { status, headers: cors });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return response(405, { error: 'method_not_allowed' });
    let amount: unknown;
    try {
      const body: unknown = await request.json();
      if (!body || typeof body !== 'object' || Object.keys(body).length !== 1 || !('amount' in body))
        return response(400, { error: 'invalid_amount' });
      amount = body.amount;
    } catch {
      return response(400, { error: 'invalid_request' });
    }
    if (
      typeof amount !== 'number' ||
      !Number.isSafeInteger(amount) ||
      amount < MIN_DONATION ||
      amount > MAX_DONATION
    )
      return response(400, { error: 'invalid_amount' });
    if (!config.apiKey) return response(503, { error: 'not_configured' });

    const body = JSON.stringify({
      amount: String(amount),
      currency: 'XOF',
      success_url: config.siteUrl + '/soutenir?don=merci',
      error_url: config.siteUrl + '/soutenir?don=echec',
      client_reference: 'wirdlink-don',
    });
    const waveHeaders: Record<string, string> = {
      Authorization: 'Bearer ' + config.apiKey,
      'Content-Type': 'application/json',
    };
    if (config.signingSecret) {
      const timestamp = String(Math.floor(config.now() / 1000));
      waveHeaders['Wave-Signature'] =
        `t=${timestamp},v1=${await sign(config.signingSecret, timestamp + body)}`;
    }
    try {
      const wave = await config.fetch(CHECKOUT_URL, { method: 'POST', headers: waveHeaders, body });
      if (!wave.ok) return response(502, { error: 'wave_unavailable' });
      const session: unknown = await wave.json();
      const url =
        session && typeof session === 'object' && 'wave_launch_url' in session
          ? session.wave_launch_url
          : null;
      if (typeof url !== 'string' || !url.startsWith('https://pay.wave.com/'))
        return response(502, { error: 'wave_unavailable' });
      return response(200, { url });
    } catch {
      return response(502, { error: 'wave_unavailable' });
    }
  };
}
