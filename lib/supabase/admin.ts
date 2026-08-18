import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com service_role — usar SOMENTE no servidor (API routes).
 * Nunca exponha no frontend.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase admin credentials não configuradas");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
