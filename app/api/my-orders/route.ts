import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const email = req.nextUrl.searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { error: "userId ou email obrigatório" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let query = supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_name,
          product_price,
          quantity
        )
      `
      )
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (email) {
      query = query.eq("customer_email", email);
    }

    const { data: orders, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 });
  }
}
