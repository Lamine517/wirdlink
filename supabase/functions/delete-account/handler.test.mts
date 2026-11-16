import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAccountDeletionHandler, type AccountDeletionServices } from './handler.ts';

function fixture() {
  const calls: string[] = [];
  const services: AccountDeletionServices = {
    async verifyUser(token) { calls.push('verify:' + token); return { id: 'verified-user', anonymous: false }; },
    async prepare(id) { calls.push('prepare:' + id); },
    async listMedia(id) { calls.push('list:' + id); return []; },
    async removeMedia(paths) { calls.push('remove:' + paths.join(',')); },
    async purgeData(id) { calls.push('purge:' + id); },
    async revokeSessions(token) { calls.push('revoke:' + token); },
    async deleteUser(id) { calls.push('delete:' + id); },
  };
  const request = (body: object = { confirmation: 'DELETE_ACCOUNT' }) => new Request('https://example.com/delete-account', {
    method: 'POST', headers: { authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { calls, services, request, handler: createAccountDeletionHandler(services) };
}

test('missing credentials and invalid confirmation never reach admin services', async () => {
  const f = fixture();
  assert.equal((await f.handler(new Request('https://example.com', { method: 'POST' }))).status, 401);
  assert.equal((await f.handler(f.request({ confirmation: 'DELETE_ACCOUNT', userId: 'someone-else' }))).status, 400);
  assert.equal((await f.handler(f.request({}))).status, 400);
  assert.deepEqual(f.calls, []);
});
test('anonymous and invalid users cannot delete accounts', async () => {
  const f = fixture();
  f.services.verifyUser = async () => ({ id: 'anonymous', anonymous: true });
  assert.equal((await f.handler(f.request())).status, 401);
  f.services.verifyUser = async () => null;
  assert.equal((await f.handler(f.request())).status, 401);
  assert.deepEqual(f.calls, []);
});
test('only the verified identity is purged, sessions revoked, then account deleted', async () => {
  const f = fixture();
  let listed = false;
  f.services.listMedia = async () => {
    if (listed) return [];
    listed = true;
    return ['verified-user/image.png'];
  };
  const result = await f.handler(f.request());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { deleted: true });
  assert.deepEqual(f.calls, ['verify:test-token', 'prepare:verified-user',
    'remove:verified-user/image.png', 'purge:verified-user', 'revoke:test-token', 'delete:verified-user']);
});
test('storage failure keeps the operation resumable and does not delete the identity', async () => {
  const f = fixture();
  f.services.listMedia = async () => ['verified-user/audio.mp3'];
  f.services.removeMedia = async () => { throw new Error('Private provider detail'); };
  const result = await f.handler(f.request());
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { error: 'deletion_incomplete' });
  assert.ok(!f.calls.some((call) => call.startsWith('purge:') || call.startsWith('delete:')));
});
test('a non-empty media queue is bounded and never produces a false success', async () => {
  const f = fixture();
  f.services.listMedia = async () => ['verified-user/audio.mp3'];
  assert.equal((await f.handler(f.request())).status, 503);
  assert.equal(f.calls.filter((call) => call.startsWith('remove:')).length, 20);
  assert.ok(!f.calls.some((call) => call.startsWith('delete:')));
});
test('session revocation must succeed before identity deletion', async () => {
  const f = fixture();
  f.services.revokeSessions = async () => { throw new Error('Auth unavailable'); };
  assert.equal((await f.handler(f.request())).status, 503);
  assert.ok(!f.calls.some((call) => call.startsWith('delete:')));
});
