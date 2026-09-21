"use client";

import { useRef, useCallback, useEffect } from "react";
import { formatPrice } from "@/lib/products";
import { FREE_FREIGHT_MIN } from "@/lib/cep";

export type FreightInfo = {
  available: boolean;
  price: number;
  label: string;
  message?: string;
  freeShipping?: boolean;
  distanceKm?: number;
};

type Props = {
  cep: string;
  orderTotal: number;
  qualifiesFreeFreight: boolean;
  freight: FreightInfo | null;
  cepLoading: boolean;
  onCepChange: (formattedCep: string) => void;
  onAddress: (addr: {
    street?: string;
    neighborhood?: string;
    city?: string;
  }) => void;
  onFreight: (f: FreightInfo | null) => void;
  onLoading: (v: boolean) => void;
  onCouponReset?: () => void;
};

export default function CepFreightField({
  cep,
  orderTotal,
  qualifiesFreeFreight,
  freight,
  cepLoading,
  onCepChange,
  onAddress,
  onFreight,
  onLoading,
  onCouponReset,
}: Props) {
  const requestId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupCep = useCallback(
    async (cepValue: string) => {
      const digits = cepValue.replace(/\D/g, "").slice(0, 8);
      if (digits.length !== 8) {
        onFreight(null);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const id = ++requestId.current;

      onLoading(true);
      try {
        const res = await fetch(
          `/api/cep?cep=${digits}&orderTotal=${encodeURIComponent(String(orderTotal))}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const data = await res.json();
        if (id !== requestId.current) return;

        if (!res.ok) {
          onFreight({
            available: false,
            price: 0,
            label: "CEP inválido",
            message: data.error || "CEP não encontrado",
          });
          return;
        }

        onAddress({
          street: data.address?.street,
          neighborhood: data.address?.neighborhood,
          city: data.address?.city,
        });

        onFreight({
          available: Boolean(data.freight?.available),
          price: Number(data.freight?.price) || 0,
          label: data.freight?.label || "",
          message: data.freight?.message,
          freeShipping: Boolean(data.freight?.freeShipping),
          distanceKm: data.freight?.distanceKm,
        });
        onCouponReset?.();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (id !== requestId.current) return;
        onFreight({
          available: false,
          price: 0,
          label: "Erro",
          message: "Não foi possível consultar o CEP",
        });
      } finally {
        if (id === requestId.current) onLoading(false);
      }
    },
    [orderTotal, onAddress, onFreight, onLoading, onCouponReset]
  );

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const formatted =
      digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    onCepChange(formatted);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (digits.length < 8) {
      onFreight(null);
      return;
    }

    debounceRef.current = setTimeout(() => lookupCep(digits), 400);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Busca inicial se CEP já veio preenchido (perfil)
  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length === 8 && !freight && !cepLoading) {
      lookupCep(digits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        CEP * {cepLoading && <span className="text-gray-400">(calculando frete...)</span>}
      </label>
      <input
        type="text"
        required
        inputMode="numeric"
        autoComplete="postal-code"
        value={cep}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={(e) => {
          const d = e.target.value.replace(/\D/g, "");
          if (d.length === 8) lookupCep(d);
        }}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder="00000-000"
        maxLength={9}
      />
      {cepLoading && (
        <p className="text-xs mt-1 text-gray-500">Calculando frete...</p>
      )}
      {!cepLoading && freight && (
        <p
          key={`${cep}-${freight.price}-${freight.available}-${freight.distanceKm ?? ""}`}
          className={`text-xs mt-1.5 font-medium ${
            freight.available ? "text-green-700" : "text-red-600"
          }`}
        >
          {freight.available
            ? qualifiesFreeFreight || freight.freeShipping
              ? `Frete grátis (pedidos a partir de ${formatPrice(FREE_FREIGHT_MIN)})`
              : `${freight.label} — frete ${formatPrice(freight.price)}`
            : freight.message}
        </p>
      )}
    </div>
  );
}
