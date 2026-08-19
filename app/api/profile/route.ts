import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Salva/atualiza perfil com service role (não depende de sessão RLS) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...fields } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const payload = {
      id: userId,
      full_name: fields.full_name || null,
      phone: fields.phone ? String(fields.phone).replace(/\D/g, "") : null,
      cpf: fields.cpf ? String(fields.cpf).replace(/\D/g, "") : null,
      address_street: fields.address_street || null,
      address_number: fields.address_number || null,
      address_complement: fields.address_complement || null,
      address_neighborhood: fields.address_neighborhood || null,
      address_city: fields.address_city || null,
      address_cep: fields.address_cep
        ? String(fields.address_cep).replace(/\D/g, "")
        : null,
      is_admin:
        Boolean(fields.is_admin) ||
        String(fields.email || "").toLowerCase() ===
          "jefersonfferreira23@gmail.com",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Profile upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar perfil" }, { status: 500 });
  }
}

/** Exclui conta permanentemente */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Remove perfil (cascade do auth.users também remove se FK estiver ok)
    await supabase.from("profiles").delete().eq("id", userId);

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Delete user error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir conta" }, { status: 500 });
  }
}
