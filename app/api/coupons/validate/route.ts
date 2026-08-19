import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Informe o cupom" }, { status: 400 });
    }

    const total = Number(orderTotal) || 0;
    const supabase = createAdminClient();

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", code.trim())
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!coupon) {
      return NextResponse.json({ error: "Cupom inválido" }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ error: "Cupom inativo" }, { status: 400 });
    }

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ error: "Cupom ainda não está válido" }, { status: 400 });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
    }

    if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 });
    }

    const minOrder = Number(coupon.min_order_value) || 0;
    if (total < minOrder) {
      return NextResponse.json(
        {
          error: `Pedido mínimo de R$ ${minOrder.toFixed(2).replace(".", ",")} para este cupom`,
        },
        { status: 400 }
      );
    }

    let discount = 0;
    if (coupon.discount_type === "percent") {
      discount = (total * Number(coupon.discount_value)) / 100;
    } else {
      discount = Number(coupon.discount_value);
    }
    discount = Math.min(discount, total);
    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      discount_amount: discount,
      final_total: Math.round((total - discount) * 100) / 100,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao validar cupom" }, { status: 500 });
  }
}
