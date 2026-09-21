"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Snowflake,
  Truck,
  Heart,
  ChefHat,
  Clock,
  ShieldCheck,
  Sparkles,
  MapPin,
  Gift,
} from "lucide-react";
import { kitOptions, formatPrice } from "@/lib/products";
import KitBuilderModal from "@/components/KitBuilderModal";
import type { KitOption } from "@/lib/products";

const steps = [
  {
    n: "01",
    title: "Escolha a faixa",
    text: "Quanto mais marmitas, menor o preço unitário.",
  },
  {
    n: "02",
    title: "Monte os sabores",
    text: "Selecione as combinações que combinam com você.",
  },
  {
    n: "03",
    title: "Receba em casa",
    text: "Entrega em Brasília, Valparaíso e Novo Gama.",
  },
];

export default function HomePage() {
  const [selectedKit, setSelectedKit] = useState<KitOption | null>(null);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative hero-gradient text-white overflow-hidden">
        {/* Blobs decorativos */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-primary-900/40 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-blob" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <ChefHat className="w-4 h-4" />
              <span>Vani Aguiar · Personal Chef</span>
            </div>

            <h1 className="animate-fade-up delay-100 text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-[1.1] tracking-tight">
              Marmitas congeladas
              <br />
              <span className="text-primary-100">com sabor de casa</span>
            </h1>

            <p className="animate-fade-up delay-200 text-lg md:text-xl text-primary-50/95 max-w-2xl mx-auto mb-8 leading-relaxed">
              Praticidade, equilíbrio e o carinho da chef em cada porção.
              Monte seu kit, escolha os sabores e receba pronto para aquecer.
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap items-center justify-center gap-3">
              <a href="#kits" className="btn-secondary shadow-lg">
                Ver kits
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white font-medium px-4 py-3 transition-colors"
              >
                Conheça a chef
              </Link>
            </div>

            {/* Trust pills */}
            <div className="animate-fade-up delay-400 mt-12 flex flex-wrap justify-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
                <Snowflake className="w-3.5 h-3.5" /> Congeladas na hora
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
                <Truck className="w-3.5 h-3.5" /> Entrega local
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
                <Gift className="w-3.5 h-3.5" /> Frete grátis a partir de R$ 349,90
              </span>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 leading-[0]">
          <svg
            viewBox="0 0 1440 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-10 md:h-14"
            preserveAspectRatio="none"
          >
            <path
              d="M0 32C240 64 480 0 720 32C960 64 1200 0 1440 32V64H0V32Z"
              fill="#fafafa"
            />
          </svg>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <p className="text-primary-600 font-semibold text-sm tracking-wide uppercase mb-2">
            Simples assim
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Como funciona
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="relative bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm card-hover"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-5xl font-black text-primary-100 absolute top-4 right-5 select-none">
                {s.n}
              </span>
              <div className="relative">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kits */}
      <section id="kits" className="bg-gradient-to-b from-gray-50 to-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary-600 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">
                Cardápio
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Escolha a quantidade
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Desconto progressivo: quanto mais você leva, menor o preço por
              marmita. Clique para montar os sabores.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {kitOptions.map((kit, i) => (
              <button
                key={kit.id}
                type="button"
                onClick={() => setSelectedKit(kit)}
                className="group text-left bg-white rounded-3xl border border-gray-100 p-6 shadow-sm card-hover hover:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-2 mb-4">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-700 transition-colors">
                    {kit.label}
                  </h3>
                  {kit.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-primary-500 to-primary-600 text-white px-2.5 py-1 rounded-full shadow-sm">
                      {kit.badge}
                    </span>
                  )}
                </div>

                <p className="text-3xl font-black text-primary-600 mb-1 tracking-tight">
                  {formatPrice(kit.unitPrice)}
                  <span className="text-sm font-medium text-gray-400"> / un.</span>
                </p>
                <p className="text-xs text-gray-500 mb-5">{kit.rangeLabel}</p>

                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
                  Montar sabores
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Por que a VC Marmitas?
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Feitas com cuidado, pensadas para o seu ritmo.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: Snowflake,
              title: "Congeladas na hora",
              text: "Sabor e nutrientes preservados com congelamento rápido.",
            },
            {
              icon: Truck,
              title: "Entrega prática",
              text: "Brasília (DF), Valparaíso de Goiás e Novo Gama.",
            },
            {
              icon: Heart,
              title: "Sabor de casa",
              text: "Receitas da chef Vani Aguiar, com carinho e equilíbrio.",
            },
            {
              icon: Clock,
              title: "Prontas em minutos",
              text: "Só aquecer e servir — ideal para a rotina corrida.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-3xl border border-gray-100 p-6 text-center shadow-sm card-hover"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <item.icon className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA frete + área */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-8 md:p-12 shadow-2xl shadow-primary-700/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  Área de entrega
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                  Frete grátis em pedidos a partir de R$&nbsp;349,90
                </h2>
                <p className="text-primary-100 mb-6 leading-relaxed">
                  Entregamos em Brasília (DF), Valparaíso de Goiás e Novo Gama.
                  O valor do frete é calculado pela distância a partir do Recanto das Emas.
                </p>
                <a href="#kits" className="btn-secondary">
                  Montar meu kit
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: ShieldCheck, label: "Pagamento seguro", sub: "PIX e cartão" },
                  { icon: Snowflake, label: "Cadeia fria", sub: "Até chegar em você" },
                  { icon: ChefHat, label: "Chef Vani", sub: "Receitas autorais" },
                  { icon: Gift, label: "Frete grátis", sub: "A partir de R$ 349,90" },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4"
                  >
                    <b.icon className="w-6 h-6 mb-2 text-primary-100" />
                    <p className="font-semibold text-sm">{b.label}</p>
                    <p className="text-xs text-primary-100/80">{b.sub}</p>
                  </div>
                ))}
              </div>
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
