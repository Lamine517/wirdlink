import { createDonationHandler } from './handler.ts';

Deno.serve(
  createDonationHandler({
    apiKey: Deno.env.get('WAVE_API_KEY'),
    signingSecret: Deno.env.get('WAVE_SIGNING_SECRET'),
    siteUrl: Deno.env.get('WIRDLINK_SITE_URL') ?? 'https://wirdlink.vercel.app',
    fetch,
    now: Date.now,
  }),
);
