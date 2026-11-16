import { createClient } from 'npm:@supabase/supabase-js@2.119.0';
import { createAccountDeletionHandler } from './handler.ts';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(createAccountDeletionHandler({
  async verifyUser(token) {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, anonymous: data.user.is_anonymous !== false };
  },
  async prepare(userId) {
    const { error } = await admin.rpc('prepare_account_deletion', { p_user_id: userId });
    if (error) throw new Error('Preparation failed');
  },
  async listMedia(userId) {
    const { data, error } = await admin.rpc('account_media_paths', { p_user_id: userId });
    if (error || !Array.isArray(data)) throw new Error('Media lookup failed');
    return data.map((row: unknown) => {
      if (!row || typeof row !== 'object' || !('path' in row) || typeof row.path !== 'string')
        throw new Error('Invalid media path');
      return row.path;
    });
  },
  async removeMedia(paths) {
    const { error } = await admin.storage.from('wird-media').remove(paths);
    if (error) throw new Error('Media removal failed');
  },
  async purgeData(userId) {
    const { error } = await admin.rpc('purge_account_data', { p_user_id: userId });
    if (error) throw new Error('Data removal failed');
  },
  async revokeSessions(token) {
    const { error } = await admin.auth.admin.signOut(token, 'global');
    if (error) throw new Error('Session revocation failed');
  },
  async deleteUser(userId) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error('Account removal failed');
  },
}));
