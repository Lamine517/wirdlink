import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { createDonationHandler, type DonationConfig } from './handler.ts';

function fixture(overrides: Partial<DonationConfig> = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const config: DonationConfig = {
    apiKey: 'wave_sn_prod_test',
    signingSecret: undefined,
    siteUrl: 'https://wirdlink.vercel.app',
    now: () => 1_700_000_000_000,
    fetch: (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ wave_launch_url: 'https://pay.wave.com/c/cos-test' }));
    }) as typeof fetch,
    ...overrides,
  };
  const request = (body: unknown) =>
    new Request('https://example.com/wave-donation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  return { calls, request, handler: createDonationHandler(config) };
}

test('rejects invalid amounts without calling Wave', async () => {
  const f = fixture();
  for (const body of [{}, { amount: 50 }, { amount: 1000.5 }, { amount: '1000' }, { amount: 900_000 }, { amount: 1000, to: 'x' }])
    assert.equal((await f.handler(f.request(body))).status, 400);
  assert.equal((await f.handler(new Request('https://example.com', { method: 'GET' }))).status, 405);
  assert.equal(f.calls.length, 0);
});

test('reports a missing key instead of calling Wave', async () => {
  const f = fixture({ apiKey: undefined });
  const response = await f.handler(f.request({ amount: 1000 }));
  assert.equal(response.status, 503);
  assert.equal(f.calls.length, 0);
});

test('creates a XOF checkout session and returns only the Wave launch URL', async () => {
  const f = fixture();
  const response = await f.handler(f.request({ amount: 2000 }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { url: 'https://pay.wave.com/c/cos-test' });
  const sent = JSON.parse(String(f.calls[0].init.body));
  assert.equal(sent.amount, '2000');
  assert.equal(sent.currency, 'XOF');
  assert.equal(sent.success_url, 'https://wirdlink.vercel.app/soutenir?don=merci');
  assert.equal((f.calls[0].init.headers as Record<string, string>)['Wave-Signature'], undefined);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://wirdlink.vercel.app');
});

test('signs the request when a signing secret is configured', async () => {
  const f = fixture({ signingSecret: 'wave_sn_AKS_secret' });
  await f.handler(f.request({ amount: 1000 }));
  const body = String(f.calls[0].init.body);
  const expected = createHmac('sha256', 'wave_sn_AKS_secret').update('1700000000' + body).digest('hex');
  assert.equal(
    (f.calls[0].init.headers as Record<string, string>)['Wave-Signature'],
    `t=1700000000,v1=${expected}`,
  );
});

test('never forwards an unexpected redirect or a Wave failure', async () => {
  const foreign = fixture({
    fetch: (async () => new Response(JSON.stringify({ wave_launch_url: 'https://evil.example/' }))) as typeof fetch,
  });
  assert.equal((await foreign.handler(foreign.request({ amount: 1000 }))).status, 502);
  const failing = fixture({
    fetch: (async () => new Response('{}', { status: 401 })) as typeof fetch,
  });
  assert.equal((await failing.handler(failing.request({ amount: 1000 }))).status, 502);
});
