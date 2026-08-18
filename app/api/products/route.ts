import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { products as fallbackProducts } from "@/lib/products";

export async function GET() {
  try {
    // Verifica se as variáveis existem
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.warn("Supabase não configurado — usando produtos locais");
      return NextResponse.json({
        products: fallbackProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image_url: p.image,
          category: p.category,
          calories: p.calories ?? null,
          weight: p.weight ?? null,
          active: true,
        })),
        source: "fallback",
      });
    }

    const supabase = createAdminClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) {
      console.error("Products fetch error:", error);
      // Fallback para não quebrar a loja
      return NextResponse.json({
        products: fallbackProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image_url: p.image,
          category: p.category,
          calories: p.calories ?? null,
          weight: p.weight ?? null,
          active: true,
        })),
        source: "fallback",
        warning: error.message,
      });
    }

    // Se o banco estiver vazio, usa fallback
    if (!products || products.length === 0) {
      return NextResponse.json({
        products: fallbackProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image_url: p.image,
          category: p.category,
          calories: p.calories ?? null,
          weight: p.weight ?? null,
          active: true,
        })),
        source: "fallback",
        warning: "Tabela products vazia",
      });
    }

    return NextResponse.json({ products, source: "supabase" });
  } catch (err) {
    console.error("Products API error:", err);
    return NextResponse.json({
      products: fallbackProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.image,
        category: p.category,
        calories: p.calories ?? null,
        weight: p.weight ?? null,
        active: true,
      })),
      source: "fallback",
      warning: err instanceof Error ? err.message : "Erro desconhecido",
    });
  }
}
