import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupons: data || [] });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao listar cupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_uses,
      active,
      expires_at,
    } = body;

    if (!code || !discount_type || discount_value == null) {
      return NextResponse.json(
        { error: "code, discount_type e discount_value são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["percent", "fixed"].includes(discount_type)) {
      return NextResponse.json({ error: "discount_type inválido" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: String(code).trim().toUpperCase(),
        description: description || null,
        discount_type,
        discount_value: Number(discount_value),
        min_order_value: Number(min_order_value) || 0,
        max_uses: max_uses === "" || max_uses == null ? null : Number(max_uses),
        active: active !== false,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupon: data });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }

    const allowed: Record<string, unknown> = {};
    if (fields.code !== undefined)
      allowed.code = String(fields.code).trim().toUpperCase();
    if (fields.description !== undefined) allowed.description = fields.description;
    if (fields.discount_type !== undefined) allowed.discount_type = fields.discount_type;
    if (fields.discount_value !== undefined)
      allowed.discount_value = Number(fields.discount_value);
    if (fields.min_order_value !== undefined)
      allowed.min_order_value = Number(fields.min_order_value) || 0;
    if (fields.max_uses !== undefined)
      allowed.max_uses =
        fields.max_uses === "" || fields.max_uses == null
          ? null
          : Number(fields.max_uses);
    if (fields.active !== undefined) allowed.active = Boolean(fields.active);
    if (fields.expires_at !== undefined) allowed.expires_at = fields.expires_at || null;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("coupons")
      .update(allowed)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ coupon: data });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao atualizar cupom" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao excluir cupom" }, { status: 500 });
  }
}
