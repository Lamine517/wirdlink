export interface AccountDeletionServices {
  verifyUser(token: string): Promise<{ id: string; anonymous: boolean } | null>;
  prepare(userId: string): Promise<void>;
  listMedia(userId: string): Promise<string[]>;
  removeMedia(paths: string[]): Promise<void>;
  purgeData(userId: string): Promise<void>;
  revokeSessions(token: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
};
function response(status: number, value: object): Response {
  return new Response(JSON.stringify(value), { status, headers });
}

export function createAccountDeletionHandler(services: AccountDeletionServices) {
  return async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return response(405, { error: 'method_not_allowed' });
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return response(401, { error: 'unauthorized' });
    const token = authorization.slice(7);
    try {
      const body: unknown = await request.json();
      if (!body || typeof body !== 'object' || !('confirmation' in body) ||
        body.confirmation !== 'DELETE_ACCOUNT' || Object.keys(body).length !== 1)
        return response(400, { error: 'confirmation_required' });
    } catch {
      return response(400, { error: 'invalid_request' });
    }
    try {
      const user = await services.verifyUser(token);
      if (!user || user.anonymous) return response(401, { error: 'unauthorized' });
      await services.prepare(user.id);
      // Storage removal is resumable and bounded. No SQL deletion of Storage metadata.
      let emptied = false;
      for (let batch = 0; batch < 20; batch++) {
        const paths = await services.listMedia(user.id);
        if (!paths.length) { emptied = true; break; }
        await services.removeMedia(paths);
      }
      if (!emptied) return response(503, { error: 'deletion_incomplete' });
      await services.purgeData(user.id);
      await services.revokeSessions(token);
      await services.deleteUser(user.id);
      return response(200, { deleted: true });
    } catch {
      // Never log access tokens, identities, file paths or raw provider errors.
      return response(503, { error: 'deletion_incomplete' });
    }
  };
}
