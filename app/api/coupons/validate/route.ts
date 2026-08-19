import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal, freightTotal, userId, email } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Informe o cupom" }, { status: 400 });
    }

    const subtotal = Number(orderTotal) || 0;
    const freight = Number(freightTotal) || 0;
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
    if (subtotal < minOrder) {
      return NextResponse.json(
        {
          error: `Pedido mínimo de R$ ${minOrder.toFixed(2).replace(".", ",")} para este cupom`,
        },
        { status: 400 }
      );
    }

    const appliesTo = coupon.applies_to || "order";
    const emailNorm = (email || "").toLowerCase().trim();

    // Limite por usuário
    if (coupon.per_user_limit != null && coupon.per_user_limit > 0) {
      if (!emailNorm && !userId) {
        return NextResponse.json(
          { error: "Faça login ou informe o e-mail para usar este cupom" },
          { status: 400 }
        );
      }

      let query = supabase
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);

      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.ilike("customer_email", emailNorm);
      }

      const { count } = await query;
      if ((count || 0) >= coupon.per_user_limit) {
        return NextResponse.json(
          { error: "Você já utilizou este cupom o máximo de vezes permitido" },
          { status: 400 }
        );
      }
    }

    // Só primeira compra
    if (coupon.first_purchase_only) {
      if (!emailNorm && !userId) {
        return NextResponse.json(
          { error: "Informe o e-mail para validar primeira compra" },
          { status: 400 }
        );
      }

      let orderQuery = supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .neq("status", "cancelado");

      if (userId) {
        orderQuery = orderQuery.eq("user_id", userId);
      } else {
        orderQuery = orderQuery.ilike("customer_email", emailNorm);
      }

      const { count: orderCount } = await orderQuery;
      if ((orderCount || 0) > 0) {
        return NextResponse.json(
          { error: "Este cupom é válido apenas na primeira compra" },
          { status: 400 }
        );
      }
    }

    // Calcula desconto conforme applies_to
    let discountOrder = 0;
    let discountFreight = 0;

    const calcDiscount = (base: number) => {
      if (base <= 0) return 0;
      let d =
        coupon.discount_type === "percent"
          ? (base * Number(coupon.discount_value)) / 100
          : Number(coupon.discount_value);
      d = Math.min(d, base);
      return Math.round(d * 100) / 100;
    };

    if (appliesTo === "order" || appliesTo === "both") {
      discountOrder = calcDiscount(subtotal);
    }
    if (appliesTo === "freight" || appliesTo === "both") {
      discountFreight = calcDiscount(freight);
    }

    // percent 100 em frete = frete grátis
    const discountAmount =
      Math.round((discountOrder + discountFreight) * 100) / 100;

    if (appliesTo === "freight" && freight <= 0) {
      return NextResponse.json(
        { error: "Informe um CEP com frete válido para usar este cupom" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      applies_to: appliesTo,
      discount_order: discountOrder,
      discount_freight: discountFreight,
      discount_amount: discountAmount,
      final_total: Math.round((subtotal - discountOrder + freight - discountFreight) * 100) / 100,
      first_purchase_only: Boolean(coupon.first_purchase_only),
      per_user_limit: coupon.per_user_limit,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao validar cupom" }, { status: 500 });
  }
}
