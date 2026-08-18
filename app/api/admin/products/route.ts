import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao listar produtos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, category, image_url, calories, weight, active } =
      body;

    if (!name || price == null) {
      return NextResponse.json(
        { error: "name e price são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        description: description || null,
        price: Number(price),
        category: category || "tradicional",
        image_url: image_url || null,
        calories: calories ? Number(calories) : null,
        weight: weight || null,
        active: active !== false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
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
    if (fields.name !== undefined) allowed.name = fields.name;
    if (fields.description !== undefined) allowed.description = fields.description;
    if (fields.price !== undefined) allowed.price = Number(fields.price);
    if (fields.category !== undefined) allowed.category = fields.category;
    if (fields.image_url !== undefined) allowed.image_url = fields.image_url;
    if (fields.calories !== undefined)
      allowed.calories = fields.calories ? Number(fields.calories) : null;
    if (fields.weight !== undefined) allowed.weight = fields.weight;
    if (fields.active !== undefined) allowed.active = Boolean(fields.active);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("products")
      .update(allowed)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }

    const supabase = createAdminClient();
    // Soft delete
    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao remover produto" }, { status: 500 });
  }
}
