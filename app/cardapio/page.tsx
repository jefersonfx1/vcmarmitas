"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Product as LocalProduct } from "@/lib/products";

const categories = [
  { id: "todos", label: "Todos" },
  { id: "tradicional", label: "Tradicional" },
  { id: "fitness", label: "Fitness" },
  { id: "vegetariana", label: "Vegetariana" },
] as const;

type DbProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: "tradicional" | "fitness" | "vegetariana";
  calories: number | null;
  weight: string | null;
};

function mapProduct(p: DbProduct): LocalProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: Number(p.price),
    image: p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
    category: p.category,
    calories: p.calories || undefined,
    weight: p.weight || undefined,
  };
}

export default function CardapioPage() {
  const [category, setCategory] = useState<string>("todos");
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar");
        setProducts((data.products || []).map(mapProduct));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar cardápio");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    category === "todos"
      ? products
      : products.filter((p) => p.category === category);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cardápio</h1>
        <p className="text-gray-600">
          Escolha suas marmitas favoritas e adicione ao carrinho.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat.id
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-center text-gray-500 py-12">Carregando cardápio...</p>
      )}

      {error && (
        <p className="text-center text-red-600 py-12">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-12">
              Nenhuma marmita encontrada nesta categoria.
            </p>
          )}
        </>
      )}
    </div>
  );
}
