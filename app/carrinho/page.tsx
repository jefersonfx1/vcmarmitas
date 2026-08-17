"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/products";

export default function CarrinhoPage() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Seu carrinho está vazio</h1>
        <p className="text-gray-600 mb-8">Adicione algumas marmitas deliciosas ao carrinho.</p>
        <Link
          href="/cardapio"
          className="inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver Cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrinho</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Lista de itens */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4"
            >
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    aria-label="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mt-0.5">{formatPrice(item.price)}</p>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-right font-semibold text-gray-900 shrink-0">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Limpar carrinho
          </button>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Resumo do pedido</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(totalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entrega</span>
                <span className="text-gray-500">A calcular</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary-600">{formatPrice(totalPrice())}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-primary-600 text-white font-semibold py-3.5 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Finalizar pedido
            </Link>

            <Link
              href="/cardapio"
              className="block w-full text-center text-sm text-gray-600 mt-3 hover:text-primary-600 transition-colors"
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}