// Server-side Supabase OPTIONAL
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseAdminClient() {
  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !KEY) {
    console.warn("[Supabase server] Not configured");
    return null;
  }
  return createClient<Database>(URL, KEY, { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } });
}

let _admin: ReturnType<typeof createSupabaseAdminClient> | null | undefined;
const noopProxy: unknown = new Proxy(() => undefined, {
  get(_, prop) { if (prop === "then") return undefined; return noopProxy; },
  apply() { return noopProxy; },
});

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient> & { __unconfigured?: boolean }, {
  get(_, prop, receiver) {
    if (_admin === undefined) _admin = createSupabaseAdminClient();
    if (_admin === null) {
      if (prop === "__unconfigured") return true;
      return (noopProxy as unknown as Record<string | symbol, unknown>)[prop as string];
    }
    return Reflect.get(_admin, prop, receiver);
  },
});
