"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { Product, formatPrice } from "@/lib/products";
import { useCart } from "@/lib/cart-store";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const addItem = useCart((s) => s.addItem);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="relative aspect-[4/3] bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 leading-snug">{product.name}</h3>
          <span className="text-primary-600 font-bold whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">
          {product.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
          {product.weight && <span>{product.weight}</span>}
          {product.calories && <span>{product.calories} kcal</span>}
        </div>

        <button
          onClick={() => addItem(product)}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-medium py-2.5 rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>
    </div>
  );
}