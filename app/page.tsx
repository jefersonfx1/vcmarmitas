import Link from "next/link";
import { ArrowRight, Snowflake, Truck, Heart } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Marmitas Congeladas<br />
            <span className="text-primary-100">Práticas e Saborosas</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-50 max-w-2xl mx-auto mb-10">
            Alimentação saudável sem complicação. Peça online e receba em casa,
            prontas para aquecer e aproveitar.
          </p>
          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-full hover:bg-primary-50 transition-colors"
          >
            Ver Cardápio
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Benefícios */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Snowflake className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Congeladas na hora</h3>
            <p className="text-gray-600 text-sm">
              Conservamos o sabor e os nutrientes com congelamento rápido e seguro.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Truck className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Entrega prática</h3>
            <p className="text-gray-600 text-sm">
              Receba suas marmitas em casa, no horário que for melhor para você.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Feitas com carinho</h3>
            <p className="text-gray-600 text-sm">
              Ingredientes selecionados e receitas pensadas para o dia a dia.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para experimentar?
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Confira nosso cardápio completo e monte seu pedido com praticidade.
          </p>
          <Link
            href="/cardapio"
            className="inline-flex items-center gap-2 bg-primary-600 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-primary-700 transition-colors"
          >
            Ver Cardápio Completo
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}