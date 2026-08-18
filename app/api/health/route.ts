import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  const checks = {
    NEXT_PUBLIC_SUPABASE_URL: {
      present: Boolean(supabaseUrl),
      startsWithHttps: supabaseUrl.startsWith("https://"),
      endsWithSupabaseCo: supabaseUrl.includes(".supabase.co"),
      length: supabaseUrl.length,
      preview: supabaseUrl
        ? `${supabaseUrl.slice(0, 20)}...${supabaseUrl.slice(-15)}`
        : null,
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      present: Boolean(anonKey),
      startsWithEyJ: anonKey.startsWith("eyJ"),
      length: anonKey.length,
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      present: Boolean(serviceKey),
      startsWithEyJ: serviceKey.startsWith("eyJ"),
      length: serviceKey.length,
    },
    ASAAS_API_KEY: {
      present: Boolean(process.env.ASAAS_API_KEY),
    },
  };

  // Testa conexão real com Supabase (só se URL e service key existirem)
  let dbTest: { ok: boolean; error?: string; productCount?: number } = {
    ok: false,
  };

  if (supabaseUrl.startsWith("https://") && serviceKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/products?select=id&limit=5`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        dbTest = { ok: true, productCount: Array.isArray(data) ? data.length : 0 };
      } else {
        const text = await res.text();
        dbTest = { ok: false, error: `${res.status}: ${text.slice(0, 200)}` };
      }
    } catch (err) {
      dbTest = {
        ok: false,
        error: err instanceof Error ? err.message : "fetch failed",
      };
    }
  } else {
    dbTest = { ok: false, error: "URL ou SERVICE_ROLE_KEY ausente/inválida" };
  }

  return NextResponse.json({
    ok: checks.NEXT_PUBLIC_SUPABASE_URL.startsWithHttps && checks.NEXT_PUBLIC_SUPABASE_ANON_KEY.present,
    checks,
    dbTest,
    tip:
      !checks.NEXT_PUBLIC_SUPABASE_URL.startsWithHttps
        ? "NEXT_PUBLIC_SUPABASE_URL deve começar com https:// e ser tipo https://xxxxx.supabase.co"
        : !checks.NEXT_PUBLIC_SUPABASE_ANON_KEY.present
          ? "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY"
          : !dbTest.ok
            ? "Variáveis presentes, mas falha ao falar com o banco — confira service_role e se as tabelas existem"
            : "Tudo ok no servidor",
  });
}
