import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .order("name");

    if (error) {
      // Tabela ainda não criada — devolve defaults
      if (error.message.includes("categories") || error.code === "42P01") {
        return NextResponse.json({
          categories: [
            { id: "tradicional", slug: "tradicional", name: "Tradicional", sort_order: 1, active: true },
            { id: "fitness", slug: "fitness", name: "Fitness", sort_order: 2, active: true },
            { id: "vegetariana", slug: "vegetariana", name: "Vegetariana", sort_order: 3, active: true },
          ],
          source: "fallback",
          warning: error.message,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: data || [], source: "supabase" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao listar categorias" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "name obrigatório" }, { status: 400 });
    }

    const slug = body.slug ? slugify(String(body.slug)) : slugify(name);
    const sort_order = body.sort_order != null ? Number(body.sort_order) : 0;
    const active = body.active !== false;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .insert({ name, slug, sort_order, active })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao criar categoria" },
      { status: 500 }
    );
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
    if (fields.name !== undefined) allowed.name = String(fields.name).trim();
    if (fields.slug !== undefined) allowed.slug = slugify(String(fields.slug));
    if (fields.sort_order !== undefined) allowed.sort_order = Number(fields.sort_order);
    if (fields.active !== undefined) allowed.active = Boolean(fields.active);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("categories")
      .update(allowed)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao atualizar categoria" },
      { status: 500 }
    );
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
      .from("categories")
      .update({ active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao remover categoria" },
      { status: 500 }
    );
  }
}
