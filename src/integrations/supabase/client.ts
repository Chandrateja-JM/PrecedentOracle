// Supabase OPTIONAL - returns null/noop instead of throwing when env vars missing.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[Supabase] Not configured - running without persistence");
    return null;
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { storage: typeof window !== 'undefined' ? localStorage : undefined, persistSession: true, autoRefreshToken: true }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | null | undefined;
const noopProxy: unknown = new Proxy(() => undefined, {
  get(_, prop) { if (prop === "then") return undefined; return noopProxy; },
  apply() { return noopProxy; },
});

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient> & { __unconfigured?: boolean }, {
  get(_, prop, receiver) {
    if (_supabase === undefined) _supabase = createSupabaseClient();
    if (_supabase === null) {
      if (prop === "__unconfigured") return true;
      return (noopProxy as unknown as Record<string | symbol, unknown>)[prop as string];
    }
    return Reflect.get(_supabase, prop, receiver);
  },
});
