"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { flavors, KitOption, formatPrice, unitPriceForQuantity } from "@/lib/products";
import { useCart } from "@/lib/cart-store";
import { useRouter } from "next/navigation";

type Props = {
  kit: KitOption;
  open: boolean;
  onClose: () => void;
};

export default function KitBuilderModal({ kit, open, onClose }: Props) {
  const router = useRouter();
  const setFlavorQuantities = useCart((s) => s.setFlavorQuantities);

  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(flavors.map((f) => [f.id, 0]))
  );

  // reset quando abre outro kit
  useEffect(() => {
    if (open) {
      setQty(Object.fromEntries(flavors.map((f) => [f.id, 0])));
    }
  }, [open, kit.id]);

  const selectedTotal = useMemo(
    () => Object.values(qty).reduce((a, b) => a + b, 0),
    [qty]
  );

  const remaining = kit.quantity - selectedTotal;
  const unitPrice = unitPriceForQuantity(kit.quantity);
  const estimatedTotal = kit.quantity * unitPrice;

  function change(id: string, delta: number) {
    setQty((prev) => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      const others = Object.entries(prev).reduce(
        (acc, [k, v]) => (k === id ? acc : acc + v),
        0
      );
      if (others + next > kit.quantity) return prev;
      return { ...prev, [id]: next };
    });
  }

  function handleConfirm() {
    if (selectedTotal !== kit.quantity) return;

    const selections = flavors.map((f) => ({
      product: { ...f, price: unitPrice },
      quantity: qty[f.id] || 0,
    }));

    setFlavorQuantities(selections);
    onClose();
    router.push("/carrinho");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-lg text-gray-900">{kit.label}</h2>
            <p className="text-sm text-gray-500">
              Escolha {kit.quantity} sabor{kit.quantity > 1 ? "es" : ""} •{" "}
              {formatPrice(estimatedTotal)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {flavors.map((flavor) => (
            <div
              key={flavor.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 leading-snug">
                  {flavor.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {flavor.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => change(flavor.id, -1)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  disabled={(qty[flavor.id] || 0) === 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-semibold text-sm">
                  {qty[flavor.id] || 0}
                </span>
                <button
                  type="button"
                  onClick={() => change(flavor.id, 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                  disabled={remaining <= 0}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Selecionadas: {selectedTotal}/{kit.quantity}
            </span>
            {remaining > 0 ? (
              <span className="text-amber-600 font-medium">
                Faltam {remaining}
              </span>
            ) : (
              <span className="text-green-600 font-medium">Completo</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedTotal !== kit.quantity}
            className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar ao carrinho — {formatPrice(estimatedTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
