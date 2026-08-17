"use client";

import { useState } from "react";
import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

const categories = [
  { id: "todos", label: "Todos" },
  { id: "tradicional", label: "Tradicional" },
  { id: "fitness", label: "Fitness" },
  { id: "vegetariana", label: "Vegetariana" },
] as const;

export default function CardapioPage() {
  const [category, setCategory] = useState<string>("todos");

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
    </div>
  );
}