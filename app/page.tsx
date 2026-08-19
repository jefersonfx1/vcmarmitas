"use client";

import { useState } from "react";
import { ArrowRight, Snowflake, Truck, Heart } from "lucide-react";
import { kitOptions, formatPrice } from "@/lib/products";
import KitBuilderModal from "@/components/KitBuilderModal";
import type { KitOption } from "@/lib/products";

export default function HomePage() {
  const [selectedKit, setSelectedKit] = useState<KitOption | null>(null);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <p className="text-primary-100 text-sm font-medium tracking-wide mb-3">
            Vani Aguiar · Personal Chef
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Marmitas Congeladas
            <br />
            <span className="text-primary-100">Praticidade · Sabor · Equilíbrio</span>
          </h1>
          <p className="text-lg text-primary-50 max-w-2xl mx-auto mb-8">
            Escolha a faixa, monte os sabores e receba em casa — prontas para
            aquecer e aproveitar.
          </p>
          <a
            href="#kits"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-full hover:bg-primary-50 transition-colors"
          >
            Ver opções
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <section id="kits" className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Escolha a quantidade
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Desconto progressivo: quanto mais você leva, menor o preço por
            marmita. A faixa indica o preço a partir daquela quantidade.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitOptions.map((kit) => (
            <button
              key={kit.id}
              type="button"
              onClick={() => setSelectedKit(kit)}
              className="text-left bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900">{kit.label}</h3>
                {kit.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                    {kit.badge}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-primary-600 mb-1">
                {formatPrice(kit.unitPrice)}
                <span className="text-sm font-medium text-gray-500"> / un.</span>
              </p>
              <p className="text-xs text-gray-500">{kit.rangeLabel}</p>
              <span className="inline-block mt-4 text-sm font-medium text-primary-600">
                Montar sabores →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Snowflake className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Congeladas na hora</h3>
              <p className="text-gray-600 text-sm">
                Conservamos o sabor e os nutrientes com congelamento rápido.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Entrega prática</h3>
              <p className="text-gray-600 text-sm">
                Brasília, Valparaíso de Goiás e Novo Gama.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Sabor de casa</h3>
              <p className="text-gray-600 text-sm">
                Receitas da chef Vani Aguiar, com carinho e equilíbrio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {selectedKit && (
        <KitBuilderModal
          kit={selectedKit}
          open={!!selectedKit}
          onClose={() => setSelectedKit(null)}
        />
      )}
    </div>
  );
}
