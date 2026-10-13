"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import {
  Product,
  KitOption,
  formatPrice,
  unitPriceForQuantity,
  tierLabelForQuantity,
  flavors as fallbackFlavors,
} from "@/lib/products";
import { useCart } from "@/lib/cart-store";
import { useRouter } from "next/navigation";

type Props = {
  kit: KitOption;
  open: boolean;
  onClose: () => void;
};

type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url?: string | null;
  category: string;
  calories?: number | null;
  weight?: string | null;
  active?: boolean;
};

function mapApiProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    price: Number(p.price),
    image: p.image_url || "",
    category: p.category as Product["category"],
    calories: p.calories ?? undefined,
    weight: p.weight ?? undefined,
  };
}

const HARD_MAX = 200;

export default function KitBuilderModal({ kit, open, onClose }: Props) {
  const router = useRouter();
  const setFlavorQuantities = useCart((s) => s.setFlavorQuantities);

  const [flavors, setFlavors] = useState<Product[]>(fallbackFlavors);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});

  // Carrega sabores ativos do banco sempre que o modal abre
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const list: ApiProduct[] = data.products || [];
        const mapped = list.map(mapApiProduct);
        if (!cancelled && mapped.length > 0) {
          setFlavors(mapped);
          setQty(Object.fromEntries(mapped.map((f) => [f.id, 0])));
        } else if (!cancelled) {
          setFlavors(fallbackFlavors);
          setQty(Object.fromEntries(fallbackFlavors.map((f) => [f.id, 0])));
        }
      } catch {
        if (!cancelled) {
          setFlavors(fallbackFlavors);
          setQty(Object.fromEntries(fallbackFlavors.map((f) => [f.id, 0])));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, kit.id]);

  const selectedTotal = useMemo(
    () => Object.values(qty).reduce((a, b) => a + b, 0),
    [qty]
  );

  const estimatedTotal = selectedTotal * unitPriceForQuantity(selectedTotal);
  const meetsMin = selectedTotal >= kit.minQty;

  function change(id: string, delta: number) {
    setQty((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const others = Object.entries(prev).reduce(
        (acc, [k, v]) => (k === id ? acc : acc + v),
        0
      );
      if (others + next > HARD_MAX) return prev;
      return { ...prev, [id]: next };
    });
  }

  function setExact(id: string, value: string) {
    const parsed = parseInt(value.replace(/\D/g, ""), 10);
    const next = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;

    setQty((prev) => {
      const others = Object.entries(prev).reduce(
        (acc, [k, v]) => (k === id ? acc : acc + v),
        0
      );
      const capped = Math.min(next, HARD_MAX - others);
      return { ...prev, [id]: Math.max(0, capped) };
    });
  }

  function handleConfirm() {
    if (!meetsMin || selectedTotal === 0) return;

    const price = unitPriceForQuantity(selectedTotal);
    const selections = flavors.map((f) => ({
      product: { ...f, price },
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
              Mínimo {kit.minQty} un. · desconto progressivo conforme a quantidade
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
          {loading && (
            <p className="text-center text-sm text-gray-500 py-8">
              Carregando sabores...
            </p>
          )}

          {!loading && flavors.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">
              Nenhum sabor disponível no momento.
            </p>
          )}

          {!loading &&
            flavors.map((flavor) => (
              <div
                key={flavor.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-gray-100"
              >
                {flavor.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flavor.image}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
                  />
                ) : null}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 leading-snug">
                    {flavor.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {flavor.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => change(flavor.id, -1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    disabled={(qty[flavor.id] || 0) === 0}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={qty[flavor.id] || 0}
                    onChange={(e) => setExact(flavor.id, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 h-8 text-center font-semibold text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label={`Quantidade de ${flavor.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => change(flavor.id, 1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                    disabled={selectedTotal >= HARD_MAX}
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
              Total: <strong>{selectedTotal}</strong> un.
              {selectedTotal > 0 && (
                <>
                  {" · "}
                  {formatPrice(unitPriceForQuantity(selectedTotal))}/un
                  {" · "}
                  {tierLabelForQuantity(selectedTotal)}
                </>
              )}
            </span>
            {!meetsMin ? (
              <span className="text-amber-600 font-medium">
                Mín. {kit.minQty}
              </span>
            ) : (
              <span className="text-green-600 font-medium">Ok</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!meetsMin || loading || flavors.length === 0}
            className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {meetsMin
              ? `Adicionar ao carrinho — ${formatPrice(estimatedTotal)}`
              : `Selecione pelo menos ${kit.minQty} unidades`}
          </button>
        </div>
      </div>
    </div>
  );
}
